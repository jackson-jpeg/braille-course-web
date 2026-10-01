'use client';

import { Stars } from '@/components/games/kit';
import BrailleText from '@/components/ui/BrailleText';
import Cell from '@/components/ui/Cell';
import { ALPHABET, getContraction } from '@/lib/ueb';
import type { QuestState } from '@/lib/progress-types';
import type { Island, Stage } from '../DotQuest';
import Mascot from './Mascot';

/** All six dots = the UEB wordsign "for" — used as a full "star" cell in the tally. */
const FULL_CELL = getContraction('for').dots;

interface QuestMapProps {
  islands: Island[];
  quest: QuestState;
  unlockAll: boolean;
  onUnlockAll: (on: boolean) => void;
  onStart: (stage: Stage) => void;
  onLocked: (stage: Stage) => void;
  onOpenBook: () => void;
  note: string | null;
}

export default function QuestMap({
  islands,
  quest,
  unlockAll,
  onUnlockAll,
  onStart,
  onLocked,
  onOpenBook,
  note,
}: QuestMapProps) {
  const all = islands.flatMap((i) => i.stops);
  const starsOf = (s: Stage) => quest.stars[s.id] ?? 0;
  const isLocked = (s: Stage) => !unlockAll && s.number > 1 && starsOf(all[s.number - 2]) === 0;
  const current = all.find((s) => !isLocked(s) && starsOf(s) === 0);
  const totalStars = all.reduce((n, s) => n + starsOf(s), 0);
  const letterStickers = ALPHABET.filter((l) => quest.stickers.includes(`letter:${l}`)).length;

  return (
    <div className="dq-map">
      <header className="dq-map-head">
        <Mascot />
        <div className="dq-map-intro">
          <h2 className="dq-map-title">Braille Bay</h2>
          <p>Hop from stop to stop. Each stop has 5 little puzzles. Take your time — there is no rush!</p>
        </div>
      </header>

      <div className="dq-map-bar">
        <p className="dq-tally">
          <span className="dq-tally-item">
            <Cell dots={FULL_CELL} size="xs" tone="marigold" />
            <strong>{totalStars}</strong> of {all.length * 3} stars
          </span>
          <span className="dq-tally-item">
            <Cell dots={FULL_CELL} size="xs" tone="pine" />
            <strong>{letterStickers}</strong> of 26 stickers
          </span>
        </p>
        <button type="button" id="dq-book-btn" className="btn btn--marigold btn--lg dq-book-btn" onClick={onOpenBook}>
          Sticker Book
        </button>
      </div>

      {note && (
        <p className="dq-map-note">
          <Mascot mood="think" size="sm" />
          {note}
        </p>
      )}

      <ol className="dq-islands">
        {islands.map((island) => (
          <li key={island.id} className={`dq-island dq-island--${island.tone}`}>
            <div className="dq-island-head">
              <BrailleText text={island.word} size="sm" className="dq-island-braille" />
              <h3 className="dq-island-name">{island.name}</h3>
              <p className="dq-island-blurb">{island.blurb}</p>
            </div>
            <ol className="dq-stops">
              {island.stops.map((s, k) => {
                const locked = isLocked(s);
                const stars = starsOf(s);
                const here = current?.id === s.id;
                const name =
                  `Stop ${s.number}: ${island.name}, ${s.what}. ` +
                  (locked ? `Locked — finish stop ${s.number - 1} first.` : `${stars} of 3 stars.`) +
                  (here ? ' You are here.' : '');
                return (
                  <li key={s.id} className="dq-stop-item">
                    {k > 0 && <BrailleText text="hop" size="xs" tone="ink" className="dq-path" />}
                    <button
                      type="button"
                      id={`dq-stop-${s.id}`}
                      className={`dq-stop${locked ? ' is-locked' : ''}${here ? ' is-here' : ''}${stars ? ' is-done' : ''}`}
                      aria-disabled={locked || undefined}
                      aria-label={name}
                      onClick={() => (locked ? onLocked(s) : onStart(s))}
                    >
                      <span className="dq-stop-flag">{s.number}</span>
                      <span className="dq-stop-text">
                        <span className="dq-stop-name">Stop {s.number}</span>
                        <span className="dq-stop-what">{s.what}</span>
                      </span>
                      <span className="dq-stop-stars">
                        {locked ? (
                          <span className="dq-stop-lock">Finish stop {s.number - 1} to open</span>
                        ) : (
                          <Stars value={stars} />
                        )}
                      </span>
                      {here && (
                        <span className="dq-here">
                          <Mascot size="sm" />
                          You are here!
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>

      <details className="dq-grownups">
        <summary>For grown-ups</summary>
        <div className="dq-grownups-body">
          <label className="dq-check">
            <input type="checkbox" checked={unlockAll} onChange={(e) => onUnlockAll(e.target.checked)} />
            Unlock all stops
          </label>
          <p>
            Stops open one after another. Tick the box to let a learner jump ahead — for example, if they already know
            letters a to j.
          </p>
          <p>
            No timers and no lives: a miss only changes the stars, and the right answer is always shown. Keyboard: 1–6
            or F D S J K L raise dots, Enter checks, Backspace clears; 1–4 pick an answer.
          </p>
        </div>
      </details>
    </div>
  );
}
