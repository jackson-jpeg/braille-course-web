import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

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
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN is not set — add it to .env.local' },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'Uncategorized';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
