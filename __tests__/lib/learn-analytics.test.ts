/**
 * Anonymous learn analytics: the public /api/track route only accepts real lessons and games,
 * and the browser sender is opt-in: silent, with no id kept, unless the learner has said yes.
 */
import { isKnownTarget } from '@/lib/learn-analytics';
import { ALL_LESSONS } from '@/lib/course-curriculum';
import { GAME_NAMES } from '@/lib/game-recommendations';
import { track } from '@/lib/analytics-track';
import {
  clearProgress,
  getGameStats,
  hasActivityConsent,
  invalidateCache,
  loadProgress,
  recordGameResult,
  saveProgress,
  setTrackingConsent,
  VISITOR_ID_KEY,
} from '@/lib/progress-storage';

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

describe('track() is opt-in', () => {
  const beacon = jest.fn((_url: string, _body: Blob) => true);
  beforeEach(() => {
    clearProgress();
    localStorage.clear();
    beacon.mockClear();
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
  });

  test('before the learner answers, nothing is sent and no id is kept', () => {
    track('lesson_start', 'letters-a-j');
    track('game_play', 'wordgame', { won: true });
    expect(beacon).not.toHaveBeenCalled();
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
  });

  test('after a yes, sends an anonymous event with a stable per-device id', () => {
    setTrackingConsent(true);
    track('lesson_start', 'letters-a-j');
    track('lesson_complete', 'letters-a-j', { score: 90 });
    expect(beacon).toHaveBeenCalledTimes(2);
    expect(beacon.mock.calls.every((c) => c[0] === '/api/track')).toBe(true);
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeTruthy();
    expect(hasActivityConsent()).toBe(true);
  });

  test('after a no, nothing is sent, the id is removed, and progress is still saved on the device', () => {
    setTrackingConsent(true);
    track('lesson_start', 'letters-a-j');
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeTruthy();
    beacon.mockClear();

    setTrackingConsent(false);
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
    track('lesson_start', 'letters-a-j');
    expect(beacon).not.toHaveBeenCalled();
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
    expect(hasActivityConsent()).toBe(false);

    recordGameResult('wordgame', true, 100);
    expect(getGameStats('wordgame').gamesPlayed).toBe(1);
  });

  test('an id left by the earlier opt-out version is removed when there is no yes', () => {
    localStorage.setItem(VISITOR_ID_KEY, 'left-over');
    track('lesson_start', 'letters-a-j');
    expect(beacon).not.toHaveBeenCalled();
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
  });

  test('the older "Skip tracking" answer is still honoured', () => {
    const p = loadProgress();
    p.settings.hasConsentedToTracking = true;
    p.settings.trackingEnabled = false;
    saveProgress(p);
    invalidateCache();
    track('lesson_start', 'letters-a-j');
    expect(beacon).not.toHaveBeenCalled();
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
  });
});
