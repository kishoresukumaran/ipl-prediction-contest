import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const id = parseInt(matchId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', id);

  if (predError) {
    return NextResponse.json({ error: predError.message }, { status: 500 });
  }

  return NextResponse.json({ ...match, predictions: predictions || [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const id = parseInt(matchId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateFields: Record<string, unknown> = {};

    if (body.winner !== undefined) updateFields.winner = body.winner;
    if (body.is_power_match !== undefined) updateFields.is_power_match = body.is_power_match;
    if (body.underdog_team !== undefined) updateFields.underdog_team = body.underdog_team;
    if (body.is_completed !== undefined) updateFields.is_completed = body.is_completed;

    if (body.is_completed && body.winner) {
      updateFields.result_updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('matches')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
