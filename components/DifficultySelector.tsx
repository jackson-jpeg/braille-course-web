'use client';

import { type Difficulty } from '@/lib/progress-types';
import { isDifficultyUnlocked, DIFFICULTY_INFO } from '@/lib/difficulty-settings';
import type { GameId } from '@/lib/progress-types';

interface DifficultySelectorProps {
  gameId: GameId;
  current: Difficulty;
  onChange: (d: Difficulty) => void;
}

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

export default function DifficultySelector({ gameId, current, onChange }: DifficultySelectorProps) {
  return (
    <div className="difficulty-selector" role="radiogroup" aria-label="Difficulty level">
      {LEVELS.map((level) => {
        const unlocked = isDifficultyUnlocked(gameId, level);
        const info = DIFFICULTY_INFO[level];
        return (
          <button
            key={level}
            className={`difficulty-pill ${current === level ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
            onClick={() => unlocked && onChange(level)}
            disabled={!unlocked}
            role="radio"
            aria-checked={current === level}
            aria-label={`${info.label}${!unlocked ? ' (locked)' : ''}`}
            title={unlocked ? info.description : 'Win more games to unlock'}
          >
            {!unlocked && <span className="difficulty-lock">🔒</span>}
            {info.label}
          </button>
        );
      })}
    </div>
  );
}
