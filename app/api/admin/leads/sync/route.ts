import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchEmailsBySubject } from '@/lib/icloud-mail';
import { isAuthorized } from '@/lib/admin-auth';
import { notifyNewLead, LEAD_SOURCES } from '@/lib/lead-notify';
import { isKnownContact, isReplyOrForward, normalizeEmail } from '@/lib/leads';

/**
 * POST /api/admin/leads/sync: turn first-contact inquiry emails in the iCloud inbox into leads.
 *
 * Creates a lead only from a first message by someone new. Skipped: replies and forwards (RE:/FW:
 * subjects, In-Reply-To or References headers), and any sender who is already a lead (deleted ones
 * included), a school contact or an enrolled student. Emails are stored lowercased, like the forms.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const emails = await searchEmailsBySubject('braille session inquiry');

    let synced = 0;
    const skipped = { reply: 0, known: 0 };

    for (const em of emails) {
      const fromRaw = em.from || '';
      const nameMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
      const rawEmail = nameMatch ? nameMatch[2] : fromRaw.replace(/[<>]/g, '').trim();
      const name = nameMatch ? nameMatch[1].replace(/^"|"$/g, '').trim() : null;

      if (!rawEmail) continue;
      if (isReplyOrForward(em)) {
        skipped.reply++;
        continue;
      }
      const email = normalizeEmail(rawEmail);
      if (await isKnownContact(email)) {
        skipped.known++;
        continue;
      }

      try {
        const lead = await prisma.lead.create({ data: { email, name, subject: em.subject, source: 'SYNC' } });
        await notifyNewLead(lead, LEAD_SOURCES.syncInbox);
        synced++;
      } catch (err) {
        // Another sync (e.g. a reload) created it a moment ago: already a lead, nothing to do.
        if ((err as { code?: string }).code === 'P2002') skipped.known++;
        else throw err;
      }
    }

    return NextResponse.json({ synced, skipped });
  } catch (err) {
    console.error('Lead sync failed:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to sync leads' }, { status: 500 });
  }
}
