/**
 * New-lead alerts: every route that creates a Lead emails Delaney (the appointment form with its
 * own admin email, every other path through notifyNewLead), the alert carries every stored field
 * with user input escaped, and a failed send never loses the lead.
 */
import fs from 'fs';
import path from 'path';

const send = jest.fn();
jest.mock('@/lib/resend', () => ({
  resend: { emails: { send: (...a: unknown[]) => send(...a) } },
  ADMIN_EMAIL: 'delaney@teachbraille.org',
  SYSTEM_NOREPLY_EMAIL: 'TeachBraille.org <noreply@teachbraille.org>',
}));

import { notifyNewLead, LEAD_SOURCES } from '@/lib/lead-notify';
import type { Lead } from '@prisma/client';

const lead: Lead = {
  id: 'lead_1',
  email: 'pat@example.com',
  name: 'Pat <b>Smith</b>',
  subject: 'Summer Course Updates',
  notes: 'line one\nline two',
  phone: '555-0100',
  preferredCallbackTime: 'weekends',
  status: 'NEW',
  source: 'SUMMER',
  deletedAt: null,
  createdAt: new Date('2026-10-15T18:37:24.664Z'),
  updatedAt: new Date('2026-10-15T18:37:24.664Z'),
};

const ROOT = path.join(__dirname, '../..');
function routeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? routeFiles(p) : /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

describe('every path that creates a lead notifies Delaney', () => {
  const writers = [...routeFiles(path.join(ROOT, 'app')), ...routeFiles(path.join(ROOT, 'lib'))]
    .filter((f) => /prisma\.lead\.(create|upsert|createMany)\(/.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ROOT, f));

  test('the known writers are exactly these (a new one must be added here, with an alert)', () => {
    expect(writers.sort()).toEqual([
      'app/api/admin/leads/route.ts',
      'app/api/admin/leads/sync/route.ts',
      'app/api/appointment-request/route.ts',
      'app/api/waitlist-signup/route.ts',
    ]);
  });

  test.each([
    ['app/api/admin/leads/route.ts', 'notifyNewLead(lead, LEAD_SOURCES.addLead)'],
    ['app/api/admin/leads/sync/route.ts', 'await notifyNewLead(lead, LEAD_SOURCES.syncInbox)'],
    ['app/api/waitlist-signup/route.ts', 'if (isNew) await notifyNewLead(lead,'],
    ['app/api/appointment-request/route.ts', 'to: ADMIN_EMAIL'],
  ])('%s', (file, call) => {
    expect(fs.readFileSync(path.join(ROOT, file), 'utf8')).toContain(call);
  });
});

describe('notifyNewLead', () => {
  beforeEach(() => send.mockReset());

  test('emails Delaney every stored field, escaped, with reply-to the lead', async () => {
    send.mockResolvedValue({ data: { id: 'em_1' }, error: null });
    expect(await notifyNewLead(lead, LEAD_SOURCES.summerUpdates)).toBe(true);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe('delaney@teachbraille.org');
    expect(msg.replyTo).toBe('pat@example.com');
    expect(msg.subject).toBe('New lead: Pat <b>Smith</b>');
    for (const v of [
      'pat@example.com',
      'Summer Course Updates',
      '555-0100',
      'weekends',
      'line one<br />line two',
      'NEW',
      'lead_1',
      '/summer',
    ]) {
      expect(msg.html).toContain(v);
    }
    expect(msg.html).toContain('Pat &lt;b&gt;Smith&lt;/b&gt;');
    expect(msg.html).not.toContain('<b>Smith</b>');
    expect(msg.html).toContain('2:37:24 PM EDT');
  });

  test('a failed send returns false and never throws', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(notifyNewLead(lead, LEAD_SOURCES.syncInbox)).resolves.toBe(false);
    send.mockRejectedValue(new Error('network'));
    await expect(notifyNewLead(lead, LEAD_SOURCES.addLead)).resolves.toBe(false);
    expect(err).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });
});
