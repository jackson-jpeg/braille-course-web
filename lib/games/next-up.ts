/**
 * "What should I practise next?" — a small, explainable recommender that runs entirely on the
 * learner's device from localStorage progress. No accounts, no server.
 */

import type { ProgressData } from '@/lib/progress-types';
import { ALL_LESSONS } from '@/lib/course-curriculum';
import { GAME_BY_ID, gameHref } from './registry';
import { itemStrength } from '@/lib/progress-storage';
import { ALPHABET } from '@/lib/ueb';

export interface NextStep {
  kind: 'lesson' | 'game' | 'review' | 'streak' | 'course';
  title: string;
  reason: string;
  href: string;
  cta: string;
}

function today(): string {
  return new Date().toLocaleDateString('en-CA');
}
function yesterday(): string {
  return new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
}

export function getNextSteps(progress: ProgressData, max = 3): NextStep[] {
  const steps: NextStep[] = [];
  const done = new Set(progress.course.completedLessons);
  const playedAny = Object.values(progress.games).some((g) => (g?.gamesPlayed ?? 0) > 0);

  // 1. The next lesson on the track.
  const nextLesson = ALL_LESSONS.find((l) => !done.has(l.slug));
  if (nextLesson) {
    const index = ALL_LESSONS.indexOf(nextLesson) + 1;
    const started = done.size > 0 || progress.course.lastLessonSlug;
    steps.push({
      kind: 'lesson',
      title: `Lesson ${index}: ${nextLesson.title}`,
      reason: started ? 'Pick up where you left off.' : 'The best place to begin — about five minutes.',
      href: `/learn/${nextLesson.slug}`,
      cta: started ? 'Continue' : 'Start lesson 1',
    });
  } else {
    steps.push({
      kind: 'course',
      title: 'Learn with Delaney, live',
      reason: 'You finished every free lesson. A live course adds feedback and real reading practice.',
      href: '/courses',
      cta: 'See courses',
    });
  }

  // 2. Letters that have been tricky (seen, but not yet strong).
  const tricky = ALPHABET.filter((l) => {
    const stat = progress.items[`letter:${l}`];
    return stat && stat.seen >= 2 && itemStrength(`letter:${l}`, progress) < 0.55;
  }).slice(0, 6);
  if (tricky.length >= 2) {
    steps.push({
      kind: 'review',
      title: `Review ${tricky.join(', ')}`,
      reason: 'These letters have been tricky lately. A quick race will lock them in.',
      href: gameHref('letter-race', { letters: tricky.join('') }),
      cta: 'Practise these',
    });
  }

  // 3. The game that matches the latest finished lesson.
  const lastDone = [...ALL_LESSONS].reverse().find((l) => done.has(l.slug));
  const gameId = lastDone?.practiceGameId;
  if (gameId && GAME_BY_ID.has(gameId)) {
    const g = GAME_BY_ID.get(gameId)!;
    const played = (progress.games[gameId]?.gamesPlayed ?? 0) > 0;
    steps.push({
      kind: 'game',
      title: g.title,
      reason: played
        ? `Keep "${lastDone!.title}" fresh with another round.`
        : `Practise what you learned in "${lastDone!.title}".`,
      href: gameHref(gameId, lastDone!.practiceParams),
      cta: 'Play',
    });
  } else if (!playedAny) {
    steps.push({
      kind: 'game',
      title: 'Dot Quest',
      reason: 'New here with a young learner? Start the kid-friendly adventure.',
      href: gameHref('dot-quest'),
      cta: 'Play',
    });
  }

  // 4. Keep the streak alive.
  const { currentStreak, lastPlayedDate } = progress.streak;
  if (currentStreak >= 1 && lastPlayedDate === yesterday()) {
    steps.unshift({
      kind: 'streak',
      title: `Keep your ${currentStreak}-day streak`,
      reason: 'Any lesson or game today counts.',
      href: gameHref('letter-race'),
      cta: 'Quick round',
    });
  } else if (lastPlayedDate === today() && currentStreak >= 2) {
    steps.push({
      kind: 'streak',
      title: `${currentStreak} days in a row!`,
      reason: 'You already practised today. Come back tomorrow to keep it going.',
      href: '/games',
      cta: 'More games',
    });
  }

  return steps.slice(0, max);
}
