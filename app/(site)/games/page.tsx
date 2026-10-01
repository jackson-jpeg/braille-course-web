import type { Metadata } from 'next';
import Eyebrow from '@/components/ui/Eyebrow';
import NextUp from '@/components/progress/NextUp';
import StreakChip from '@/components/progress/StreakChip';
import GameFilter from '@/components/games/GameFilter';
import GameTile from '@/components/games/GameTile';
import LegacyAnchorRedirect from '@/components/games/LegacyAnchorRedirect';
import BrailleText from '@/components/ui/BrailleText';
import { GAMES } from '@/lib/games/registry';
import '@/styles/pages/games-hub.css';

export const metadata: Metadata = {
  title: `Free Braille Games — ${GAMES.length} Ways to Practise`,
  description: `${GAMES.length} free braille practice games for kids and grown-ups: Letter Race, Dot Builder, Word Decoder, Contraction Trainer, Dot Quest and more. Keyboard and screen-reader friendly. No account needed.`,
  alternates: { canonical: 'https://teachbraille.org/games' },
  openGraph: {
    title: `Free Braille Games — ${GAMES.length} Ways to Practise | TeachBraille.org`,
    description: 'Fun, accessible braille practice for kids and families. No account needed.',
  },
};

export default function GamesHub() {
  const fresh = GAMES.filter((g) => g.isNew);
  return (
    <>
      <LegacyAnchorRedirect />
      <section className="page-hero lattice games-hero">
        <div className="wrap page-hero-grid">
          <div>
            <Eyebrow>Practice games</Eyebrow>
            <h1>Play your way to reading braille</h1>
            <p className="lead">
              {GAMES.length} free games, from first dots to real sentences. Every one works with a mouse, a touchscreen,
              or the keyboard alone, and saves your progress on this device.
            </p>
            <div className="cluster mt-5">
              <StreakChip />
            </div>
          </div>
          <div className="games-hero-art" aria-hidden="true">
            <BrailleText text="play" size="xl" pop />
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <NextUp />
        </div>
      </section>

      <section className="section-tight band-sunk" aria-labelledby="new-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>New</Eyebrow>
            <h2 id="new-heading">Fresh this season</h2>
          </div>
          <ul className="game-grid game-grid--featured">
            {fresh.map((g) => (
              <li key={g.id}>
                <GameTile game={g} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="all-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>All games</Eyebrow>
            <h2 id="all-heading">Pick a skill to practise</h2>
          </div>
          <GameFilter />
        </div>
      </section>
    </>
  );
}
