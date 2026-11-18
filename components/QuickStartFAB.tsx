'use client';

import { useState, useEffect, useRef } from 'react';
import { getRecommendation, type Recommendation } from '@/lib/game-recommendations';

export default function QuickStartFAB() {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setRec(getRecommendation());
  }, []);

  // Close on Escape or outside click
  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false);
    }
    function onClick(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onClick, true);
    };
  }, [expanded]);

  // While the Word Game's keyboard is on screen the button would sit on its bottom row (Backspace on
  // short phones), so it steps aside until the keyboard scrolls away.
  const [keyboardInView, setKeyboardInView] = useState(false);
  useEffect(() => {
    if (!mounted || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setKeyboardInView(entry.isIntersecting));
    // The game loads lazily: wait for its keyboard to appear, then watch it.
    const section = document.getElementById('wordgame');
    let watching: Element | null = null;
    const attach = () => {
      const keyboard = document.querySelector('.wordgame-keyboard');
      if (keyboard && keyboard !== watching) {
        if (watching) observer.unobserve(watching);
        observer.observe(keyboard);
        watching = keyboard;
      }
    };
    attach();
    const mutations = section ? new MutationObserver(attach) : null;
    if (section && mutations) mutations.observe(section, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations?.disconnect();
    };
  }, [mounted]);

  if (!mounted || !rec || keyboardInView) return null;

  return (
    <div className={`quickstart-fab ${expanded ? 'expanded' : ''}`} ref={fabRef}>
      {expanded && (
        <div className="quickstart-fab-tooltip" role="tooltip">
          <span className="quickstart-fab-game">{rec.name}</span>
          <span className="quickstart-fab-reason">{rec.reason}</span>
          <a href={`#${rec.gameId}`} className="quickstart-fab-go" onClick={() => setExpanded(false)}>
            Play Now →
          </a>
        </div>
      )}
      <button
        className="quickstart-fab-btn"
        onClick={() => setExpanded(!expanded)}
        aria-label="Quick start: play recommended game"
        aria-expanded={expanded}
      >
        ▶
      </button>
    </div>
  );
}
