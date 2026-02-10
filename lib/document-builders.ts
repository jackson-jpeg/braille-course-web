import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';
import { brailleMap, dotDescription } from '@/lib/braille-map';

/* ── Interfaces ── */

export interface SlideData {
  title: string;
  bullets: string[];
  speakerNotes?: string;
}

export interface SectionData {
  heading: string;
  content: string;
  bullets?: string[];
  keyTerms?: string[];
  practiceQuestions?: string[];
}

export interface PptxResponse {
  slides: SlideData[];
}

export interface PdfResponse {
  sections: SectionData[];
}

export interface StudyGuideResponse {
  title: string;
  objectives: string[];
  sections: SectionData[];
}

export interface WorksheetItem {
  prompt: string;
  answer: string;
}

export interface WorksheetSection {
  heading: string;
  type:
    | 'fill-in-the-blank'
    | 'matching'
    | 'practice-drill'
    | 'braille-to-print'
    | 'print-to-braille'
    | 'dot-identification';
  instructions: string;
  items: WorksheetItem[];
}

export interface WorksheetResponse {
  sections: WorksheetSection[];
}

export interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface GeneratePreview {
  slideTitles?: string[];
  sectionHeadings?: string[];
  questionCounts?: { 'multiple-choice': number; 'true-false': number; 'short-answer': number };
  totalQuestions?: number;
  worksheetSections?: { heading: string; type: string; itemCount: number }[];
  totalItems?: number;
  objectives?: string[];
}

/* ── Constants ── */

export const CATEGORY_MAP: Record<string, string> = {
  pptx: 'Presentations',
  pdf: 'Handouts',
  'study-guide': 'Study Guides',
  worksheet: 'Worksheets',
  quiz: 'Assessments',
  'session-bundle': 'Session Bundles',
};

/* ── Braille cell drawing helpers ── */

export interface BrailleCellOptions {
  size?: 'small' | 'medium';
  label?: string;
  ghostDots?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function drawBrailleCell(doc: any, pattern: number[], x: number, y: number, options: BrailleCellOptions = {}) {
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
    } else if (options.ghostDots) {
      doc.circle(cx, cy, dotRadius).fillColor('#E0E0E0').fill();
    } else {
      doc.circle(cx, cy, dotRadius).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
    }
  }

  doc.restore();

  // Optional label below the cell
  if (options.label) {
    doc
      .fontSize(size === 'medium' ? 9 : 7)
      .fillColor('#1B2A4A')
      .font('Helvetica-Bold')
      .text(options.label, x, y + cellH + 2, { width: cellW, align: 'center' });
  }

  return cellW; // return width for positioning
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function drawBrailleWord(
  doc: any,
  word: string,
  x: number,
  y: number,
  options: BrailleCellOptions = {},
): number {
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
export function setupPdfDecorations(doc: any, title: string) {
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
    doc
      .fontSize(8)
      .fillColor('#999999')
      .font('Helvetica')
      .text(`Page ${pageNumber}`, 460, 30, { width: 92, align: 'right' });
    doc.moveTo(60, 44).lineTo(552, 44).strokeColor(GOLD).lineWidth(0.5).stroke();
    doc.restore();
    doc.y = 56;
  });

  return {
    getDateLine: () => {
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      return `Generated ${dateStr}`;
    },
  };
}

/* ── Document generators ── */

export function generatePptxBuffer(data: PptxResponse): Promise<Buffer> {
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
        x: 0.5,
        y: 1.5,
        w: '90%',
        h: 1.5,
        fontSize: 36,
        fontFace: 'Arial',
        color: GOLD,
        bold: true,
        align: 'center',
      });
      if (slide.bullets.length > 0) {
        s.addText(slide.bullets[0], {
          x: 0.5,
          y: 3.2,
          w: '90%',
          h: 0.8,
          fontSize: 18,
          fontFace: 'Arial',
          color: CREAM,
          align: 'center',
        });
      }
    } else {
      s.addText(slide.title, {
        x: 0.5,
        y: 0.3,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        fontFace: 'Arial',
        color: NAVY,
        bold: true,
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: 1.0,
        w: 2,
        h: 0.04,
        fill: { color: GOLD },
      });

      if (slide.bullets.length > 0) {
        const bulletText = slide.bullets.map((b) => ({
          text: b,
          options: { bullet: true, fontSize: 16, color: '333333', breakLine: true },
        }));
        s.addText(bulletText as PptxGenJS.TextProps[], {
          x: 0.7,
          y: 1.3,
          w: '85%',
          h: 3.5,
          fontFace: 'Arial',
          lineSpacingMultiple: 1.5,
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

export function generatePdfBuffer(
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
    sections.forEach((section, sectionIdx) => {
      if (doc.y > 650) doc.addPage();

      // Alternating section backgrounds
      const isAlt = sectionIdx % 2 === 1;
      if (isAlt) {
        const bgStartY = doc.y - 4;
        doc.save();
        doc.rect(55, bgStartY, 502, 0.1).fill('#FDFAF3');
        doc.restore();
      }

      doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold').text(section.heading);
      // Gold underline below section heading
      doc.save();
      doc
        .moveTo(60, doc.y + 2)
        .lineTo(300, doc.y + 2)
        .strokeColor(GOLD)
        .lineWidth(0.75)
        .stroke();
      doc.restore();
      doc.moveDown(0.4);

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
        // Navy left border bar for key terms
        const ktStartY = doc.y;
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
              doc
                .fontSize(11)
                .fillColor('#555555')
                .font('Helvetica')
                .text(trimmed.toUpperCase(), 70, textY, { continued: false });
              drawBrailleCell(doc, pattern, 90, textY - 2, { size: 'small', label: dotDescription(trimmed) });
              doc.y = textY + 22;
              doc.moveDown(0.15);
              continue;
            }
          }
          doc.fontSize(11).fillColor('#555555').font('Helvetica').text(`\u2022  ${trimmed}`, { indent: 10 });
          doc.moveDown(0.15);
        }
        // Draw navy border bar
        const ktEndY = doc.y;
        doc.save();
        doc.rect(56, ktStartY - 2, 4, ktEndY - ktStartY + 4).fill('#1B2A4A');
        doc.restore();
        doc.moveDown(0.3);
      }

      if (isStudyGuide && section.practiceQuestions?.length) {
        // Cream background for practice questions
        const pqStartY = doc.y;
        doc.fontSize(12).fillColor(NAVY).font('Helvetica-Bold').text('Practice Questions:');
        section.practiceQuestions.forEach((q, qi) => {
          doc
            .fontSize(11)
            .fillColor('#333333')
            .font('Helvetica')
            .text(`${qi + 1}. ${q}`, { indent: 10 });
          doc.moveDown(0.15);
        });
        const pqEndY = doc.y;
        // Draw cream background behind practice questions
        doc.save();
        doc.rect(55, pqStartY - 4, 502, pqEndY - pqStartY + 8).fill('#FDFAF3');
        doc.restore();
        // Re-render text on top of background
        doc.y = pqStartY;
        doc.fontSize(12).fillColor(NAVY).font('Helvetica-Bold').text('Practice Questions:');
        section.practiceQuestions.forEach((q, qi) => {
          doc
            .fontSize(11)
            .fillColor('#333333')
            .font('Helvetica')
            .text(`${qi + 1}. ${q}`, { indent: 10 });
          doc.moveDown(0.15);
        });
        doc.moveDown(0.3);
      }

      doc.moveDown(0.5);
    });

    doc.end();
  });
}

export function generateWorksheetPdfBuffer(data: WorksheetResponse, title: string): Promise<Buffer> {
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
    doc
      .fontSize(10)
      .fillColor('#666666')
      .font('Helvetica')
      .text('Name: ________________________    Date: ____________', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1);

    let itemCounter = 0;

    data.sections.forEach((section) => {
      if (doc.y > 600) doc.addPage();

      doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold').text(section.heading);
      // Gold underline
      doc.save();
      doc
        .moveTo(60, doc.y + 2)
        .lineTo(300, doc.y + 2)
        .strokeColor(GOLD)
        .lineWidth(0.75)
        .stroke();
      doc.restore();
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
      } else if (section.type === 'practice-drill') {
        // Practice drill with ghost dots for student area
        section.items.forEach((item) => {
          if (doc.y > 680) doc.addPage();
          itemCounter++;
          doc.fontSize(11).fillColor('#333333').font('Helvetica');
          doc.text(`${itemCounter}. ${item.prompt}`);
          doc.moveDown(0.15);

          // Draw ghost dot cells for student to fill in
          const answerText = item.answer.trim().toUpperCase();
          const letters = answerText.replace(/[^A-Z]/g, '');
          if (letters.length > 0 && letters.length <= 10) {
            const startX = 80;
            let curX = startX;
            for (const ch of letters) {
              const pattern = brailleMap[ch];
              if (pattern) {
                const emptyPattern = [0, 0, 0, 0, 0, 0];
                const w = drawBrailleCell(doc, emptyPattern, curX, doc.y, { size: 'medium', ghostDots: true });
                curX += w + 6;
              }
            }
            doc.y = doc.y + 38; // move past the cells
          } else {
            doc.text('Answer: _______________________________________', { indent: 20 });
          }
          doc.moveDown(0.4);
        });
      } else {
        // fill-in-the-blank, braille-to-print, print-to-braille, dot-identification
        section.items.forEach((item) => {
          if (doc.y > 680) doc.addPage();
          itemCounter++;
          doc.fontSize(11).fillColor('#333333').font('Helvetica');
          doc.text(`${itemCounter}. ${item.prompt}`);
          if (
            section.type === 'braille-to-print' ||
            section.type === 'print-to-braille' ||
            section.type === 'dot-identification'
          ) {
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

export function generateQuizPdfBuffer(data: QuizResponse, title: string): Promise<Buffer> {
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
    doc
      .fontSize(10)
      .fillColor('#666666')
      .font('Helvetica')
      .text('Name: ________________________    Date: ____________', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Total Questions: ${data.questions.length}`, { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1);

    // Questions
    data.questions.forEach((q, i) => {
      if (doc.y > 620) doc.addPage();

      const typeLabel = q.type === 'multiple-choice' ? 'MC' : q.type === 'true-false' ? 'T/F' : 'SA';
      doc
        .fontSize(11)
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .text(`${i + 1}. [${typeLabel}] ${q.question}`);
      doc.moveDown(0.2);

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          doc.fontSize(10).fillColor('#333333').font('Helvetica').text(`    ${opt}`);
          doc.moveDown(0.1);
        });
      }

      if (q.type === 'short-answer') {
        doc.moveDown(0.2);
        doc
          .fontSize(10)
          .fillColor('#999999')
          .font('Helvetica')
          .text('Answer: ___________________________________________', { indent: 20 });
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
      doc
        .fontSize(10)
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .text(`${i + 1}. ${q.answer}`);
      doc.fontSize(9).fillColor('#555555').font('Helvetica').text(`   ${q.explanation}`);
      doc.moveDown(0.3);
    });

    doc.end();
  });
}

/* ── Preview builder ── */

export function buildPreview(format: string, parsed: unknown): GeneratePreview {
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
    case 'session-bundle': {
      const bundle = parsed as {
        slides: SlideData[];
        handoutSections: SectionData[];
        worksheetSections: WorksheetSection[];
      };
      return {
        slideTitles: bundle.slides?.map((s) => s.title),
        sectionHeadings: bundle.handoutSections?.map((s) => s.heading),
        worksheetSections: bundle.worksheetSections?.map((s) => ({
          heading: s.heading,
          type: s.type,
          itemCount: s.items.length,
        })),
        totalItems: bundle.worksheetSections?.reduce((sum, s) => sum + s.items.length, 0),
      };
    }
    default:
      return {};
  }
}

/* ── SSE helper ── */

export function sseEncode(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
