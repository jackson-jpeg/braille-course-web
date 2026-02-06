import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* PATCH /api/admin/notes/[id] — update a note */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    const note = await prisma.note.update({
      where: { id },
      data: { content },
    });
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

/* DELETE /api/admin/notes/[id] — delete a note */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
