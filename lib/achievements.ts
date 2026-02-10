/**
 * Achievement definitions and unlock logic.
 * Runs client-side after each game completion.
 */

import { ProgressData, GameId } from './progress-types';
import { saveProgress } from './progress-storage';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'beginner' | 'skill' | 'mastery' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  category: AchievementCategory;
  icon: string; // emoji
}

/** All achievement definitions */
export const ACHIEVEMENTS: Achievement[] = [
  // === BEGINNER (Bronze) ===
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Play your first game',
    tier: 'bronze',
    category: 'beginner',
    icon: '👣',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Try 3 different games',
    tier: 'bronze',
    category: 'beginner',
    icon: '🧭',
  },
  {
    id: 'first-win',
    name: 'First Victory',
    description: 'Win your first game',
    tier: 'bronze',
    category: 'beginner',
    icon: '⭐',
  },
  {
    id: 'daily-player',
    name: 'Daily Player',
    description: 'Complete a daily challenge',
    tier: 'bronze',
    category: 'beginner',
    icon: '📅',
  },
  {
    id: 'five-games',
    name: 'Getting Started',
    description: 'Play 5 games total',
    tier: 'bronze',
    category: 'beginner',
    icon: '🎯',
  },

  // === SKILL (Silver) ===
  { id: 'ten-wins', name: 'Double Digits', description: 'Win 10 games', tier: 'silver', category: 'skill', icon: '🏅' },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Get a 10-streak in Speed Match',
    tier: 'silver',
    category: 'skill',
    icon: '⚡',
  },
  {
    id: 'word-smith',
    name: 'Word Smith',
    description: 'Win Word Game in 3 guesses or fewer',
    tier: 'silver',
    category: 'skill',
    icon: '📝',
  },
  {
    id: 'perfect-memory',
    name: 'Perfect Memory',
    description: 'Complete Memory Match in under 10 moves',
    tier: 'silver',
    category: 'skill',
    icon: '🧠',
  },
  {
    id: 'hangman-hero',
    name: 'Hangman Hero',
    description: 'Win Hangman with 0 wrong guesses',
    tier: 'silver',
    category: 'skill',
    icon: '🦸',
  },
  {
    id: 'contraction-pro',
    name: 'Contraction Pro',
    description: 'Score 10+ in Contraction Sprint',
    tier: 'silver',
    category: 'skill',
    icon: '📖',
  },
  {
    id: 'math-whiz',
    name: 'Math Whiz',
    description: 'Score 10+ in Number Sense',
    tier: 'silver',
    category: 'skill',
    icon: '🔢',
  },
  {
    id: 'quick-reflexes',
    name: 'Quick Reflexes',
    description: 'Score 15+ in Reflex Dots',
    tier: 'silver',
    category: 'skill',
    icon: '👆',
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    tier: 'silver',
    category: 'skill',
    icon: '🗓️',
  },
  {
    id: 'all-games',
    name: 'Renaissance Player',
    description: 'Play all 9 games',
    tier: 'silver',
    category: 'skill',
    icon: '🎪',
  },

  // === MASTERY (Gold) ===
  {
    id: 'fifty-wins',
    name: 'Half Century',
    description: 'Win 50 games',
    tier: 'gold',
    category: 'mastery',
    icon: '🏆',
  },
  {
    id: 'speed-master',
    name: 'Speed Master',
    description: 'Get a 20-streak in Speed Match',
    tier: 'gold',
    category: 'mastery',
    icon: '🌟',
  },
  {
    id: 'month-streak',
    name: 'Dedicated Learner',
    description: 'Maintain a 30-day streak',
    tier: 'gold',
    category: 'mastery',
    icon: '🔥',
  },
  {
    id: 'hundred-games',
    name: 'Centurion',
    description: 'Play 100 games total',
    tier: 'gold',
    category: 'mastery',
    icon: '💯',
  },
  {
    id: 'advanced-player',
    name: 'Advanced Player',
    description: 'Win on Advanced difficulty',
    tier: 'gold',
    category: 'mastery',
    icon: '🎓',
  },
  {
    id: 'daily-sweep',
    name: 'Daily Sweep',
    description: 'Complete all 3 daily challenges in one day',
    tier: 'gold',
    category: 'mastery',
    icon: '🧹',
  },

  // === EXPERT (Platinum) ===
  {
    id: 'hundred-wins',
    name: 'Century Champion',
    description: 'Win 100 games',
    tier: 'platinum',
    category: 'mastery',
    icon: '👑',
  },
  {
    id: 'braille-master',
    name: 'Braille Master',
    description: 'Unlock 20 other achievements',
    tier: 'platinum',
    category: 'special',
    icon: '🌠',
  },
  {
    id: 'speed-legend',
    name: 'Speed Legend',
    description: 'Get a 30-streak in Speed Match',
    tier: 'platinum',
    category: 'mastery',
    icon: '💎',
  },
];

/** Check for newly unlocked achievements. Returns newly unlocked ones. */
export function checkAchievements(progress: ProgressData): Achievement[] {
  const already = new Set(progress.achievements.unlocked);
  const newlyUnlocked: Achievement[] = [];

  const totalPlayed = Object.values(progress.games).reduce((s, g) => s + (g?.gamesPlayed || 0), 0);
  const totalWins = Object.values(progress.games).reduce((s, g) => s + (g?.gamesWon || 0), 0);
  const allGamesTriedCount = Object.values(progress.games).filter((g) => g && g.gamesPlayed > 0).length;
  const scoredGamesTriedCount = Object.entries(progress.games).filter(
    ([id, g]) => g && g.gamesPlayed > 0 && id !== 'explorer',
  ).length;

  function unlock(id: string) {
    if (already.has(id)) return;
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (achievement) {
      newlyUnlocked.push(achievement);
      progress.achievements.unlocked.push(id);
    }
  }

  // Beginner
  if (totalPlayed >= 1) unlock('first-steps');
  if (totalWins >= 1) unlock('first-win');
  if (totalPlayed >= 5) unlock('five-games');
  if (allGamesTriedCount >= 3) unlock('explorer');

  // Check daily challenge completion
  const dailyCompleted = progress.dailyChallenge.challenges.filter((c) => c.completed).length;
  if (dailyCompleted >= 1) unlock('daily-player');
  if (dailyCompleted >= 3) unlock('daily-sweep');

  // Skill
  if (totalWins >= 10) unlock('ten-wins');
  if (scoredGamesTriedCount >= 9) unlock('all-games'); // 9 scored games (explorer is a tool, not a game)

  // Speed Match streaks
  const speedStats = progress.games.speedmatch;
  if (speedStats && speedStats.bestScore >= 10) unlock('speed-demon');
  if (speedStats && speedStats.bestScore >= 20) unlock('speed-master');
  if (speedStats && speedStats.bestScore >= 30) unlock('speed-legend');

  // Word Game - best score is fewest guesses (lower is better, stored as 7-guesses)
  const wordStats = progress.games.wordgame;
  if (wordStats && wordStats.bestScore >= 4) unlock('word-smith'); // score 4 = solved in 3 guesses

  // Memory Match
  const memStats = progress.games.memorymatch;
  if (memStats && memStats.bestScore >= 3) unlock('perfect-memory'); // score ≥ 3 means < 10 moves

  // Hangman
  const hangStats = progress.games.hangman;
  if (hangStats && hangStats.bestScore >= 6) unlock('hangman-hero'); // 6 = zero wrong

  // New games
  const conStats = progress.games['contraction-sprint'];
  if (conStats && conStats.bestScore >= 10) unlock('contraction-pro');
  const numStats = progress.games['number-sense'];
  if (numStats && numStats.bestScore >= 10) unlock('math-whiz');
  const reflexStats = progress.games['reflex-dots'];
  if (reflexStats && reflexStats.bestScore >= 15) unlock('quick-reflexes');

  // Streaks
  if (progress.streak.longestStreak >= 7) unlock('week-warrior');
  if (progress.streak.longestStreak >= 30) unlock('month-streak');

  // Mastery
  if (totalWins >= 50) unlock('fifty-wins');
  if (totalWins >= 100) unlock('hundred-wins');
  if (totalPlayed >= 100) unlock('hundred-games');

  // Advanced difficulty win
  const hasAdvancedWin = Object.values(progress.games).some((g) => g && g.difficultyStats.advanced.won > 0);
  if (hasAdvancedWin) unlock('advanced-player');

  // Meta: braille master
  if (progress.achievements.unlocked.length >= 20) unlock('braille-master');

  if (newlyUnlocked.length > 0) {
    saveProgress(progress);
  }

  return newlyUnlocked;
}

/** Get tier color */
export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#D4A853';
    case 'platinum':
      return '#E5E4E2';
  }
}
