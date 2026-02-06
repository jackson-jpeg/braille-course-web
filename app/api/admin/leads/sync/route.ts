import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/leads/sync?key=... — auto-sync inquiry emails from Resend ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resend.emails.receiving.list();
    const emails = result.data?.data ?? [];

    let synced = 0;

    for (const em of emails) {
      const subject = (em as { subject?: string }).subject || '';
      if (!subject.toLowerCase().includes('braille session inquiry')) continue;

      const fromRaw = (em as { from?: string }).from || '';
      const nameMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
      const email = nameMatch ? nameMatch[2] : fromRaw.replace(/[<>]/g, '').trim();
      const name = nameMatch ? nameMatch[1].trim() : null;

      if (!email) continue;

      await prisma.lead.upsert({
        where: { email },
        create: { email, name, subject },
        update: {},
      });
      synced++;
    }

    return NextResponse.json({ synced });
  } catch (err) {
    console.error('Lead sync failed:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to sync leads' }, { status: 500 });
  }
}
