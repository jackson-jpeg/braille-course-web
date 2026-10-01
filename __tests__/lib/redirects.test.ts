import nextConfig from '../../next.config.mjs';
import { LEGACY_LESSON_REDIRECTS, LESSON_SLUGS } from '@/lib/course-curriculum';

type Redirect = { source: string; destination: string; permanent: boolean };

describe('SEO redirects', () => {
  test('next.config redirects match the curriculum legacy map and land on real lessons', async () => {
    const redirects = await (nextConfig as unknown as { redirects: () => Promise<Redirect[]> }).redirects();
    for (const [from, to] of Object.entries(LEGACY_LESSON_REDIRECTS)) {
      const r = redirects.find((x) => x.source === `/learn/${from}`);
      expect(r).toEqual({ source: `/learn/${from}`, destination: `/learn/${to}`, permanent: true });
      expect(LESSON_SLUGS).toContain(to);
    }
    expect(redirects).toContainEqual({ source: '/summer', destination: '/courses', permanent: true });
    expect(redirects.every((r) => r.permanent)).toBe(true);
  });
});
