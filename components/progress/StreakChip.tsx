'use client';

import { useEffect, useState } from 'react';
import { loadProgress } from '@/lib/progress-storage';

/** "🔥 3-day streak" style chip — drawn with a cell, announced in words. */
export default function StreakChip() {
  const [streak, setStreak] = useState<number | null>(null);
  useEffect(() => {
    const p = loadProgress();
    const today = new Date().toLocaleDateString('en-CA');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    const alive = p.streak.lastPlayedDate === today || p.streak.lastPlayedDate === yesterday;
    setStreak(alive ? p.streak.currentStreak : 0);
  }, []);
  if (!streak) return null;
  return (
    <span className="chip chip--marigold streak-chip">
      <span aria-hidden="true">●</span>
      {streak}-day streak
    </span>
  );
}
