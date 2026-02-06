import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

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
