import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('match_id');

  let query = supabase.from('predictions').select('*');

  if (matchId) {
    query = query.eq('match_id', parseInt(matchId, 10));
  }

  const { data, error } = await query;

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

    if (upsertData.length === 0) {
      return NextResponse.json({ message: 'No predictions to save' });
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
