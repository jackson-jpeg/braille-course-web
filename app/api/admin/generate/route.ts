import { NextRequest } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { anthropic } from '@/lib/anthropic';
import { getSettings, getSetting } from '@/lib/settings';
import { dotDescription } from '@/lib/braille-map';
import { contractedBrailleEntries } from '@/lib/contracted-braille-map';
import { validateContentJson } from '@/lib/braille-validator';
import {
  buildPreview,
  sseEncode,
} from '@/lib/document-builders';

export const maxDuration = 60;

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/* ── Braille reference context builder ── */

function buildBrailleContext(difficulty: Difficulty): string {
  const lines: string[] = [
    '=== BRAILLE REFERENCE DATA (use this as ground truth — do NOT guess dot patterns) ===',
    '',
    'The braille cell has 6 dots arranged in 2 columns of 3:',
    '  1 4',
    '  2 5',
    '  3 6',
    '',
    '--- Letter-to-Dot Mappings (A-Z) ---',
  ];

  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    lines.push(`  ${letter}: ${dotDescription(letter)}`);
  }

  lines.push('');
  lines.push('--- Numbers ---');
  lines.push('  Number indicator (#): dots 3 4 5 6');
  lines.push('  After the number indicator, letters A-J become digits 1-9 and 0:');
  for (let i = 1; i <= 9; i++) {
    const letter = String.fromCharCode(64 + i); // A=1 ... I=9
    lines.push(`  ${i}: ${dotDescription(letter)} (same as ${letter})`);
  }
  lines.push(`  0: ${dotDescription('J')} (same as J)`);

  lines.push('');
  lines.push('--- Formatting Indicators ---');
  lines.push('  Capital indicator: dot 6');
  lines.push('  Double capital (all-caps): dot 6, dot 6');
  lines.push('  Letter indicator: dots 5 6');

  if (difficulty === 'intermediate' || difficulty === 'advanced') {
    lines.push('');
    lines.push('--- Grade 2 Contractions ---');

    const wordsigns = contractedBrailleEntries.filter(e => e.type === 'wordsign');
    const strong = contractedBrailleEntries.filter(e => e.type === 'strong');
    const groupsignsStrong = contractedBrailleEntries.filter(e => e.type === 'groupsign-strong');
    const groupsignsLower = contractedBrailleEntries.filter(e => e.type === 'groupsign-lower');
    const wordsignsLower = contractedBrailleEntries.filter(e => e.type === 'wordsign-lower');

    const dotNums = [1, 4, 2, 5, 3, 6];
    const describeDots = (pattern: number[]) => {
      const raised = pattern
        .map((v, i) => (v ? dotNums[i] : null))
        .filter(Boolean)
        .sort((a, b) => a! - b!);
      return `dots ${raised.join(' ')}`;
    };

    lines.push('');
    lines.push('  Strong contractions (unique patterns):');
    for (const e of strong) {
      lines.push(`    "${e.label}": ${describeDots(e.pattern)}`);
    }

    lines.push('');
    lines.push('  Alphabetic wordsigns (same pattern as the letter, used as whole word):');
    for (const e of wordsigns) {
      lines.push(`    "${e.label}": same pattern as ${e.label.charAt(0).toUpperCase()}`);
    }

    lines.push('');
    lines.push('  Strong groupsigns (can appear within words):');
    for (const e of groupsignsStrong) {
      lines.push(`    "${e.label}": ${describeDots(e.pattern)}`);
    }

    if (difficulty === 'advanced') {
      lines.push('');
      lines.push('  Lower groupsigns:');
      for (const e of groupsignsLower) {
        lines.push(`    "${e.label}": ${describeDots(e.pattern)}`);
      }

      lines.push('');
      lines.push('  Lower wordsigns:');
      for (const e of wordsignsLower) {
        lines.push(`    "${e.label}": ${describeDots(e.pattern)}`);
      }
    }
  }

  lines.push('');
  lines.push('=== END BRAILLE REFERENCE DATA ===');
  return lines.join('\n');
}

function buildPedagogicalPreamble(difficulty: Difficulty): string {
  const common = [
    'CRITICAL ACCURACY RULES (apply to all content you generate):',
    '- ALWAYS verify dot patterns against the reference data provided above.',
    '- NEVER guess or invent dot patterns from memory — use ONLY the reference data.',
    '- ALWAYS include dot numbers alongside braille characters (e.g., "The letter A is dots 1").',
    '- When describing a braille cell, specify which dots are raised.',
    '',
  ].join('\n');

  const levelGuidelines: Record<Difficulty, string> = {
    beginner: [
      'PEDAGOGICAL GUIDELINES — BEGINNER LEVEL:',
      '- Use ONLY Grade 1 (uncontracted) braille. Do NOT introduce any contractions.',
      '- Always include dot numbers for every letter or symbol introduced.',
      '- Start with simple, familiar letters (A, B, C, L) before moving to complex ones.',
      '- Use short, familiar words (cat, bag, bed, all) for practice.',
      '- Limit to 3-5 new characters or concepts per section.',
      '- Build from single letters → short words → simple sentences.',
      '- Include the 6-dot cell diagram explanation early in the material.',
      '',
    ].join('\n'),
    intermediate: [
      'PEDAGOGICAL GUIDELINES — INTERMEDIATE LEVEL:',
      '- Mix Grade 1 and common Grade 2 contractions.',
      '- Introduce alphabetic wordsigns (e.g., b="but", c="can") and strong contractions (e.g., "and", "the", "for").',
      '- Relate contractions to their letter origins (e.g., "The wordsign for \'but\' uses the same dots as the letter B").',
      '- Include 5-8 new concepts per section.',
      '- Provide context for when contractions are used vs. spelled out.',
      '- Include dot numbers for all new contractions introduced.',
      '',
    ].join('\n'),
    advanced: [
      'PEDAGOGICAL GUIDELINES — ADVANCED LEVEL:',
      '- Emphasize Grade 2 (contracted) braille throughout.',
      '- Include groupsigns (ch, sh, th, wh, ed, er, ou, ow, st, ar, ing) and lower groupsigns.',
      '- Cover context-dependent rules and exceptions (e.g., when a contraction cannot be used).',
      '- Use full sentences and longer passages for practice.',
      '- Include 8-12 concepts per section.',
      '- Address real-world reading and writing scenarios.',
      '',
    ].join('\n'),
  };

  return levelGuidelines[difficulty] + common;
}

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
      const validWorksheetTypes = ['fill-in-the-blank', 'matching', 'practice-drill', 'braille-to-print', 'print-to-braille', 'dot-identification'];
      for (const section of data.sections) {
        const sec = section as Record<string, unknown>;
        if (!Array.isArray(sec.items) || sec.items.length === 0) {
          throw new Error('Invalid worksheet section: each section needs a non-empty "items" array');
        }
        if (typeof sec.type === 'string' && !validWorksheetTypes.includes(sec.type)) {
          throw new Error(`Invalid worksheet section type "${sec.type}". Must be one of: ${validWorksheetTypes.join(', ')}`);
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

  worksheet: `You are creating a braille course worksheet. Given the user's notes, create an engaging worksheet with varied exercise types. Return ONLY valid JSON (no markdown fences) with this shape:
{ "sections": [{ "heading": "Section Title", "type": "fill-in-the-blank", "instructions": "Instructions for this section.", "items": [{ "prompt": "The braille cell has ___ dots.", "answer": "six" }] }] }
The "type" must be one of: "fill-in-the-blank", "matching", "practice-drill", "braille-to-print", "print-to-braille", or "dot-identification".
Create 3-5 sections with 4-8 items each. Include at least one braille-specific section type. Guidelines for each type:
- fill-in-the-blank: Use ___ in the prompt to indicate blanks.
- matching: Prompts are left-column items and answers are right-column items.
- practice-drill: Prompts are instructions and answers are the expected results.
- braille-to-print: Prompt gives a dot pattern description (e.g., "dots 1 2"), answer is the print character or word. Example: { "prompt": "What letter is represented by dots 1 2?", "answer": "B" }
- print-to-braille: Prompt gives a print letter or word, answer is the dot pattern. Example: { "prompt": "Write the dot numbers for the letter F.", "answer": "dots 1 2 4" }
- dot-identification: Prompt describes a cell configuration, answer lists the dot numbers. Example: { "prompt": "A cell has the top-left and middle-left dots raised. Which dot numbers are these?", "answer": "dots 1 2" }
Always use the reference data above to ensure dot patterns are correct.`,

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
Create 3-6 sections. Include key terms and practice questions where relevant. Content should complement the slide deck — not duplicate it but provide deeper explanation and reference material.`,

  worksheet: `You are creating a braille course worksheet. Given the user's notes, create an engaging worksheet with varied exercise types. Return ONLY valid JSON (no markdown fences) with this shape:
{ "sections": [{ "heading": "Section Title", "type": "fill-in-the-blank", "instructions": "Instructions for this section.", "items": [{ "prompt": "The braille cell has ___ dots.", "answer": "six" }] }] }
The "type" must be one of: "fill-in-the-blank", "matching", "practice-drill", "braille-to-print", "print-to-braille", or "dot-identification".
Create 3-5 sections with 4-8 items each. Include at least one braille-specific section type. This worksheet accompanies a slide deck and handout — focus on active practice and exercises rather than reference content.`,
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
  const difficulty: Difficulty = (['beginner', 'intermediate', 'advanced'].includes(body.difficulty || '')
    ? body.difficulty as Difficulty
    : 'intermediate');

  if (!prompt || !format || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields: prompt, format, title' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!['pptx', 'pdf', 'study-guide', 'worksheet', 'quiz', 'session-bundle'].includes(format)) {
    return new Response(JSON.stringify({ error: 'Invalid format. Use pptx, pdf, study-guide, worksheet, quiz, or session-bundle' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(new TextEncoder().encode(sseEncode(data)));
      };

      try {
        // Stage 1: AI generation
        send({ stage: 'ai' });

        const brailleContext = buildBrailleContext(difficulty);
        const pedagogicalPreamble = buildPedagogicalPreamble(difficulty);

        // Inject course context from settings
        const settings = await getSettings();
        const courseName = getSetting(settings, 'course.name', 'Summer Braille Course');
        const courseStart = getSetting(settings, 'course.startDate', '2026-06-08');
        const courseEnd = getSetting(settings, 'course.endDate', '2026-07-31');
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
          const systemPrompt = pedagogicalPreamble + '\n' + brailleContext + courseContext + '\n' + FORMAT_PROMPTS[format];

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          });

          const textBlock = response.content.find((b) => b.type === 'text');
          if (!textBlock || textBlock.type !== 'text') {
            send({ error: 'No text response from AI' });
            controller.close();
            return;
          }

          parsed = safeParseJSON(textBlock.text);
          validateStructure(format, parsed);
        }

        // Braille fidelity validation
        const { corrected, corrections, wasCorrected } = validateContentJson(parsed);
        const preview = buildPreview(format, corrected);

        // Two-stage flow: stop at review stage — no building/uploading
        send({
          stage: 'review',
          content: corrected,
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
