/**
 * Anonymous learn analytics: the public /api/track route only accepts real lessons and games,
 * and the browser sender stays silent when the learner has skipped tracking.
 */
import { isKnownTarget } from '@/lib/learn-analytics';
import { ALL_LESSONS } from '@/lib/course-curriculum';
import { GAME_NAMES } from '@/lib/game-recommendations';
import { track } from '@/lib/analytics-track';
import { clearProgress, setTrackingConsent } from '@/lib/progress-storage';

describe('isKnownTarget', () => {
  test.each(ALL_LESSONS.map((l) => l.slug))('lesson %s is accepted for lesson events', (slug) => {
    expect(isKnownTarget('lesson_start', slug)).toBe(true);
    expect(isKnownTarget('lesson_complete', slug)).toBe(true);
    expect(isKnownTarget('game_play', slug)).toBe(false);
  });

  test.each(Object.keys(GAME_NAMES))('game %s is accepted for game events only', (id) => {
    expect(isKnownTarget('game_play', id)).toBe(true);
    expect(isKnownTarget('lesson_start', id)).toBe(false);
  });

  test.each(['', 'constructor', '__proto__', 'toString', 'letters-a-z', '<script>'])('rejects %p', (t) => {
    expect(isKnownTarget('game_play', t)).toBe(false);
    expect(isKnownTarget('lesson_start', t)).toBe(false);
  });
});

describe('track()', () => {
  const beacon = jest.fn(() => true);
  beforeEach(() => {
    clearProgress();
    localStorage.clear();
    beacon.mockClear();
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
  });

  test('sends an anonymous event with a stable per-device id', () => {
    track('lesson_start', 'letters-a-j');
    track('lesson_complete', 'letters-a-j', { score: 90 });
    expect(beacon).toHaveBeenCalledTimes(2);
    expect(beacon.mock.calls.every((c) => (c as unknown[])[0] === '/api/track')).toBe(true);
  });

  test('sends nothing after "Skip tracking"', () => {
    setTrackingConsent(false);
    track('lesson_start', 'letters-a-j');
    expect(beacon).not.toHaveBeenCalled();
  });
});
