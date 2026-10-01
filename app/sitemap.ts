import type { MetadataRoute } from 'next';
import { LESSON_SLUGS } from '@/lib/course-curriculum';
import { GAMES } from '@/lib/games/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://teachbraille.org';
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly') => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('', 1.0, 'weekly'),
    page('/learn', 0.95),
    ...LESSON_SLUGS.map((s) => page(`/learn/${s}`, 0.8)),
    page('/games', 0.9),
    ...GAMES.map((g) => page(`/games/${g.slug}`, 0.7)),
    page('/intro', 0.8),
    page('/courses', 0.9, 'weekly'),
    page('/services', 0.7),
    page('/appointments', 0.6),
    page('/policies', 0.3, 'yearly'),
  ];
}
