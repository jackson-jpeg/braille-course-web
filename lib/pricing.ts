/**
 * Single source of truth for course pricing displayed across the site.
 * The checkout API also reads from CourseSettings DB for dynamic overrides,
 * but these constants are used for all static/marketing pages and components.
 *
 * To change pricing: update these values, then redeploy.
 */

export const PRICING = {
  /** Total course cost */
  full: 500,
  /** Deposit amount */
  deposit: 150,
  /** Remaining balance after deposit (computed) */
  balance: 500 - 150,
  /** Date the balance is charged (display string) */
  balanceDueDate: 'May 1st',
  /** Course start date (display string) */
  courseStartDate: 'June 7',
  /** Course date range */
  courseDates: 'June 7 – July 30, 2027',
  /** Total sessions */
  totalSessions: 15,
  /** Course duration */
  courseDuration: '8-week',
} as const;

/** Format a number as a dollar amount (no cents) */
export function formatPrice(amount: number): string {
  return `$${amount}`;
}
