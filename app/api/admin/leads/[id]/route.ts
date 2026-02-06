import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── PATCH /api/admin/leads/[id]?key=... — update a lead ── */
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
    const { status, name, email } = body as {
      status?: string;
      name?: string;
      email?: string;
    };

    if (status && status !== 'NEW' && status !== 'CONTACTED') {
      return NextResponse.json(
        { error: 'Status must be NEW or CONTACTED' },
        { status: 400 }
      );
    }

    const data: Record<string, string> = {};
    if (status) data.status = status;
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      lead: {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

/* ── DELETE /api/admin/leads/[id]?key=... — delete a lead ── */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
