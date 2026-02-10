'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type Achievement, getTierColor } from '@/lib/achievements';

/** Global achievement queue — games push here, toast component reads */
let achievementQueue: Achievement[] = [];
let listeners: (() => void)[] = [];

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
    }, 3500);
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

  if (!current) return null;

  return (
    <div
      className={`achievement-toast ${visible ? 'visible' : ''}`}
      role="alert"
      aria-live="polite"
      onClick={() => setVisible(false)}
      style={{ cursor: 'pointer' }}
    >
      <span
        className="achievement-toast-icon"
        style={{ background: getTierColor(current.tier) }}
      >
        {current.icon}
      </span>
      <div className="achievement-toast-content">
        <span className="achievement-toast-label">Achievement Unlocked!</span>
        <span className="achievement-toast-name">{current.name}</span>
        <span className="achievement-toast-desc">{current.description}</span>
      </div>
    </div>
  );
}
