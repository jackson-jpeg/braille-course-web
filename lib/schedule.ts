import { prisma } from '@/lib/prisma';

export const SECTION_SCHEDULES: Record<string, string> = {
  'Section A': 'Mon & Wed, 1–2 PM ET',
  'Section B': 'Tue & Thu, 4–5 PM ET',
};

export function getSchedule(sectionLabel: string): string {
  return SECTION_SCHEDULES[sectionLabel] || sectionLabel;
}

/**
 * Load section schedules from CourseSettings DB, falling back to hardcoded values.
 */
export async function loadScheduleMap(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.courseSettings.findMany({
      where: {
        key: { in: ['section.A.schedule', 'section.B.schedule'] },
      },
    });

    const map: Record<string, string> = { ...SECTION_SCHEDULES };
    for (const s of settings) {
      if (s.key === 'section.A.schedule' && s.value) map['Section A'] = s.value;
      if (s.key === 'section.B.schedule' && s.value) map['Section B'] = s.value;
    }
    return map;
  } catch {
    return { ...SECTION_SCHEDULES };
  }
}
