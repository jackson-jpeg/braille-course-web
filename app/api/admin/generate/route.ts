import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';
import { anthropic } from '@/lib/anthropic';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';

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
};

const CATEGORY_MAP: Record<string, string> = {
  pptx: 'Presentations',
  pdf: 'Handouts',
  'study-guide': 'Study Guides',
};

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
      // Title slide
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
      // Content slide
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

    // Title
    doc.fontSize(28).fillColor(NAVY).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1);

    // Objectives (study guide only)
    if (isStudyGuide && 'objectives' in data && data.objectives?.length) {
      doc.fontSize(14).fillColor(NAVY).font('Helvetica-Bold').text('Learning Objectives');
      doc.moveDown(0.3);
      data.objectives.forEach((obj) => {
        doc.fontSize(11).fillColor('#333333').font('Helvetica').text(`\u2022  ${obj}`, { indent: 10 });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.8);
    }

    // Sections
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
        doc.fontSize(11).fillColor('#555555').font('Helvetica').text(section.keyTerms.join(', '));
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

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt, format, title, instructions } = await req.json();

    if (!prompt || !format || !title) {
      return NextResponse.json({ error: 'Missing required fields: prompt, format, title' }, { status: 400 });
    }

    if (!['pptx', 'pdf', 'study-guide'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use pptx, pdf, or study-guide' }, { status: 400 });
    }

    const systemPrompt = FORMAT_PROMPTS[format];
    const userMessage = instructions
      ? `Notes/Content:\n${prompt}\n\nAdditional Instructions:\n${instructions}`
      : `Notes/Content:\n${prompt}`;

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    // Parse JSON — strip markdown fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(jsonText);

    // Generate file
    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    const safeTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

    if (format === 'pptx') {
      buffer = await generatePptxBuffer(parsed as PptxResponse);
      filename = `${safeTitle}.pptx`;
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else {
      buffer = await generatePdfBuffer(
        parsed as PdfResponse | StudyGuideResponse,
        title,
        format === 'study-guide',
      );
      filename = `${safeTitle}.pdf`;
      contentType = 'application/pdf';
    }

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, { access: 'public' });

    // Create Material record
    const material = await prisma.material.create({
      data: {
        filename,
        contentType,
        size: buffer.length,
        blobUrl: blob.url,
        category: CATEGORY_MAP[format],
      },
    });

    return NextResponse.json({
      material: { ...material, createdAt: material.createdAt.toISOString() },
    });
  } catch (err) {
    console.error('Generate error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate material';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
