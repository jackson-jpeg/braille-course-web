import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyNewLead, LEAD_SOURCES } from '@/lib/lead-notify';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`waitlist:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  try {
    const { email, list } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // "summer-updates" is the reminder list on /summer for people not ready to enroll yet.
    // An existing lead is left as it is, so a sign-up never overwrites a lead Delaney is already working with.
    const isUpdates = list === 'summer-updates';
    const subject = isUpdates ? 'Summer Course Updates' : 'Waitlist Request';

    const normalized = email.toLowerCase().trim();
    const existed = await prisma.lead.findUnique({ where: { email: normalized }, select: { id: true } });

    const lead = await prisma.lead.upsert({
      where: { email: normalized },
      update: isUpdates ? {} : { subject, status: 'NEW' },
      create: {
        email: normalized,
        subject,
        status: 'NEW',
      },
    });

    if (!existed) await notifyNewLead(lead, isUpdates ? LEAD_SOURCES.summerUpdates : LEAD_SOURCES.waitlist);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Waitlist signup failed:', (err as Error).message);
    return NextResponse.json({ error: 'Unable to join waitlist. Please try again.' }, { status: 500 });
  }
}
