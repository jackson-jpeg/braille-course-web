import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { anthropic } from '@/lib/anthropic';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notes, format, difficulty } = await req.json();

    if (!notes) {
      return NextResponse.json({ error: 'Missing required field: notes' }, { status: 400 });
    }

    const systemPrompt = `You are a braille course instructor's assistant. Restructure the user's rough notes into a clean lesson plan outline. Keep ALL factual content — do not add, invent, or remove any braille-specific facts. Organize with headings, bullet points, and logical flow. Return plain text (no JSON, no markdown fences). The output will be used as input for an AI material generator, so structure it clearly with labeled sections.${format ? ` The material will be generated as a ${format}.` : ''}${difficulty ? ` Target difficulty level: ${difficulty}.` : ''}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: notes }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    return NextResponse.json({ polished: textBlock.text });
  } catch (err) {
    console.error('Polish notes error:', err);
    const message = err instanceof Error ? err.message : 'Failed to polish notes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
