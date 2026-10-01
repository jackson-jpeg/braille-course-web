'use client';

import { useState } from 'react';
import { GAMES, SKILL_LABELS, type Skill } from '@/lib/games/registry';
import GameTileClient from './GameTileClient';

const FILTERS: (Skill | 'all' | 'kids')[] = ['all', 'kids', 'cell', 'letters', 'words', 'numbers', 'contractions'];

/** Filter the full game list by skill. Buttons use aria-pressed; results count is announced. */
export default function GameFilter() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const list = GAMES.filter((g) =>
    filter === 'all'
      ? true
      : filter === 'kids'
        ? g.audience === 'kids' || g.audience === 'everyone'
        : g.skills.includes(filter),
  );
  return (
    <div>
      <div className="cluster game-filter" role="group" aria-label="Filter games">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="filter-chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All games' : f === 'kids' ? 'Kid-friendly' : SKILL_LABELS[f]}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {list.length} games shown
      </p>
      <ul className="game-grid">
        {list.map((g) => (
          <li key={g.id}>
            <GameTileClient game={g} />
          </li>
        ))}
      </ul>
    </div>
  );
}
