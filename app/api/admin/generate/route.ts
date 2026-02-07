import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';
import { anthropic } from '@/lib/anthropic';
import { brailleMap, dotDescription } from '@/lib/braille-map';
import { contractedBrailleEntries } from '@/lib/contracted-braille-map';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';

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

/* ── Interfaces ── */

interface SlideData {
  title: string;
  bullets: string[];
  speakerNotes?: string;
}

interface SectionData {
  heading: string;
  content: string;
  bullets?: string[];
  keyTerms?: string[];
  practiceQuestions?: string[];
}

interface PptxResponse {
  slides: SlideData[];
}

interface PdfResponse {
  sections: SectionData[];
}

interface StudyGuideResponse {
  title: string;
  objectives: string[];
  sections: SectionData[];
}

interface WorksheetItem {
  prompt: string;
  answer: string;
}

interface WorksheetSection {
  heading: string;
  type: 'fill-in-the-blank' | 'matching' | 'practice-drill' | 'braille-to-print' | 'print-to-braille' | 'dot-identification';
  instructions: string;
  items: WorksheetItem[];
}

interface WorksheetResponse {
  sections: WorksheetSection[];
}

interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

interface QuizResponse {
  questions: QuizQuestion[];
}

interface GeneratePreview {
  slideTitles?: string[];
  sectionHeadings?: string[];
  questionCounts?: { 'multiple-choice': number; 'true-false': number; 'short-answer': number };
  totalQuestions?: number;
  worksheetSections?: { heading: string; type: string; itemCount: number }[];
  totalItems?: number;
  objectives?: string[];
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

function buildPreview(format: string, parsed: unknown): GeneratePreview {
  switch (format) {
    case 'pptx': {
      const slides = (parsed as PptxResponse).slides;
      return { slideTitles: slides.map((s) => s.title) };
    }
    case 'pdf': {
      const sections = (parsed as PdfResponse).sections;
      return { sectionHeadings: sections.map((s) => s.heading) };
    }
    case 'study-guide': {
      const sg = parsed as StudyGuideResponse;
      return {
        sectionHeadings: sg.sections.map((s) => s.heading),
        objectives: sg.objectives,
      };
    }
    case 'worksheet': {
      const ws = parsed as WorksheetResponse;
      const worksheetSections = ws.sections.map((s) => ({
        heading: s.heading,
        type: s.type,
        itemCount: s.items.length,
      }));
      return {
        worksheetSections,
        totalItems: ws.sections.reduce((sum, s) => sum + s.items.length, 0),
      };
    }
    case 'quiz': {
      const q = parsed as QuizResponse;
      const counts = { 'multiple-choice': 0, 'true-false': 0, 'short-answer': 0 };
      for (const question of q.questions) {
        if (counts[question.type] !== undefined) counts[question.type]++;
      }
      return { questionCounts: counts, totalQuestions: q.questions.length };
    }
    default:
      return {};
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

const CATEGORY_MAP: Record<string, string> = {
  pptx: 'Presentations',
  pdf: 'Handouts',
  'study-guide': 'Study Guides',
  worksheet: 'Worksheets',
  quiz: 'Assessments',
};

/* ── Braille cell drawing helpers ── */

interface BrailleCellOptions {
  size?: 'small' | 'medium';
  label?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBrailleCell(doc: any, pattern: number[], x: number, y: number, options: BrailleCellOptions = {}) {
  const size = options.size || 'small';
  const dotRadius = size === 'medium' ? 3 : 2;
  const dotSpacingX = size === 'medium' ? 12 : 8;
  const dotSpacingY = size === 'medium' ? 12 : 8;
  const padding = size === 'medium' ? 6 : 4;
  const cellW = dotSpacingX + padding * 2;
  const cellH = dotSpacingY * 2 + padding * 2;

  // Rounded rectangle background
  doc.save();
  doc.roundedRect(x, y, cellW, cellH, 3).strokeColor('#CCCCCC').lineWidth(0.5).stroke();

  // Dot positions: pattern is [d1, d4, d2, d5, d3, d6]
  // Grid layout: col 0 = dots 1,2,3  col 1 = dots 4,5,6
  const dotMap = [
    { col: 0, row: 0, idx: 0 }, // dot 1
    { col: 1, row: 0, idx: 1 }, // dot 4
    { col: 0, row: 1, idx: 2 }, // dot 2
    { col: 1, row: 1, idx: 3 }, // dot 5
    { col: 0, row: 2, idx: 4 }, // dot 3
    { col: 1, row: 2, idx: 5 }, // dot 6
  ];

  for (const dot of dotMap) {
    const cx = x + padding + dot.col * dotSpacingX;
    const cy = y + padding + dot.row * dotSpacingY;
    if (pattern[dot.idx]) {
      doc.circle(cx, cy, dotRadius).fillColor('#1B2A4A').fill();
    } else {
      doc.circle(cx, cy, dotRadius).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
    }
  }

  doc.restore();

  // Optional label below the cell
  if (options.label) {
    doc.fontSize(size === 'medium' ? 9 : 7)
      .fillColor('#1B2A4A')
      .font('Helvetica-Bold')
      .text(options.label, x, y + cellH + 2, { width: cellW, align: 'center' });
  }

  return cellW; // return width for positioning
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBrailleWord(doc: any, word: string, x: number, y: number, options: BrailleCellOptions = {}): number {
  let curX = x;
  const gap = options.size === 'medium' ? 4 : 3;
  for (const char of word.toUpperCase()) {
    const pattern = brailleMap[char];
    if (pattern) {
      const w = drawBrailleCell(doc, pattern, curX, y, { ...options, label: char });
      curX += w + gap;
    }
  }
  return curX - x; // total width
}

/* ── PDF page decoration helper ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupPdfDecorations(doc: any, title: string) {
  const NAVY = '#1B2A4A';
  const GOLD = '#D4A853';
  let pageNumber = 1;

  doc.on('pageAdded', () => {
    pageNumber++;
    // Header on pages 2+
    doc.save();
    doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold');
    const truncatedTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
    doc.text(truncatedTitle, 60, 30, { width: 400, lineBreak: false });
    doc.fontSize(8).fillColor('#999999').font('Helvetica')
      .text(`Page ${pageNumber}`, 460, 30, { width: 92, align: 'right' });
    doc.moveTo(60, 44).lineTo(552, 44).strokeColor(GOLD).lineWidth(0.5).stroke();
    doc.restore();
    doc.y = 56;
  });

  return { getDateLine: () => {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `Generated ${dateStr}`;
  }};
}

/* ── Document generators ── */

function generatePptxBuffer(data: PptxResponse): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const NAVY = '1B2A4A';
  const GOLD = 'D4A853';
  const CREAM = 'FDF8F0';

  data.slides.forEach((slide, i) => {
    const s = pptx.addSlide();
    s.background = { fill: i === 0 ? NAVY : CREAM };

    if (i === 0) {
      s.addText(slide.title, {
        x: 0.5, y: 1.5, w: '90%', h: 1.5,
        fontSize: 36, fontFace: 'Arial',
        color: GOLD, bold: true, align: 'center',
      });
      if (slide.bullets.length > 0) {
        s.addText(slide.bullets[0], {
          x: 0.5, y: 3.2, w: '90%', h: 0.8,
          fontSize: 18, fontFace: 'Arial',
          color: CREAM, align: 'center',
        });
      }
    } else {
      s.addText(slide.title, {
        x: 0.5, y: 0.3, w: '90%', h: 0.8,
        fontSize: 24, fontFace: 'Arial',
        color: NAVY, bold: true,
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.0, w: 2, h: 0.04, fill: { color: GOLD },
      });

      if (slide.bullets.length > 0) {
        const bulletText = slide.bullets.map((b) => ({
          text: b,
          options: { bullet: true, fontSize: 16, color: '333333', breakLine: true },
        }));
        s.addText(bulletText as PptxGenJS.TextProps[], {
          x: 0.7, y: 1.3, w: '85%', h: 3.5,
          fontFace: 'Arial', lineSpacingMultiple: 1.5,
          valign: 'top',
        });
      }

      if (slide.speakerNotes) {
        s.addNotes(slide.speakerNotes);
      }
    }
  });

  return pptx.write({ outputType: 'nodebuffer' }) as Promise<Buffer>;
}

function generatePdfBuffer(
  data: PdfResponse | StudyGuideResponse,
  title: string,
  isStudyGuide: boolean,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const NAVY = '#1B2A4A';
    const GOLD = '#D4A853';
    const { getDateLine } = setupPdfDecorations(doc, title);

    doc.fontSize(28).fillColor(NAVY).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#888888').font('Helvetica').text(getDateLine(), { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1);

    if (isStudyGuide && 'objectives' in data && data.objectives?.length) {
      doc.fontSize(14).fillColor(NAVY).font('Helvetica-Bold').text('Learning Objectives');
      doc.moveDown(0.3);
      data.objectives.forEach((obj) => {
        doc.fontSize(11).fillColor('#333333').font('Helvetica').text(`\u2022  ${obj}`, { indent: 10 });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.8);
    }

    const sections = data.sections;
    sections.forEach((section) => {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold').text(section.heading);
      doc.moveDown(0.3);

      if (section.content) {
        doc.fontSize(11).fillColor('#333333').font('Helvetica').text(section.content, { lineGap: 3 });
        doc.moveDown(0.3);
      }

      if (section.bullets?.length) {
        section.bullets.forEach((b) => {
          doc.fontSize(11).fillColor('#333333').font('Helvetica').text(`\u2022  ${b}`, { indent: 10 });
          doc.moveDown(0.15);
        });
        doc.moveDown(0.3);
      }

      if (isStudyGuide && section.keyTerms?.length) {
        doc.fontSize(12).fillColor(NAVY).font('Helvetica-Bold').text('Key Terms:');
        doc.moveDown(0.2);
        for (const term of section.keyTerms) {
          if (doc.y > 680) doc.addPage();
          const trimmed = term.trim();
          // If the term is a single letter A-Z, draw its braille cell inline
          if (trimmed.length === 1 && /^[A-Za-z]$/.test(trimmed)) {
            const pattern = brailleMap[trimmed.toUpperCase()];
            if (pattern) {
              const textY = doc.y;
              doc.fontSize(11).fillColor('#555555').font('Helvetica').text(trimmed.toUpperCase(), 70, textY, { continued: false });
              drawBrailleCell(doc, pattern, 90, textY - 2, { size: 'small', label: dotDescription(trimmed) });
              doc.y = textY + 22;
              doc.moveDown(0.15);
              continue;
            }
          }
          doc.fontSize(11).fillColor('#555555').font('Helvetica').text(`\u2022  ${trimmed}`, { indent: 10 });
          doc.moveDown(0.15);
        }
        doc.moveDown(0.3);
      }

      if (isStudyGuide && section.practiceQuestions?.length) {
        doc.fontSize(12).fillColor(NAVY).font('Helvetica-Bold').text('Practice Questions:');
        section.practiceQuestions.forEach((q, qi) => {
          doc.fontSize(11).fillColor('#333333').font('Helvetica').text(`${qi + 1}. ${q}`, { indent: 10 });
          doc.moveDown(0.15);
        });
        doc.moveDown(0.3);
      }

      doc.moveDown(0.5);
    });

    doc.end();
  });
}

function generateWorksheetPdfBuffer(data: WorksheetResponse, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const NAVY = '#1B2A4A';
    const GOLD = '#D4A853';
    const { getDateLine } = setupPdfDecorations(doc, title);

    // Title
    doc.fontSize(28).fillColor(NAVY).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.15);
    doc.fontSize(9).fillColor('#888888').font('Helvetica').text(getDateLine(), { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#666666').font('Helvetica').text('Name: ________________________    Date: ____________', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1);

    let itemCounter = 0;

    data.sections.forEach((section) => {
      if (doc.y > 600) doc.addPage();

      doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold').text(section.heading);
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor('#555555').font('Helvetica-Oblique').text(section.instructions);
      doc.moveDown(0.5);

      if (section.type === 'matching') {
        // Two-column matching layout
        const leftX = 80;
        const rightX = 340;
        const startY = doc.y;

        doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold');
        doc.text('Column A', leftX, startY);
        doc.text('Column B', rightX, startY);
        doc.moveDown(0.3);

        const shuffledAnswers = [...section.items.map((it) => it.answer)].sort(() => Math.random() - 0.5);

        section.items.forEach((item, idx) => {
          if (doc.y > 680) doc.addPage();
          const y = doc.y;
          doc.fontSize(11).fillColor('#333333').font('Helvetica');
          doc.text(`${idx + 1}. ${item.prompt}`, leftX, y);
          doc.text(`${String.fromCharCode(65 + idx)}. ${shuffledAnswers[idx]}`, rightX, y);
          doc.moveDown(0.4);
        });
        doc.moveDown(0.3);
        doc.text('Answers: ____  ____  ____  ____  ____  ____  ____  ____', 80);
      } else {
        // fill-in-the-blank, practice-drill, braille-to-print, print-to-braille, dot-identification
        section.items.forEach((item) => {
          if (doc.y > 680) doc.addPage();
          itemCounter++;
          doc.fontSize(11).fillColor('#333333').font('Helvetica');
          doc.text(`${itemCounter}. ${item.prompt}`);
          if (section.type === 'practice-drill' || section.type === 'braille-to-print' || section.type === 'print-to-braille' || section.type === 'dot-identification') {
            doc.moveDown(0.15);
            doc.text('Answer: _______________________________________', { indent: 20 });
          }
          doc.moveDown(0.4);
        });
      }

      doc.moveDown(0.5);
    });

    // Answer key on a new page
    doc.addPage();
    doc.fontSize(22).fillColor(NAVY).font('Helvetica-Bold').text('Answer Key', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(1.5).stroke();
    doc.moveDown(0.8);

    let answerCounter = 0;
    data.sections.forEach((section) => {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(13).fillColor(NAVY).font('Helvetica-Bold').text(section.heading);
      doc.moveDown(0.3);

      const isBrailleSection = ['braille-to-print', 'print-to-braille', 'dot-identification'].includes(section.type);

      section.items.forEach((item, idx) => {
        if (doc.y > 660) doc.addPage();
        answerCounter++;
        const num = section.type === 'matching' ? `${idx + 1}` : `${answerCounter}`;
        doc.fontSize(10).fillColor('#333333').font('Helvetica').text(`${num}. ${item.answer}`);

        // Draw braille cell next to answer for braille-specific sections
        if (isBrailleSection) {
          const answerText = item.answer.trim().toUpperCase();
          // If answer is a single letter, draw its cell
          if (answerText.length === 1 && brailleMap[answerText]) {
            drawBrailleCell(doc, brailleMap[answerText], doc.x + 200, doc.y - 12, { size: 'small' });
          }
        }

        doc.moveDown(0.15);
      });
      doc.moveDown(0.4);
    });

    doc.end();
  });
}

function generateQuizPdfBuffer(data: QuizResponse, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const NAVY = '#1B2A4A';
    const GOLD = '#D4A853';
    const { getDateLine } = setupPdfDecorations(doc, title);

    // Title page
    doc.fontSize(28).fillColor(NAVY).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.15);
    doc.fontSize(9).fillColor('#888888').font('Helvetica').text(getDateLine(), { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#666666').font('Helvetica').text('Name: ________________________    Date: ____________', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Total Questions: ${data.questions.length}`, { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1);

    // Questions
    data.questions.forEach((q, i) => {
      if (doc.y > 620) doc.addPage();

      const typeLabel = q.type === 'multiple-choice' ? 'MC' : q.type === 'true-false' ? 'T/F' : 'SA';
      doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold').text(`${i + 1}. [${typeLabel}] ${q.question}`);
      doc.moveDown(0.2);

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          doc.fontSize(10).fillColor('#333333').font('Helvetica').text(`    ${opt}`);
          doc.moveDown(0.1);
        });
      }

      if (q.type === 'short-answer') {
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor('#999999').font('Helvetica').text('Answer: ___________________________________________', { indent: 20 });
      }

      doc.moveDown(0.5);
    });

    // Answer key on a new page
    doc.addPage();
    doc.fontSize(22).fillColor(NAVY).font('Helvetica-Bold').text('Answer Key', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(1.5).stroke();
    doc.moveDown(0.8);

    data.questions.forEach((q, i) => {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text(`${i + 1}. ${q.answer}`);
      doc.fontSize(9).fillColor('#555555').font('Helvetica').text(`   ${q.explanation}`);
      doc.moveDown(0.3);
    });

    doc.end();
  });
}

/* ── SSE helper ── */

function sseEncode(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

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

  if (!['pptx', 'pdf', 'study-guide', 'worksheet', 'quiz'].includes(format)) {
    return new Response(JSON.stringify({ error: 'Invalid format. Use pptx, pdf, study-guide, worksheet, or quiz' }), {
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
        const systemPrompt = pedagogicalPreamble + '\n' + brailleContext + '\n\n' + FORMAT_PROMPTS[format];
        const userMessage = instructions
          ? `Notes/Content:\n${prompt}\n\nAdditional Instructions:\n${instructions}`
          : `Notes/Content:\n${prompt}`;

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

        const parsed = safeParseJSON(textBlock.text);
        validateStructure(format, parsed);

        const preview = buildPreview(format, parsed);

        // Stage 2: Building document
        send({ stage: 'building' });

        let buffer: Buffer;
        let filename: string;
        let contentType: string;

        const safeTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

        if (format === 'pptx') {
          buffer = await generatePptxBuffer(parsed as PptxResponse);
          filename = `${safeTitle}.pptx`;
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        } else if (format === 'worksheet') {
          buffer = await generateWorksheetPdfBuffer(parsed as WorksheetResponse, title);
          filename = `${safeTitle}-worksheet.pdf`;
          contentType = 'application/pdf';
        } else if (format === 'quiz') {
          buffer = await generateQuizPdfBuffer(parsed as QuizResponse, title);
          filename = `${safeTitle}-quiz.pdf`;
          contentType = 'application/pdf';
        } else {
          buffer = await generatePdfBuffer(
            parsed as PdfResponse | StudyGuideResponse,
            title,
            format === 'study-guide',
          );
          filename = `${safeTitle}.pdf`;
          contentType = 'application/pdf';
        }

        // Stage 3: Uploading
        send({ stage: 'uploading' });

        const blob = await put(filename, buffer, { access: 'public' });

        const material = await prisma.material.create({
          data: {
            filename,
            contentType,
            size: buffer.length,
            blobUrl: blob.url,
            category: CATEGORY_MAP[format],
          },
        });

        send({
          stage: 'done',
          material: { ...material, createdAt: material.createdAt.toISOString() },
          preview,
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
