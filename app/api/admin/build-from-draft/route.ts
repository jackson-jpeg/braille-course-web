import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';
import {
  CATEGORY_MAP,
  sseEncode,
  generatePptxBuffer,
  generatePdfBuffer,
  generateWorksheetPdfBuffer,
  generateQuizPdfBuffer,
  type PptxResponse,
  type PdfResponse,
  type StudyGuideResponse,
  type WorksheetResponse,
  type QuizResponse,
} from '@/lib/document-builders';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { contentJson?: string; format?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { contentJson, format, title } = body;

  if (!contentJson || !format || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields: contentJson, format, title' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsed;
  try {
    parsed = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid contentJson: not valid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const safeTitle = title
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(new TextEncoder().encode(sseEncode(data)));
      };

      try {
        if (format === 'session-bundle') {
          // Build three documents sequentially with progress sub-events
          const materials: Array<{
            id: string;
            filename: string;
            contentType: string;
            size: number;
            blobUrl: string;
            category: string;
            createdAt: string;
          }> = [];

          // 1. Slides (PPTX)
          send({ stage: 'building', sub: 'slides', progress: '1/3' });
          const slidesData: PptxResponse = { slides: parsed.slides };
          const pptxBuffer = await generatePptxBuffer(slidesData);
          send({ stage: 'uploading', sub: 'slides', progress: '1/3' });
          const pptxFilename = `${safeTitle}-slides.pptx`;
          const pptxBlob = await put(pptxFilename, pptxBuffer, { access: 'public' });
          const pptxMaterial = await prisma.material.create({
            data: {
              filename: pptxFilename,
              contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              size: pptxBuffer.length,
              blobUrl: pptxBlob.url,
              category: 'Presentations',
            },
          });
          materials.push({ ...pptxMaterial, createdAt: pptxMaterial.createdAt.toISOString() });

          // 2. Handout (PDF)
          send({ stage: 'building', sub: 'handout', progress: '2/3' });
          const handoutData: PdfResponse = { sections: parsed.handoutSections };
          const handoutBuffer = await generatePdfBuffer(handoutData, title + ' — Handout', false);
          send({ stage: 'uploading', sub: 'handout', progress: '2/3' });
          const handoutFilename = `${safeTitle}-handout.pdf`;
          const handoutBlob = await put(handoutFilename, handoutBuffer, { access: 'public' });
          const handoutMaterial = await prisma.material.create({
            data: {
              filename: handoutFilename,
              contentType: 'application/pdf',
              size: handoutBuffer.length,
              blobUrl: handoutBlob.url,
              category: 'Handouts',
            },
          });
          materials.push({ ...handoutMaterial, createdAt: handoutMaterial.createdAt.toISOString() });

          // 3. Worksheet (PDF)
          send({ stage: 'building', sub: 'worksheet', progress: '3/3' });
          const worksheetData: WorksheetResponse = { sections: parsed.worksheetSections };
          const worksheetBuffer = await generateWorksheetPdfBuffer(worksheetData, title + ' — Worksheet');
          send({ stage: 'uploading', sub: 'worksheet', progress: '3/3' });
          const worksheetFilename = `${safeTitle}-worksheet.pdf`;
          const worksheetBlob = await put(worksheetFilename, worksheetBuffer, { access: 'public' });
          const worksheetMaterial = await prisma.material.create({
            data: {
              filename: worksheetFilename,
              contentType: 'application/pdf',
              size: worksheetBuffer.length,
              blobUrl: worksheetBlob.url,
              category: 'Worksheets',
            },
          });
          materials.push({ ...worksheetMaterial, createdAt: worksheetMaterial.createdAt.toISOString() });

          send({ stage: 'done', materials });
        } else {
          // Single document build
          send({ stage: 'building' });

          let buffer: Buffer;
          let filename: string;
          let contentType: string;

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

          send({ stage: 'uploading' });

          const blob = await put(filename, buffer, { access: 'public' });

          const material = await prisma.material.create({
            data: {
              filename,
              contentType,
              size: buffer.length,
              blobUrl: blob.url,
              category: CATEGORY_MAP[format] || 'Uncategorized',
            },
          });

          send({
            stage: 'done',
            material: { ...material, createdAt: material.createdAt.toISOString() },
          });
        }
      } catch (err) {
        console.error('Build error:', err);
        const message = err instanceof Error ? err.message : 'Failed to build document';
        send({ error: message });
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
