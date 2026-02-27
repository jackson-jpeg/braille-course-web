import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sectionId = req.nextUrl.searchParams.get('sectionId');
  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
  }

  try {
    const assignments = await prisma.assignment.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      assignments: assignments.map((a) => ({
        id: a.id,
        sectionId: a.sectionId,
        title: a.title,
        maxScore: a.maxScore,
        dueDate: a.dueDate?.toISOString() ?? null,
        sortOrder: a.sortOrder,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Assignments fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sectionId, title, maxScore, dueDate } = await req.json();
    if (!sectionId || !title?.trim()) {
      return NextResponse.json({ error: 'sectionId and title are required' }, { status: 400 });
    }

    const maxSort = await prisma.assignment.aggregate({
      where: { sectionId },
      _max: { sortOrder: true },
    });

    const assignment = await prisma.assignment.create({
      data: {
        sectionId,
        title: title.trim(),
        maxScore: maxScore ?? 100,
        dueDate: dueDate ? new Date(dueDate) : null,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

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
