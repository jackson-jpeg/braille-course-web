import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

interface GameProgressRow {
  enrollmentId: string;
  progressJson: string;
  lastSyncedAt: Date;
}

interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  lastPlayed: string;
}

interface ProgressData {
  games: Record<string, GameStats>;
  achievements: { unlocked: string[] };
  streak: { currentStreak: number; longestStreak: number };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all enrolled students with their game progress
    const enrollments = await prisma.enrollment.findMany({
      where: { paymentStatus: 'COMPLETED' },
      select: {
        id: true,
        email: true,
        section: { select: { label: true } },
        createdAt: true,
      },
    });

    const gameProgressRows: GameProgressRow[] = await prisma.gameProgress.findMany();

    const progressMap = new Map<string, GameProgressRow>();
    for (const gp of gameProgressRows) {
      progressMap.set(gp.enrollmentId, gp);
    }

    const TOTAL_GAMES = 10; // Total number of games in the platform

    const students = enrollments.map((e: { id: string; email: string | null; section: { label: string }; createdAt: Date }) => {
      const gp = progressMap.get(e.id);
      let totalGamesPlayed = 0;
      let totalGamesWon = 0;
      let gamesWithActivity = 0;
      let achievementCount = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let lastActive: string | null = null;

      if (gp) {
        try {
          const data = JSON.parse(gp.progressJson) as ProgressData;
          const games = data.games || {};
          for (const stats of Object.values(games)) {
            if (stats && stats.gamesPlayed > 0) {
              gamesWithActivity++;
              totalGamesPlayed += stats.gamesPlayed;
              totalGamesWon += stats.gamesWon;
              if (!lastActive || stats.lastPlayed > lastActive) {
                lastActive = stats.lastPlayed;
              }
            }
          }
          achievementCount = data.achievements?.unlocked?.length || 0;
          currentStreak = data.streak?.currentStreak || 0;
          longestStreak = data.streak?.longestStreak || 0;
        } catch {
          // Invalid JSON
        }
      }

      const completionPct = Math.round((gamesWithActivity / TOTAL_GAMES) * 100);
      const daysSinceActive = lastActive
        ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000)
        : null;

      return {
        enrollmentId: e.id,
        email: e.email,
        section: e.section.label,
        enrolledAt: e.createdAt,
        totalGamesPlayed,
        totalGamesWon,
        gamesWithActivity,
        completionPct,
        achievementCount,
        currentStreak,
        longestStreak,
        lastActive,
        daysSinceActive,
        inactive: daysSinceActive !== null && daysSinceActive > 7,
        hasProgress: !!gp,
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Student progress error:', error);
    return NextResponse.json({ error: 'Failed to load student progress' }, { status: 500 });
  }
}
