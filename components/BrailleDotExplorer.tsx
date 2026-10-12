'use client';

import { useState, useEffect, useRef } from 'react';
import type { Cell } from '@/lib/braille/ueb';
import BrailleDotPad, { toggleDot } from '@/components/BrailleDotPad';
import { type ExplorerMode, DOT_KEYS, cellMeanings, dotsCaption, headline } from '@/lib/games/explorer';

export default function BrailleDotExplorer() {
  const [cell, setCell] = useState<Cell>([]);
  const [mode, setMode] = useState<ExplorerMode>('alphabetic');

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  // Visibility-scoped keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keyboard: number keys toggle the matching dot, C clears
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const dot = DOT_KEYS[e.key];
      if (dot) setCell((prev) => toggleDot(prev, dot));
      if (e.key.toLowerCase() === 'c') setCell([]);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const anyActive = cell.length > 0;
  const meanings = cellMeanings(cell, mode);
  const big = headline(cell, mode);

  return (
    <div className="explorer-container" ref={containerRef}>
      <div className="explorer-header">
        <span className="section-label">Explore</span>
        <h2>Dot Explorer</h2>
        <p>
          Toggle dots to discover what each braille cell means{mode === 'contracted' ? ', including contractions' : ''}{' '}
          <span className="explorer-kbd-hint">Keys 1–6 toggle dots, C clears</span>
        </p>
      </div>

      <div className="explorer-mode-toggle" role="radiogroup" aria-label="Explorer mode">
        <button
          className={`explorer-mode-pill${mode === 'alphabetic' ? ' active' : ''}`}
          role="radio"
          aria-checked={mode === 'alphabetic'}
          onClick={() => setMode('alphabetic')}
        >
          Uncontracted
        </button>
        <button
          className={`explorer-mode-pill${mode === 'contracted' ? ' active' : ''}`}
          role="radio"
          aria-checked={mode === 'contracted'}
          onClick={() => setMode('contracted')}
        >
          Contracted
        </button>
      </div>

      <div className="explorer-body">
        <BrailleDotPad
          cell={cell}
          onToggle={(d) => setCell((prev) => toggleDot(prev, d))}
          className="explorer-cell"
          dotClassName="explorer-dot"
          raisedClassName="active"
          label="Interactive braille cell"
          renderDot={(d) => <span className="explorer-dot-number">{d}</span>}
        />

        <div className="explorer-result" aria-live="polite" aria-atomic="true">
          {anyActive ? (
            <>
              {big ? (
                <div className={mode === 'contracted' ? 'explorer-contraction' : 'explorer-letter'}>{big}</div>
              ) : (
                <div className="explorer-letter explorer-no-match">?</div>
              )}
              <div className="explorer-dots-label">
                {dotsCaption(cell)}
                {meanings.length === 0 ? ' — no single-cell sign on this site' : ''}
              </div>
              {meanings.map((m, i) => (
                <div key={i} className="explorer-contraction-type" data-meaning={m.kind}>
                  <strong>{m.title}</strong>
                  {m.detail ? ` — ${m.detail}` : ''} <span className="explorer-rule">(UEB rule {m.rule})</span>
                </div>
              ))}
              {mode === 'alphabetic' && cellMeanings(cell, 'contracted').length > meanings.length && (
                <div className="explorer-contraction-type">Switch to Contracted to see its contractions.</div>
              )}
            </>
          ) : (
            <div className="explorer-prompt">Tap dots to begin</div>
          )}
        </div>

        <button
          className="explorer-clear"
          onClick={() => setCell([])}
          disabled={!anyActive}
          aria-label="Clear all dots"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
