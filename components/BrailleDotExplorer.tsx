'use client';

import '@/styles/games/dot-explorer.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Cell from '@/components/ui/Cell';
import { DotPad, ModePicker, useAnnouncer, useGameKeys, useSession, sample } from '@/components/games/kit';
import {
  ALPHABET,
  CONTRACTIONS,
  DIGIT_LETTER,
  INDICATORS,
  KIND_LABELS,
  LETTERS,
  PUNCTUATION,
  describe,
  sameDots,
  type Dots,
} from '@/lib/ueb';

type Show = 'letters' | 'contractions';

interface Meaning {
  kind: string;
  text: string;
  /** Main reading (shown big). */
  primary?: boolean;
}

const FOUND_KEY = 'tb-explorer-found';

/** Every single-cell meaning of a dot pattern, straight from lib/ueb.ts. */
function meaningsFor(dots: Dots, withContractions: boolean): Meaning[] {
  if (dots.length === 0) return [];
  const out: Meaning[] = [];
  const letter = ALPHABET.find((l) => sameDots(LETTERS[l], dots));
  if (letter) {
    out.push({ kind: 'Letter', text: letter, primary: true });
    const digit = Object.keys(DIGIT_LETTER).find((d) => DIGIT_LETTER[d] === letter);
    if (digit) out.push({ kind: 'Number, after the number sign', text: digit });
  }
  for (const ind of Object.values(INDICATORS)) {
    if (ind.cells.length === 1 && sameDots(ind.cells[0], dots)) out.push({ kind: 'Sign', text: ind.name });
  }
  for (const p of PUNCTUATION) {
    if (p.cells.length === 1 && sameDots(p.cells[0], dots))
      out.push({ kind: 'Punctuation', text: `${p.name} ${p.print}` });
  }
  if (withContractions) {
    for (const c of CONTRACTIONS) {
      if (sameDots(c.dots, dots)) out.push({ kind: KIND_LABELS[c.kind], text: c.text });
    }
  }
  if (out.length && !out.some((m) => m.primary)) out[0].primary = true;
  return out;
}

function loadFound(): string[] {
  try {
    const raw = window.localStorage.getItem(FOUND_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((l): l is string => typeof l === 'string' && l in LETTERS) : [];
  } catch {
    return [];
  }
}

export default function BrailleDotExplorer() {
  const { answer, finish } = useSession('explorer');
  const { announce, region } = useAnnouncer();
  const [dots, setDots] = useState<number[]>([]);
  const [show, setShow] = useState<Show>('letters');
  const [found, setFound] = useState<string[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => setFound(loadFound()), []);

  const meanings = useMemo(() => meaningsFor(dots, show === 'contractions'), [dots, show]);
  const primary = meanings.find((m) => m.primary);

  const change = useCallback(
    (next: number[]) => {
      setDots(next);
      const m = meaningsFor(next, show === 'contractions');
      const what = m.length ? m.map((x) => `${x.kind}: ${x.text}`).join('. ') : next.length ? 'No match yet' : '';
      announce(next.length ? `${describe(next)}. ${what}.` : 'Cell cleared.');

      const l = ALPHABET.find((x) => sameDots(LETTERS[x], next));
      if (l) {
        setFound((prev) => {
          if (prev.includes(l)) return prev;
          const list = [...prev, l].sort();
          try {
            window.localStorage.setItem(FOUND_KEY, JSON.stringify(list));
          } catch {
            /* private mode — keep it in memory */
          }
          return list;
        });
      }
      if (target && l === target) {
        answer(`letter:${target}`, true);
        finish(true, 1);
        announce(`Yes! ${describe(next)} is the letter ${target}. Press N for another challenge.`);
        setTarget(null);
      }
    },
    [announce, answer, finish, show, target],
  );

  const clear = useCallback(() => change([]), [change]);

  const newChallenge = useCallback(() => {
    const notFound = ALPHABET.filter((l) => !found.includes(l));
    const pick = sample(notFound.length ? notFound : ALPHABET.filter((l) => l !== target));
    setTarget(pick);
    setHint(false);
    setDots([]);
    announce(`Challenge: make the letter ${pick}.`);
  }, [announce, found, target]);

  useGameKeys((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      clear();
    } else if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      newChallenge();
    }
  });

  return (
    <div className="game-board dex" data-testid="game-board">
      {region}
      <div className="game-board-toolbar">
        <ModePicker
          legend="Show me"
          name="explorer-show"
          value={show}
          onChange={setShow}
          options={[
            { value: 'letters', label: 'Letters & signs' },
            { value: 'contractions', label: 'Contractions too' },
          ]}
        />
        <button type="button" className="btn btn--paper btn--sm" onClick={newChallenge}>
          {target ? 'New challenge' : 'Give me a challenge'}
        </button>
      </div>

      {target && (
        <div className="dex-challenge">
          <p>
            Challenge: make the letter <span className="letter-chip">{target}</span>
          </p>
          {hint ? (
            <p className="dex-hint">
              Hint: {target} is {describe(LETTERS[target])}.
            </p>
          ) : (
            <button type="button" className="btn btn--paper btn--sm" onClick={() => setHint(true)}>
              Hint
            </button>
          )}
        </div>
      )}

      <div className="dex-main">
        <div className="dex-pad">
          <DotPad value={dots} onChange={change} label="Your braille cell" />
          <button type="button" className="btn btn--paper btn--sm" onClick={clear} disabled={dots.length === 0}>
            Clear dots
          </button>
        </div>

        <div className={`dex-result${primary ? ' is-match' : ''}`}>
          <h2 className="dex-result-title">
            {dots.length === 0 ? 'Raise a dot to begin' : primary ? 'You made' : 'No match yet'}
          </h2>
          {dots.length > 0 && (
            <>
              <div className="dex-result-cell">
                <Cell dots={dots} size="lg" framed />
                <span className={primary ? 'dex-big' : 'dex-big dex-big--none'}>{primary ? primary.text : '?'}</span>
              </div>
              <p className="dex-dots">{describe(dots)}</p>
              {meanings.length > 0 ? (
                <ul className="dex-meanings">
                  {meanings.map((m) => (
                    <li key={`${m.kind}-${m.text}`}>
                      <span className="dex-kind">{m.kind}</span> <strong>{m.text}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dex-hint">
                  {show === 'letters'
                    ? 'Try another dot — or switch on contractions to see more.'
                    : 'This pattern is not a single-cell sign. Try another dot.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <section className="dex-found" aria-labelledby="dex-found-title">
        <h3 id="dex-found-title" className="dex-found-title">
          Letters you have found: {found.length} of 26
        </h3>
        <p className="sr-only">{found.length ? found.join(', ') : 'None yet.'}</p>
        <ul className="dex-found-list" aria-hidden="true">
          {ALPHABET.map((l) => {
            const has = found.includes(l);
            return (
              <li key={l} className={has ? 'is-found' : ''}>
                <Cell dots={has ? LETTERS[l] : []} size="xs" flat="ghost" pop={has} />
                <span>{l}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
