import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { anthropic } from '@/lib/anthropic';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { brief, recipientContext } = await req.json();

    if (!brief) {
      return NextResponse.json({ error: 'Missing required field: brief' }, { status: 400 });
    }

    const systemPrompt = `You are drafting an email for Delaney, a braille course instructor. Write in a warm, professional tone. Keep emails concise and friendly. Return ONLY valid JSON (no markdown fences) with this shape: { "subject": "Email subject line", "body": "Full email body text" }. Sign off as Delaney. Do not include HTML — plain text only.`;

    const userMessage = recipientContext
      ? `Draft an email: ${brief}\n\nRecipient context: ${recipientContext}`
      : `Draft an email: ${brief}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON — please try again' }, { status: 502 });
    }

    return NextResponse.json({ subject: parsed.subject, body: parsed.body });
  } catch (err) {
    console.error('Draft email error:', err);
    const message = err instanceof Error ? err.message : 'Failed to draft email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
