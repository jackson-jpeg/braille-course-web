import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { GAME_LABELS } from '@/lib/learn-analytics';
import { ALL_LESSONS } from '@/lib/course-curriculum';
import type { GameId } from '@/lib/progress-types';

/**
 * Aggregated free-course & game engagement for the admin "Learners" tab.
 * Reads anonymous AnalyticsEvent rows over a rolling window and rolls them up
 * in JS (volume is small at this scale, and it keeps the shaping flexible).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const daysParam = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
    const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const events = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { visitorId: true, eventType: true, target: true, createdAt: true },
    });

    // ── Headline totals ──
    const uniqueLearners = new Set(events.map((e) => e.visitorId)).size;
    const lessonStarts = events.filter((e) => e.eventType === 'lesson_start').length;
    const lessonCompletes = events.filter((e) => e.eventType === 'lesson_complete').length;
    const gamePlays = events.filter((e) => e.eventType === 'game_play').length;

    // ── Per game: plays + distinct players ──
    const gamePlayers = new Map<string, Set<string>>();
    const gamePlayCount = new Map<string, number>();
    for (const e of events) {
      if (e.eventType !== 'game_play') continue;
      gamePlayCount.set(e.target, (gamePlayCount.get(e.target) || 0) + 1);
      if (!gamePlayers.has(e.target)) gamePlayers.set(e.target, new Set());
      gamePlayers.get(e.target)!.add(e.visitorId);
    }
    const perGame = Array.from(gamePlayCount.entries())
      .map(([gameId, plays]) => ({
        gameId,
        label: GAME_LABELS[gameId as GameId] || gameId,
        plays,
        players: gamePlayers.get(gameId)?.size ?? 0,
      }))
      .sort((a, b) => b.plays - a.plays);

    // ── Per lesson: starts + completes, in curriculum order ──
    const lessonStartCount = new Map<string, number>();
    const lessonCompleteCount = new Map<string, number>();
    const lessonLearners = new Map<string, Set<string>>();
    for (const e of events) {
      if (e.eventType === 'lesson_start') {
        lessonStartCount.set(e.target, (lessonStartCount.get(e.target) || 0) + 1);
      } else if (e.eventType === 'lesson_complete') {
        lessonCompleteCount.set(e.target, (lessonCompleteCount.get(e.target) || 0) + 1);
      } else {
        continue;
      }
      if (!lessonLearners.has(e.target)) lessonLearners.set(e.target, new Set());
      lessonLearners.get(e.target)!.add(e.visitorId);
    }
    const perLesson = ALL_LESSONS.map((l) => ({
      slug: l.slug,
      title: l.title,
      starts: lessonStartCount.get(l.slug) || 0,
      completes: lessonCompleteCount.get(l.slug) || 0,
      learners: lessonLearners.get(l.slug)?.size ?? 0,
    })).filter((l) => l.starts > 0 || l.completes > 0);

    // ── Daily trend: distinct active learners per day ──
    const dayLearners = new Map<string, Set<string>>();
    for (const e of events) {
      const key = e.createdAt.toISOString().slice(0, 10);
      if (!dayLearners.has(key)) dayLearners.set(key, new Set());
      dayLearners.get(key)!.add(e.visitorId);
    }
    const dailyTrend: { date: string; learners: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, learners: dayLearners.get(key)?.size ?? 0 });
    }

    return NextResponse.json({
      days,
      totals: { uniqueLearners, lessonStarts, lessonCompletes, gamePlays },
      perGame,
      perLesson,
      dailyTrend,
    });
  } catch (error) {
    console.error('Learn analytics error:', error);
    return NextResponse.json({ error: 'Failed to load learn analytics' }, { status: 500 });
  }
}
