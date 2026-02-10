/**
 * Algorithm to suggest the next game to play based on progress.
 */

import { GameId } from './progress-types';
import { loadProgress, getGameMastery } from './progress-storage';

const ALL_GAMES: GameId[] = [
  'wordgame', 'explorer', 'hangman', 'speedmatch', 'memorymatch',
  'contraction-sprint', 'number-sense', 'reflex-dots', 'sequence', 'sentence-decoder',
];

const GAME_NAMES: Record<GameId, string> = {
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
};

export interface Recommendation {
  gameId: GameId;
  name: string;
  reason: string;
}

/** Get the best next game recommendation */
export function getRecommendation(): Recommendation {
  const progress = loadProgress();

  // Priority 1: Games never played
  const unplayed = ALL_GAMES.filter(
    (id) => !progress.games[id] || progress.games[id]!.gamesPlayed === 0
  );
  if (unplayed.length > 0) {
    const gameId = unplayed[0];
    return {
      gameId,
      name: GAME_NAMES[gameId],
      reason: 'Try something new!',
    };
  }

  // Priority 2: Lowest mastery game
  const byMastery = ALL_GAMES
    .map((id) => ({ id, mastery: getGameMastery(id) }))
    .sort((a, b) => a.mastery - b.mastery);

  const lowest = byMastery[0];
  if (lowest.mastery < 50) {
    return {
      gameId: lowest.id,
      name: GAME_NAMES[lowest.id],
      reason: 'Build your skills here',
    };
  }

  // Priority 3: Least recently played
  const byRecency = ALL_GAMES
    .map((id) => ({
      id,
      lastPlayed: progress.games[id]?.lastPlayed || '',
    }))
    .sort((a, b) => a.lastPlayed.localeCompare(b.lastPlayed));

  const leastRecent = byRecency[0];
  return {
    gameId: leastRecent.id,
    name: GAME_NAMES[leastRecent.id],
    reason: 'It\'s been a while!',
  };
}
