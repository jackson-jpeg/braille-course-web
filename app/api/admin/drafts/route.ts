import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const drafts = await prisma.materialDraft.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      drafts: drafts.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Drafts fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, notes, format, difficulty, instructions, contentJson, wasCorrected } = body;

    if (!title || !format || !contentJson) {
      return NextResponse.json({ error: 'title, format, and contentJson are required' }, { status: 400 });
    }

    const data = {
      title,
      notes: notes || '',
      format,
      difficulty: difficulty || 'intermediate',
      instructions: instructions || null,
      contentJson: typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson),
      wasCorrected: wasCorrected ?? false,
    };

    let draft;
    if (id) {
      // Upsert: update if exists, create if not
      draft = await prisma.materialDraft.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    } else {
      draft = await prisma.materialDraft.create({ data });
    }

    return NextResponse.json({
      draft: {
        ...draft,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
