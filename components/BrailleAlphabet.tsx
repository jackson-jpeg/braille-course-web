'use client';

import { useState } from 'react';
import { brailleMap, dotDescription } from '@/lib/braille-map';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DOT_NUMBERS = [1, 4, 2, 5, 3, 6];

export default function BrailleAlphabet() {
  const [selected, setSelected] = useState<string | null>(null);

  const pattern = selected ? brailleMap[selected] : null;
  const desc = selected ? dotDescription(selected) : '';

  return (
    <div className="alpha-container">
      <div className="alpha-grid" role="group" aria-label="Braille alphabet cards">
        {LETTERS.map((letter) => {
          const dots = brailleMap[letter];
          const isSelected = selected === letter;
          return (
            <button
              key={letter}
              className={`alpha-card${isSelected ? ' active' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${letter}, ${dotDescription(letter)}`}
              onClick={() => setSelected(isSelected ? null : letter)}
            >
              <div className="alpha-card-cell" aria-hidden="true">
                {dots.map((filled, i) => (
                  <span key={i} className={`alpha-dot${filled ? ' raised' : ''}`} />
                ))}
              </div>
              <span className="alpha-card-letter">{letter}</span>
            </button>
          );
        })}
      </div>

      {selected && pattern && (
        <div className="alpha-detail" aria-live="polite">
          <div className="alpha-detail-cell" aria-hidden="true">
            {pattern.map((filled, i) => (
              <span key={i} className={`alpha-detail-dot${filled ? ' raised' : ''}`}>
                {DOT_NUMBERS[i]}
              </span>
            ))}
          </div>
          <div className="alpha-detail-info">
            <div className="alpha-detail-letter">{selected}</div>
            <div className="alpha-detail-desc">{desc.charAt(0).toUpperCase() + desc.slice(1)}</div>
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
