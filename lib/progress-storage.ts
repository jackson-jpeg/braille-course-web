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
const CURRENT_VERSION = 1;

/** Read full progress from localStorage */
export function loadProgress(): ProgressData {
  if (typeof window === 'undefined') return createDefaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const data = JSON.parse(raw) as ProgressData;
    if (data.version !== CURRENT_VERSION) return migrateData(data);
    return data;
  } catch {
    return createDefaultProgress();
  }
}

/** Write full progress to localStorage */
export function saveProgress(data: ProgressData): void {
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
  difficulty: Difficulty = 'beginner'
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
      version: CURRENT_VERSION,
    };
    saveProgress(merged);
    return true;
  } catch {
    return false;
  }
}

/** Clear all progress data */
export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Calculate total games played across all games */
export function getTotalGamesPlayed(): number {
  const progress = loadProgress();
  return Object.values(progress.games).reduce(
    (sum, stats) => sum + (stats?.gamesPlayed || 0),
    0
  );
}

/** Calculate total wins across all games */
export function getTotalWins(): number {
  const progress = loadProgress();
  return Object.values(progress.games).reduce(
    (sum, stats) => sum + (stats?.gamesWon || 0),
    0
  );
}

/** Get mastery percentage for a game (0-100) */
export function getGameMastery(gameId: GameId): number {
  const stats = getGameStats(gameId);
  if (stats.gamesPlayed === 0) return 0;
  const winRate = stats.gamesWon / stats.gamesPlayed;
  const volumeBonus = Math.min(stats.gamesPlayed / 20, 1); // max out at 20 games
  return Math.round(winRate * 70 + volumeBonus * 30);
}

// Helpers — use local timezone for date comparisons so streaks
// align with the user's calendar day, not UTC midnight.
function getDateString(date: Date): string {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
}

function migrateData(data: ProgressData): ProgressData {
  // Future migrations go here
  return { ...createDefaultProgress(), ...data, version: CURRENT_VERSION };
}
