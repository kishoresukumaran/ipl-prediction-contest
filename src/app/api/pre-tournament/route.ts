import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PARTICIPANTS } from '@/lib/constants';
import { calculatePreTournamentPoints } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pre-tournament
 *
 * Returns everything the UI needs for the "Crystal Ball" surfaces:
 *   - actuals: the singleton row of admin-verified answers (or nulls)
 *   - predictions: every player's row with their picks + per-question breakdown
 *
 * Predictions are enriched with:
 *   - participantId / participantName / avatarColor (resolved from PARTICIPANTS)
 *   - breakdown: PreTournamentBreakdown calculated against current actuals
 */
export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const [predsRes, actualsRes] = await Promise.all([
      admin.from('pre_tournament_predictions').select('*'),
      admin.from('pre_tournament_actuals').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (predsRes.error) {
      console.error('Pre-tournament predictions query error:', predsRes.error);
      return NextResponse.json({ error: predsRes.error.message }, { status: 500 });
    }
    if (actualsRes.error) {
      console.error('Pre-tournament actuals query error:', actualsRes.error);
    }

    const rawPredictions = predsRes.data || [];
    const actuals = actualsRes.data || null;

    const predictions = rawPredictions.map((row) => {
      const participant = PARTICIPANTS.find(
        (p) => p.name.toLowerCase() === row.player.toLowerCase()
      );
      const breakdown = calculatePreTournamentPoints(
        participant?.id || row.player.toLowerCase(),
        row,
        actuals
      );
      return {
        ...row,
        participantId: participant?.id || row.player.toLowerCase(),
        participantName: participant?.name || row.player,
        avatarColor: participant?.avatar_color || '#666',
        breakdown,
      };
    });

    return NextResponse.json({
      actuals,
      predictions,
      hasData: predictions.length > 0,
    });
  } catch (err) {
    console.error('Pre-tournament API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
