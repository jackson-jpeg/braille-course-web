'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setLastLesson } from '@/lib/progress-storage';

interface Ctx {
  /** Report an exercise result (first-try correctness). */
  report: (id: string, correct: number, total: number) => void;
  /** 0–100 across all reported exercises (100 if none). */
  score: () => number;
  done: number;
}

const LessonCtx = createContext<Ctx>({ report: () => {}, score: () => 100, done: 0 });

export function useLessonProgress() {
  return useContext(LessonCtx);
}

/** Collects drill and quiz results for a lesson, and remembers it as the "resume" lesson. */
export default function LessonProgress({ slug, children }: { slug: string; children: ReactNode }) {
  const results = useRef<Record<string, { correct: number; total: number }>>({});
  const [done, setDone] = useState(0);

  useEffect(() => setLastLesson(slug), [slug]);

  const report = useCallback((id: string, correct: number, total: number) => {
    results.current[id] = { correct, total };
    setDone(Object.keys(results.current).length);
  }, []);

  const score = useCallback(() => {
    const all = Object.values(results.current);
    const total = all.reduce((s, r) => s + r.total, 0);
    if (total === 0) return 100;
    return Math.round((all.reduce((s, r) => s + r.correct, 0) / total) * 100);
  }, []);

  const value = useMemo(() => ({ report, score, done }), [report, score, done]);
  return <LessonCtx.Provider value={value}>{children}</LessonCtx.Provider>;
}
