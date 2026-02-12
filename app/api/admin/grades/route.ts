import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sectionId = req.nextUrl.searchParams.get('sectionId');
  const enrollmentId = req.nextUrl.searchParams.get('enrollmentId');

  // If enrollmentId is provided, look up the sectionId from the enrollment
  if (!sectionId && enrollmentId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { sectionId: true },
    });
    if (enrollment) sectionId = enrollment.sectionId;
  }

  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId or enrollmentId is required' }, { status: 400 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { sectionId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const grades = await prisma.grade.findMany({
    where: {
      assignmentId: { in: assignments.map((a) => a.id) },
      ...(enrollmentId ? { enrollmentId } : {}),
    },
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
    grades: grades.map((g) => ({
      id: g.id,
      assignmentId: g.assignmentId,
      enrollmentId: g.enrollmentId,
      score: g.score,
      notes: g.notes,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { grades } = (await req.json()) as {
      grades: { assignmentId: string; enrollmentId: string; score: number | null }[];
    };

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ error: 'grades array is required' }, { status: 400 });
    }

    const results = await prisma.$transaction(
      grades.map((g) =>
        prisma.grade.upsert({
          where: {
            assignmentId_enrollmentId: {
              assignmentId: g.assignmentId,
              enrollmentId: g.enrollmentId,
            },
          },
          create: {
            assignmentId: g.assignmentId,
            enrollmentId: g.enrollmentId,
            score: g.score,
          },
          update: {
            score: g.score,
          },
        }),
      ),
    );

    return NextResponse.json({
      saved: results.length,
      grades: results.map((g) => ({
        id: g.id,
        assignmentId: g.assignmentId,
        enrollmentId: g.enrollmentId,
        score: g.score,
        notes: g.notes,
      })),
    });
  } catch (err) {
    console.error('Grades save error:', err);
    return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
  }
}
