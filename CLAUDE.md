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
| `npm run format:check` | Prettier check (CI)             |
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
