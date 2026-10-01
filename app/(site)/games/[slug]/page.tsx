import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GameMount from '@/components/games/GameMount';
import NextUp from '@/components/progress/NextUp';
import StreakChip from '@/components/progress/StreakChip';
import BrailleText from '@/components/ui/BrailleText';
import { GAMES, getGame, SKILL_LABELS } from '@/lib/games/registry';
import { getLessonBySlug, getLessonIndex } from '@/lib/course-curriculum';
import '@/styles/games/kit.css';

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return {};
  return {
    title: `${game.title} — Free Braille Game`,
    description: game.description,
    alternates: { canonical: `https://teachbraille.org/games/${game.slug}` },
    openGraph: { title: `${game.title} — Free Braille Game | TeachBraille.org`, description: game.tagline },
  };
}

const AUDIENCE: Record<string, string> = {
  everyone: 'For everyone',
  kids: 'Great for kids',
  'grown-ups': 'Best for grown-ups',
};

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game || game.slug !== slug) notFound();

  const lessons = game.lessons.map((s) => getLessonBySlug(s)).filter((l) => !!l);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description,
    url: `https://teachbraille.org/games/${game.slug}`,
    genre: 'Educational',
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: 'Delaney Costello' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="game-page">
        <header className="wrap game-page-head">
          <nav aria-label="Breadcrumb">
            <ol className="crumbs">
              <li>
                <Link href="/games">Games</Link>
              </li>
              <li aria-current="page">{game.title}</li>
            </ol>
          </nav>
          <div className="game-title-row">
            <div>
              <h1>{game.title}</h1>
              <p className="lead">{game.tagline}</p>
            </div>
            <BrailleText text={game.emblem} size="sm" className="game-emblem" />
          </div>
          <div className="cluster">
            {game.skills.map((s) => (
              <span key={s} className="chip chip--sky">
                {SKILL_LABELS[s]}
              </span>
            ))}
            <span className="chip">About {game.minutes} min</span>
            <span className="chip chip--plum">{AUDIENCE[game.audience]}</span>
            <StreakChip />
          </div>
        </header>

        <section className="wrap game-stage" aria-label={`${game.title} game`}>
          <GameMount id={game.id} title={game.title} />
        </section>

        <div className="wrap game-info">
          <section className="tile tile--sunk" aria-labelledby="how-heading">
            <h2 id="how-heading">How to play</h2>
            <p>{game.description}</p>
            <h3 className="mt-5">Keyboard</h3>
            <ul className="key-list">
              {game.keys.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </section>
          {lessons.length > 0 && (
            <section className="tile tile--sunk" aria-labelledby="lessons-heading">
              <h2 id="lessons-heading">Practises these lessons</h2>
              <ul className="lesson-links">
                {lessons.map((l) => (
                  <li key={l.slug}>
                    <Link href={`/learn/${l.slug}`} className="link-arrow">
                      Lesson {getLessonIndex(l.slug) + 1}: {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="wrap section-tight">
          <NextUp heading="Up next for you" />
        </div>
      </div>
    </>
  );
}
