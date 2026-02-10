import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
]);

/* GET /api/admin/materials — list all materials */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      materials: materials.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

/* POST /api/admin/materials — upload a file */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not set — add it to .env.local' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'Uncategorized';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 25 MB.` },
        { status: 400 },
      );
    }

    const mime = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { error: `File type "${mime}" is not allowed. Accepted: PDF, DOCX, PPTX, XLSX, images, plain text, CSV.` },
        { status: 400 },
      );
    }

    const blob = await put(file.name, file, { access: 'public' });

    const material = await prisma.material.create({
      data: {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        blobUrl: blob.url,
        category,
      },
    });

    return NextResponse.json({
      material: { ...material, createdAt: material.createdAt.toISOString() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upload material';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
