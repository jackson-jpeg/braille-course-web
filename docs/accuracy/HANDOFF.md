# Session handoff: teachbraille.org braille accuracy work (October 2026)

Everything another session needs to continue, with no prior context.

## What this is

teachbraille.org teaches Unified English Braille (UEB) to sighted parents and family of blind and low
vision children. It is run by Delaney Costello, a Teacher of the Visually Impaired (TVI). It has free
lessons (`/learn`) and practice games (`/games`) with no signup. Repo: `jackson-jpeg/braille-course-web`
(Next.js 14 App Router, TypeScript, Prisma/Neon, Stripe, Vercel). Owner: Jackson (realjacksons@gmail.com).

**Mission of this work**: every braille pattern, explanation and game answer is provably correct, and
the basics (capitals, numbers, punctuation) are taught. Accuracy over everything; Delaney is not
available to review, so the code proves its own correctness.

## Where things are

| Path                                                                                      | What                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/braille/ueb.ts`                                                                      | **The only definition of braille cells.** Letters, digits, indicators (capitals, numeric, grade 1, typeforms), punctuation, symbols, contractions, each with its ICEB rule. Unicode conversion, `dotPosition`, mirror. |
| `lib/braille/transcribe.ts`                                                               | Print → uncontracted UEB, cell by cell (`transcribe`, `transcribeTokens`). Throws `TranscriptionError` rather than guess.                                                                                              |
| `lib/braille/prose.ts`                                                                    | Generated prose: `describeCell(s)`, `renderProse('{dots:numeric}')`, data-derived `FACTS`.                                                                                                                             |
| `lib/braille/contracted.ts`                                                               | `contractedWord('bath', ['b','a','th'])` for grade 2 content.                                                                                                                                                          |
| `lib/braille/perkins.ts`                                                                  | Perkins / six-key layout, chord reader.                                                                                                                                                                                |
| `lib/braille/shared.ts`                                                                   | Which signs share a cell.                                                                                                                                                                                              |
| `lib/braille/inventory.ts`, `site-inventory.ts`                                           | Every string the site shows as braille (fed to liblouis). Register new content modules in `site-inventory.ts`.                                                                                                         |
| `lib/braille/discrepancies.ts`                                                            | The only place a liblouis disagreement may be accepted (needs a verified rulebook citation).                                                                                                                           |
| `lib/games/*.ts`                                                                          | Pure game logic per game: question enumeration, `isCorrect`, `brailleInventory`.                                                                                                                                       |
| `lib/course-curriculum.ts`                                                                | The 18 lessons (templates rendered with `renderProse`).                                                                                                                                                                |
| `components/BrailleCell.tsx`, `BrailleDotPad.tsx`, `BrailleText.tsx`                      | The only components that draw dots.                                                                                                                                                                                    |
| `components/games/ChoiceGame.tsx`                                                         | Shell for Capital Quest, Number Lock, Punctuation Detective.                                                                                                                                                           |
| `scripts/braille/`                                                                        | liblouis oracle, rulebook extraction/verification, Unicode names, real-browser geometry, report generator.                                                                                                             |
| `__tests__/braille/`, `__tests__/games/`, `__tests__/course/`, `__tests__/admin-braille/` | The accuracy suite.                                                                                                                                                                                                    |
| `docs/accuracy/`                                                                          | Audit, verification, discrepancy reports; this file; `MIGRATION-BRIEF.md` (rules for anyone editing braille content).                                                                                                  |

## Commands (run in the repo; the original work ran in a Claude Code cloud container)

| Command                                                                             | Purpose                                                                           | Needs                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm test` / `npm run test:accuracy`                                                | Whole suite (≈1,580 tests)                                                        | node 22                                                             |
| `npm run braille:oracle`                                                            | Regenerate `__tests__/fixtures/liblouis-oracle.json` after adding braille content | liblouis + python3-louis (`apt install liblouis-bin python3-louis`) |
| `npm run braille:rulebook`                                                          | Re-extract rulebook tables and verify cited examples                              | poppler-utils (`pdftotext`), internet                               |
| `npm run build`                                                                     | Runs the accuracy suite, then Prisma + Next build (what Vercel runs)              |                                                                     |
| `npm run start -- -p 3100` then `npm run braille:geometry -- http://localhost:3100` | Real-browser dot-position check                                                   | Playwright Chromium                                                 |
| `npx tsx scripts/braille/verification-report.ts <geometry-log>`                     | Regenerate `docs/accuracy/VERIFICATION-RESULTS.md`                                |                                                                     |

**Machines.** Jackson's normal setup is a VPS (source of truth, see `jackson-jpeg/vps-tools`) that syncs
one way to a MacBook. This session ran in an Anthropic cloud container that cannot reach either, so
nothing was run on the VPS or Mac. All commands above run on any Linux machine with the listed tools.
On the VPS use the repo path `/root/braille-course-web`. Don't run `npm install` in a production tree
there (a vps-tools hook blocks it).

## Deploy

Vercel builds production from `master` (git integration; no Vercel CLI or token was available). Merging
to `master` deploys. `npm run build` runs the full accuracy suite first, so a failing or skipped test stops
the deploy. GitHub Actions (`.github/workflows/braille-accuracy.yml`) also regenerates the oracle with a
fresh liblouis and runs the browser geometry check.

Vercel builds with `NODE_ENV=production`. React refuses `act()` in production builds, so
`test:accuracy` forces `NODE_ENV=test` for jest; CI also builds with `NODE_ENV=production` to catch
this. (The first production deploy of this work failed for exactly this reason and was fixed in a
follow-up PR.)

## How to add or change braille content safely

1. Never type a cell, a braille character, or "dots N" prose. Use `lib/braille` (see `MIGRATION-BRIEF.md`).
2. Put game logic in `lib/games/<game>.ts` with `brailleInventory()` listing every string with the cells
   the component actually draws; register it in `lib/braille/site-inventory.ts`.
3. Run `npm run braille:oracle`, then `npm test`. If liblouis disagrees, the site is probably wrong. Only
   if the ICEB rulebook supports the site: add a citation to `__tests__/fixtures/iceb-rulebook-examples.json`
   ("citations"), verify it with `npm run braille:rulebook`, and add an entry to `lib/braille/discrepancies.ts`.
   Never loosen or skip a test.
4. Enumerate every question in a game test (see `__tests__/games/new-games-logic.test.ts`).

## State at handoff

- Branch `claude/teachbraille-accuracy-audit-j6y95w`, merged to `master` through one PR (see the final
  message of the session for the PR link and the live check).
- All tests pass, none skipped. Numbers are in `VERIFICATION-RESULTS.md`.
- The previous attempt (PR #3, a full redesign) was reverted by the owner in PR #4; its branch
  `redesign-oct-2026` still exists. **This work deliberately keeps the current (pre-redesign) design.**

## Open items / ideas (none block accuracy)

- **Slate and stylus**: no game writes with a slate, so mirror writing is untested in practice
  (`mirrorCell` exists and is unit-tested). Add tests if a slate mode is built.
- **Word Game keyboard at 320px**: the braille key row overflows on the narrowest phones (390px and up
  are fine). Probably pre-existing; layout only.
- **Contracted coverage**: only the main one-cell contractions are taught. Initial-letter and final-letter
  contractions and shortforms are not; adding them means extending `CONTRACTIONS` and the rulebook tests.
- **Typeform indicators** (italic, bold, underline) are in the data and the AI reference but not taught.
- `lib/difficulty-settings.ts` still has unused parameters for Contraction Sprint and Sentence Decoder
  (their levels now live in `lib/games/*`).
- Admin PDF worksheets no longer draw braille for word answers (it differs between grades); passing the
  worksheet's grade through would let them draw the right form.
