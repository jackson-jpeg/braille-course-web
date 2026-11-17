'use client';

import { type CSSProperties, useId, useState } from 'react';
import BrailleText from '@/components/BrailleText';
import { EXAMPLE_NAME, NAME_MAX_LENGTH, type DotRow, dotRows, nameToBraille } from '@/lib/world-braille-day';

/**
 * "Write your name in braille" and the printable name card, for /world-braille-day.
 *
 * What is typed stays in this component's state: it is never sent, stored or counted, and it is
 * never put in the address bar. Characters the site cannot write are refused and marked; nothing
 * is guessed (lib/world-braille-day.ts).
 */
function DotList({ rows, className }: { rows: DotRow[]; className: string }) {
  return (
    <ol className={className}>
      {rows.map((r, i) => (
        <li key={i}>
          <span className="wbd-dot-name">{r.name}</span>
          <span className="wbd-dot-dots">{r.dots}</span>
        </li>
      ))}
    </ol>
  );
}

/** Cells in the longest word: braille words never wrap, so the dots are sized to fit it (CSS). */
function longestWordCells(tokens: { kind: string; cells: readonly unknown[] }[]): number {
  let longest = 0;
  let current = 0;
  for (const t of tokens) {
    current = t.kind === 'space' ? 0 : current + t.cells.length;
    longest = Math.max(longest, current);
  }
  return Math.max(longest, 1);
}

function cellCount(n: number): string {
  return `${n} ${n === 1 ? 'cell' : 'cells'}`;
}

export default function NameInBraille() {
  const [value, setValue] = useState(EXAMPLE_NAME);
  const inputId = useId();
  const hintId = useId();
  const result = nameToBraille(value);
  const rows = result.status === 'ok' ? dotRows(result.tokens) : [];
  const cells = result.status === 'ok' ? result.tokens.flatMap((t) => t.cells).length : 0;
  const fit = { '--wbd-cells': result.status === 'ok' ? longestWordCells(result.tokens) : 1 } as CSSProperties;
  const label =
    result.status === 'ok' ? `${result.print} in braille: ${rows.map((r) => `${r.name}, ${r.dots}`).join('; ')}` : '';

  let status: string;
  if (result.status === 'ok') status = `${result.print}: ${cellCount(cells)} of braille.`;
  else if (result.status === 'empty') status = 'Type a name to see it in braille.';
  else if (result.status === 'too-long')
    status = `That is too long for the card. Names of up to ${NAME_MAX_LENGTH} characters fit.`;
  else if (result.unsupported.length > 0)
    status = `Nothing is shown, because this box cannot write ${result.unsupported.map((c) => `“${c}”`).join(', ')} yet. It writes only the letters a to z, spaces, hyphens and apostrophes, and it does not guess.`;
  else status = 'Nothing is shown, because this box cannot write that name correctly. It does not guess.';

  return (
    <>
      <section className="wbd-section wbd-name-section" id="write-your-name" aria-labelledby="wbd-name-heading">
        <div className="wbd-inner">
          <h2 id="wbd-name-heading">Write your name in braille</h2>
          <form className="wbd-name-form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor={inputId} className="wbd-name-label">
              Your name, or a short word
            </label>
            <input
              id={inputId}
              className="wbd-name-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={NAME_MAX_LENGTH + 10}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              aria-describedby={hintId}
            />
            <p id={hintId} className="wbd-name-hint">
              Letters a to z, spaces, hyphens and apostrophes, written in uncontracted braille (every letter spelled
              out). What you type stays on this device: it is not sent anywhere or counted.
            </p>
          </form>

          <p
            className={`wbd-name-status${result.status === 'ok' ? '' : ' wbd-name-status--problem'}`}
            aria-live="polite"
          >
            {status}
          </p>

          {result.status === 'refused' && (
            <p className="wbd-name-marked">
              {result.marks.map((m, i) =>
                m.writable ? (
                  <span key={i}>{m.ch}</span>
                ) : (
                  <mark key={i} className="wbd-name-unwritable">
                    {m.ch}
                    <span className="sr-only"> (cannot be written here)</span>
                  </mark>
                ),
              )}
            </p>
          )}

          {result.status === 'ok' && (
            <div className="wbd-name-output">
              <div className="wbd-fit" style={fit}>
                <div className="wbd-braille-scroll">
                  <BrailleText
                    tokens={result.tokens}
                    showLabels
                    className="braille-text wbd-name-braille"
                    label={label}
                  />
                </div>
              </div>
              <h3 className="wbd-dot-heading">The dots, sign by sign</h3>
              <DotList rows={rows} className="wbd-dot-list" />
              {result.tokens.some((t) => t.kind === 'indicator') && (
                <p className="wbd-name-hint">
                  A capital is shown by a sign written before the letter, so a capital letter takes two cells.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="wbd-section wbd-card-section" id="name-card" aria-labelledby="wbd-card-heading">
        <div className="wbd-inner">
          <h2 id="wbd-card-heading" className="wbd-noprint">
            A printable name card
          </h2>
          <p className="wbd-text wbd-noprint">
            The name above, laid out on one sheet. The dots on a printed page are flat, so the card is for sighted
            learners to study the patterns and copy them, not for reading by touch.
          </p>
          {result.status === 'ok' ? (
            <>
              <button type="button" className="wbd-print-btn wbd-noprint" onClick={() => window.print()}>
                Print the name card
              </button>
              <div className="wbd-card wbd-fit" style={fit}>
                <p className="wbd-card-kicker">World Braille Day, January 4</p>
                <p className="wbd-card-print">{result.print}</p>
                <div className="wbd-braille-scroll">
                  <BrailleText
                    tokens={result.tokens}
                    showLabels
                    className="braille-text wbd-card-braille"
                    cellClassName="wbd-card-cell"
                    dotClassName="wbd-card-dot"
                    label={label}
                  />
                </div>
                <DotList rows={rows} className="wbd-dot-list wbd-card-dots" />
                <p className="wbd-card-note">
                  Uncontracted braille. These dots are printed flat: this card is for sighted learners to study, not for
                  reading by touch. From teachbraille.org.
                </p>
              </div>
            </>
          ) : (
            <p className="wbd-text">The card appears here once the name above can be written.</p>
          )}
        </div>
      </section>
    </>
  );
}
