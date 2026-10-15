import { prisma } from '@/lib/prisma';

/** Leads the admin shows: everything not soft-deleted. */
export const ACTIVE_LEAD = { deletedAt: null } as const;

/** Lowercased, trimmed email, the way every public form stores it. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A reply or forward, not a first message: "RE:"/"FW:"/"Fwd:" (and the common non-English forms)
 * at the start of the subject, or any In-Reply-To or References header.
 */
export function isReplyOrForward(msg: { subject?: string; inReplyTo?: string | null; references?: string | null }) {
  if (msg.inReplyTo?.trim() || msg.references?.trim()) return true;
  return /^\s*(re|fw|fwd|aw|sv|wg|tr|rif|antw)\s*(\[\d+\])?\s*:/i.test(msg.subject || '');
}

/**
 * Whether this address already belongs to someone Delaney knows: any lead (soft-deleted ones too,
 * so a deleted lead is never re-created by Sync Inbox), a school contact, or an enrolled student.
 */
export async function isKnownContact(email: string): Promise<'lead' | 'school' | 'student' | null> {
  const ci = { equals: email.trim(), mode: 'insensitive' as const };
  if (await prisma.lead.findFirst({ where: { email: ci }, select: { id: true } })) return 'lead';
  if (await prisma.schoolInquiry.findFirst({ where: { contactEmail: ci }, select: { id: true } })) return 'school';
  if (await prisma.enrollment.findFirst({ where: { email: ci }, select: { id: true } })) return 'student';
  return null;
}

/**
 * After Delaney emails people from the admin, any of them who are NEW leads become CONTACTED.
 * Matches case-insensitively. Never throws: a status update must not turn a sent email into an error.
 */
export async function markLeadsContacted(emails: string[]): Promise<number> {
  const list = [...new Set(emails.map((e) => e?.trim()).filter(Boolean))];
  if (!list.length) return 0;
  try {
    const { count } = await prisma.lead.updateMany({
      where: {
        ...ACTIVE_LEAD,
        status: 'NEW',
        OR: list.map((e) => ({ email: { equals: e, mode: 'insensitive' as const } })),
      },
      data: { status: 'CONTACTED' },
    });
    return count;
  } catch (err) {
    console.error('Marking leads contacted failed', { error: (err as Error).message });
    return 0;
  }
}
