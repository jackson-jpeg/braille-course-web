'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type Achievement } from '@/lib/achievements';
import Cell from '@/components/ui/Cell';

/** Global achievement queue — games push here, toast component reads */
const achievementQueue: Achievement[] = [];
const listeners: (() => void)[] = [];

export function pushAchievement(achievement: Achievement) {
  achievementQueue.push(achievement);
  listeners.forEach((fn) => fn());
}

export function pushAchievements(achievements: Achievement[]) {
  achievements.forEach((a) => achievementQueue.push(a));
  if (achievements.length > 0) listeners.forEach((fn) => fn());
}

export default function AchievementToast() {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const showNext = useCallback(() => {
    if (achievementQueue.length === 0) return;
    const next = achievementQueue.shift()!;
    setCurrent(next);
    setVisible(true);

    const t1 = setTimeout(() => {
      setVisible(false);
      const t2 = setTimeout(() => {
        setCurrent(null);
        if (achievementQueue.length > 0) showNext();
      }, 300);
      timerRefs.current.push(t2);
    }, 6000);
    timerRefs.current.push(t1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const listener = () => {
      if (!current) showNext();
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [current, showNext]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {current && visible && (
        <div className="toast">
          <Cell dots={[1, 2, 3, 4, 5, 6]} size="sm" tone="marigold" onInk pop />
          <div>
            <strong>Achievement unlocked: {current.name}</strong>
            <span>{current.description}</span>
          </div>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss"
            onClick={() => {
              clearTimers();
              setVisible(false);
              setCurrent(null);
              if (achievementQueue.length > 0) showNext();
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
