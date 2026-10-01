# Human queue — things only a person can do

_Session: 2026-10-01. Ordered by urgency. Each item says who, where to click, and why._

## 1. Check for 2027 deposits already taken (Jackson or Delaney · 5 minutes · important)

A previous session (July 24, 2026) relaunched /summer as "Summer 2027, June 7 – July 30, 2027" with $500 / $150 deposit
enrollment open. Those dates were never confirmed by Delaney. Enrollment is now hidden, but anyone who paid since July
is real money and a real family.

- Click path: **teachbraille.org/admin → Students** (filter: Enrolled) and **Stripe Dashboard → Payments** (since Jul 24, 2026).
- If there are any: email those families before anything else. Note the daily cron **finalize-balance** will try to
  charge deposit balances on the balance due date stored in **Admin → Settings** (default `2027-05-01`).
- If there are none: nothing to do.

## 2. Delaney: one review pass of new teaching content (~45 minutes)

See `DELANEY-CONTENT-REVIEW.md` in this folder. Everything is live but flagged as "pending Delaney". The most
important items are the words written in her voice (lesson 12 note, courses page quote) and the stats on /intro.

## 3. When the next live course has real dates (Delaney decides; Claude can do the code)

Public enrollment is hidden until a cohort is configured. To open it, give a future session (or a developer):
the course name, dates, the two schedule slots, tuition and deposit. Then they:

1. Fill `NEXT_COHORT` in `lib/cohort.ts`.
2. Update `lib/pricing.ts` (it still holds the unconfirmed 2027 dates used by the confirmation email) and
   **Admin → Settings** (course dates, balance due date, prices).
3. Confirm the Stripe price IDs in Vercel env (`STRIPE_PRICE_FULL`, `STRIPE_PRICE_DEPOSIT`) match the tuition.
4. Create the sections in Admin, deploy.

Until then /courses collects an interest list. Sign-ups land in **Admin → Students → Leads** with subject
"Waitlist Request" (same endpoint and storage as before).

## 4. Legal text (Delaney / Frankly the Best Education, LLC)

- /policies → Privacy: only mentions emails collected via Stripe; the contact, appointment and school forms collect
  name, phone and school details. Consider updating.
- /policies → Refunds still names "May 1st" and "June 7" (from `lib/pricing.ts`). Fine for past enrollments; revisit
  with the next cohort.
- A new short section "#game-progress" says lesson/game progress stays in the browser. Please approve.

## 5. Nice to have (no deadline)

- Want an email when someone joins the course interest list? Today it only appears in Admin. (A future session can add a
  Resend notification to `/api/waitlist-signup`.)
- Transactional emails (`lib/email-templates.ts`) still use the old navy/gold look.
