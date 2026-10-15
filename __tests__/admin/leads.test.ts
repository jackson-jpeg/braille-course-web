/**
 * @jest-environment node
 *
 * Lead rules: Sync Inbox creates a lead only from a first message by someone new, deleting a lead
 * is a soft delete the admin hides, every create records its source, and emailing a NEW lead from
 * the admin marks it CONTACTED.
 */
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

const db = {
  lead: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
  schoolInquiry: { findFirst: jest.fn() },
  enrollment: { findFirst: jest.fn() },
};
jest.mock('@/lib/prisma', () => ({
  get prisma() {
    return db;
  },
}));
const search = jest.fn();
jest.mock('@/lib/icloud-mail', () => ({ searchEmailsBySubject: (...a: unknown[]) => search(...a) }));
jest.mock('@/lib/admin-auth', () => ({ isAuthorized: () => true }));
const notify = jest.fn();
jest.mock('@/lib/lead-notify', () => ({
  notifyNewLead: (...a: unknown[]) => notify(...a),
  LEAD_SOURCES: { syncInbox: 'sync' },
}));

import { isReplyOrForward, markLeadsContacted, normalizeEmail } from '@/lib/leads';
import { POST as sync } from '@/app/api/admin/leads/sync/route';

const ROOT = path.join(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

beforeEach(() => {
  jest.clearAllMocks();
  db.lead.findFirst.mockResolvedValue(null);
  db.schoolInquiry.findFirst.mockResolvedValue(null);
  db.enrollment.findFirst.mockResolvedValue(null);
  db.lead.create.mockImplementation(async ({ data }) => ({ id: 'new', ...data }));
});

describe('isReplyOrForward', () => {
  it.each(['RE: Braille Session Inquiry', 're:x', 'Fwd: x', 'FW: x', ' Re[2]: x', 'AW: x'])('%s is a reply', (s) =>
    expect(isReplyOrForward({ subject: s })).toBe(true),
  );
  it('a reply header makes it a reply whatever the subject', () => {
    expect(isReplyOrForward({ subject: 'Braille Session Inquiry', inReplyTo: '<a@b>' })).toBe(true);
    expect(isReplyOrForward({ subject: 'Braille Session Inquiry', references: '<a@b>' })).toBe(true);
  });
  it('a first message is not', () => {
    expect(isReplyOrForward({ subject: 'Braille Session Inquiry', inReplyTo: null, references: '' })).toBe(false);
    expect(isReplyOrForward({ subject: 'Regarding braille session inquiry' })).toBe(false);
  });
});

describe('Sync Inbox', () => {
  const run = async () => (await sync(new NextRequest('http://x/api/admin/leads/sync', { method: 'POST' }))).json();
  const msg = (from: string, subject = 'Braille Session Inquiry', extra = {}) => ({ from, subject, ...extra });

  it('creates a lead from a first message by someone new, lowercased, with source SYNC', async () => {
    search.mockResolvedValue([msg('"Pat Smith" <Pat.Smith@Example.com>')]);
    expect(await run()).toEqual({ synced: 1, skipped: { reply: 0, known: 0 } });
    expect(db.lead.create).toHaveBeenCalledWith({
      data: { email: 'pat.smith@example.com', name: 'Pat Smith', subject: 'Braille Session Inquiry', source: 'SYNC' },
    });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('skips replies and forwards (the Monique case)', async () => {
    search.mockResolvedValue([
      msg('M <m@school.org>', 'RE: Braille Session Inquiry'),
      msg('M <m@school.org>', 'Braille Session Inquiry', { inReplyTo: '<x@y>' }),
      msg('M <m@school.org>', 'Fwd: Braille Session Inquiry'),
    ]);
    expect(await run()).toEqual({ synced: 0, skipped: { reply: 3, known: 0 } });
    expect(db.lead.create).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it.each([
    ['an existing or deleted lead', 'lead'],
    ['a school contact', 'schoolInquiry'],
    ['an enrolled student', 'enrollment'],
  ] as const)('skips a sender who is %s, matching case-insensitively', async (_, table) => {
    db[table].findFirst.mockResolvedValue({ id: 'x' });
    search.mockResolvedValue([msg('M <MoniqueM@School.org>')]);
    expect(await run()).toEqual({ synced: 0, skipped: { reply: 0, known: 1 } });
    const where = db[table].findFirst.mock.calls[0][0].where;
    expect(Object.values(where)[0]).toEqual({ equals: 'moniquem@school.org', mode: 'insensitive' });
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it('the known-lead check includes soft-deleted leads, so a deleted lead is never re-created', () => {
    expect(read('lib/leads.ts')).toMatch(/prisma\.lead\.findFirst\(\{ where: \{ email: ci \}/);
  });
});

describe('markLeadsContacted', () => {
  it('moves only active NEW leads to CONTACTED, case-insensitively, de-duplicated', async () => {
    db.lead.updateMany.mockResolvedValue({ count: 1 });
    expect(await markLeadsContacted(['A@x.com', 'a@x.com ', ''])).toBe(1);
    expect(db.lead.updateMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: 'NEW',
        OR: [
          { email: { equals: 'A@x.com', mode: 'insensitive' } },
          { email: { equals: 'a@x.com', mode: 'insensitive' } },
        ],
      },
      data: { status: 'CONTACTED' },
    });
  });
  it('never throws, so a sent email is never reported as failed', async () => {
    db.lead.updateMany.mockRejectedValue(new Error('db down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(markLeadsContacted(['a@x.com'])).resolves.toBe(0);
  });
  it('does nothing with no addresses', async () => {
    expect(await markLeadsContacted([])).toBe(0);
    expect(db.lead.updateMany).not.toHaveBeenCalled();
  });
  it.each([
    ['app/api/admin/emails/route.ts', 'await markLeadsContacted(recipients);'],
    ['app/api/admin/emails/bulk/route.ts', 'await markLeadsContacted(results.filter((r) => r.success)'],
    ['app/api/cron/send-scheduled-emails/route.ts', 'await markLeadsContacted(email.to);'],
  ])('%s marks recipients contacted after a successful send', (file, call) => {
    const src = read(file);
    expect(src).toContain(call);
  });
  it('bulk send counts a Resend error as a failure, not a send', () => {
    expect(read('app/api/admin/emails/bulk/route.ts')).toContain(
      'if (result.error) results.push({ email, success: false',
    );
  });
});

describe('soft delete and source', () => {
  it('normalizeEmail lowercases and trims', () => expect(normalizeEmail('  A@B.Com ')).toBe('a@b.com'));

  it('DELETE soft-deletes, and PATCH cannot touch a deleted lead', () => {
    const src = read('app/api/admin/leads/[id]/route.ts');
    expect(src).not.toMatch(/prisma\.lead\.delete\(/);
    expect(src).toContain('data: { deletedAt: new Date() }');
    expect(src).toContain('where: { id, ...ACTIVE_LEAD }');
  });

  it.each([
    ['app/api/admin/leads/route.ts', /where: ACTIVE_LEAD|where: \{ \.\.\.ACTIVE_LEAD/],
    ['app/admin/page.tsx', /prisma\.lead\.findMany\(\{[^}]*deletedAt: null/s],
  ])('%s hides soft-deleted leads', (file, re) => expect(read(file)).toMatch(re));

  it('no admin read of leads forgets the soft-delete filter', () => {
    const files = ['app/api/admin/leads/route.ts', 'app/admin/page.tsx', 'app/api/admin/analytics/route.ts'];
    for (const f of files) {
      if (!fs.existsSync(path.join(ROOT, f))) continue;
      for (const m of read(f).matchAll(/prisma\.lead\.(findMany|count)\(([^;]*)/gs)) {
        expect([f, /deletedAt: null|ACTIVE_LEAD/.test(m[2])]).toEqual([f, true]);
      }
    }
  });

  it.each([
    ['app/api/appointment-request/route.ts', "source: 'APPOINTMENT'"],
    ['app/api/waitlist-signup/route.ts', "source: isUpdates ? 'SUMMER' : 'WAITLIST'"],
    ['app/api/admin/leads/sync/route.ts', "source: 'SYNC'"],
    ['app/api/admin/leads/route.ts', "source: 'MANUAL'"],
  ])('%s records the source on create', (file, s) => expect(read(file)).toContain(s));

  it.each(['app/api/appointment-request/route.ts', 'app/api/waitlist-signup/route.ts', 'app/api/admin/leads/route.ts'])(
    '%s brings a soft-deleted lead back instead of failing on its email',
    (file) => expect(read(file)).toContain('deletedAt: null'),
  );
});
