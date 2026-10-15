/**
 * Client-side sender for anonymous free-course & game engagement events.
 *
 * Privacy model: we mint a random per-device id in localStorage (no login, no
 * PII) and only send events when the learner's tracking consent is enabled —
 * the same `settings.trackingEnabled` flag that gates local progress storage.
 * All failures are swallowed; tracking must never disrupt the learner.
 */

'use client';

import { loadProgress } from './progress-storage';
import { VISITOR_ID_KEY, type AnalyticsEventType } from './learn-analytics';

/** Get (or lazily create) the anonymous visitor id for this device. */
export function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Record an anonymous engagement event. No-ops silently when tracking consent
 * is off, on the server, or if the network call fails.
 */
export function track(eventType: AnalyticsEventType, target: string, meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    // Respect the same consent flag that gates local progress.
    if (!loadProgress().settings.trackingEnabled) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    const payload = JSON.stringify({
      visitorId,
      eventType,
      target,
      meta: meta ?? undefined,
    });

    // sendBeacon survives page navigations (e.g. clicking to the next lesson).
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/track', blob)) return;
    }

    // Fallback: keepalive fetch, fire-and-forget.
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics break the learning experience.
  }
}
