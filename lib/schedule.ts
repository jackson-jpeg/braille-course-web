export const SECTION_SCHEDULES: Record<string, string> = {
  'Section A': 'Mon & Wed, 1–2 PM ET',
  'Section B': 'Tue & Thu, 4–5 PM ET',
};

export function getSchedule(sectionLabel: string): string {
  return SECTION_SCHEDULES[sectionLabel] || sectionLabel;
}
