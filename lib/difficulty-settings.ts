/**
 * Difficulty system: unlock conditions and per-game settings.
 */

import { GameId, Difficulty, GameStats } from './progress-types';
import { getGameStats } from './progress-storage';

export interface DifficultyConfig {
  label: string;
  description: string;
}

export const DIFFICULTY_INFO: Record<Difficulty, DifficultyConfig> = {
  beginner: { label: 'Beginner', description: 'Learning the basics' },
  intermediate: { label: 'Intermediate', description: 'Building confidence' },
  advanced: { label: 'Advanced', description: 'Mastery challenge' },
};

/** Per-game difficulty parameters */
export interface GameDifficultyParams {
  wordgame: { wordLength: number };
  hangman: { minLength: number; maxLength: number; maxWrong: number };
  speedmatch: { choiceCount: number; timeLimit: number };
  memorymatch: { pairs: number };
  'contraction-sprint': { timeLimit: number; contractionTypes: string[] };
  'number-sense': { maxNumber: number; operations: string[] };
  'reflex-dots': { displayTime: number; rounds: number };
  sequence: { letterCount: number };
  'sentence-decoder': { maxWords: number; contractionDensity: number };
}

/** Get difficulty parameters for a game */
export function getDifficultyParams(gameId: GameId, difficulty: Difficulty): Record<string, unknown> {
  const params: Record<GameId, Record<Difficulty, Record<string, unknown>>> = {
    wordgame: {
      beginner: { wordLength: 4 },
      intermediate: { wordLength: 4 },
      advanced: { wordLength: 4 },
    },
    explorer: {
      beginner: {},
      intermediate: {},
      advanced: {},
    },
    hangman: {
      beginner: { minLength: 4, maxLength: 5, maxWrong: 6 },
      intermediate: { minLength: 5, maxLength: 6, maxWrong: 5 },
      advanced: { minLength: 6, maxLength: 8, maxWrong: 4 },
    },
    speedmatch: {
      beginner: { choiceCount: 4, timeLimit: 0 },
      intermediate: { choiceCount: 4, timeLimit: 5000 },
      advanced: { choiceCount: 6, timeLimit: 3000 },
    },
    memorymatch: {
      beginner: { pairs: 6 },
      intermediate: { pairs: 8 },
      advanced: { pairs: 10 },
    },
    'contraction-sprint': {
      beginner: { timeLimit: 60, contractionTypes: ['wordsign'] },
      intermediate: { timeLimit: 45, contractionTypes: ['wordsign', 'strong'] },
      advanced: { timeLimit: 30, contractionTypes: ['wordsign', 'strong', 'groupsign-strong', 'groupsign-lower'] },
    },
    'number-sense': {
      beginner: { maxNumber: 10, operations: ['+'] },
      intermediate: { maxNumber: 20, operations: ['+', '-'] },
      advanced: { maxNumber: 50, operations: ['+', '-', '×'] },
    },
    'reflex-dots': {
      beginner: { displayTime: 2000, rounds: 10 },
      intermediate: { displayTime: 1200, rounds: 15 },
      advanced: { displayTime: 700, rounds: 20 },
    },
    sequence: {
      beginner: { letterCount: 4 },
      intermediate: { letterCount: 6 },
      advanced: { letterCount: 8 },
    },
    'sentence-decoder': {
      beginner: { maxWords: 3, contractionDensity: 0.3 },
      intermediate: { maxWords: 5, contractionDensity: 0.5 },
      advanced: { maxWords: 7, contractionDensity: 0.7 },
    },
  };

  return params[gameId]?.[difficulty] || params[gameId]?.['beginner'] || {};
}

/** Check if a difficulty level is unlocked for a game */
export function isDifficultyUnlocked(gameId: GameId, difficulty: Difficulty): boolean {
  if (difficulty === 'beginner') return true;

  const stats = getGameStats(gameId);

  if (difficulty === 'intermediate') {
    return stats.gamesWon >= 5;
  }

  if (difficulty === 'advanced') {
    return stats.gamesWon >= 15 && stats.difficultyStats.intermediate.won >= 5;
  }

  return false;
}

/** Get suggestion message for difficulty upgrade */
export function getDifficultySuggestion(gameId: GameId): string | null {
  const stats = getGameStats(gameId);
  const winRate = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;

  if (winRate >= 0.7 && stats.gamesWon >= 5) {
    if (!isDifficultyUnlocked(gameId, 'intermediate')) return null;
    if (stats.difficultyStats.intermediate.played === 0) {
      return 'You\'re doing great! Ready to try Intermediate?';
    }
  }

  if (winRate >= 0.7 && stats.difficultyStats.intermediate.won >= 5) {
    if (!isDifficultyUnlocked(gameId, 'advanced')) return null;
    if (stats.difficultyStats.advanced.played === 0) {
      return 'Impressive! Think you can handle Advanced?';
    }
  }

  return null;
}
