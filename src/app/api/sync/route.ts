import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TEAM_NAME_TO_ABBR, resolvePlayerId, resolveMatchType } from '@/lib/sync-mappings';

// Allow this serverless function up to 60s. The previous per-row sequential
// upsert approach blew past Vercel's default 10s window with ~600+ predictions.
export const maxDuration = 60;

interface SyncMatch {
  id: number;
  winner?: string | null;
  match_type?: string;
  is_power_match?: boolean;
  underdog_team?: string | null;
}

interface SyncPrediction {
  player: string;
  match_id: number;
  prediction: string;
  joker?: boolean;
}

interface SyncTriviaPoints {
  player: string;
  trivia_id: number;
  prediction: string;
  correct_answer: string;
  correct_check: number; // 1 for correct, 0 for incorrect
  points_earned: number;
}

interface SyncPreTournamentPrediction {
  player: string;
  champion?: string | null;
  orange_cap?: string | null;
  purple_cap?: string | null;
  playoff_teams?: string | null; // CSV of full team names from sheet
  table_topper?: string | null;
  contest_winner?: string | null; // sheet name like "Kishore"
}

interface SyncPreTournamentActuals {
  champion?: string | null;
  orange_cap?: string | null;
  purple_cap?: string | null;
  playoff_teams?: string | null;
  table_topper?: string | null;
  contest_winner?: string | null;
}

interface SyncPayload {
  matches?: SyncMatch[];
  predictions?: SyncPrediction[];
  expected_prediction_pairs?: Array<{ player: string; match_id: number }>;
  trivia_points?: SyncTriviaPoints[];
  pre_tournament_predictions?: SyncPreTournamentPrediction[];
  pre_tournament_actuals?: SyncPreTournamentActuals;
}

interface SyncSummary {
  matches: { updated: number; skipped: number };
  predictions: { upserted: number; deleted: number };
  jokers: { upserted: number; deleted: number };
  trivia_points: { upserted: number };
  pre_tournament: { predictions_upserted: number; actuals_updated: number };
}

/**
 * Run promises with bounded concurrency. Used for per-row updates that can't
 * be expressed as a single bulk statement (e.g. matches.update with row-
 * specific column sets).
 */
async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency = 10
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * POST /api/sync
 * Syncs data from Google Sheet to Supabase
 * Requires x-api-key header matching SYNC_API_KEY env var
 */
export async function POST(request: NextRequest) {
  // Check API key
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    const payload: SyncPayload = await request.json();
    const admin = getSupabaseAdmin();
    const errors: string[] = [];
    const summary: SyncSummary = {
      matches: { updated: 0, skipped: 0 },
      predictions: { upserted: 0, deleted: 0 },
      jokers: { upserted: 0, deleted: 0 },
      trivia_points: { upserted: 0 },
      pre_tournament: { predictions_upserted: 0, actuals_updated: 0 },
    };

    // Helper: resolve a team value (full name OR abbreviation) -> abbr.
    // Returns null and pushes an error if it can't resolve a non-empty value.
    const resolveTeam = (
      raw: string | null | undefined,
      ctx: string
    ): string | null => {
      if (raw === null || raw === undefined) return null;
      const trimmed = raw.toString().trim();
      if (trimmed === '') return null;
      const upper = trimmed.toUpperCase();
      if (TEAM_NAME_TO_ABBR[trimmed]) return TEAM_NAME_TO_ABBR[trimmed];
      if (Object.values(TEAM_NAME_TO_ABBR).includes(upper)) return upper;
      errors.push(`Unknown team '${raw}' in ${ctx}`);
      return null;
    };

    const resolvePlayoffCsv = (
      raw: string | null | undefined,
      ctx: string
    ): string | null => {
      if (!raw) return null;
      const parts = raw.toString().split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return null;
      const abbrs: string[] = [];
      for (const part of parts) {
        const abbr = resolveTeam(part, `${ctx} playoff_teams`);
        if (abbr) abbrs.push(abbr);
      }
      return abbrs.length > 0 ? abbrs.join(',') : null;
    };

    // ============ SYNC MATCHES ============
    // Matches still use .update() (not upsert) because rows must already
    // exist; bulk-update with differing column sets isn't a single SQL call,
    // so we run row updates with bounded concurrency to keep latency low
    // without overwhelming PostgREST.
    if (payload.matches && Array.isArray(payload.matches)) {
      type MatchUpdate = {
        id: number;
        data: Record<string, unknown>;
      };
      const matchUpdates: MatchUpdate[] = [];

      for (const match of payload.matches) {
        const { id, winner, match_type, is_power_match, underdog_team } = match;

        if (!winner || winner.trim() === '') {
          summary.matches.skipped++;
          continue;
        }

        let winnerAbbr: string;
        if (winner.toLowerCase() === 'abandoned') {
          winnerAbbr = 'ABANDONED';
        } else {
          winnerAbbr = TEAM_NAME_TO_ABBR[winner];
          if (!winnerAbbr) {
            errors.push(`Unknown team: '${winner}' for match ${id}`);
            summary.matches.skipped++;
            continue;
          }
        }

        let underdogAbbr: string | null = null;
        if (underdog_team && underdog_team.trim() !== '') {
          underdogAbbr = TEAM_NAME_TO_ABBR[underdog_team];
          if (!underdogAbbr) {
            errors.push(`Unknown underdog team: '${underdog_team}' for match ${id}`);
            summary.matches.skipped++;
            continue;
          }
        }

        const resolvedMatchType = match_type ? resolveMatchType(match_type) : undefined;

        const updateData: Record<string, unknown> = {
          winner: winnerAbbr,
          is_completed: true,
          result_updated_at: new Date().toISOString(),
        };
        if (underdogAbbr) updateData.underdog_team = underdogAbbr;
        if (resolvedMatchType) updateData.match_type = resolvedMatchType;
        if (is_power_match !== undefined) updateData.is_power_match = is_power_match;

        matchUpdates.push({ id, data: updateData });
      }

      await runWithConcurrency(
        matchUpdates,
        async ({ id, data }) => {
          const { error: updateError } = await admin
            .from('matches')
            .update(data)
            .eq('id', id);
          if (updateError) {
            errors.push(`Failed to update match ${id}: ${updateError.message}`);
            summary.matches.skipped++;
          } else {
            summary.matches.updated++;
          }
        },
        10
      );
    }

    // ============ SYNC PREDICTIONS & JOKERS ============
    // Strategy: collect all rows into 4 buckets (predictions to upsert/delete,
    // jokers to upsert/delete), then issue a single bulk upsert for each
    // upsert bucket and parallel deletes for the delete buckets. This turns
    // ~1000 sequential round-trips into ~4 statements + a handful of deletes.
    if (payload.predictions && Array.isArray(payload.predictions)) {
      type PKey = { match_id: number; participant_id: string };
      const toKey = (p: PKey) => `${p.match_id}:${p.participant_id}`;
      const parseKey = (k: string): PKey => {
        const [matchIdStr, participant_id] = k.split(':');
        return { match_id: Number(matchIdStr), participant_id };
      };
      const buildOrDeleteClause = (pairs: PKey): string =>
        `and(match_id.eq.${pairs.match_id},participant_id.eq.${pairs.participant_id})`;

      const predictionsToUpsert: Array<{
        match_id: number;
        participant_id: string;
        predicted_team: string;
      }> = [];
      const jokersToUpsert: Array<{
        participant_id: string;
        match_id: number;
        declared_at: string;
      }> = [];
      const explicitBlankPredictionKeys = new Set<string>();

      const seenPred = new Set<string>();
      const seenJokerUpsert = new Set<string>();

      for (const pred of payload.predictions) {
        const { player, match_id, prediction, joker } = pred;

        const participantId = resolvePlayerId(player);
        if (!participantId) {
          errors.push(`Unknown player: '${player}' in match ${match_id}`);
          continue;
        }

        const predictionTrimmed = (prediction ?? '').toString().trim();

        // Blank prediction is retained as a backward-compatible signal for
        // deletion when `expected_prediction_pairs` is not provided.
        if (predictionTrimmed === '') {
          explicitBlankPredictionKeys.add(toKey({ match_id, participant_id: participantId }));
          continue;
        }

        let predictedTeamAbbr: string;
        if (predictionTrimmed.toLowerCase() === 'abandoned') {
          predictedTeamAbbr = 'ABANDONED';
        } else {
          predictedTeamAbbr = TEAM_NAME_TO_ABBR[predictionTrimmed];
          if (!predictedTeamAbbr) {
            errors.push(`Unknown team: '${predictionTrimmed}' predicted by ${player} in match ${match_id}`);
            continue;
          }
        }

        const k = toKey({ match_id, participant_id: participantId });
        if (!seenPred.has(k)) {
          seenPred.add(k);
          predictionsToUpsert.push({
            match_id,
            participant_id: participantId,
            predicted_team: predictedTeamAbbr,
          });
        }

        if (joker === true) {
          if (!seenJokerUpsert.has(k)) {
            seenJokerUpsert.add(k);
            jokersToUpsert.push({
              participant_id: participantId,
              match_id,
              declared_at: new Date().toISOString(),
            });
          }
        }
      }

      const upsertPredictionKeySet = new Set(
        predictionsToUpsert.map((p) => toKey({ match_id: p.match_id, participant_id: p.participant_id }))
      );
      const desiredJokerKeySet = new Set(
        jokersToUpsert.map((j) => toKey({ match_id: j.match_id, participant_id: j.participant_id }))
      );

      // Determine which prediction keys are in-scope for this sync:
      // - preferred: explicit `expected_prediction_pairs` from GAS
      // - fallback: explicit blank rows from legacy payload
      const expectedPredictionKeySet = new Set<string>();
      if (payload.expected_prediction_pairs && Array.isArray(payload.expected_prediction_pairs)) {
        for (const pair of payload.expected_prediction_pairs) {
          const participantId = resolvePlayerId(pair.player);
          if (!participantId) {
            errors.push(`Unknown player in expected_prediction_pairs: '${pair.player}'`);
            continue;
          }
          expectedPredictionKeySet.add(toKey({ match_id: pair.match_id, participant_id: participantId }));
        }
      }
      const hasExplicitExpectedPairs = expectedPredictionKeySet.size > 0;
      if (!hasExplicitExpectedPairs) {
        explicitBlankPredictionKeys.forEach((k) => expectedPredictionKeySet.add(k));
      }

      // Safety guard: never delete predictions or jokers belonging to a
      // completed match. Sheet-side IMPORTRANGE refreshes can briefly show
      // cells as blank for already-decided games, which previously caused the
      // sync to wipe historical predictions/jokers and made the leaderboard
      // flip "none" between page reloads.
      const { data: completedMatchRows, error: completedMatchesError } = await admin
        .from('matches')
        .select('id')
        .eq('is_completed', true);
      if (completedMatchesError) {
        errors.push(`Failed to load completed matches for delete safety: ${completedMatchesError.message}`);
      }
      const completedMatchIdSet = new Set<number>(
        (completedMatchRows || []).map((m: { id: number }) => m.id)
      );

      const predictionsToDelete = Array.from(expectedPredictionKeySet)
        .filter((k) => !upsertPredictionKeySet.has(k))
        .map(parseKey)
        .filter((p) => !completedMatchIdSet.has(p.match_id));

      // Bulk upsert predictions in one call
      if (predictionsToUpsert.length > 0) {
        const { error: predError } = await admin
          .from('predictions')
          .upsert(predictionsToUpsert, { onConflict: 'match_id,participant_id' });
        if (predError) {
          errors.push(`Failed to bulk upsert predictions: ${predError.message}`);
        } else {
          summary.predictions.upserted = predictionsToUpsert.length;
        }
      }

      // Bulk upsert jokers in one call
      if (jokersToUpsert.length > 0) {
        const { error: jokerError } = await admin
          .from('jokers')
          .upsert(jokersToUpsert, { onConflict: 'participant_id,match_id' });
        if (jokerError) {
          errors.push(`Failed to bulk upsert jokers: ${jokerError.message}`);
        } else {
          summary.jokers.upserted = jokersToUpsert.length;
        }
      }

      // Bulk-delete stale predictions in chunks.
      // PostgREST URL length can grow with .or(...) predicates, so we chunk.
      for (const chunk of chunkArray(predictionsToDelete, 100)) {
        const clause = chunk.map(buildOrDeleteClause).join(',');
        const { error } = await admin
            .from('predictions')
            .delete()
            .or(clause);
        if (error) {
          errors.push(`Failed bulk deleting predictions: ${error.message}`);
        } else {
          summary.predictions.deleted += chunk.length;
        }
      }

      // Delete only stale jokers currently present in DB for in-scope pairs.
      // This avoids firing thousands of no-op deletes every sync.
      const jokerScopeKeySet = hasExplicitExpectedPairs
        ? expectedPredictionKeySet
        : new Set([...upsertPredictionKeySet, ...explicitBlankPredictionKeys]);
      const scopeMatchIds = Array.from(
        new Set(Array.from(jokerScopeKeySet).map((k) => parseKey(k).match_id))
      );

      if (scopeMatchIds.length > 0) {
        const { data: existingScopedJokers, error: existingJokersError } = await admin
          .from('jokers')
          .select('match_id,participant_id')
          .in('match_id', scopeMatchIds);

        if (existingJokersError) {
          errors.push(`Failed to load existing jokers for diff-delete: ${existingJokersError.message}`);
        } else {
          const staleJokerPairs = (existingScopedJokers || [])
            .map((j) => ({ match_id: j.match_id, participant_id: j.participant_id }))
            .filter((j) => {
              const key = toKey(j);
              if (completedMatchIdSet.has(j.match_id)) return false;
              return jokerScopeKeySet.has(key) && !desiredJokerKeySet.has(key);
            });

          for (const chunk of chunkArray(staleJokerPairs, 100)) {
            const clause = chunk.map(buildOrDeleteClause).join(',');
            const { error } = await admin
              .from('jokers')
              .delete()
              .or(clause);
            if (error) {
              errors.push(`Failed bulk deleting stale jokers: ${error.message}`);
            } else {
              summary.jokers.deleted += chunk.length;
            }
          }
        }
      }
    }

    // ============ SYNC TRIVIA POINTS ============
    // Single bulk upsert; we still validate rows up-front and skip empty ones.
    // Deduplicate on (player, trivia_id) — duplicate keys in one ON CONFLICT
    // statement cause Postgres to error "cannot affect row a second time".
    if (payload.trivia_points && Array.isArray(payload.trivia_points)) {
      const triviaMap = new Map<string, {
        player: string;
        trivia_id: number;
        prediction: string;
        correct_answer: string;
        correct_check: number;
        points_earned: number;
      }>();

      for (const tp of payload.trivia_points) {
        const { player, trivia_id, prediction, correct_answer, correct_check, points_earned } = tp;
        if (!player || player.toString().trim() === '') {
          errors.push(`Skipping trivia points: missing player name`);
          continue;
        }
        triviaMap.set(`${player}:${trivia_id}`, {
          player,
          trivia_id,
          prediction,
          correct_answer,
          correct_check,
          points_earned,
        });
      }

      const triviaRows = Array.from(triviaMap.values());

      if (triviaRows.length > 0) {
        const { error: tpError } = await admin
          .from('trivia_points')
          .upsert(triviaRows, { onConflict: 'player,trivia_id' });
        if (tpError) {
          errors.push(`Failed to bulk upsert trivia points: ${tpError.message}`);
        } else {
          summary.trivia_points.upserted = triviaRows.length;
        }
      }
    }

    // ============ SYNC PRE-TOURNAMENT PREDICTIONS ============
    // Deduplicate on `player` so the bulk upsert never sees the same key twice.
    if (payload.pre_tournament_predictions && Array.isArray(payload.pre_tournament_predictions)) {
      const ptMap = new Map<string, {
        player: string;
        champion: string | null;
        orange_cap: string | null;
        purple_cap: string | null;
        playoff_teams: string | null;
        table_topper: string | null;
        contest_winner: string | null;
        updated_at: string;
      }>();

      for (const row of payload.pre_tournament_predictions) {
        const { player } = row;
        if (!player || player.toString().trim() === '') {
          errors.push('Skipping pre_tournament_predictions row: missing player');
          continue;
        }

        const participantId = resolvePlayerId(player);
        if (!participantId) {
          errors.push(`Unknown player in pre_tournament_predictions: '${player}'`);
          continue;
        }

        const ctx = `pre_tournament(${player})`;
        const champion = resolveTeam(row.champion, ctx);
        const orange_cap = resolveTeam(row.orange_cap, ctx);
        const purple_cap = resolveTeam(row.purple_cap, ctx);
        const table_topper = resolveTeam(row.table_topper, ctx);
        const playoff_teams = resolvePlayoffCsv(row.playoff_teams, ctx);

        let contest_winner: string | null = null;
        if (row.contest_winner && row.contest_winner.toString().trim() !== '') {
          contest_winner = resolvePlayerId(row.contest_winner);
          if (!contest_winner) {
            errors.push(`Unknown contest_winner '${row.contest_winner}' for ${player}`);
          }
        }

        ptMap.set(player, {
          player,
          champion,
          orange_cap,
          purple_cap,
          playoff_teams,
          table_topper,
          contest_winner,
          updated_at: new Date().toISOString(),
        });
      }

      const ptRows = Array.from(ptMap.values());
      if (ptRows.length > 0) {
        const { error: ptError } = await admin
          .from('pre_tournament_predictions')
          .upsert(ptRows, { onConflict: 'player' });
        if (ptError) {
          errors.push(`Failed to bulk upsert pre_tournament_predictions: ${ptError.message}`);
        } else {
          summary.pre_tournament.predictions_upserted = ptRows.length;
        }
      }
    }

    // ============ SYNC PRE-TOURNAMENT ACTUALS ============
    if (payload.pre_tournament_actuals && typeof payload.pre_tournament_actuals === 'object') {
      const a = payload.pre_tournament_actuals;
      const ctx = 'pre_tournament_actuals';

      // Build update object — only include non-null fields so phased reveals
      // don't accidentally clear previously-set columns.
      const updateData: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };

      if (a.champion !== undefined) {
        const v = resolveTeam(a.champion, ctx);
        if (v !== null || a.champion === null || a.champion === '') updateData.champion = v;
      }
      if (a.orange_cap !== undefined) {
        const v = resolveTeam(a.orange_cap, ctx);
        if (v !== null || a.orange_cap === null || a.orange_cap === '') updateData.orange_cap = v;
      }
      if (a.purple_cap !== undefined) {
        const v = resolveTeam(a.purple_cap, ctx);
        if (v !== null || a.purple_cap === null || a.purple_cap === '') updateData.purple_cap = v;
      }
      if (a.table_topper !== undefined) {
        const v = resolveTeam(a.table_topper, ctx);
        if (v !== null || a.table_topper === null || a.table_topper === '') updateData.table_topper = v;
      }
      if (a.playoff_teams !== undefined) {
        const v = resolvePlayoffCsv(a.playoff_teams, ctx);
        if (v !== null || a.playoff_teams === null || a.playoff_teams === '') updateData.playoff_teams = v;
      }
      if (a.contest_winner !== undefined) {
        if (a.contest_winner === null || a.contest_winner === '') {
          updateData.contest_winner = null;
        } else {
          const cw = resolvePlayerId(a.contest_winner);
          if (cw) updateData.contest_winner = cw;
          else errors.push(`Unknown contest_winner '${a.contest_winner}' in actuals`);
        }
      }

      const { error: actError } = await admin
        .from('pre_tournament_actuals')
        .upsert(updateData, { onConflict: 'id' });

      if (actError) {
        errors.push(`Failed to upsert pre_tournament_actuals: ${actError.message}`);
      } else {
        summary.pre_tournament.actuals_updated++;
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process sync: ${message}` },
      { status: 400 }
    );
  }
}
