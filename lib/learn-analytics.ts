/**
 * Shared constants for anonymous free-course & game engagement tracking.
 *
 * This is server-safe (no browser APIs) so both the ingestion route and the
 * admin aggregation route can import it. The matching client-side sender lives
 * in `lib/analytics-track.ts`.
 */

import type { GameId } from './progress-types';

/** The only event types the ingestion endpoint accepts. */
export const ANALYTICS_EVENT_TYPES = ['lesson_start', 'lesson_complete', 'game_play'] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** localStorage key holding the anonymous per-device visitor id. */
export const VISITOR_ID_KEY = 'brailleGames_visitorId';

/** Human labels for each game, keyed by GameId (mirrors lib/game-recommendations). */
export const GAME_LABELS: Record<GameId, string> = {
  wordgame: 'Word Game',
  explorer: 'Dot Explorer',
  hangman: 'Hangman',
  speedmatch: 'Speed Match',
  memorymatch: 'Memory Match',
  'contraction-sprint': 'Contraction Sprint',
  'number-sense': 'Number Sense',
  'reflex-dots': 'Reflex Dots',
  sequence: 'Sequence',
  'sentence-decoder': 'Sentence Decoder',
  bingo: 'Braille Bingo',
  rain: 'Braille Rain',
};

/** Caps to keep the public endpoint from storing junk. */
export const MAX_TARGET_LENGTH = 80;
export const MAX_META_LENGTH = 300;
