/**
 * Shared constants for anonymous free-course & game engagement tracking.
 *
 * This is server-safe (no browser APIs) so both the ingestion route and the
 * admin aggregation route can import it. The matching client-side sender lives
 * in `lib/analytics-track.ts`.
 */

import type { GameId } from './progress-types';
import { GAME_NAMES } from './game-recommendations';
import { LESSON_SLUGS } from './course-curriculum';

/** The only event types the ingestion endpoint accepts. */
export const ANALYTICS_EVENT_TYPES = ['lesson_start', 'lesson_complete', 'game_play'] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** localStorage key holding the anonymous per-device visitor id. */
export const VISITOR_ID_KEY = 'brailleGames_visitorId';

/** Human labels for each game. */
export const GAME_LABELS: Record<GameId, string> = GAME_NAMES;

/** Lesson events must name a real lesson, and game events a real game, so junk never reaches the table. */
export function isKnownTarget(eventType: AnalyticsEventType, target: string): boolean {
  return eventType === 'game_play'
    ? Object.prototype.hasOwnProperty.call(GAME_NAMES, target)
    : LESSON_SLUGS.includes(target);
}

/** Caps to keep the public endpoint from storing junk. */
export const MAX_TARGET_LENGTH = 80;
export const MAX_META_LENGTH = 300;
