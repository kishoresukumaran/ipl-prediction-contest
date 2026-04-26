import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRows, supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('match_id');

  // When filtering by a single match the result set is small (≤ #players),
  // so a normal `select('*')` is fine. Without a filter, the unbounded query
  // would silently get capped at PostgREST's default 1000-row limit, so we
  // paginate via `fetchAllRows`.
  if (matchId) {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', parseInt(matchId, 10));
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await fetchAllRows(() =>
    supabase.from('predictions').select('*')
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { match_id, predictions } = body;

    if (!match_id || !predictions || !Array.isArray(predictions)) {
      return NextResponse.json(
        { error: 'Missing required fields: match_id and predictions array' },
        { status: 400 }
      );
    }

    const upsertData = predictions
      .filter((p: { predicted_team: string }) => p.predicted_team)
      .map((p: { participant_id: string; predicted_team: string; prediction_time?: string }) => ({
        match_id,
        participant_id: p.participant_id,
        predicted_team: p.predicted_team,
        prediction_time: p.prediction_time || null,
      }));

    const activeParticipantIds = upsertData.map((p: { participant_id: string }) => p.participant_id);

    // Delete predictions for participants who were cleared
    let deleteQuery = supabase
      .from('predictions')
      .delete()
      .eq('match_id', match_id);

    if (activeParticipantIds.length > 0) {
      deleteQuery = deleteQuery.not('participant_id', 'in', `(${activeParticipantIds.join(',')})`);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (upsertData.length === 0) {
      return NextResponse.json({ message: 'Cleared all predictions for this match' });
    }

    const { data, error } = await supabase
      .from('predictions')
      .upsert(upsertData, {
        onConflict: 'match_id,participant_id',
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
