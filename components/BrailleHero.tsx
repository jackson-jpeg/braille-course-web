'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const brailleAlphabet: Record<string, number[]> = {
  B: [1, 0, 1, 0, 0, 0],
  R: [1, 0, 1, 1, 1, 0],
  A: [1, 0, 0, 0, 0, 0],
  I: [0, 1, 1, 0, 0, 0],
  L: [1, 0, 1, 0, 1, 0],
  E: [1, 0, 0, 1, 0, 0],
};

const word = 'BRAILLE';

export default function BrailleHero() {
  const [dots, setDots] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    word.split('').forEach((letter, i) => {
      const key = `${letter}-${i}`;
      initial[key] = brailleAlphabet[letter].map((v) => v === 1);
    });
    return initial;
  });

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [popDots, setPopDots] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  const toggleDot = useCallback(
    (groupKey: string, dotIndex: number) => {
      setDots((prev) => {
        const newDots = { ...prev };
        const arr = [...newDots[groupKey]];
        arr[dotIndex] = !arr[dotIndex];
        newDots[groupKey] = arr;
        return newDots;
      });

      const popKey = `${groupKey}-${dotIndex}`;
      setPopDots((prev) => ({ ...prev, [popKey]: true }));
      setTimeout(() => {
        setPopDots((prev) => ({ ...prev, [popKey]: false }));
      }, 500);
    },
    []
  );

  const activate = useCallback((key: string) => {
    setActiveGroup(key);
    setHintVisible(false);
  }, []);

  const deactivate = useCallback(() => {
    setActiveGroup(null);
  }, []);

  return (
    <div
      className="braille-interactive-area"
      aria-label="Interactive braille cells spelling BRAILLE"
    >
      <div
        className="braille-decoration"
        role="group"
        aria-label="Braille letter cells"
      >
        {word.split('').map((letter, i) => {
          const groupKey = `${letter}-${i}`;
          const isActive = activeGroup === groupKey;
          return (
            <div
              key={groupKey}
              className={`braille-letter-group${isActive ? ' active' : ''}`}
              role="button"
              aria-label={`Braille letter ${letter}`}
              tabIndex={0}
              onMouseEnter={() => activate(groupKey)}
              onMouseLeave={deactivate}
              onFocus={() => activate(groupKey)}
              onBlur={deactivate}
              onTouchStart={() => activate(groupKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const allFilled = dots[groupKey].every(Boolean);
                  setDots((prev) => ({
                    ...prev,
                    [groupKey]: brailleAlphabet[letter].map((v) =>
                      allFilled ? false : v === 1
                    ),
                  }));
                }
              }}
            >
              <div className="braille-cell">
                {dots[groupKey].map((filled, di) => {
                  const popKey = `${groupKey}-${di}`;
                  return (
                    <span
                      key={di}
                      className={`braille-dot ${filled ? 'filled' : 'empty'}${
                        popDots[popKey] ? ' pop' : ''
                      }`}
                      aria-hidden="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDot(groupKey, di);
                      }}
                    />
                  );
                })}
              </div>
              <span className="braille-letter-label">{letter}</span>
            </div>
          );
        })}
      </div>
      <div className={`braille-hint${hintVisible ? ' visible' : ''}`}>
        hover or tap each letter
      </div>
    </div>
  );
}
