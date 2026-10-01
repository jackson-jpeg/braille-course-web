/**
 * localStorage abstraction for braille games progress.
 * All data stays on the user's device — nothing sent to servers.
 */

import {
  ProgressData,
  GameId,
  GameStats,
  Difficulty,
  createDefaultGameStats,
  createDefaultProgress,
} from './progress-types';

const STORAGE_KEY = 'brailleGames_progress';
const CURRENT_VERSION = 3;

// In-memory cache to avoid repeated JSON.parse on every read
let _cache: ProgressData | null = null;

/** Read full progress from localStorage */
export function loadProgress(): ProgressData {
  if (_cache) return _cache;
  if (typeof window === 'undefined') return createDefaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const data = JSON.parse(raw) as ProgressData;
    if (data.version !== CURRENT_VERSION) {
      _cache = migrateData(data);
      return _cache;
    }
    _cache = data;
    return data;
  } catch {
    return createDefaultProgress();
  }
}

/** Write full progress to localStorage */
export function saveProgress(data: ProgressData): void {
  _cache = data;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked — fail silently
  }
}

/** Get stats for a specific game */
export function getGameStats(gameId: GameId): GameStats {
  const progress = loadProgress();
  return progress.games[gameId] || createDefaultGameStats();
}

/** Record a completed game round */
export function recordGameResult(
  gameId: GameId,
  won: boolean,
  score: number,
  difficulty: Difficulty = 'beginner',
): ProgressData {
  const progress = loadProgress();
  if (!progress.settings.trackingEnabled) return progress;

  const now = new Date().toISOString();
  const today = getDateString(new Date());

  // Initialize first play date
  if (!progress.firstPlayDate) {
    progress.firstPlayDate = now;
  }

  // Update game stats
  const validScore = Math.max(0, score);
  const stats = progress.games[gameId] || createDefaultGameStats();
  stats.gamesPlayed++;
  if (won) stats.gamesWon++;
  stats.bestScore = Math.max(stats.bestScore, validScore);
  stats.totalScore += validScore;
  stats.lastPlayed = now;

  // Difficulty-specific
  const ds = stats.difficultyStats[difficulty] || { played: 0, won: 0 };
  ds.played++;
  if (won) ds.won++;
  stats.difficultyStats[difficulty] = ds;

  progress.games[gameId] = stats;

  // Update streak
  updateStreak(progress, today);

  saveProgress(progress);
  return progress;
}

/** Update the daily streak */
function updateStreak(progress: ProgressData, today: string): void {
  const { streak } = progress;
  const lastPlayed = streak.lastPlayedDate;

  if (lastPlayed === today) return; // Already played today

  const yesterday = getDateString(new Date(Date.now() - 86400000));

  if (lastPlayed === yesterday) {
    streak.currentStreak++;
  } else if (lastPlayed && lastPlayed !== today) {
    // Missed a day — check for freeze
    if (streak.freezesAvailable > 0) {
      streak.freezesAvailable--;
      streak.currentStreak++;
    } else {
      streak.currentStreak = 1;
    }
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastPlayedDate = today;
}

/** Get difficulty for a game */
export function getGameDifficulty(gameId: GameId): Difficulty {
  const progress = loadProgress();
  return progress.settings.difficulty[gameId] || 'beginner';
}

/** Set difficulty for a game */
export function setGameDifficulty(gameId: GameId, difficulty: Difficulty): void {
  const progress = loadProgress();
  progress.settings.difficulty[gameId] = difficulty;
  saveProgress(progress);
}

/** Mark onboarding as seen */
export function markOnboardingSeen(): void {
  const progress = loadProgress();
  progress.settings.hasSeenOnboarding = true;
  saveProgress(progress);
}

/** Mark tracking consent */
export function setTrackingConsent(consented: boolean): void {
  const progress = loadProgress();
  progress.settings.hasConsentedToTracking = true;
  progress.settings.trackingEnabled = consented;
  saveProgress(progress);
}

/** Export progress as JSON blob */
export function exportProgress(): string {
  return JSON.stringify(loadProgress(), null, 2);
}

/** Import progress from JSON string */
export function importProgress(json: string): boolean {
  try {
    const data = JSON.parse(json) as Partial<ProgressData>;
    if (!data.version) return false;
    // Merge with defaults to fill any missing fields
    const defaults = createDefaultProgress();
    const merged: ProgressData = {
      ...defaults,
      ...data,
      settings: { ...defaults.settings, ...(data.settings || {}) },
      streak: { ...defaults.streak, ...(data.streak || {}) },
      achievements: { ...defaults.achievements, ...(data.achievements || {}) },
      dailyChallenge: { ...defaults.dailyChallenge, ...(data.dailyChallenge || {}) },
      course: { ...defaults.course, ...(data.course || {}) },
      version: CURRENT_VERSION,
    };
    saveProgress(merged);
    _cache = null;
    return true;
  } catch {
    return false;
  }
}

/** Clear all progress data */
export function clearProgress(): void {
  _cache = null;
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Calculate total games played across all games */
export function getTotalGamesPlayed(): number {
  const progress = loadProgress();
  return Object.values(progress.games).reduce((sum, stats) => sum + (stats?.gamesPlayed || 0), 0);
}

/** Calculate total wins across all games */
export function getTotalWins(): number {
  const progress = loadProgress();
  return Object.values(progress.games).reduce((sum, stats) => sum + (stats?.gamesWon || 0), 0);
}

/** Get mastery percentage for a game (0-100) */
export function getGameMastery(gameId: GameId): number {
  const stats = getGameStats(gameId);
  if (stats.gamesPlayed === 0) return 0;
  const winRate = stats.gamesWon / stats.gamesPlayed;
  const volumeBonus = Math.min(stats.gamesPlayed / 20, 1); // max out at 20 games
  return Math.round(winRate * 70 + volumeBonus * 30);
}

/* ── Course progress (free structured course, localStorage only) ───────────── */

/** Mark a course lesson finished, storing the best drill score (0-100). */
export function markLessonComplete(slug: string, score: number): ProgressData {
  const progress = loadProgress();
  if (!progress.settings.trackingEnabled) return progress;

  const now = new Date().toISOString();
  const { course } = progress;

  if (!course.completedLessons.includes(slug)) {
    course.completedLessons.push(slug);
  }
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  course.lessonScores[slug] = Math.max(course.lessonScores[slug] ?? 0, clamped);
  course.lastLessonSlug = slug;

  if (!progress.firstPlayDate) progress.firstPlayDate = now;
  // Finishing a lesson counts as daily activity — keep the streak alive.
  updateStreak(progress, getDateString(new Date()));

  saveProgress(progress);
  return progress;
}

/** Whether a lesson is complete and its best drill score. */
export function getLessonState(slug: string): { completed: boolean; score: number } {
  const { course } = loadProgress();
  return {
    completed: course.completedLessons.includes(slug),
    score: course.lessonScores[slug] ?? 0,
  };
}

/** Record that a lesson was opened (for "Resume"), without completing it. */
export function setLastLesson(slug: string): void {
  const progress = loadProgress();
  if (!progress.settings.trackingEnabled) return;
  if (progress.course.lastLessonSlug === slug) return;
  progress.course.lastLessonSlug = slug;
  saveProgress(progress);
}

/** Course-wide progress summary for the course home page. */
export function getCourseProgress(): {
  completedSlugs: string[];
  completedCount: number;
  lastLessonSlug: string;
} {
  const { course } = loadProgress();
  return {
    completedSlugs: course.completedLessons,
    completedCount: course.completedLessons.length,
    lastLessonSlug: course.lastLessonSlug,
  };
}

/** The slug to resume from, or '' if the learner hasn't started. */
export function getResumeLesson(): string {
  return loadProgress().course.lastLessonSlug;
}

/**
 * Merge local and cloud progress data.
 * - Achievements: union of unlocked sets (cloud wins)
 * - Streak: take the higher values
 * - Game stats: take per-game max of gamesPlayed/gamesWon/bestScore
 * - Settings: local wins (user's current device preferences)
 */
export function mergeProgress(local: ProgressData, cloud: ProgressData): ProgressData {
  const merged: ProgressData = {
    ...local,
    version: CURRENT_VERSION,
    firstPlayDate: local.firstPlayDate || cloud.firstPlayDate,
    // Merge achievements — union of unlocked
    achievements: {
      unlocked: [...new Set([...local.achievements.unlocked, ...cloud.achievements.unlocked])],
      progress: { ...cloud.achievements.progress, ...local.achievements.progress },
      lastChecked: local.achievements.lastChecked || cloud.achievements.lastChecked,
    },
    // Streak — take higher values
    streak: {
      currentStreak: Math.max(local.streak.currentStreak, cloud.streak.currentStreak),
      longestStreak: Math.max(local.streak.longestStreak, cloud.streak.longestStreak),
      lastPlayedDate:
        local.streak.lastPlayedDate > cloud.streak.lastPlayedDate
          ? local.streak.lastPlayedDate
          : cloud.streak.lastPlayedDate,
      freezesAvailable: Math.max(local.streak.freezesAvailable, cloud.streak.freezesAvailable),
    },
    // Settings — local wins (current device)
    settings: {
      ...local.settings,
      difficulty: { ...local.settings.difficulty },
    },
    // Daily challenge — use whichever is more recent
    dailyChallenge:
      local.dailyChallenge.date >= cloud.dailyChallenge.date ? local.dailyChallenge : cloud.dailyChallenge,
    // Course — union of completed lessons, max of each lesson score
    course: {
      completedLessons: [
        ...new Set([...(local.course?.completedLessons ?? []), ...(cloud.course?.completedLessons ?? [])]),
      ],
      lessonScores: (() => {
        const scores: Record<string, number> = { ...(cloud.course?.lessonScores ?? {}) };
        for (const [slug, s] of Object.entries(local.course?.lessonScores ?? {})) {
          scores[slug] = Math.max(scores[slug] ?? 0, s);
        }
        return scores;
      })(),
      lastLessonSlug: local.course?.lastLessonSlug || cloud.course?.lastLessonSlug || '',
    },
    // Games — merge per-game stats
    games: { ...cloud.games },
  };

  // Merge per-game: take max of each stat
  const allGameIds = new Set([...Object.keys(local.games), ...Object.keys(cloud.games)]) as Set<GameId>;

  for (const gameId of allGameIds) {
    const l = local.games[gameId];
    const c = cloud.games[gameId];
    if (!l) {
      merged.games[gameId] = c;
    } else if (!c) {
      merged.games[gameId] = l;
    } else {
      merged.games[gameId] = {
        gamesPlayed: Math.max(l.gamesPlayed, c.gamesPlayed),
        gamesWon: Math.max(l.gamesWon, c.gamesWon),
        bestScore: Math.max(l.bestScore, c.bestScore),
        totalScore: Math.max(l.totalScore, c.totalScore),
        lastPlayed: l.lastPlayed > c.lastPlayed ? l.lastPlayed : c.lastPlayed,
        difficultyStats: {
          beginner: {
            played: Math.max(l.difficultyStats.beginner.played, c.difficultyStats.beginner.played),
            won: Math.max(l.difficultyStats.beginner.won, c.difficultyStats.beginner.won),
          },
          intermediate: {
            played: Math.max(l.difficultyStats.intermediate.played, c.difficultyStats.intermediate.played),
            won: Math.max(l.difficultyStats.intermediate.won, c.difficultyStats.intermediate.won),
          },
          advanced: {
            played: Math.max(l.difficultyStats.advanced.played, c.difficultyStats.advanced.played),
            won: Math.max(l.difficultyStats.advanced.won, c.difficultyStats.advanced.won),
          },
        },
      };
    }
  }

  return merged;
}

/** Invalidate the in-memory cache (used after cloud sync) */
export function invalidateCache(): void {
  _cache = null;
}

// Helpers — use local timezone for date comparisons so streaks
// align with the user's calendar day, not UTC midnight.
function getDateString(date: Date): string {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
}

function migrateData(data: ProgressData): ProgressData {
  const defaults = createDefaultProgress();
  // v1 → v2 added `course`; v2 → v3 added `items` and `quest`. Spreading defaults fills them.
  return {
    ...defaults,
    ...data,
    items: data.items ?? {},
    quest: { ...defaults.quest, ...(data.quest ?? {}) },
    settings: {
      ...defaults.settings,
      ...(data.settings ?? {}),
      difficulty: { ...defaults.settings.difficulty, ...(data.settings?.difficulty ?? {}) },
    },
    version: CURRENT_VERSION,
  };
}

/* ── Item skill memory ─────────────────────────────────────────────────────── */

/** Record one answer about one item (e.g. "letter:q"). Safe to call often. */
export function recordItem(key: string, correct: boolean): void {
  const progress = loadProgress();
  if (!progress.settings.trackingEnabled) return;
  const stat = progress.items[key] ?? { seen: 0, correct: 0, run: 0, lastSeen: '' };
  stat.seen++;
  if (correct) {
    stat.correct++;
    stat.run++;
  } else {
    stat.run = 0;
  }
  stat.lastSeen = new Date().toISOString();
  progress.items[key] = stat;
  saveProgress(progress);
}

/** 0–1 confidence for an item: accuracy weighted by how many times it's been seen. */
export function itemStrength(key: string, progress: ProgressData = loadProgress()): number {
  const stat = progress.items[key];
  if (!stat || stat.seen === 0) return 0;
  const accuracy = stat.correct / stat.seen;
  const exposure = Math.min(stat.seen / 6, 1);
  const runBonus = Math.min(stat.run / 4, 1) * 0.2;
  return Math.min(1, accuracy * exposure * 0.8 + runBonus);
}

/** The weakest items among `keys` (unseen first, then lowest strength). */
export function weakestItems(keys: string[], count: number): string[] {
  const progress = loadProgress();
  return [...keys]
    .map((k, i) => ({ k, s: itemStrength(k, progress), i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, count)
    .map((x) => x.k);
}

/* ── Dot Quest ─────────────────────────────────────────────────────────────── */

export function getQuest(): ProgressData['quest'] {
  return loadProgress().quest;
}

/** Save stars for a stage (keeps the best) and add any new stickers. Returns newly earned stickers. */
export function saveQuestStage(stageId: string, stars: number, stickers: string[] = []): string[] {
  const progress = loadProgress();
  const quest = progress.quest;
  quest.stars[stageId] = Math.max(quest.stars[stageId] ?? 0, Math.max(0, Math.min(3, stars)));
  const fresh = stickers.filter((s) => !quest.stickers.includes(s));
  quest.stickers.push(...fresh);
  if (!progress.firstPlayDate) progress.firstPlayDate = new Date().toISOString();
  saveProgress(progress);
  return fresh;
}
