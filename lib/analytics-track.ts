/**
 * Client-side sender for anonymous free-course & game engagement events.
 *
 * Privacy model: opt-in. Nothing is sent, and no id is kept, until the learner
 * says yes in the welcome box. After a yes we mint a random per-device id in
 * localStorage (no login, no PII) and send events with it. Without a yes any
 * id left by an earlier version of the site is removed.
 * All failures are swallowed; tracking must never disrupt the learner.
 */

'use client';

import { hasActivityConsent, removeVisitorId, VISITOR_ID_KEY } from './progress-storage';
import type { AnalyticsEventType } from './learn-analytics';

/** Get (or lazily create) the anonymous visitor id for this device. Call only after a yes. */
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
 * Record an anonymous engagement event. No-ops silently unless the learner has
 * said yes, on the server, or if the network call fails.
 */
export function track(eventType: AnalyticsEventType, target: string, meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    // Opt-in: without an explicit yes nothing is sent and no id is kept.
    if (!hasActivityConsent()) {
      removeVisitorId();
      return;
    }

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
