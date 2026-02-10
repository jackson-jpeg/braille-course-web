/**
 * Hint system — 3 hints per day, resets at midnight.
 */

import { GameId } from './progress-types';

const HINTS_KEY = 'brailleGames_hints';
const MAX_HINTS_PER_DAY = 3;

interface HintState {
  date: string;
  used: number;
}

function getState(): HintState {
  if (typeof window === 'undefined') return { date: '', used: 0 };
  try {
    const raw = localStorage.getItem(HINTS_KEY);
    if (!raw) return { date: '', used: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: '', used: 0 };
  }
}

function saveState(state: HintState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HINTS_KEY, JSON.stringify(state));
}

/** Get remaining hints for today */
export function getHintsRemaining(): number {
  const state = getState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.date !== today) return MAX_HINTS_PER_DAY;
  return Math.max(0, MAX_HINTS_PER_DAY - state.used);
}

/** Use a hint, returns false if none remaining */
export function useHint(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const state = getState();

  if (state.date !== today) {
    saveState({ date: today, used: 1 });
    return true;
  }

  if (state.used >= MAX_HINTS_PER_DAY) return false;

  state.used++;
  saveState(state);
  return true;
}

/** Game-specific hint types */
export type HintType =
  | 'reveal-letter'     // Word Game / Hangman: reveal a random unguessed letter
  | 'eliminate-choice'  // Speed Match: remove one wrong answer
  | 'show-category'     // Contraction Sprint: show contraction type
  | 'show-dot-count'    // Reflex Dots / Sequence: show how many dots are raised
  | 'reveal-word';      // Sentence Decoder: reveal one word

export function getHintTypeForGame(gameId: GameId): HintType {
  switch (gameId) {
    case 'wordgame':
    case 'hangman':
      return 'reveal-letter';
    case 'speedmatch':
      return 'eliminate-choice';
    case 'contraction-sprint':
      return 'show-category';
    case 'reflex-dots':
    case 'sequence':
      return 'show-dot-count';
    case 'sentence-decoder':
      return 'reveal-word';
    default:
      return 'reveal-letter';
  }
}
