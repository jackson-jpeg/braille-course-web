# Braille Course Web

## Overview

Next.js 14 App Router application for a braille learning course. TypeScript, Prisma 6 (PostgreSQL on Neon), Stripe payments, Vercel Blob file storage, Resend email, Anthropic AI content generation.

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in secrets
npm run db:push               # sync Prisma schema
npm run dev                   # http://localhost:3000
```

## Key Commands

| Command                | Purpose                         |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start dev server                |
| `npm run build`        | Prisma generate + Next.js build |
| `npm run lint`         | ESLint (next lint)              |
| `npm run format`       | Prettier write                  |
| `npm run format:check` | Prettier check                  |
| `npm run db:push`      | Push Prisma schema to DB        |
| `npm run db:seed`      | Seed database                   |
| `npm run db:studio`    | Open Prisma Studio              |

## Project Structure

```
app/                  # Next.js App Router pages + API routes
  api/                # Route handlers (admin/, checkout/, webhook/, cron/)
  admin/              # Admin dashboard page
  games/              # Interactive braille learning games
  summer/             # Summer enrollment + Stripe checkout
components/           # React components
  admin/              # Admin dashboard tabs, modals, utilities
hooks/                # Custom React hooks
lib/                  # Shared utilities, services, data maps
  prisma.ts           # Prisma client singleton
  admin-auth.ts       # HMAC session tokens
  stripe.ts           # Stripe server SDK
  stripe-client.ts    # Stripe client SDK
  progress-storage.ts # localStorage game progress
prisma/               # Schema + seed script
```

## Conventions

- **Imports**: Use `@/*` path alias (maps to project root)
- **Styling**: Global CSS in `app/globals.css` with CSS custom properties (design tokens in `:root`)
- **Components**: Client components use `'use client'` directive; server components are the default
- **API routes**: All admin routes check `isAuthorized(req)` from `lib/admin-auth.ts`
- **Database**: Prisma client via `lib/prisma.ts` singleton; always use `@prisma/client` imports for types
- **Error handling**: API routes return `{ error: string }` with appropriate status codes
- **Toast notifications**: Admin UI uses `useToast()` from `components/admin/AdminToast.tsx`

## Architecture Notes

- Admin auth uses HMAC-signed session tokens stored in cookies (24h expiry)
- File uploads go to Vercel Blob; metadata stored in Prisma `Material` model
- AI content generation streams through `/api/admin/generate` using Anthropic SDK
- Game progress is entirely client-side (localStorage), no server round-trips
- Stripe Embedded Checkout for payments; webhooks handle enrollment confirmation
- Rate limiting for admin login is in-memory (`lib/rate-limit.ts`) — resets on deploy; acceptable for admin-only endpoint

## Production database: never `db:push`

- **Do not run `npm run db:push` (or `prisma db push`) against production.** Production holds
  `Attendance_archive_2026`, `ClassSession_archive_2026`, `Enrollment_archive_2026` and `Grade_archive_2026`,
  which are not in `schema.prisma`; a push would drop them (checked 2026-10-15 with `prisma migrate diff`).
- To change the schema, generate the exact SQL for your change and apply only that:
  `prisma migrate diff --from-schema-datamodel <old schema> --to-schema-datamodel prisma/schema.prisma --script`,
  read it, then `prisma db execute --schema prisma/schema.prisma --file <that.sql>`.
- `AnalyticsEvent` (anonymous lesson and game events, `/api/track`, admin Learners tab) was added this way on
  2026-10-15.

## Domain and indexing

- **The apex `https://teachbraille.org` is the one home.** In the Vercel project, `www.teachbraille.org`
  redirects to it with a permanent 308, and the apex itself has no redirect (set 2026-10-15; before that the
  apex sent a temporary 307 to www while every canonical and the sitemap named the apex, and Google would not
  index). Canonicals, `app/sitemap.ts`, `app/robots.ts` and `metadataBase` all name the apex. Never flip this
  back to www.
- DNS is not on Vercel (nameservers `ns-cloud-b*.googledomains.com`), so search-engine verification uses meta
  tags in `app/layout.tsx` metadata (`verification`), not DNS records.
- Vercel Analytics drops `/admin` page views (`lib/analytics-filter.ts`).

## Braille accuracy (read before touching any braille content)

- **All braille comes from `lib/braille/`** (`ueb.ts` cells with ICEB rule citations, `transcribe.ts` print → uncontracted UEB, `prose.ts` generated dot descriptions). Never type a dot pattern, a Unicode braille character, or "dots N" prose anywhere else; `__tests__/braille/no-hardcoded-braille.test.ts` fails the build if you do.
- Draw cells only with `components/BrailleCell.tsx`, `BrailleDotPad.tsx` or `BrailleText.tsx`.
- Game logic lives in `lib/games/*.ts` with every question enumerated and tested, and a `brailleInventory()` registered in `lib/braille/site-inventory.ts`.
- After adding braille content run `npm run braille:oracle` (needs liblouis + python3-louis) and `npm test`. A liblouis disagreement can only be accepted via `lib/braille/discrepancies.ts` with a verified ICEB rulebook citation. Never loosen or skip a test.
- `npm run build` runs the whole test suite first, so Vercel will not deploy with a failing accuracy test.
- **No automatic CI**: GitHub Actions is manual-only (`workflow_dispatch`). Before every merge, run the local checklist in `docs/accuracy/HANDOFF.md` ("Before every merge"): oracle with a clean fixture diff, production build, browser geometry check and axe check. Do not trigger the workflow or enable Dependabot version updates unless the owner asks.
- Full method and history: `docs/accuracy/` (start with `HANDOFF.md` and `MIGRATION-BRIEF.md`).
