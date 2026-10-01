'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import { ALPHABET, LETTERS } from '@/lib/ueb';
import type { Island } from '../DotQuest';

/** One friendly creature per letter sticker. */
export const CREATURES: Readonly<Record<string, string>> = {
  a: 'Amber Ant',
  b: 'Bubbly Bee',
  c: 'Cozy Crab',
  d: 'Dizzy Dolphin',
  e: 'Eager Eel',
  f: 'Fuzzy Frog',
  g: 'Giggly Goat',
  h: 'Happy Hippo',
  i: 'Itty Inchworm',
  j: 'Jolly Jellyfish',
  k: 'Kind Koala',
  l: 'Lucky Llama',
  m: 'Merry Moose',
  n: 'Nifty Newt',
  o: 'Orange Owl',
  p: 'Perky Penguin',
  q: 'Quiet Quail',
  r: 'Rosy Rabbit',
  s: 'Silly Seal',
  t: 'Tiny Turtle',
  u: 'Upbeat Unicorn',
  v: 'Velvet Vole',
  w: 'Wiggly Walrus',
  x: 'X-ray Fish',
  y: 'Yawning Yak',
  z: 'Zippy Zebra',
};

/** Sparkle positions for the "new sticker" burst — fixed, so nothing random happens in render. */
const BURST = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return {
    '--x': `${Math.round(Math.cos(angle) * 70)}px`,
    '--y': `${Math.round(Math.sin(angle) * 70)}px`,
  } as CSSProperties;
});

export function LetterSticker({
  letter,
  collected,
  isNew,
  index = 0,
}: {
  letter: string;
  collected: boolean;
  isNew?: boolean;
  index?: number;
}) {
  if (!collected) {
    return (
      <div className="dq-sticker is-empty">
        <Cell dots={[]} size="lg" flat="ghost" />
        <span className="dq-sticker-letter" aria-hidden="true">
          ?
        </span>
        <span className="dq-sticker-name">
          <span className="sr-only">Mystery sticker: </span>not found yet
        </span>
      </div>
    );
  }
  return (
    <div
      className={`dq-sticker${isNew ? ' is-new' : ''}`}
      data-sticker={`letter:${letter}`}
      style={{ '--n': index } as CSSProperties}
    >
      {isNew && (
        <span className="burst" aria-hidden="true">
          {BURST.map((s, i) => (
            <span key={i} style={s} />
          ))}
        </span>
      )}
      <Cell dots={LETTERS[letter]} size="lg" framed pop={isNew} label={`Letter ${letter}`} />
      <span className="dq-sticker-letter" aria-hidden="true">
        {letter}
      </span>
      <span className="dq-sticker-name">{CREATURES[letter]}</span>
    </div>
  );
}

export function IslandBadge({ island, collected, isNew }: { island: Island; collected: boolean; isNew?: boolean }) {
  return (
    <div
      className={`dq-badge dq-badge--${island.tone}${collected ? '' : ' is-empty'}${isNew ? ' is-new' : ''}`}
      data-sticker={collected ? `island:${island.id}` : undefined}
    >
      <span className="dq-badge-disc">
        <BrailleText
          text={island.word}
          size="sm"
          tone={collected ? 'marigold' : undefined}
          flat={collected ? undefined : 'ghost'}
          onInk={collected}
        />
      </span>
      <span className="dq-badge-name">
        {collected ? (
          `${island.name} badge`
        ) : (
          <>
            <span className="sr-only">{island.name} badge: </span>finish {island.name}
          </>
        )}
      </span>
    </div>
  );
}

export default function StickerBook({
  islands,
  stickers,
  onBack,
}: {
  islands: Island[];
  stickers: string[];
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const have = new Set(stickers);
  const letterCount = ALPHABET.filter((l) => have.has(`letter:${l}`)).length;

  return (
    <section className="dq-book" aria-labelledby="dq-book-title">
      <div className="dq-book-head">
        <div>
          <h2 id="dq-book-title" ref={heading} tabIndex={-1} className="dq-book-title">
            Sticker Book
          </h2>
          <p className="dq-book-count">
            {letterCount} of 26 letter stickers
            {letterCount === 26 ? ' — you found them all!' : '. Play stops to find more!'}
          </p>
        </div>
        <button type="button" className="btn btn--paper" onClick={onBack}>
          Back to the map
        </button>
      </div>

      <h3 className="dq-book-sub">Letter stickers</h3>
      <ul className="dq-sticker-grid">
        {ALPHABET.map((l) => (
          <li key={l}>
            <LetterSticker letter={l} collected={have.has(`letter:${l}`)} />
          </li>
        ))}
      </ul>

      <h3 className="dq-book-sub">Island badges</h3>
      <ul className="dq-badge-grid">
        {islands.map((island) => (
          <li key={island.id}>
            <IslandBadge island={island} collected={have.has(`island:${island.id}`)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
