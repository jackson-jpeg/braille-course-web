'use client';

import { useState, useEffect, useCallback } from 'react';
import { brailleMap } from '@/lib/braille-map';

export default function BrailleHero({ word = '^DELANEY ^COSTELLO' }: { word?: string }) {
  const [dots] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    word.split('').forEach((char, i) => {
      if (char === ' ') return;
      const key = `${char}-${i}`;
      initial[key] = brailleMap[char].map((v) => v === 1);
    });
    return initial;
  });

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  const activate = useCallback((key: string) => {
    setActiveGroup(key);
    setHintVisible(false);
  }, []);

  const deactivate = useCallback(() => {
    setActiveGroup(null);
  }, []);

  let letterIndex = 0;

  return (
    <div
      className="braille-interactive-area"
      aria-label={`Interactive braille cells spelling ${word}`}
    >
      <div
        className="braille-decoration"
        role="group"
        aria-label="Braille letter cells"
      >
        {word.split('').map((char, i) => {
          if (char === ' ') {
            return <div key={`space-${i}`} className="braille-spacer" />;
          }

          const groupKey = `${char}-${i}`;
          const isActive = activeGroup === groupKey;
          const currentLetterIndex = letterIndex++;

          return (
            <div
              key={groupKey}
              className={`braille-letter-group${isActive ? ' active' : ''}`}
              role="button"
              aria-label={`Braille letter ${char}`}
              tabIndex={0}
              onMouseEnter={() => activate(groupKey)}
              onMouseLeave={deactivate}
              onFocus={() => activate(groupKey)}
              onBlur={deactivate}
              onTouchStart={() => activate(groupKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  activate(groupKey);
                }
              }}
            >
              <div className="braille-cell">
                {dots[groupKey].map((filled, di) => (
                    <span
                      key={di}
                      className={`braille-dot ${filled ? 'filled' : 'empty'}`}
                      style={filled ? { animationDelay: `${currentLetterIndex * 0.15 + 0.2}s` } : undefined}
                      aria-hidden="true"
                    />
                  ))}
              </div>
              <span className="braille-letter-label">{char}</span>
            </div>
          );
        })}
      </div>
      <div className={`braille-hint${hintVisible ? ' visible' : ''}`}>
        {isTouchDevice ? 'tap each letter' : 'hover over each letter'}
      </div>
    </div>
  );
}
