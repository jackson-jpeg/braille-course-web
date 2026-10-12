'use client';

import { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { tokenCaption } from '@/components/BrailleText';
import { type BrailleToken } from '@/lib/braille/transcribe';
import { describeCells } from '@/lib/braille/prose';
import { DEFAULT_HERO_WORD, heroPrint, heroTokens } from '@/lib/games/hero';

/**
 * Interactive braille banner. `word` is in hero notation (see lib/games/hero.ts): letters are
 * shown lowercase unless marked with `^` (capital, with the capital indicator).
 */
function safeTokens(word: string): BrailleToken[] {
  try {
    return heroTokens(word);
  } catch {
    // Never draw a made-up cell: print the site cannot transcribe is not shown in braille.
    return [];
  }
}

export default function BrailleHero({
  word = DEFAULT_HERO_WORD,
  easterEggs = false,
}: {
  word?: string;
  easterEggs?: boolean;
}) {
  const print = heroPrint(word);
  const tokens = useMemo(() => safeTokens(word), [word]);

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

  // Unique signs in the word (excluding spaces)
  const uniqueLettersRef = useRef<Set<string>>(new Set(tokens.filter((t) => t.kind !== 'space').map((t) => t.signId)));

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
        const signId = key.slice(0, key.lastIndexOf('-'));
        discoveredRef.current.add(signId);
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
    <div className="braille-interactive-area" aria-label={`Interactive braille cells spelling ${print}`}>
      <div
        className={`braille-decoration${allDiscovered ? ' celebration' : ''}`}
        role="group"
        aria-label="Braille letter cells"
      >
        {tokens.map((token, i) => {
          if (token.kind === 'space') return <div key={`space-${i}`} className="braille-spacer" />;

          const groupKey = `${token.signId}-${i}`;
          const isActive = activeGroup === groupKey;
          const isPop = popKey === groupKey;
          const isLongPress = longPressKey === groupKey;
          const currentLetterIndex = letterIndex++;

          return (
            <div
              key={groupKey}
              className={`braille-letter-group${isActive ? ' active' : ''}${isPop ? ' pop' : ''}`}
              role="button"
              aria-label={`${token.name}, ${describeCells(token.cells)}`}
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
              <div style={token.cells.length > 1 ? { display: 'flex', gap: 2 } : undefined}>
                {token.cells.map((cell, ci) => (
                  <BrailleCell
                    key={ci}
                    cell={cell}
                    className="braille-cell"
                    dotClassName="braille-dot"
                    style={{ '--wave-delay': `${currentLetterIndex * 0.15 + 0.2}s` } as CSSProperties}
                  />
                ))}
              </div>
              <span className={`braille-letter-label${isLongPress ? ' dot-desc' : ''}`}>
                {isLongPress ? describeCells(token.cells) : tokenCaption(token)}
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
