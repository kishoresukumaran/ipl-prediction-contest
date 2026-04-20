import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TEAM_NAME_TO_ABBR, resolvePlayerId, resolveMatchType } from '@/lib/sync-mappings';

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
      // Already an abbreviation?
      const upper = trimmed.toUpperCase();
      if (TEAM_NAME_TO_ABBR[trimmed]) return TEAM_NAME_TO_ABBR[trimmed];
      // Try the value-as-abbr by checking the reverse map: if any entry maps to it, accept.
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
    if (payload.matches && Array.isArray(payload.matches)) {
      for (const match of payload.matches) {
        const { id, winner, match_type, is_power_match, underdog_team } = match;

        // Only upsert if there's a winner to update
        if (!winner || winner.trim() === '') {
          summary.matches.skipped++;
          continue;
        }

        // Check if match is abandoned
        let winnerAbbr: string;
        if (winner.toLowerCase() === 'abandoned') {
          winnerAbbr = 'ABANDONED';
        } else {
          // Resolve team abbreviation
          winnerAbbr = TEAM_NAME_TO_ABBR[winner];
          if (!winnerAbbr) {
            errors.push(`Unknown team: '${winner}' for match ${id}`);
            summary.matches.skipped++;
            continue;
          }
        }

        // Resolve underdog team if provided
        let underdogAbbr: string | null = null;
        if (underdog_team && underdog_team.trim() !== '') {
          underdogAbbr = TEAM_NAME_TO_ABBR[underdog_team];
          if (!underdogAbbr) {
            errors.push(`Unknown underdog team: '${underdog_team}' for match ${id}`);
            summary.matches.skipped++;
            continue;
          }
        }

        // Resolve match type if provided
        const resolvedMatchType = match_type ? resolveMatchType(match_type) : undefined;

        // Upsert match (never delete, only update)
        const updateData: Record<string, unknown> = {
          winner: winnerAbbr,
          is_completed: true,
          result_updated_at: new Date().toISOString(),
        };

        if (underdogAbbr) {
          updateData.underdog_team = underdogAbbr;
        }

        if (resolvedMatchType) {
          updateData.match_type = resolvedMatchType;
        }

        if (is_power_match !== undefined) {
          updateData.is_power_match = is_power_match;
        }

        const { error: updateError } = await admin
          .from('matches')
          .update(updateData)
          .eq('id', id);

        if (updateError) {
          errors.push(`Failed to update match ${id}: ${updateError.message}`);
          summary.matches.skipped++;
        } else {
          summary.matches.updated++;
        }
      }
    }

    // ============ SYNC PREDICTIONS & JOKERS ============
    if (payload.predictions && Array.isArray(payload.predictions)) {
      for (const pred of payload.predictions) {
        const { player, match_id, prediction, joker } = pred;

        // Resolve player ID
        const participantId = resolvePlayerId(player);
        if (!participantId) {
          errors.push(`Unknown player: '${player}' in match ${match_id}`);
          continue;
        }

        // Blank prediction means "no pick" — delete any previously stored
        // prediction + joker so the sheet remains the source of truth when
        // an admin clears a cell.
        const predictionTrimmed = (prediction ?? '').toString().trim();
        if (predictionTrimmed === '') {
          const { error: delPredError } = await admin
            .from('predictions')
            .delete()
            .eq('match_id', match_id)
            .eq('participant_id', participantId);

          if (delPredError) {
            errors.push(`Failed to delete prediction for ${player} in match ${match_id}: ${delPredError.message}`);
          } else {
            summary.predictions.deleted++;
          }

          const { error: delJokerError } = await admin
            .from('jokers')
            .delete()
            .eq('match_id', match_id)
            .eq('participant_id', participantId);

          if (delJokerError) {
            errors.push(`Failed to delete joker for ${player} in match ${match_id}: ${delJokerError.message}`);
          } else {
            summary.jokers.deleted++;
          }

          continue;
        }

        // Check if prediction is abandoned
        let predictedTeamAbbr: string;
        if (predictionTrimmed.toLowerCase() === 'abandoned') {
          predictedTeamAbbr = 'ABANDONED';
        } else {
          // Resolve predicted team
          predictedTeamAbbr = TEAM_NAME_TO_ABBR[predictionTrimmed];
          if (!predictedTeamAbbr) {
            errors.push(`Unknown team: '${predictionTrimmed}' predicted by ${player} in match ${match_id}`);
            continue;
          }
        }

        // Upsert prediction
        const { error: predError } = await admin
          .from('predictions')
          .upsert(
            {
              match_id,
              participant_id: participantId,
              predicted_team: predictedTeamAbbr,
            },
            { onConflict: 'match_id,participant_id' }
          );

        if (predError) {
          errors.push(`Failed to upsert prediction for ${player} in match ${match_id}: ${predError.message}`);
          continue;
        }

        summary.predictions.upserted++;

        // Upsert joker if flagged; otherwise make sure no stale joker remains
        if (joker === true) {
          const { error: jokerError } = await admin
            .from('jokers')
            .upsert(
              {
                participant_id: participantId,
                match_id,
                declared_at: new Date().toISOString(),
              },
              { onConflict: 'participant_id,match_id' }
            );

          if (jokerError) {
            errors.push(`Failed to upsert joker for ${player} in match ${match_id}: ${jokerError.message}`);
          } else {
            summary.jokers.upserted++;
          }
        } else {
          const { error: delJokerError } = await admin
            .from('jokers')
            .delete()
            .eq('match_id', match_id)
            .eq('participant_id', participantId);

          if (delJokerError) {
            errors.push(`Failed to clear stale joker for ${player} in match ${match_id}: ${delJokerError.message}`);
          }
        }
      }
    }

    // ============ SYNC TRIVIA POINTS ============
    if (payload.trivia_points && Array.isArray(payload.trivia_points)) {
      for (const tp of payload.trivia_points) {
        const { player, trivia_id, prediction, correct_answer, correct_check, points_earned } = tp;

        if (!player || player.toString().trim() === '') {
          errors.push(`Skipping trivia points: missing player name`);
          continue;
        }

        // Upsert trivia points
        const { error: tpError } = await admin
          .from('trivia_points')
          .upsert(
            {
              player,
              trivia_id,
              prediction,
              correct_answer,
              correct_check,
              points_earned,
            },
            { onConflict: 'player,trivia_id' }
          );

        if (tpError) {
          errors.push(`Failed to upsert trivia points for ${player} in trivia ${trivia_id}: ${tpError.message}`);
        } else {
          summary.trivia_points.upserted++;
        }
      }
    }

    // ============ SYNC PRE-TOURNAMENT PREDICTIONS ============
    if (payload.pre_tournament_predictions && Array.isArray(payload.pre_tournament_predictions)) {
      for (const row of payload.pre_tournament_predictions) {
        const { player } = row;
        if (!player || player.toString().trim() === '') {
          errors.push('Skipping pre_tournament_predictions row: missing player');
          continue;
        }

        // Validate player exists (don't block sync, just warn)
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

        const { error: ptError } = await admin
          .from('pre_tournament_predictions')
          .upsert(
            {
              player,
              champion,
              orange_cap,
              purple_cap,
              playoff_teams,
              table_topper,
              contest_winner,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'player' }
          );

        if (ptError) {
          errors.push(`Failed to upsert pre_tournament_prediction for ${player}: ${ptError.message}`);
        } else {
          summary.pre_tournament.predictions_upserted++;
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
