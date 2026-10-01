'use client';

import { useMemo, useState } from 'react';
import DotPad from '@/components/games/kit/DotPad';
import { useAnnouncer } from '@/components/games/kit/useAnnouncer';
import { LETTERS, PUNCTUATION, describe } from '@/lib/ueb';
import { useFocusWithin } from '@/components/learn/useFocusWithin';

const key = (d: readonly number[]) => [...d].sort().join('');

/** "Tap the dots" — the home page's hello. Tells you which letter (or sign) your dots make. */
export default function HeroCell() {
  const [dots, setDots] = useState<number[]>([1]);
  const { announce, region } = useAnnouncer();
  const focus = useFocusWithin();

  const lookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const [l, d] of Object.entries(LETTERS)) m.set(key(d), `the letter ${l}`);
    for (const p of PUNCTUATION)
      if (p.cells.length === 1 && !m.has(key(p.cells[0]))) m.set(key(p.cells[0]), `a ${p.name.toLowerCase()}`);
    return m;
  }, []);

  const meaning = dots.length === 0 ? null : (lookup.get(key(dots)) ?? null);
  const letter = meaning?.startsWith('the letter ') ? meaning.slice(-1) : null;

  function change(next: number[]) {
    setDots(next);
    const m = next.length === 0 ? null : lookup.get(key(next));
    announce(
      next.length === 0
        ? 'Empty cell.'
        : m
          ? `${describe(next)}: that's ${m}!`
          : `${describe(next)}. Not a letter yet.`,
    );
  }

  return (
    <div className="hero-cell" {...focus.props}>
      {region}
      <p className="hero-cell-label" id="hero-cell-label">
        Try it: tap the dots
      </p>
      <DotPad value={dots} onChange={change} keyboard={focus.active} label="Try a braille cell" />
      <div className="hero-cell-result" aria-hidden="true">
        {letter ? (
          <>
            <span className="hero-cell-big">{letter}</span>
            <span>You made {meaning}!</span>
          </>
        ) : meaning ? (
          <span>That&rsquo;s {meaning}.</span>
        ) : dots.length === 0 ? (
          <span>Raise a dot to begin.</span>
        ) : (
          <span>Hmm, not a letter yet. Keep trying!</span>
        )}
      </div>
    </div>
  );
}
