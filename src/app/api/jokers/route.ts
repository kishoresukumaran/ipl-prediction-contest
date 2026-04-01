import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('jokers')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participant_id, match_id, declared_at } = body;

    if (!participant_id) {
      return NextResponse.json(
        { error: 'Missing required field: participant_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('jokers')
      .upsert(
        {
          participant_id,
          match_id: match_id || null,
          declared_at: declared_at || (match_id ? new Date().toISOString() : null),
        },
        { onConflict: 'participant_id' }
      )
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
