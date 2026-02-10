'use client';

import { useState, useEffect } from 'react';
import { getDailyChallengeStatus, type DailyChallenge as DC } from '@/lib/daily-challenges';

export default function DailyChallengeBanner() {
  const [challenges, setChallenges] = useState<DC[]>([]);
  const [completed, setCompleted] = useState<boolean[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const status = getDailyChallengeStatus();
    setChallenges(status.challenges);
    setCompleted(status.completed);
  }, []);

  if (!mounted || challenges.length === 0) return null;

  const allDone = completed.every(Boolean);
  const completedCount = completed.filter(Boolean).length;

  return (
    <div className="daily-challenge-banner" role="region" aria-label="Daily challenges">
      <div className="daily-challenge-header">
        <span className="daily-challenge-title">Daily Challenges</span>
        <span className="daily-challenge-count">
          {completedCount}/{challenges.length}
          {allDone && ' ✓'}
        </span>
      </div>

      <div className="daily-challenge-list">
        {challenges.map((challenge, i) => (
          <div
            key={challenge.id}
            className={`daily-challenge-item ${completed[i] ? 'completed' : ''}`}
          >
            <span className="daily-challenge-check">
              {completed[i] ? '✓' : '○'}
            </span>
            <div className="daily-challenge-info">
              <span className="daily-challenge-name">{challenge.title}</span>
              <span className="daily-challenge-desc">{challenge.description}</span>
            </div>
            <span className="daily-challenge-xp">+{challenge.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
