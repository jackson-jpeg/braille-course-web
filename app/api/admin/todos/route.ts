import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todos = await prisma.todoItem.findMany({
      orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      todos: todos.map((t) => ({
        id: t.id,
        text: t.text,
        done: t.done,
        dueDate: t.dueDate?.toISOString() ?? null,
        sortOrder: t.sortOrder,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Todos fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, dueDate } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const maxSort = await prisma.todoItem.aggregate({ _max: { sortOrder: true } });
    const todo = await prisma.todoItem.create({
      data: {
        text: text.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({
      todo: {
        id: todo.id,
        text: todo.text,
        done: todo.done,
        dueDate: todo.dueDate?.toISOString() ?? null,
        sortOrder: todo.sortOrder,
        createdAt: todo.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
