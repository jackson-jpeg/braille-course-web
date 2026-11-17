# Next (updated 2026-11-17)

In order. The latest session handoff is `docs/handoffs/2026-11-17-session.md`.

0. **Build `/world-braille-day` on a branch, preview only** (lead, on Jackson's behalf, 2026-11-17). Scope:
   `docs/outreach/2026-11-17/JANUARY-PAGE-PLAN.md`. Branch `world-braille-day` off `master`; push the branch so
   Vercel builds a preview, and give the preview link. **Do not merge to `master` or go live**: that waits on
   Jackson's OK. Do not open a PR without asking (PRs email Jackson). Items, one commit each:
   1. Page shell at `app/world-braille-day/page.tsx`: what the day is (three sentences, Delaney may rewrite), metadata,
      not yet in `app/sitemap.ts` or linked from the home page (both wait for go-live).
   2. "Write your name in braille": a small client component using `lib/braille/transcribe.ts` and `BrailleText` /
      `BrailleCell`; shows dot numbers per letter; refuses and clearly marks characters it cannot write; sends and
      counts nothing typed. Register its braille in `lib/braille/site-inventory.ts`; unit tests for the name box.
   3. Printable name card: a print stylesheet for the same name on one sheet, with the note that printed dots are for
      sighted study, not touch reading.
   4. Classroom paths: ten minutes (Braille Cell lesson plus one game), thirty minutes (letters a to j plus two games),
      one week (the first four lessons), linking existing `/learn` and `/games` pages; a short "For teachers" section
      and "Take it with you" (the app and Delaney's lessons).
   5. Checks before pushing the branch: format, lint, tsc, `npm run braille:oracle` with a clean fixture diff,
      `NODE_ENV=production npm run build`, local server plus `braille:geometry` and `a11y:axe` with the new page
      added to their page lists. No em dashes; no decorative graphics or new colours.
1. **When Apple approves iOS 1.1**, on the Mac (`source ~/.sanger-build/secrets.env && cd ~/teachbraille-ios`):
   `TB_VERSION=1.1.1 ruby scripts/asc/asc-store.rb newversion`, `build 202611170158`, `whatsnew`, `notes`,
   `autorelease`, `attach ~/Downloads/TeachBraille-iOS/review-recording/TeachBraille-App-Review-1.1.1.mp4`. Then
   `submit` only on Jackson's word, given in the session that runs it. Details: `teachbraille-ios/docs/1.1.1/HANDOFF.md`.
2. **If Jackson approves the January page** (Inbox `teachbraille-outreach-jan`): build `/world-braille-day` as scoped
   in `docs/outreach/2026-11-17/JANUARY-PAGE-PLAN.md`; live by December 15. Run the full pre-merge checklist in
   `docs/accuracy/HANDOFF.md`.
3. **Optional**: iPad audit and layout checks for 1.1.1 on a temporary iPad simulator, when the Mac has room.
4. **Optional, needs a request first**: the website's Word Game is 50 px too tall to show board and keyboard together
   at 320 by 568 (fits at 375 by 667 and up). Not changed.
