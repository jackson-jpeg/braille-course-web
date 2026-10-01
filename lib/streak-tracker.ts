/**
 * Daily streak tracking utilities.
 */

import { loadProgress } from './progress-storage';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  freezesAvailable: number;
}

export function getStreakInfo(): StreakInfo {
  const progress = loadProgress();
  const { streak } = progress;
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    isActiveToday: streak.lastPlayedDate === today,
    freezesAvailable: streak.freezesAvailable,
  };
}

/** Get streak milestone message if applicable */
export function getStreakMilestone(streakCount: number): string | null {
  const milestones: Record<number, string> = {
    3: 'Three-day streak! Keep it up!',
    7: 'One week streak! Amazing dedication!',
    14: "Two weeks strong! You're on fire!",
    30: "Monthly streak! You're a braille champion!",
    50: 'Fifty days! Incredible commitment!',
    100: 'One hundred days! Legendary learner!',
  };
  return milestones[streakCount] || null;
}
