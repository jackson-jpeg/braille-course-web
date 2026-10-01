'use client';

import { useEffect, useState } from 'react';
import { getGameMastery, getGameStats } from '@/lib/progress-storage';
import type { GameId } from '@/lib/progress-types';

/** Small "played 3 times · 60% mastery" line on game tiles; hidden until played. */
export default function MasteryMeter({ id }: { id: GameId }) {
  const [state, setState] = useState<{ played: number; mastery: number } | null>(null);
  useEffect(() => {
    const stats = getGameStats(id);
    setState({ played: stats.gamesPlayed, mastery: getGameMastery(id) });
  }, [id]);
  if (!state || state.played === 0) return null;
  return (
    <span className="meter game-tile-meter">
      <span className="meter-track" aria-hidden="true">
        <span className="meter-fill" style={{ width: `${state.mastery}%`, display: 'block' }} />
      </span>
      <span className="meter-label">
        {state.mastery}% <span className="sr-only">mastery, played {state.played} times</span>
      </span>
    </span>
  );
}
