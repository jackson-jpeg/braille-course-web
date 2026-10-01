'use client';

import { useCallback } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { recordItem } from '@/lib/progress-storage';
import type { GameId } from '@/lib/progress-types';

/**
 * Everything a game needs to save progress: difficulty, best score, daily streak,
 * achievements (shown as toasts), and per-item skill memory ("letter:a" was right/wrong).
 */
export function useSession(gameId: GameId) {
  const progress = useGameProgress(gameId);
  const { recordResult } = progress;

  /** Call once when a round ends. */
  const finish = useCallback(
    (won: boolean, score: number) => {
      const unlocked = recordResult(won, score);
      pushAchievements(unlocked);
      return unlocked;
    },
    [recordResult],
  );

  /** Call on every answer about a specific item, e.g. answer('letter:q', true). */
  const answer = useCallback((itemKey: string, correct: boolean) => recordItem(itemKey, correct), []);

  return { ...progress, finish, answer };
}
