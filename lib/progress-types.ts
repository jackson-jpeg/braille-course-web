/** Type definitions for the braille games progress tracking system */

export type GameId =
  | 'wordgame'
  | 'explorer'
  | 'hangman'
  | 'speedmatch'
  | 'memorymatch'
  | 'contraction-sprint'
  | 'number-sense'
  | 'reflex-dots'
  | 'sequence'
  | 'sentence-decoder';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;        // game-specific (e.g., best streak, fewest moves)
  totalScore: number;       // cumulative score
  lastPlayed: string;       // ISO date
  /** Per-difficulty stats */
  difficultyStats: Record<Difficulty, { played: number; won: number }>;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;   // YYYY-MM-DD
  freezesAvailable: number;
}

export interface AchievementProgress {
  unlocked: string[];       // achievement IDs
  progress: Record<string, number>; // partial progress towards achievements
  lastChecked: string;      // ISO date
}

export interface DailyChallengeState {
  date: string;             // YYYY-MM-DD
  challenges: {
    id: string;
    completed: boolean;
  }[];
}

export interface UserSettings {
  difficulty: Record<GameId, Difficulty>;
  trackingEnabled: boolean;
  hasSeenOnboarding: boolean;
  hasConsentedToTracking: boolean;
}

export interface ProgressData {
  version: number;
  games: Partial<Record<GameId, GameStats>>;
  streak: StreakData;
  achievements: AchievementProgress;
  dailyChallenge: DailyChallengeState;
  settings: UserSettings;
  firstPlayDate: string;
}

export const DEFAULT_GAME_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestScore: 0,
  totalScore: 0,
  lastPlayed: '',
  difficultyStats: {
    beginner: { played: 0, won: 0 },
    intermediate: { played: 0, won: 0 },
    advanced: { played: 0, won: 0 },
  },
};

export const DEFAULT_SETTINGS: UserSettings = {
  difficulty: {
    wordgame: 'beginner',
    explorer: 'beginner',
    hangman: 'beginner',
    speedmatch: 'beginner',
    memorymatch: 'beginner',
    'contraction-sprint': 'beginner',
    'number-sense': 'beginner',
    'reflex-dots': 'beginner',
    sequence: 'beginner',
    'sentence-decoder': 'beginner',
  },
  trackingEnabled: true,
  hasSeenOnboarding: false,
  hasConsentedToTracking: false,
};

export function createDefaultProgress(): ProgressData {
  return {
    version: 1,
    games: {},
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',
      freezesAvailable: 0,
    },
    achievements: {
      unlocked: [],
      progress: {},
      lastChecked: '',
    },
    dailyChallenge: {
      date: '',
      challenges: [],
    },
    settings: { ...DEFAULT_SETTINGS },
    firstPlayDate: '',
  };
}
