'use client';

import { useState } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';

/** The letters a–z. Each card shows the lowercase letter: a capital needs the capital indicator first. */
const LETTERS = ALPHABET;

export default function BrailleAlphabet() {
  const [selected, setSelected] = useState<string | null>(null);

  const cell = selected ? LETTER_CELLS[selected] : null;
  const desc = cell ? describeCell(cell) : '';

  return (
    <div className="alpha-container">
      <div className="alpha-grid" role="group" aria-label="Braille alphabet cards">
        {LETTERS.map((letter) => {
          const isSelected = selected === letter;
          return (
            <button
              key={letter}
              className={`alpha-card${isSelected ? ' active' : ''}`}
              aria-pressed={isSelected}
              aria-label={`letter ${letter}, ${describeCell(LETTER_CELLS[letter])}`}
              onClick={() => setSelected(isSelected ? null : letter)}
            >
              <BrailleCell
                cell={LETTER_CELLS[letter]}
                className="alpha-card-cell"
                dotClassName="alpha-dot"
                raisedClassName="raised"
                flatClassName="flat"
              />
              <span className="alpha-card-letter">{letter}</span>
            </button>
          );
        })}
      </div>

      {selected && cell && (
        <div className="alpha-detail" aria-live="polite">
          <BrailleCell
            cell={cell}
            className="alpha-detail-cell"
            dotClassName="alpha-detail-dot"
            raisedClassName="raised"
            flatClassName="flat"
            showNumbers
          />
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
