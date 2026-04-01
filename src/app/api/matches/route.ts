import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { match_date, start_time, day_of_week, home_team, away_team, venue, match_type } = body;

    if (!match_date || !home_team || !away_team || !match_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('matches')
      .insert({
        match_date,
        start_time: start_time || '19:30',
        day_of_week: day_of_week || new Date(match_date).toLocaleDateString('en-US', { weekday: 'long' }),
        home_team,
        away_team,
        venue: venue || 'TBD',
        match_type,
        is_power_match: false,
        underdog_team: null,
        winner: null,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
