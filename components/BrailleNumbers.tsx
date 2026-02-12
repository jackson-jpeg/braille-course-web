'use client';

import { useState } from 'react';
import { brailleMap } from '@/lib/braille-map';

const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const LETTER_FOR: Record<string, string> = {
  '1': 'A',
  '2': 'B',
  '3': 'C',
  '4': 'D',
  '5': 'E',
  '6': 'F',
  '7': 'G',
  '8': 'H',
  '9': 'I',
  '0': 'J',
};
const DOT_POS = [1, 4, 2, 5, 3, 6];

export default function BrailleNumbers() {
  const [selected, setSelected] = useState<string | null>(null);
  const indicator = brailleMap['#'];

  return (
    <div className="num-wrap">
      <div className="num-indicator-banner">
        <div className="num-indicator-cell" aria-hidden="true">
          {indicator.map((f, i) => (
            <span key={i} className={`num-dot-sm${f ? ' raised' : ''}`} />
          ))}
        </div>
        <p>
          <strong>Number Indicator</strong> (dots 3, 4, 5, 6) tells the reader: the next character is a number.
          Numbers 1&ndash;9 reuse the patterns for letters A&ndash;I, and 0 uses J.
        </p>
      </div>

      <div className="num-grid" role="group" aria-label="Braille numbers">
        {NUMBERS.map((n) => {
          const dots = brailleMap[n];
          const active = selected === n;
          return (
            <button
              key={n}
              className={`num-card${active ? ' active' : ''}`}
              aria-pressed={active}
              aria-label={`Number ${n}, same pattern as letter ${LETTER_FOR[n]}`}
              onClick={() => setSelected(active ? null : n)}
            >
              <div className="num-card-dots" aria-hidden="true">
                {dots.map((f, i) => (
                  <span key={i} className={`num-dot-sm${f ? ' raised' : ''}`} />
                ))}
              </div>
              <span className="num-card-val">{n}</span>
              <span className="num-card-eq">({LETTER_FOR[n]})</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="num-detail" aria-live="polite">
          <div className="num-detail-equation">
            <div className="num-detail-cell-group">
              <div className="num-detail-cell">
                {indicator.map((f, i) => (
                  <span key={i} className={`num-detail-dot${f ? ' raised ind' : ''}`}>
                    {DOT_POS[i]}
                  </span>
                ))}
              </div>
              <span className="num-detail-cell-lbl">#</span>
            </div>
            <span className="num-detail-op" aria-hidden="true">
              +
            </span>
            <div className="num-detail-cell-group">
              <div className="num-detail-cell">
                {brailleMap[selected].map((f, i) => (
                  <span key={i} className={`num-detail-dot${f ? ' raised' : ''}`}>
                    {DOT_POS[i]}
                  </span>
                ))}
              </div>
              <span className="num-detail-cell-lbl">{LETTER_FOR[selected]}</span>
            </div>
            <span className="num-detail-op" aria-hidden="true">
              =
            </span>
            <div className="num-detail-result">{selected}</div>
          </div>
          <button className="alpha-detail-close" onClick={() => setSelected(null)} aria-label="Close detail panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
