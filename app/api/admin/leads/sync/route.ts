import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchEmailsBySubject } from '@/lib/icloud-mail';
import { isAuthorized } from '@/lib/admin-auth';
import { notifyNewLead, LEAD_SOURCES } from '@/lib/lead-notify';

/* ── POST /api/admin/leads/sync?key=... — auto-sync inquiry emails from iCloud IMAP ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const emails = await searchEmailsBySubject('braille session inquiry');

    let synced = 0;

    for (const em of emails) {
      const fromRaw = em.from || '';
      const nameMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
      const email = nameMatch ? nameMatch[2] : fromRaw.replace(/[<>]/g, '').trim();
      const name = nameMatch ? nameMatch[1].trim() : null;

      if (!email) continue;

      const existed = await prisma.lead.findUnique({ where: { email }, select: { id: true } });
      const lead = await prisma.lead.upsert({
        where: { email },
        create: { email, name, subject: em.subject },
        update: {},
      });
      if (!existed) await notifyNewLead(lead, LEAD_SOURCES.syncInbox);
      synced++;
    }

    return NextResponse.json({ synced });
  } catch (err) {
    console.error('Lead sync failed:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to sync leads' }, { status: 500 });
  }
}
