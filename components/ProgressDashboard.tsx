'use client';

import { useState, useEffect } from 'react';
import { loadProgress, getGameMastery, getTotalGamesPlayed, getTotalWins } from '@/lib/progress-storage';
import { getStreakInfo } from '@/lib/streak-tracker';
import type { GameId } from '@/lib/progress-types';

const GAME_INFO: { id: GameId; label: string; anchor: string }[] = [
  { id: 'wordgame', label: 'Word Game', anchor: '#wordgame' },
  { id: 'explorer', label: 'Dot Explorer', anchor: '#explorer' },
  { id: 'hangman', label: 'Hangman', anchor: '#hangman' },
  { id: 'speedmatch', label: 'Speed Match', anchor: '#speedmatch' },
  { id: 'memorymatch', label: 'Memory Match', anchor: '#memorymatch' },
  { id: 'contraction-sprint', label: 'Contraction Sprint', anchor: '#contraction-sprint' },
  { id: 'number-sense', label: 'Number Sense', anchor: '#number-sense' },
  { id: 'reflex-dots', label: 'Reflex Dots', anchor: '#reflex-dots' },
  { id: 'sequence', label: 'Sequence', anchor: '#sequence' },
  { id: 'sentence-decoder', label: 'Sentence Decoder', anchor: '#sentence-decoder' },
];

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring" aria-hidden="true">
      <circle
        className="progress-ring-bg"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        className="progress-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function ProgressDashboard() {
  const [mounted, setMounted] = useState(false);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, longestStreak: 0, isActiveToday: false, freezesAvailable: 0 });
  const [masteries, setMasteries] = useState<Record<GameId, number>>({} as Record<GameId, number>);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTotalPlayed(getTotalGamesPlayed());
    setTotalWins(getTotalWins());
    setStreakInfo(getStreakInfo());

    const m: Partial<Record<GameId, number>> = {};
    for (const game of GAME_INFO) {
      m[game.id] = getGameMastery(game.id);
    }
    setMasteries(m as Record<GameId, number>);
  }, []);

  if (!mounted || totalPlayed === 0) return null;

  const overallMastery = Math.round(
    Object.values(masteries).reduce((s, v) => s + v, 0) / GAME_INFO.length
  );

  return (
    <div className="progress-dashboard">
      <div
        className="progress-dashboard-header"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        role="button"
        tabIndex={0}
      >
        <div className="progress-dashboard-summary">
          <ProgressRing progress={overallMastery} size={52} />
          <div className="progress-dashboard-stats">
            <span className="progress-dashboard-label">Your Progress</span>
            <span className="progress-dashboard-numbers">
              {totalWins} wins · {totalPlayed} played
              {streakInfo.currentStreak > 0 && (
                <> · <span className="progress-streak-badge">{streakInfo.currentStreak} day streak</span></>
              )}
            </span>
          </div>
        </div>
        <button
          className="progress-dashboard-toggle"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse progress' : 'Expand progress'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="progress-dashboard-grid">
          {GAME_INFO.map((game) => {
            const m = masteries[game.id] || 0;
            return (
              <a key={game.id} href={game.anchor} className="progress-game-card">
                <ProgressRing progress={m} size={40} />
                <div className="progress-game-info">
                  <span className="progress-game-name">{game.label}</span>
                  <span className="progress-game-pct">{m}%</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
