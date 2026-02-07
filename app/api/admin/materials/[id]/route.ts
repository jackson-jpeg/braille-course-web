import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* PATCH /api/admin/materials/[id] — update filename/category */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, string> = {};
    if (body.filename && typeof body.filename === 'string') data.filename = body.filename;
    if (body.category && typeof body.category === 'string') data.category = body.category;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const material = await prisma.material.update({ where: { id }, data });
    return NextResponse.json({
      material: { ...material, createdAt: material.createdAt.toISOString() },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }
}

/* DELETE /api/admin/materials/[id] — delete a material */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const material = await prisma.material.findUnique({ where: { id } });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Delete from Vercel Blob
    await del(material.blobUrl);

    // Delete from DB
    await prisma.material.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
