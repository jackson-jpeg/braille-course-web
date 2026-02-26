import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* GET /api/admin/notes?email=... — list notes for a student */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
  }

  try {
    const notes = await prisma.note.findMany({
      where: { studentEmail: email },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      notes: notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

/* POST /api/admin/notes — create a note */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, content } = await req.json();

    if (!email || !content) {
      return NextResponse.json({ error: 'Missing email or content' }, { status: 400 });
    }

    // Strip HTML tags from content
    const sanitizedContent = content.replace(/<[^>]*>/g, '');

    const note = await prisma.note.create({
      data: { studentEmail: email, content: sanitizedContent },
    });

    return NextResponse.json({
      note: { ...note, createdAt: note.createdAt.toISOString() },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
