import { prisma } from '@/lib/prisma';
import { PRICING } from '@/lib/pricing';

/** Default settings — used as fallbacks when no DB value exists. */
export const DEFAULT_SETTINGS: Record<string, string> = {
  'course.name': 'Summer Braille Course',
  'course.startDate': '2026-06-01',
  'course.endDate': '2026-07-21',
  'course.balanceDueDate': '2026-05-01',
  'course.sessionCount': String(PRICING.totalSessions),
  'pricing.full': String(PRICING.full),
  'pricing.deposit': String(PRICING.deposit),
  'pricing.balance': String(PRICING.balance),
  'pricing.currency': 'USD',
  'section.A.schedule': 'Mon & Wed, 1–2 PM ET',
  'section.A.days': '1,3',
  'section.A.time': '13:00',
  'section.B.schedule': 'Tue & Thu, 4–5 PM ET',
  'section.B.days': '2,4',
  'section.B.time': '16:00',
  'enrollment.enabled': 'true',
  'enrollment.waitlistEnabled': 'true',
  'enrollment.maxWaitlist': '10',
  'email.depositSubject': `Your $${PRICING.deposit} Deposit Is Confirmed — Summer Braille Course`,
  'email.fullPaymentSubject': "You're Enrolled — Summer Braille Course",
  'email.balanceReminderSubject': 'Balance Reminder — Summer Braille Course',
};

/** Load all settings from DB, merged with defaults. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.courseSettings.findMany();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

/** Read a single setting from a pre-loaded settings map, with a fallback. */
export function getSetting(map: Record<string, string>, key: string, fallback: string): string {
  return map[key] ?? fallback;
}
