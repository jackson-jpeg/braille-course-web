import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === 'string') data.title = body.title.trim();
    if (typeof body.maxScore === 'number') data.maxScore = body.maxScore;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const assignment = await prisma.assignment.update({ where: { id }, data });

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        sectionId: assignment.sectionId,
        title: assignment.title,
        maxScore: assignment.maxScore,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        sortOrder: assignment.sortOrder,
        createdAt: assignment.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
