import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: trivia, error: triviaError } = await supabase
    .from('trivia')
    .select('*')
    .order('trivia_date', { ascending: true });

  if (triviaError) {
    return NextResponse.json({ error: triviaError.message }, { status: 500 });
  }

  const { data: responses, error: respError } = await supabase
    .from('trivia_responses')
    .select('*');

  if (respError) {
    return NextResponse.json({ error: respError.message }, { status: 500 });
  }

  const triviaWithResponses = (trivia || []).map((t) => ({
    ...t,
    responses: (responses || []).filter((r) => r.trivia_id === t.id),
  }));

  return NextResponse.json(triviaWithResponses);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trivia_date, question, correct_answer } = body;

    if (!trivia_date || !question) {
      return NextResponse.json(
        { error: 'Missing required fields: trivia_date and question' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('trivia')
      .insert({
        trivia_date,
        question,
        correct_answer: correct_answer || null,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { trivia_id, responses } = body;

    if (!trivia_id || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Missing required fields: trivia_id and responses array' },
        { status: 400 }
      );
    }

    const upsertData = responses.map(
      (r: { participant_id: string; is_correct: boolean; response?: string }) => ({
        trivia_id,
        participant_id: r.participant_id,
        is_correct: r.is_correct,
        response: r.response || null,
      })
    );

    const { data, error } = await supabase
      .from('trivia_responses')
      .upsert(upsertData, {
        onConflict: 'trivia_id,participant_id',
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
