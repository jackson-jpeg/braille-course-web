'use client';

import { useState } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { DIGITS_IN_ORDER, DIGIT_CELLS, DIGIT_LETTER, INDICATORS } from '@/lib/braille/ueb';
import { describeCell, describeCells, renderProse } from '@/lib/braille/prose';

/**
 * The ten digits: each is the numeric indicator followed by one of the letters a–j (ICEB 6.1).
 * Every digit card shows both cells, because a bare letter cell is a letter, not a number.
 */
const NUMERIC = INDICATORS.numeric.cells[0];

export default function BrailleNumbers() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="num-wrap">
      <div className="num-indicator-banner">
        <BrailleCell
          cell={NUMERIC}
          className="num-indicator-cell"
          dotClassName="num-dot-sm"
          raisedClassName="raised"
          flatClassName=""
        />
        <p>
          {renderProse(
            'The {name:numeric} ({dots:numeric}) tells the reader that a number follows. The digits 1 to 9 then use the cells of the letters a to i, and 0 uses j.',
          )}
        </p>
      </div>

      <div className="num-grid" role="group" aria-label="Braille digits">
        {DIGITS_IN_ORDER.map((n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              className={`num-card${active ? ' active' : ''}`}
              aria-pressed={active}
              aria-label={`Number ${n}: numeric indicator, then letter ${DIGIT_LETTER[n]}. ${describeCells([NUMERIC, DIGIT_CELLS[n]])}`}
              onClick={() => setSelected(active ? null : n)}
            >
              <span className="num-card-cells" aria-hidden="true">
                <BrailleCell
                  cell={NUMERIC}
                  className="num-card-dots"
                  dotClassName="num-dot-sm"
                  raisedClassName="raised"
                  flatClassName=""
                />
                <BrailleCell
                  cell={DIGIT_CELLS[n]}
                  className="num-card-dots"
                  dotClassName="num-dot-sm"
                  raisedClassName="raised"
                  flatClassName=""
                />
              </span>
              <span className="num-card-val">{n}</span>
              <span className="num-card-eq">({DIGIT_LETTER[n]})</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="num-detail" aria-live="polite">
          <div className="num-detail-equation">
            <div className="num-detail-cell-group">
              <BrailleCell
                cell={NUMERIC}
                className="num-detail-cell"
                dotClassName="num-detail-dot"
                raisedClassName="raised ind"
                flatClassName=""
                showNumbers
              />
              <span className="num-detail-cell-lbl">numeric indicator</span>
            </div>
            <span className="num-detail-op" aria-hidden="true">
              +
            </span>
            <div className="num-detail-cell-group">
              <BrailleCell
                cell={DIGIT_CELLS[selected]}
                className="num-detail-cell"
                dotClassName="num-detail-dot"
                raisedClassName="raised"
                flatClassName=""
                showNumbers
              />
              <span className="num-detail-cell-lbl">{DIGIT_LETTER[selected]}</span>
            </div>
            <span className="num-detail-op" aria-hidden="true">
              =
            </span>
            <div className="num-detail-result">{selected}</div>
          </div>
          <p className="sr-only">
            {selected} is the numeric indicator, {describeCell(NUMERIC)}, then {describeCell(DIGIT_CELLS[selected])}.
          </p>
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
