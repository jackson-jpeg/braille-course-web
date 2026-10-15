import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewLead, LEAD_SOURCES } from '@/lib/lead-notify';
import { ACTIVE_LEAD, normalizeEmail } from '@/lib/leads';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/leads?key=... — list all leads ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: ACTIVE_LEAD,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      leads: leads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

/* ── POST /api/admin/leads?key=... — manually add a lead ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, name, subject } = body as {
      email?: string;
      name?: string;
      subject?: string;
    };

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const existing = await prisma.lead.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' } },
      select: { id: true, deletedAt: true },
    });
    if (existing && !existing.deletedAt) {
      return NextResponse.json({ error: 'A lead with this email already exists' }, { status: 409 });
    }

    const fields = { name: name?.trim() || null, subject: subject?.trim() || null };
    // A soft-deleted lead with this email comes back (its history and original source are kept).
    const lead = existing
      ? await prisma.lead.update({ where: { id: existing.id }, data: { ...fields, status: 'NEW', deletedAt: null } })
      : await prisma.lead.create({ data: { email: normalized, ...fields, source: 'MANUAL' } });
    await notifyNewLead(lead, LEAD_SOURCES.addLead);

    return NextResponse.json({
      lead: {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    // Unique constraint violation
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A lead with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
