/**
 * Tests for progress-storage.ts — localStorage game progress abstraction.
 */
import {
  loadProgress,
  saveProgress,
  recordGameResult,
  getGameStats,
  getGameMastery,
  getGameDifficulty,
  setGameDifficulty,
  clearProgress,
  exportProgress,
  importProgress,
  mergeProgress,
  getTotalGamesPlayed,
  getTotalWins,
  invalidateCache,
} from '@/lib/progress-storage';
import { createDefaultProgress } from '@/lib/progress-types';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  invalidateCache();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    },
    writable: true,
  });
});

describe('loadProgress', () => {
  it('returns defaults when nothing is stored', () => {
    const p = loadProgress();
    expect(p.version).toBe(1);
    expect(p.games).toEqual({});
    expect(p.streak.currentStreak).toBe(0);
  });

  it('returns saved data on subsequent load', () => {
    const defaults = createDefaultProgress();
    defaults.firstPlayDate = '2024-01-01';
    saveProgress(defaults);
    invalidateCache();
    const loaded = loadProgress();
    expect(loaded.firstPlayDate).toBe('2024-01-01');
  });
});

describe('recordGameResult', () => {
  it('increments gamesPlayed and gamesWon on win', () => {
    const p = recordGameResult('wordgame', true, 100);
    expect(p.games.wordgame!.gamesPlayed).toBe(1);
    expect(p.games.wordgame!.gamesWon).toBe(1);
    expect(p.games.wordgame!.bestScore).toBe(100);
  });

  it('increments gamesPlayed but not gamesWon on loss', () => {
    const p = recordGameResult('hangman', false, 50);
    expect(p.games.hangman!.gamesPlayed).toBe(1);
    expect(p.games.hangman!.gamesWon).toBe(0);
  });

  it('tracks difficulty-specific stats', () => {
    recordGameResult('speedmatch', true, 80, 'advanced');
    const stats = getGameStats('speedmatch');
    expect(stats.difficultyStats.advanced.played).toBe(1);
    expect(stats.difficultyStats.advanced.won).toBe(1);
    expect(stats.difficultyStats.beginner.played).toBe(0);
  });

  it('sets firstPlayDate on first game', () => {
    const p = recordGameResult('wordgame', true, 100);
    expect(p.firstPlayDate).toBeTruthy();
  });

  it('does not track when tracking is disabled', () => {
    const p = loadProgress();
    p.settings.trackingEnabled = false;
    saveProgress(p);
    invalidateCache();
    recordGameResult('wordgame', true, 100);
    const stats = getGameStats('wordgame');
    expect(stats.gamesPlayed).toBe(0);
  });
});

describe('getGameMastery', () => {
  it('returns 0 for unplayed games', () => {
    expect(getGameMastery('explorer')).toBe(0);
  });

  it('returns >0 after playing', () => {
    recordGameResult('explorer', true, 50);
    expect(getGameMastery('explorer')).toBeGreaterThan(0);
  });

  it('gives higher mastery for more wins', () => {
    for (let i = 0; i < 10; i++) recordGameResult('memorymatch', true, 80);
    const winMastery = getGameMastery('memorymatch');

    clearProgress();
    invalidateCache();
    for (let i = 0; i < 10; i++) recordGameResult('memorymatch', false, 20);
    const loseMastery = getGameMastery('memorymatch');

    expect(winMastery).toBeGreaterThan(loseMastery);
  });
});

describe('difficulty', () => {
  it('defaults to beginner', () => {
    expect(getGameDifficulty('wordgame')).toBe('beginner');
  });

  it('persists difficulty changes', () => {
    setGameDifficulty('wordgame', 'advanced');
    invalidateCache();
    expect(getGameDifficulty('wordgame')).toBe('advanced');
  });
});

describe('getTotalGamesPlayed / getTotalWins', () => {
  it('aggregates across games', () => {
    recordGameResult('wordgame', true, 10);
    recordGameResult('hangman', false, 5);
    recordGameResult('hangman', true, 15);
    expect(getTotalGamesPlayed()).toBe(3);
    expect(getTotalWins()).toBe(2);
  });
});

describe('export / import', () => {
  it('round-trips progress data', () => {
    recordGameResult('wordgame', true, 100);
    const json = exportProgress();
    clearProgress();
    invalidateCache();
    expect(getGameStats('wordgame').gamesPlayed).toBe(0);
    expect(importProgress(json)).toBe(true);
    expect(getGameStats('wordgame').gamesPlayed).toBe(1);
  });

  it('rejects invalid JSON', () => {
    expect(importProgress('not json')).toBe(false);
  });

  it('rejects data without version', () => {
    expect(importProgress('{}')).toBe(false);
  });
});

describe('mergeProgress', () => {
  it('unions achievements from both sources', () => {
    const local = createDefaultProgress();
    local.achievements.unlocked = ['first-win', 'streak-3'];
    const cloud = createDefaultProgress();
    cloud.achievements.unlocked = ['first-win', 'streak-7', 'explorer'];

    const merged = mergeProgress(local, cloud);
    expect(merged.achievements.unlocked).toEqual(
      expect.arrayContaining(['first-win', 'streak-3', 'streak-7', 'explorer']),
    );
    expect(merged.achievements.unlocked.length).toBe(4);
  });

  it('takes higher streak values', () => {
    const local = createDefaultProgress();
    local.streak.currentStreak = 3;
    local.streak.longestStreak = 5;
    const cloud = createDefaultProgress();
    cloud.streak.currentStreak = 7;
    cloud.streak.longestStreak = 7;

    const merged = mergeProgress(local, cloud);
    expect(merged.streak.currentStreak).toBe(7);
    expect(merged.streak.longestStreak).toBe(7);
  });

  it('takes per-game max stats', () => {
    const local = createDefaultProgress();
    local.games.wordgame = {
      gamesPlayed: 10,
      gamesWon: 8,
      bestScore: 100,
      totalScore: 500,
      lastPlayed: '2024-06-01',
      difficultyStats: {
        beginner: { played: 10, won: 8 },
        intermediate: { played: 0, won: 0 },
        advanced: { played: 0, won: 0 },
      },
    };
    const cloud = createDefaultProgress();
    cloud.games.wordgame = {
      gamesPlayed: 5,
      gamesWon: 4,
      bestScore: 120,
      totalScore: 300,
      lastPlayed: '2024-06-05',
      difficultyStats: {
        beginner: { played: 5, won: 4 },
        intermediate: { played: 0, won: 0 },
        advanced: { played: 0, won: 0 },
      },
    };

    const merged = mergeProgress(local, cloud);
    expect(merged.games.wordgame!.gamesPlayed).toBe(10);
    expect(merged.games.wordgame!.bestScore).toBe(120);
    expect(merged.games.wordgame!.lastPlayed).toBe('2024-06-05');
  });

  it('preserves games that only exist in one source', () => {
    const local = createDefaultProgress();
    local.games.hangman = {
      gamesPlayed: 3,
      gamesWon: 2,
      bestScore: 50,
      totalScore: 100,
      lastPlayed: '2024-05-01',
      difficultyStats: {
        beginner: { played: 3, won: 2 },
        intermediate: { played: 0, won: 0 },
        advanced: { played: 0, won: 0 },
      },
    };
    const cloud = createDefaultProgress();

    const merged = mergeProgress(local, cloud);
    expect(merged.games.hangman!.gamesPlayed).toBe(3);
  });

  it('uses local settings (device preferences)', () => {
    const local = createDefaultProgress();
    // Deep-copy difficulty to avoid shared reference
    local.settings = { ...local.settings, difficulty: { ...local.settings.difficulty } };
    local.settings.difficulty.wordgame = 'advanced';
    const cloud = createDefaultProgress();
    cloud.settings = { ...cloud.settings, difficulty: { ...cloud.settings.difficulty } };
    cloud.settings.difficulty.wordgame = 'beginner';

    const merged = mergeProgress(local, cloud);
    expect(merged.settings.difficulty.wordgame).toBe('advanced');
  });
});

describe('clearProgress', () => {
  it('wipes all data', () => {
    recordGameResult('wordgame', true, 100);
    clearProgress();
    invalidateCache();
    expect(getGameStats('wordgame').gamesPlayed).toBe(0);
    expect(getTotalGamesPlayed()).toBe(0);
  });
});
