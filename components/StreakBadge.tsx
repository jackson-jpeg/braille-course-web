'use client';

import { useState, useEffect } from 'react';
import { getStreakInfo } from '@/lib/streak-tracker';

export default function StreakBadge() {
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const info = getStreakInfo();
    setStreak(info.currentStreak);
  }, []);

  if (!mounted || streak === 0) return null;

  return (
    <span className="streak-badge" aria-label={`${streak} day streak`}>
      <span className="streak-badge-fire">🔥</span>
      <span className="streak-badge-count">{streak}</span>
    </span>
  );
}
