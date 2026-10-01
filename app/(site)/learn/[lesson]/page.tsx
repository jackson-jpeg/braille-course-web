import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LessonBlocks from '@/components/learn/LessonBlocks';
import LessonProgress from '@/components/learn/LessonProgress';
import LessonFinish from '@/components/learn/LessonFinish';
import BrailleText from '@/components/ui/BrailleText';
import {
  LESSON_SLUGS,
  TOTAL_LESSONS,
  getAdjacentLessons,
  getLessonBySlug,
  getLessonIndex,
  getModuleForLesson,
} from '@/lib/course-curriculum';
import { GAME_BY_ID, gameHref } from '@/lib/games/registry';
import '@/styles/pages/learn.css';
import '@/styles/games/kit.css';

export function generateStaticParams() {
  return LESSON_SLUGS.map((lesson) => ({ lesson }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson: slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return {};
  const n = getLessonIndex(slug) + 1;
  const title = `Lesson ${n}: ${lesson.title} — Free Braille Course`;
  return {
    title,
    description: `${lesson.summary} A free, self-paced braille lesson from a Teacher of the Visually Impaired. No account needed.`,
    alternates: { canonical: `https://teachbraille.org/learn/${lesson.slug}` },
    openGraph: { title: `${title} | TeachBraille.org`, description: lesson.summary },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson: slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const n = getLessonIndex(slug) + 1;
  const mod = getModuleForLesson(lesson);
  const { prev, next } = getAdjacentLessons(slug);
  const game = GAME_BY_ID.get(lesson.practiceGameId)!;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.summary,
    url: `https://teachbraille.org/learn/${lesson.slug}`,
    learningResourceType: 'Lesson',
    educationalLevel: 'Beginner',
    timeRequired: `PT${lesson.minutes}M`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    isPartOf: { '@type': 'Course', name: 'Learn Braille: Free Beginner Track', url: 'https://teachbraille.org/learn' },
    author: { '@type': 'Person', name: 'Delaney Costello', jobTitle: 'Teacher of the Visually Impaired' },
  };

  return (
    <LessonProgress slug={slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="lesson">
        <header className="lesson-head lattice">
          <div className="wrap-narrow">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                <li>
                  <Link href="/learn">Lessons</Link>
                </li>
                {mod && <li>{mod.title}</li>}
                <li aria-current="page">Lesson {n}</li>
              </ol>
            </nav>
            <p className="lesson-number">
              <BrailleText text={String(n)} size="sm" />
              <span>
                Lesson {n} of {TOTAL_LESSONS} · about {lesson.minutes} minutes
              </span>
            </p>
            <h1>{lesson.title}</h1>
            <p className="lead">{lesson.summary}</p>
            <div className="lesson-goals tile">
              <h2 className="lesson-goals-title">By the end, you&rsquo;ll be able to</h2>
              <ul>
                {lesson.goals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </header>

        <div className="wrap-narrow lesson-body prose">
          <LessonBlocks slug={slug} blocks={lesson.blocks} />
        </div>

        <div className="wrap-narrow">
          <LessonFinish
            slug={slug}
            practiceHref={gameHref(game.id, lesson.practiceParams)}
            practiceLabel={lesson.practiceLabel}
            next={next ? { href: `/learn/${next.slug}`, title: next.title } : null}
            isLast={!next}
          />

          {lesson.alsoTry && lesson.alsoTry.length > 0 && (
            <section className="also-try" aria-labelledby="also-h">
              <h2 id="also-h">Also good practice</h2>
              <ul className="cluster">
                {lesson.alsoTry.map((id) => {
                  const g = GAME_BY_ID.get(id)!;
                  return (
                    <li key={id}>
                      <Link href={`/games/${g.slug}`} className="chip chip--sky also-chip">
                        {g.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <nav className="lesson-nav" aria-label="Lessons">
            {prev ? (
              <Link href={`/learn/${prev.slug}`} className="lesson-nav-link">
                <span className="lesson-nav-dir">← Previous</span>
                <span>{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/learn/${next.slug}`} className="lesson-nav-link lesson-nav-link--next">
                <span className="lesson-nav-dir">Next →</span>
                <span>{next.title}</span>
              </Link>
            ) : (
              <Link href="/courses" className="lesson-nav-link lesson-nav-link--next">
                <span className="lesson-nav-dir">Keep going →</span>
                <span>Live courses with Delaney</span>
              </Link>
            )}
          </nav>
        </div>
      </article>
    </LessonProgress>
  );
}
