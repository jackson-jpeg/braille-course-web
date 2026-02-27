'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap, dotDescription } from '@/lib/braille-map';

export default function BrailleHero({
  word = '^DELANEY ^COSTELLO',
  easterEggs = false,
}: {
  word?: string;
  easterEggs?: boolean;
}) {
  const [dots] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    word.split('').forEach((char, i) => {
      if (char === ' ' || !brailleMap[char]) return;
      const key = `${char}-${i}`;
      initial[key] = brailleMap[char].map((v) => v === 1);
    });
    return initial;
  });

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Easter egg state
  const [popKey, setPopKey] = useState<string | null>(null);
  const [longPressKey, setLongPressKey] = useState<string | null>(null);
  const [allDiscovered, setAllDiscovered] = useState(false);
  const discoveredRef = useRef<Set<string>>(new Set());
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unique letters in the word (excluding spaces)
  const uniqueLettersRef = useRef<Set<string>>(new Set(word.split('').filter((c) => c !== ' ')));

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const activate = useCallback(
    (key: string) => {
      setActiveGroup(key);
      if (!allDiscovered) setHintVisible(false);

      if (easterEggs && !allDiscovered) {
        const char = key.split('-')[0];
        discoveredRef.current.add(char);
        if (discoveredRef.current.size >= uniqueLettersRef.current.size) {
          setAllDiscovered(true);
          setHintVisible(true);
        }
      }
    },
    [easterEggs, allDiscovered],
  );

  const deactivate = useCallback(() => {
    setActiveGroup(null);
  }, []);

  // Easter egg 2: click to pop
  const handleClick = useCallback(
    (key: string) => {
      if (!easterEggs) return;
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      setPopKey(key);
      popTimerRef.current = setTimeout(() => setPopKey(null), 400);
    },
    [easterEggs],
  );

  // Easter egg 3: long-press to reveal dot numbers
  const handlePressStart = useCallback(
    (key: string) => {
      if (!easterEggs) return;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        setLongPressKey(key);
      }, 800);
    },
    [easterEggs],
  );

  const handlePressEnd = useCallback(() => {
    if (!easterEggs) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setLongPressKey(null);
  }, [easterEggs]);

  let letterIndex = 0;

  return (
    <div className="braille-interactive-area" aria-label={`Interactive braille cells spelling ${word}`}>
      <div
        className={`braille-decoration${allDiscovered ? ' celebration' : ''}`}
        role="group"
        aria-label="Braille letter cells"
      >
        {word.split('').map((char, i) => {
          if (char === ' ') {
            return <div key={`space-${i}`} className="braille-spacer" />;
          }

          const groupKey = `${char}-${i}`;
          const isActive = activeGroup === groupKey;
          const isPop = popKey === groupKey;
          const isLongPress = longPressKey === groupKey;
          const currentLetterIndex = letterIndex++;

          return (
            <div
              key={groupKey}
              className={`braille-letter-group${isActive ? ' active' : ''}${isPop ? ' pop' : ''}`}
              role="button"
              aria-label={`Braille letter ${char}`}
              tabIndex={0}
              onMouseEnter={() => activate(groupKey)}
              onMouseLeave={() => {
                deactivate();
                handlePressEnd();
              }}
              onFocus={() => activate(groupKey)}
              onBlur={() => {
                deactivate();
                handlePressEnd();
              }}
              onTouchStart={() => {
                activate(groupKey);
                handlePressStart(groupKey);
              }}
              onTouchEnd={handlePressEnd}
              onClick={() => handleClick(groupKey)}
              onMouseDown={() => handlePressStart(groupKey)}
              onMouseUp={handlePressEnd}
              onContextMenu={easterEggs ? (e) => e.preventDefault() : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  activate(groupKey);
                  handleClick(groupKey);
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
              <span className={`braille-letter-label${isLongPress ? ' dot-desc' : ''}`}>
                {isLongPress ? dotDescription(char) : char}
              </span>
            </div>
          );
        })}
      </div>
      <div className={`braille-hint${hintVisible ? ' visible' : ''}`}>
        {allDiscovered ? 'you can read braille!' : isTouchDevice ? 'tap each letter' : 'hover over each letter'}
      </div>
    </div>
  );
}
