'use client';

import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'wordgame', label: 'Word Game' },
  { id: 'explorer', label: 'Dot Explorer' },
  { id: 'hangman', label: 'Hangman' },
  { id: 'speedmatch', label: 'Speed Match' },
  { id: 'memorymatch', label: 'Memory Match' },
];

export default function GamesNav() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="games-nav" aria-label="Game navigation">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`games-nav-link${activeId === id ? ' active' : ''}`}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
