/**
 * The next live course cohort. While this is null, /courses is evergreen: it describes the course
 * and collects an interest list, and public enrollment (the Stripe checkout form) is hidden.
 *
 * To open enrollment for a new cohort (needs Delaney's real dates and prices — never guess):
 *   1. Fill in NEXT_COHORT below.
 *   2. Update lib/pricing.ts and Admin → Settings (course dates, balance due date, prices) to match.
 *   3. Check the Stripe price IDs (STRIPE_PRICE_FULL / STRIPE_PRICE_DEPOSIT) match the prices.
 *   4. Create the sections in Admin, then deploy.
 */
export interface Cohort {
  /** e.g. "Summer 2027" */
  name: string;
  /** Human-readable dates, e.g. "June 7 – July 30, 2027" */
  dates: string;
  /** ISO dates for structured data */
  startDate: string;
  endDate: string;
  /** e.g. ["Mon & Wed, 1–2 PM ET", "Tue & Thu, 4–5 PM ET"] */
  schedules: string[];
}

export const NEXT_COHORT: Cohort | null = null;
