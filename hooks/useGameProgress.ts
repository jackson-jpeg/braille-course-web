'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  GameId,
  Difficulty,
  GameStats,
  ProgressData,
  DEFAULT_GAME_STATS,
} from '@/lib/progress-types';
import {
  loadProgress,
  recordGameResult,
  getGameStats,
  getGameMastery,
  getGameDifficulty,
  setGameDifficulty,
} from '@/lib/progress-storage';
import { checkAchievements, type Achievement } from '@/lib/achievements';

interface UseGameProgressReturn {
  stats: GameStats;
  mastery: number;
  difficulty: Difficulty;
  streak: number;
  bestStreak: number;
  /** Call when a game round ends */
  recordResult: (won: boolean, score: number) => Achievement[];
  /** Change difficulty */
  setDifficulty: (d: Difficulty) => void;
  /** Reload stats from storage */
  refresh: () => void;
}

export function useGameProgress(gameId: GameId): UseGameProgressReturn {
  const [stats, setStats] = useState<GameStats>({ ...DEFAULT_GAME_STATS });
  const [mastery, setMastery] = useState(0);
  const [difficulty, setDiffState] = useState<Difficulty>('beginner');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const refresh = useCallback(() => {
    const s = getGameStats(gameId);
    const p = loadProgress();
    setStats(s);
    setMastery(getGameMastery(gameId));
    setDiffState(getGameDifficulty(gameId));
    setStreak(p.streak.currentStreak);
    setBestStreak(p.streak.longestStreak);
  }, [gameId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordResult = useCallback(
    (won: boolean, score: number): Achievement[] => {
      const progress = recordGameResult(gameId, won, score, difficulty);
      const newAchievements = checkAchievements(progress);
      refresh();
      return newAchievements;
    },
    [gameId, difficulty, refresh]
  );

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      setGameDifficulty(gameId, d);
      setDiffState(d);
    },
    [gameId]
  );

  return {
    stats,
    mastery,
    difficulty,
    streak,
    bestStreak,
    recordResult,
    setDifficulty,
    refresh,
  };
}

/** Hook for full progress overview (dashboard) */
export function useProgressOverview() {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const refresh = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  return { progress, refresh };
}
