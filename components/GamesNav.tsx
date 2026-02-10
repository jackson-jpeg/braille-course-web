'use client';

import { useState, useEffect, useRef } from 'react';
import { getGameMastery } from '@/lib/progress-storage';
import type { GameId } from '@/lib/progress-types';

const SECTIONS: { id: string; gameId: GameId; label: string }[] = [
  { id: 'wordgame', gameId: 'wordgame', label: 'Word Game' },
  { id: 'explorer', gameId: 'explorer', label: 'Dot Explorer' },
  { id: 'hangman', gameId: 'hangman', label: 'Hangman' },
  { id: 'speedmatch', gameId: 'speedmatch', label: 'Speed Match' },
  { id: 'memorymatch', gameId: 'memorymatch', label: 'Memory Match' },
  { id: 'contraction-sprint', gameId: 'contraction-sprint', label: 'Contraction Sprint' },
  { id: 'number-sense', gameId: 'number-sense', label: 'Number Sense' },
  { id: 'reflex-dots', gameId: 'reflex-dots', label: 'Reflex Dots' },
  { id: 'sequence', gameId: 'sequence', label: 'Sequence' },
  { id: 'sentence-decoder', gameId: 'sentence-decoder', label: 'Sentence Decoder' },
];

function MasteryDot({ mastery }: { mastery: number }) {
  const level = mastery === 0 ? 'none' : mastery < 50 ? 'low' : mastery < 80 ? 'mid' : 'high';
  return <span className={`games-nav-mastery games-nav-mastery-${level}`} aria-hidden="true" />;
}

export default function GamesNav() {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [masteries, setMasteries] = useState<Record<GameId, number>>({} as Record<GameId, number>);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    // Load masteries
    const m: Partial<Record<GameId, number>> = {};
    for (const s of SECTIONS) {
      m[s.gameId] = getGameMastery(s.gameId);
    }
    setMasteries(m as Record<GameId, number>);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const link = navRef.current.querySelector(`[href="#${activeId}"]`);
    if (link) {
      link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  return (
    <nav ref={navRef} className="games-nav" aria-label="Game navigation">
      {SECTIONS.map(({ id, gameId, label }) => (
        <a key={id} href={`#${id}`} className={`games-nav-link${activeId === id ? ' active' : ''}`}>
          {label}
          <MasteryDot mastery={masteries[gameId] || 0} />
        </a>
      ))}
    </nav>
  );
}
