import type { Lead } from '@prisma/client';
import { resend, ADMIN_EMAIL, SYSTEM_NOREPLY_EMAIL } from '@/lib/resend';
import { newLeadAdminEmail } from '@/lib/email-templates';

/** Where a lead came from, as Delaney sees it in the alert. */
export const LEAD_SOURCES = {
  summerUpdates: 'the "Not ready to enroll yet?" form on /summer',
  waitlist: 'the waitlist form on /summer (course full)',
  syncInbox: 'Sync Inbox (an email in the iCloud inbox)',
  addLead: 'Add Lead in the admin dashboard',
} as const;

/**
 * Emails Delaney every detail of a newly created lead. Never throws: a lead is saved even if the
 * email fails, and the failure is logged with the lead id. (The appointment form sends its own,
 * richer admin email and does not call this.)
 */
export async function notifyNewLead(lead: Lead, source: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: SYSTEM_NOREPLY_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: lead.email,
      subject: `New lead: ${lead.name || lead.email}`,
      html: newLeadAdminEmail({ ...lead, source }),
    });
    if (error) throw new Error(error.message);
    console.log('New lead alert sent', { leadId: lead.id, resendId: data?.id });
    return true;
  } catch (err) {
    console.error('New lead alert failed', { leadId: lead.id, error: (err as Error).message });
    return false;
  }
}
