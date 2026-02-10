'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameId, Difficulty, GameStats, ProgressData, createDefaultGameStats } from '@/lib/progress-types';
import {
  loadProgress,
  recordGameResult,
  getGameStats,
  getGameMastery,
  getGameDifficulty,
  setGameDifficulty,
  saveProgress,
  mergeProgress,
  invalidateCache,
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
  const [stats, setStats] = useState<GameStats>(createDefaultGameStats());
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
    [gameId, difficulty, refresh],
  );

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      setGameDifficulty(gameId, d);
      setDiffState(d);
    },
    [gameId],
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

/**
 * Hook for cloud sync of game progress.
 * Pass the enrollmentId of the logged-in student.
 * If null, sync is disabled (anonymous user).
 */
export function useCloudSync(enrollmentId: string | null) {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSyncedRef = useRef(false);

  // Load from cloud on mount
  useEffect(() => {
    if (!enrollmentId || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/game-progress?enrollmentId=${enrollmentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.progress) {
          const local = loadProgress();
          const merged = mergeProgress(local, data.progress);
          saveProgress(merged);
          invalidateCache();
          setLastSynced(new Date(data.lastSyncedAt));
        }
      } catch (err) {
        console.error('Cloud sync load failed:', err);
      }
    })();
  }, [enrollmentId]);

  // Debounced save to cloud
  const syncToCloud = useCallback(() => {
    if (!enrollmentId) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      setSyncing(true);
      try {
        const progress = loadProgress();
        const res = await fetch('/api/game-progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollmentId, progress }),
        });
        if (res.ok) setLastSynced(new Date());
      } catch (err) {
        console.error('Cloud sync save failed:', err);
      }
      setSyncing(false);
    }, 5000);
  }, [enrollmentId]);

  return { syncing, lastSynced, syncToCloud };
}
