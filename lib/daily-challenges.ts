/**
 * Deterministic daily challenge generation.
 * Uses date-based seeding — same date always produces the same challenges.
 * No backend needed.
 */

import { GameId } from './progress-types';
import { loadProgress, saveProgress } from './progress-storage';

export interface DailyChallenge {
  id: string;
  gameId: GameId;
  title: string;
  description: string;
  target: number;
  xp: number;
  type: 'streak' | 'wins' | 'score' | 'perfect' | 'speed';
}

// Weighted game pool for challenge generation
const GAME_POOL: { gameId: GameId; weight: number }[] = [
  { gameId: 'speedmatch', weight: 25 },
  { gameId: 'wordgame', weight: 20 },
  { gameId: 'hangman', weight: 15 },
  { gameId: 'memorymatch', weight: 15 },
  { gameId: 'contraction-sprint', weight: 10 },
  { gameId: 'number-sense', weight: 10 },
  { gameId: 'reflex-dots', weight: 5 },
  { gameId: 'sequence', weight: 5 },
  { gameId: 'sentence-decoder', weight: 5 },
];

const GAME_LABELS: Record<GameId, string> = {
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

/** Simple seeded pseudo-random number generator */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000; // divide by 2^32 to ensure [0, 1)
  };
}

/** Convert date string to seed number */
function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Pick a game from weighted pool using RNG */
function pickGame(rng: () => number, exclude: GameId[]): GameId {
  const pool = GAME_POOL.filter((g) => !exclude.includes(g.gameId));
  const totalWeight = pool.reduce((s, g) => s + g.weight, 0);
  let r = rng() * totalWeight;
  for (const g of pool) {
    r -= g.weight;
    if (r <= 0) return g.gameId;
  }
  return pool[pool.length - 1].gameId;
}

/** Generate challenge templates per game type */
function generateChallenge(gameId: GameId, rng: () => number, index: number): DailyChallenge {
  const label = GAME_LABELS[gameId];
  const id = `${gameId}-${index}`;

  switch (gameId) {
    case 'speedmatch': {
      const target = 8 + Math.floor(rng() * 12);
      return {
        id,
        gameId,
        title: `${target}-Streak`,
        description: `Get a ${target}-streak in ${label}`,
        target,
        xp: target * 3,
        type: 'streak',
      };
    }
    case 'wordgame': {
      const tries = 2 + Math.floor(rng() * 3);
      return {
        id,
        gameId,
        title: `Quick Solve`,
        description: `Win ${label} in ${tries} guesses or fewer`,
        target: tries,
        xp: 40,
        type: 'perfect',
      };
    }
    case 'hangman': {
      const maxWrong = 1 + Math.floor(rng() * 3);
      return {
        id,
        gameId,
        title: `Clean Win`,
        description: `Win ${label} with ${maxWrong} or fewer wrong guesses`,
        target: maxWrong,
        xp: 35,
        type: 'perfect',
      };
    }
    case 'memorymatch': {
      const games = 2 + Math.floor(rng() * 2);
      return {
        id,
        gameId,
        title: `Memory Master`,
        description: `Complete ${games} ${label} games`,
        target: games,
        xp: 30,
        type: 'wins',
      };
    }
    case 'contraction-sprint': {
      const score = 6 + Math.floor(rng() * 8);
      return {
        id,
        gameId,
        title: `Sprint Star`,
        description: `Score ${score}+ in ${label}`,
        target: score,
        xp: 40,
        type: 'score',
      };
    }
    case 'number-sense': {
      const score = 5 + Math.floor(rng() * 8);
      return {
        id,
        gameId,
        title: `Number Crunch`,
        description: `Score ${score}+ in ${label}`,
        target: score,
        xp: 35,
        type: 'score',
      };
    }
    case 'reflex-dots': {
      const score = 10 + Math.floor(rng() * 10);
      return {
        id,
        gameId,
        title: `Lightning Fast`,
        description: `Score ${score}+ in ${label}`,
        target: score,
        xp: 30,
        type: 'speed',
      };
    }
    case 'sequence': {
      const wins = 3 + Math.floor(rng() * 3);
      return {
        id,
        gameId,
        title: `In Order`,
        description: `Get ${wins}+ correct in ${label}`,
        target: wins,
        xp: 30,
        type: 'score',
      };
    }
    case 'sentence-decoder': {
      const wins = 3 + Math.floor(rng() * 3);
      return {
        id,
        gameId,
        title: `Speed Reader`,
        description: `Decode ${wins}+ sentences in ${label}`,
        target: wins,
        xp: 40,
        type: 'score',
      };
    }
    default: {
      return {
        id,
        gameId,
        title: `Play ${label}`,
        description: `Complete a round of ${label}`,
        target: 1,
        xp: 20,
        type: 'wins',
      };
    }
  }
}

/** Get today's 3 challenges (deterministic based on date) */
export function getTodayChallenges(): DailyChallenge[] {
  const today = new Date().toLocaleDateString('en-CA');
  const seed = dateToSeed(today);
  const rng = seededRandom(seed);

  const challenges: DailyChallenge[] = [];
  const usedGames: GameId[] = [];

  for (let i = 0; i < 3; i++) {
    const gameId = pickGame(rng, usedGames);
    usedGames.push(gameId);
    challenges.push(generateChallenge(gameId, rng, i));
  }

  return challenges;
}

/** Get completion status for today's challenges */
export function getDailyChallengeStatus(): { challenges: DailyChallenge[]; completed: boolean[] } {
  const challenges = getTodayChallenges();
  const progress = loadProgress();
  const today = new Date().toLocaleDateString('en-CA');

  if (progress.dailyChallenge.date !== today) {
    // New day — reset
    progress.dailyChallenge = {
      date: today,
      challenges: challenges.map((c) => ({ id: c.id, completed: false })),
    };
    saveProgress(progress);
  }

  const completed = challenges.map((c) => {
    const saved = progress.dailyChallenge.challenges.find((sc) => sc.id === c.id);
    return saved?.completed || false;
  });

  return { challenges, completed };
}

/** Mark a daily challenge as completed */
export function completeDailyChallenge(challengeId: string): void {
  const progress = loadProgress();
  const challenge = progress.dailyChallenge.challenges.find((c) => c.id === challengeId);
  if (challenge) {
    challenge.completed = true;
    saveProgress(progress);
  }
}
