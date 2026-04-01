import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch all bonus questions with responses
export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get('match_id');

  let query = supabase.from('bonus_questions').select('*');
  if (matchId) {
    query = query.eq('match_id', Number(matchId));
  }

  const { data: questions, error } = await query.order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch responses for these questions
  const questionIds = (questions || []).map((q: { id: number }) => q.id);
  const { data: responses } = questionIds.length > 0
    ? await supabase.from('bonus_responses').select('*').in('bonus_question_id', questionIds)
    : { data: [] };

  return NextResponse.json({ questions: questions || [], responses: responses || [] });
}

// POST - Create or update a bonus question
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { match_id, question, options, correct_answer, points = 1 } = body;

  if (!match_id || !question || !options?.length) {
    return NextResponse.json({ error: 'match_id, question, and options are required' }, { status: 400 });
  }

  // Upsert: check if question already exists for this match
  const { data: existing } = await supabase
    .from('bonus_questions')
    .select('id')
    .eq('match_id', match_id)
    .limit(1);

  if (existing && existing.length > 0) {
    // Update existing
    const { error } = await supabase
      .from('bonus_questions')
      .update({ question, options, correct_answer, points })
      .eq('id', existing[0].id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: existing[0].id });
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('bonus_questions')
      .insert({ match_id, question, options, correct_answer, points })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  }
}

// PUT - Save bonus responses for a question
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { bonus_question_id, responses } = body;

  if (!bonus_question_id || !responses?.length) {
    return NextResponse.json({ error: 'bonus_question_id and responses required' }, { status: 400 });
  }

  // Get the question to check correct answer
  const { data: question } = await supabase
    .from('bonus_questions')
    .select('correct_answer')
    .eq('id', bonus_question_id)
    .single();

  const upsertData = responses.map((r: { participant_id: string; selected_option: string }) => ({
    bonus_question_id,
    participant_id: r.participant_id,
    selected_option: r.selected_option,
    is_correct: question?.correct_answer ? r.selected_option === question.correct_answer : false,
  }));

  const { error } = await supabase
    .from('bonus_responses')
    .upsert(upsertData, { onConflict: 'bonus_question_id,participant_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, saved: upsertData.length });
}

// DELETE - Remove bonus question
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('bonus_questions').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
