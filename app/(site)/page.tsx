import type { Metadata } from 'next';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import HeroCell from '@/components/home/HeroCell';
import NextUp from '@/components/progress/NextUp';
import GameTile from '@/components/games/GameTile';
import { COURSE_MODULES, TOTAL_LESSONS } from '@/lib/course-curriculum';
import { GAMES, GAME_BY_ID } from '@/lib/games/registry';
import { LETTERS } from '@/lib/ueb';
import type { GameId } from '@/lib/progress-types';
import '@/styles/pages/home.css';
import '@/styles/games/kit.css';

export const metadata: Metadata = {
  title: { absolute: 'Teach Braille — Free Lessons & Games for Families | TeachBraille.org' },
  description:
    'Learn braille free with warm, beginner-friendly lessons and games for parents, families and kids. Unified English Braille, made by Delaney Costello, Teacher of the Visually Impaired. Live courses and 1-on-1 sessions too.',
  alternates: { canonical: 'https://teachbraille.org' },
};

const PATHS = [
  {
    letter: 'p',
    who: 'For parents & family',
    title: 'Learn braille to connect with your child',
    text: 'Twelve short lessons in plain language. Start with what braille is and finish reading your first contractions.',
    href: '/learn',
    cta: 'Start the free lessons',
  },
  {
    letter: 'k',
    who: 'For kids',
    title: 'Go on a Dot Quest',
    text: 'Hop between islands, build letters, earn stars and collect a sticker for every letter you learn.',
    href: '/games/dot-quest',
    cta: 'Play Dot Quest',
  },
  {
    letter: 't',
    who: 'With a teacher',
    title: 'Learn live with Delaney',
    text: 'Small-group remote courses for families, and 1-on-1 TVI services for students, parents and schools.',
    href: '/courses',
    cta: 'See courses & services',
  },
];

const FEATURED: GameId[] = ['letter-race', 'dot-builder', 'word-decoder', 'contraction-trainer'];

export default function HomePage() {
  return (
    <>
      <section className="home-hero lattice">
        <div className="wrap home-hero-grid">
          <div className="home-hero-copy">
            <Eyebrow>Free braille lessons &amp; games</Eyebrow>
            <h1>
              Braille, one dot <span className="home-hero-accent">at a time.</span>
            </h1>
            <p className="lead">
              Warm, beginner-friendly lessons and games for families learning braille together — made by Delaney
              Costello, a Teacher of the Visually Impaired.
            </p>
            <div className="cluster mt-5">
              <Link href="/learn/what-is-braille" className="btn btn--lg">
                <ButtonCell letter="s" />
                Start lesson 1
              </Link>
              <Link href="/games" className="btn btn--paper btn--lg">
                Play a game
              </Link>
            </div>
            <p className="home-hero-note muted">No account. No cost. Progress saves on your device.</p>
          </div>
          <div className="home-hero-play tile">
            <HeroCell />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="paths-h">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Where to start</Eyebrow>
            <h2 id="paths-h">Pick your path</h2>
          </div>
          <ul className="home-paths">
            {PATHS.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="tile tile-link home-path">
                  <Cell dots={LETTERS[p.letter]} size="lg" framed pop />
                  <span className="home-path-who">{p.who}</span>
                  <span className="home-path-title">{p.title}</span>
                  <span className="home-path-text">{p.text}</span>
                  <span className="link-arrow">{p.cta}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-tight band-sunk">
        <div className="wrap">
          <NextUp heading="Your next step" />
        </div>
      </section>

      <section className="section" aria-labelledby="track-h">
        <div className="wrap home-track">
          <div className="stack">
            <Eyebrow>The free track</Eyebrow>
            <h2 id="track-h">From &ldquo;what is braille?&rdquo; to your first contractions</h2>
            <p className="lead">
              {TOTAL_LESSONS} lessons, five to ten minutes each, written for nervous beginners. You write every letter
              yourself, then practise it in a matching game.
            </p>
            <Link href="/learn" className="btn">
              See all lessons
            </Link>
          </div>
          <ol className="home-modules">
            {COURSE_MODULES.map((m, i) => (
              <li key={m.id} className="home-module">
                <Cell dots={[[1], [1, 2], [1, 2, 4], [1, 2, 4, 5]][i] ?? [1]} size="sm" />
                <span>
                  <span className="home-module-title">{m.title}</span>
                  <span className="home-module-lessons">{m.lessons.map((l) => l.title).join(' · ')}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section band-sunk" aria-labelledby="games-h">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Practice games</Eyebrow>
            <h2 id="games-h">{GAMES.length} games, from first dots to real sentences</h2>
          </div>
          <ul className="game-grid">
            {FEATURED.map((id) => (
              <li key={id}>
                <GameTile game={GAME_BY_ID.get(id)!} />
              </li>
            ))}
          </ul>
          <p className="mt-5">
            <Link href="/games" className="link-arrow">
              All {GAMES.length} games
            </Link>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="about-h">
        <div className="wrap home-about">
          <div className="home-about-card tile">
            <BrailleText text="Delaney" size="md" label="Delaney, in braille" />
            <p className="home-about-role">Teacher of the Visually Impaired · 9 years</p>
          </div>
          <div className="stack prose">
            <Eyebrow>Meet your teacher</Eyebrow>
            <h2 id="about-h">Hi, I&rsquo;m Delaney Costello</h2>
            <p>
              I&rsquo;m a Teacher of the Visually Impaired with nine years of experience helping students and families
              navigate the world of visual impairment: braille, assistive technology, compensatory and daily living
              skills, visual efficiency and working with school teams.
            </p>
            <p>
              Whether I&rsquo;m teaching a student to read braille, helping a family get started with assistive
              technology, or consulting with a school team on accommodations, my focus is always on empowering students
              and the people who support them.
            </p>
            <blockquote>
              Every student and family I work with has a unique story. Being part of that journey is the most rewarding
              work I can imagine.
            </blockquote>
          </div>
        </div>
      </section>

      <section className="section band-ink lattice" aria-labelledby="work-h">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Work with Delaney</Eyebrow>
            <h2 id="work-h">When you&rsquo;re ready for a teacher</h2>
          </div>
          <ul className="home-work">
            <li>
              <h3>Live braille courses</h3>
              <p>Small-group, remote courses for parents and loved ones. The next course is being planned.</p>
              <Link href="/courses" className="btn btn--marigold">
                Join the list
              </Link>
            </li>
            <li>
              <h3>1-on-1 sessions</h3>
              <p>Braille, assistive technology, compensatory skills and more, at your pace — remote or in person.</p>
              <Link href="/appointments" className="btn btn--paper">
                Request a session
              </Link>
            </li>
            <li>
              <h3>For schools</h3>
              <p>TVI services and consultation for educational teams and districts.</p>
              <Link href="/services#schools" className="btn btn--paper">
                School services
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
