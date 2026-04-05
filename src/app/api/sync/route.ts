import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TEAM_NAME_TO_ABBR, resolvePlayerId, resolveMatchType } from '@/lib/sync-mappings';

interface SyncMatch {
  id: number;
  winner?: string | null;
  match_type?: string;
  underdog_team?: string | null;
}

interface SyncPrediction {
  player: string;
  match_id: number;
  prediction: string;
  joker?: boolean;
}

interface SyncTrivia {
  id: number;
  date?: string;
  question: string;
  correct_answer: string;
}

interface SyncTriviaPrediction {
  player: string;
  trivia_id: number;
  prediction: string;
}

interface SyncPayload {
  matches?: SyncMatch[];
  predictions?: SyncPrediction[];
  trivia?: SyncTrivia[];
  trivia_predictions?: SyncTriviaPrediction[];
}

interface SyncSummary {
  matches: { updated: number; skipped: number };
  predictions: { upserted: number };
  jokers: { upserted: number };
  trivia: { upserted: number };
  trivia_responses: { upserted: number };
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
      predictions: { upserted: 0 },
      jokers: { upserted: 0 },
      trivia: { upserted: 0 },
      trivia_responses: { upserted: 0 },
    };

    // ============ SYNC MATCHES ============
    if (payload.matches && Array.isArray(payload.matches)) {
      for (const match of payload.matches) {
        const { id, winner, match_type, underdog_team } = match;

        // Only upsert if there's a winner to update
        if (!winner || winner.trim() === '') {
          summary.matches.skipped++;
          continue;
        }

        // Resolve team abbreviation
        const winnerAbbr = TEAM_NAME_TO_ABBR[winner];
        if (!winnerAbbr) {
          errors.push(`Unknown team: '${winner}' for match ${id}`);
          summary.matches.skipped++;
          continue;
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

        // Resolve predicted team
        const predictedTeamAbbr = TEAM_NAME_TO_ABBR[prediction];
        if (!predictedTeamAbbr) {
          errors.push(`Unknown team: '${prediction}' predicted by ${player} in match ${match_id}`);
          continue;
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

        // Upsert joker if flagged
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
        }
      }
    }

    // ============ SYNC TRIVIA ============
    const triviaMap: Record<number, SyncTrivia> = {};
    if (payload.trivia && Array.isArray(payload.trivia)) {
      for (const trivia of payload.trivia) {
        const { id, date, question, correct_answer } = trivia;

        if (!date || date.trim() === '') {
          errors.push(`Skipping trivia ${id}: missing date`);
          continue;
        }

        triviaMap[id] = trivia;

        const { error: triviaError } = await admin
          .from('trivia')
          .upsert(
            {
              id,
              date,
              question,
              correct_answer,
            },
            { onConflict: 'id' }
          );

        if (triviaError) {
          errors.push(`Failed to upsert trivia ${id}: ${triviaError.message}`);
        } else {
          summary.trivia.upserted++;
        }
      }
    }

    // ============ SYNC TRIVIA PREDICTIONS ============
    if (payload.trivia_predictions && Array.isArray(payload.trivia_predictions)) {
      for (const triviaPred of payload.trivia_predictions) {
        const { player, trivia_id, prediction } = triviaPred;

        // Resolve player ID
        const participantId = resolvePlayerId(player);
        if (!participantId) {
          errors.push(`Unknown player: '${player}' in trivia ${trivia_id}`);
          continue;
        }

        // Find the trivia to get correct answer
        const trivia = triviaMap[trivia_id];
        if (!trivia) {
          errors.push(`Trivia ${trivia_id} not found or has no correct answer`);
          continue;
        }

        // Check if prediction is correct
        const isCorrect =
          prediction &&
          prediction.toString().trim().toLowerCase() ===
            trivia.correct_answer.toString().trim().toLowerCase();

        // Upsert trivia response
        const { error: triviaRespError } = await admin
          .from('trivia_responses')
          .upsert(
            {
              trivia_id,
              participant_id: participantId,
              response: prediction,
              is_correct: isCorrect,
            },
            { onConflict: 'trivia_id,participant_id' }
          );

        if (triviaRespError) {
          errors.push(`Failed to upsert trivia response for ${player} in trivia ${trivia_id}: ${triviaRespError.message}`);
          continue;
        }

        summary.trivia_responses.upserted++;
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
