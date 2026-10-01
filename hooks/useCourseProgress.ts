'use client';

import { useState, useCallback, useEffect } from 'react';
import { getCourseProgress, getLessonState, markLessonComplete, setLastLesson } from '@/lib/progress-storage';
import { TOTAL_LESSONS } from '@/lib/course-curriculum';

interface UseCourseProgressReturn {
  /** Slugs the learner has completed. */
  completedSlugs: string[];
  /** Number of completed lessons. */
  completedCount: number;
  /** Percentage complete across the whole course (0-100). */
  percent: number;
  /** Most recently opened lesson, for "Resume" (empty if not started). */
  lastLessonSlug: string;
  /** Whether a given lesson is complete. */
  isComplete: (slug: string) => boolean;
  /** Best drill score for a lesson (0-100). */
  scoreFor: (slug: string) => number;
  /** Mark a lesson finished; returns the fresh completed count. */
  complete: (slug: string, score: number) => void;
  /** Record that a lesson was opened, for resume. */
  markOpened: (slug: string) => void;
  /** Re-read from storage. */
  refresh: () => void;
}

export function useCourseProgress(): UseCourseProgressReturn {
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [lastLessonSlug, setLastLessonSlug] = useState('');

  const refresh = useCallback(() => {
    const { completedSlugs: slugs, lastLessonSlug: last } = getCourseProgress();
    setCompletedSlugs(slugs);
    setLastLessonSlug(last);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isComplete = useCallback((slug: string) => getLessonState(slug).completed, []);
  const scoreFor = useCallback((slug: string) => getLessonState(slug).score, []);

  const complete = useCallback(
    (slug: string, score: number) => {
      markLessonComplete(slug, score);
      refresh();
    },
    [refresh],
  );

  const markOpened = useCallback(
    (slug: string) => {
      setLastLesson(slug);
      refresh();
    },
    [refresh],
  );

  const completedCount = completedSlugs.length;
  const percent = TOTAL_LESSONS > 0 ? Math.round((completedCount / TOTAL_LESSONS) * 100) : 0;

  return {
    completedSlugs,
    completedCount,
    percent,
    lastLessonSlug,
    isComplete,
    scoreFor,
    complete,
    markOpened,
    refresh,
  };
}
