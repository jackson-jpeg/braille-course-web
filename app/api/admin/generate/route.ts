import { NextRequest } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { anthropic } from '@/lib/anthropic';
import { getSettings, getSetting } from '@/lib/settings';
import {
  type Difficulty,
  PROMPT_EXAMPLES,
  buildBrailleReference,
  buildPedagogicalPreamble,
} from '@/lib/ai-braille-reference';
import { sanitizeGeneratedContent } from '@/lib/ai-content-sanitizer';
import { gradeForDifficulty } from '@/lib/worksheet-braille';
import { buildPreview, sseEncode } from '@/lib/document-builders';

export const maxDuration = 60;

/* Braille reference data and accuracy rules: generated from lib/braille (see lib/ai-braille-reference.ts). */

/* ── Helpers ── */

function safeParseJSON(text: string): unknown {
  let cleaned = text.trim();
  // Strip markdown fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt to extract the first {...} substring
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new SyntaxError('Could not parse AI response as JSON. The model returned invalid output.');
  }
}

function validateStructure(format: string, parsed: unknown): void {
  const data = parsed as Record<string, unknown>;

  switch (format) {
    case 'pptx': {
      if (!Array.isArray(data.slides) || data.slides.length === 0) {
        throw new Error('Invalid AI response: expected non-empty "slides" array');
      }
      for (const slide of data.slides) {
        const s = slide as Record<string, unknown>;
        if (typeof s.title !== 'string' || !Array.isArray(s.bullets)) {
          throw new Error('Invalid slide: each slide needs "title" (string) and "bullets" (array)');
        }
      }
      break;
    }
    case 'pdf':
    case 'study-guide': {
      if (!Array.isArray(data.sections) || data.sections.length === 0) {
        throw new Error('Invalid AI response: expected non-empty "sections" array');
      }
      break;
    }
    case 'worksheet': {
      if (!Array.isArray(data.sections) || data.sections.length === 0) {
        throw new Error('Invalid AI response: expected non-empty "sections" array');
      }
      const validWorksheetTypes = [
        'fill-in-the-blank',
        'matching',
        'practice-drill',
        'braille-to-print',
        'print-to-braille',
        'dot-identification',
      ];
      for (const section of data.sections) {
        const sec = section as Record<string, unknown>;
        if (!Array.isArray(sec.items) || sec.items.length === 0) {
          throw new Error('Invalid worksheet section: each section needs a non-empty "items" array');
        }
        if (typeof sec.type === 'string' && !validWorksheetTypes.includes(sec.type)) {
          throw new Error(
            `Invalid worksheet section type "${sec.type}". Must be one of: ${validWorksheetTypes.join(', ')}`,
          );
        }
      }
      break;
    }
    case 'quiz': {
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Invalid AI response: expected non-empty "questions" array');
      }
      break;
    }
  }
}

/* ── Prompts ── */

const WORKSHEET_SHAPE = `Return ONLY valid JSON (no markdown fences) with this shape:
{ "sections": [{ "heading": "Section Title", "type": "fill-in-the-blank", "instructions": "Instructions for this section.", "items": [{ "prompt": "The braille cell has ___ dots.", "answer": "six" }] }] }
The "type" must be one of: "fill-in-the-blank", "matching", "practice-drill", "braille-to-print", "print-to-braille", or "dot-identification".
Guidelines for each type:
- fill-in-the-blank: Use ___ in the prompt to indicate blanks. Prompt and answer are print; never dot numbers.
- matching: Prompts are left-column items and answers are right-column items, in print; never dot numbers.
- braille-to-print, print-to-braille, dot-identification: each item is ONLY the print to show in braille, e.g. ${PROMPT_EXAMPLES.brailleToPrint}, ${PROMPT_EXAMPLES.printToBraille}, ${PROMPT_EXAMPLES.dotIdentification}. The print is a single letter, a number or one word suited to the level. The site writes the prompt, draws the braille and writes the answer.
- practice-drill: a short instruction in "prompt" and the print to write in "print", e.g. ${PROMPT_EXAMPLES.practiceDrill}. No answer: the site generates it.
Never write dot numbers or braille characters anywhere; use the tokens from the reference (e.g. "${PROMPT_EXAMPLES.tokenSentence}").`;

const FORMAT_PROMPTS: Record<string, string> = {
  pptx: `You are creating a PowerPoint presentation for a braille course instructor. Given the user's notes, create a structured presentation. Return ONLY valid JSON (no markdown fences) with this shape:
{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "speakerNotes": "Optional notes" }] }
Create 5-12 slides. The first slide should be a title slide. Keep bullets concise (under 15 words each). Include speaker notes for complex slides.`,

  pdf: `You are creating a PDF handout for a braille course instructor. Given the user's notes, create a structured document. Return ONLY valid JSON (no markdown fences) with this shape:
{ "sections": [{ "heading": "Section Title", "content": "Paragraph text here.", "bullets": ["Point 1", "Point 2"] }] }
Create 3-8 sections. Content should be clear and suitable for students.`,

  'study-guide': `You are creating a study guide for a braille course. Given the user's notes, create a comprehensive study guide. Return ONLY valid JSON (no markdown fences) with this shape:
{ "title": "Study Guide Title", "objectives": ["Objective 1", "Objective 2"], "sections": [{ "heading": "Section Title", "content": "Explanation text.", "keyTerms": ["term1", "term2"], "practiceQuestions": ["Question 1?", "Question 2?"] }] }
Create 3-6 sections with key terms and practice questions where relevant.`,

  worksheet: `You are creating a braille course worksheet. Given the user's notes, create an engaging worksheet with varied exercise types. ${WORKSHEET_SHAPE}
Create 3-5 sections with 4-8 items each. Include at least one braille-specific section type.`,

  quiz: `You are creating a quiz/assessment for a braille course. Given the user's notes, create a mixed-format assessment. Return ONLY valid JSON (no markdown fences) with this shape:
{ "questions": [{ "type": "multiple-choice", "question": "What is...?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "Because..." }] }
The "type" must be one of: "multiple-choice", "true-false", or "short-answer". For true-false, options should be ["True", "False"]. For short-answer, omit options.
Create 10-20 mixed questions. Include a good mix of question types. Provide clear explanations for each answer.`,
};

/* Session bundle sub-prompts — each gets its own AI call */
const SESSION_BUNDLE_PROMPTS = {
  slides: `You are creating a PowerPoint presentation for a braille course instructor. Given the user's notes, create a structured presentation. Return ONLY valid JSON (no markdown fences) with this shape:
{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "speakerNotes": "Optional notes" }] }
Create 5-12 slides. The first slide should be a title slide. Keep bullets concise (under 15 words each). Include speaker notes for complex slides.`,

  handout: `You are creating a PDF handout for a braille course instructor. Given the user's notes, create a structured document. Return ONLY valid JSON (no markdown fences) with this shape:
{ "sections": [{ "heading": "Section Title", "content": "Paragraph text here.", "bullets": ["Point 1", "Point 2"], "keyTerms": ["term1", "term2"], "practiceQuestions": ["Question 1?"] }] }
Create 3-6 sections. Include key terms and practice questions where relevant. Content should complement the slide deck. Do not duplicate it; provide deeper explanation and reference material.`,

  worksheet: `You are creating a braille course worksheet. Given the user's notes, create an engaging worksheet with varied exercise types. ${WORKSHEET_SHAPE}
Create 3-5 sections with 4-8 items each. Include at least one braille-specific section type. This worksheet accompanies a slide deck and handout. Focus on active practice and exercises rather than reference content.`,
};

/* ── POST handler (SSE streaming) ── */

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { prompt?: string; format?: string; title?: string; instructions?: string; difficulty?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt, format, title, instructions } = body;
  const difficulty: Difficulty = ['beginner', 'intermediate', 'advanced'].includes(body.difficulty || '')
    ? (body.difficulty as Difficulty)
    : 'intermediate';

  if (!prompt || !format || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields: prompt, format, title' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!['pptx', 'pdf', 'study-guide', 'worksheet', 'quiz', 'session-bundle'].includes(format)) {
    return new Response(
      JSON.stringify({ error: 'Invalid format. Use pptx, pdf, study-guide, worksheet, quiz, or session-bundle' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(new TextEncoder().encode(sseEncode(data)));
      };

      try {
        // Stage 1: AI generation
        send({ stage: 'ai' });

        const brailleContext = buildBrailleReference(difficulty);
        const pedagogicalPreamble = buildPedagogicalPreamble(difficulty);

        // Inject course context from settings
        const settings = await getSettings();
        const courseName = getSetting(settings, 'course.name', 'Summer Braille Course');
        const courseStart = getSetting(settings, 'course.startDate', '2027-06-07');
        const courseEnd = getSetting(settings, 'course.endDate', '2027-07-30');
        const courseContext = `\nCOURSE CONTEXT: This material is for "${courseName}", running ${courseStart} to ${courseEnd}. Reference these dates where appropriate rather than using generic placeholders.\n`;

        const userMessage = instructions
          ? `Notes/Content:\n${prompt}\n\nAdditional Instructions:\n${instructions}`
          : `Notes/Content:\n${prompt}`;

        let parsed: unknown;

        if (format === 'session-bundle') {
          // Session bundle: 3 separate AI calls for full attention on each sub-document
          const baseSystem = pedagogicalPreamble + '\n' + brailleContext + courseContext + '\n';

          const [slidesRes, handoutRes, worksheetRes] = await Promise.all([
            anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 8192,
              system: baseSystem + SESSION_BUNDLE_PROMPTS.slides,
              messages: [{ role: 'user', content: userMessage }],
            }),
            anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 8192,
              system: baseSystem + SESSION_BUNDLE_PROMPTS.handout,
              messages: [{ role: 'user', content: userMessage }],
            }),
            anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 8192,
              system: baseSystem + SESSION_BUNDLE_PROMPTS.worksheet,
              messages: [{ role: 'user', content: userMessage }],
            }),
          ]);

          const getTextContent = (res: typeof slidesRes) => {
            if (!res.content) throw new Error('No content in AI response');
            const tb = res.content.find((b) => b.type === 'text');
            if (!tb || tb.type !== 'text') throw new Error('No text response from AI');
            return tb.text;
          };

          const slidesData = safeParseJSON(getTextContent(slidesRes));
          validateStructure('pptx', slidesData);

          const handoutData = safeParseJSON(getTextContent(handoutRes));
          validateStructure('pdf', handoutData);

          const worksheetData = safeParseJSON(getTextContent(worksheetRes));
          validateStructure('worksheet', worksheetData);

          parsed = {
            slides: (slidesData as { slides: unknown[] }).slides,
            handoutSections: (handoutData as { sections: unknown[] }).sections,
            worksheetSections: (worksheetData as { sections: unknown[] }).sections,
          };
        } else {
          const systemPrompt =
            pedagogicalPreamble + '\n' + brailleContext + courseContext + '\n' + FORMAT_PROMPTS[format];

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          });

          if (!response || !response.content) {
            send({ error: 'No content in AI response' });
            controller.close();
            return;
          }
          const textBlock = response.content.find((b) => b.type === 'text');
          if (!textBlock || textBlock.type !== 'text') {
            send({ error: 'No text response from AI' });
            controller.close();
            return;
          }

          parsed = safeParseJSON(textBlock.text);
          validateStructure(format, parsed);
        }

        // The model's braille is never used: every dot claim is regenerated from lib/braille or
        // removed, braille items are rebuilt from their print for the level's grade.
        const { content, issues } = sanitizeGeneratedContent(format, parsed, gradeForDifficulty(difficulty));
        const preview = buildPreview(format, content);
        const corrections = issues.map((i) => ({
          original: i.original ?? '',
          corrected: i.detail,
          context: i.kind,
          letterOrContraction: '',
        }));
        const wasCorrected = issues.length > 0;

        // Two-stage flow: stop at review stage — no building/uploading
        send({
          stage: 'review',
          content,
          preview,
          corrections,
          wasCorrected,
        });
      } catch (err) {
        console.error('Generate error:', err);

        if (err instanceof SyntaxError) {
          send({ error: 'Could not parse AI response. Please try again.' });
        } else if (err instanceof Error && (err.message.includes('rate_limit') || err.message.includes('429'))) {
          send({ error: 'AI service is busy. Please wait a moment and try again.' });
        } else {
          const message = err instanceof Error ? err.message : 'Failed to generate material';
          send({ error: message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
