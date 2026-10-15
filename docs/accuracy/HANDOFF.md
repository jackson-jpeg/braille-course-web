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
| `lib/braille/terminology.ts`, `labels.ts`                                                 | Superseded (EBAE) terms and other-code names the site must never use; the rule that a plain letter cell is never captioned with an uppercase letter.                                                                   |
| `lib/ai-content-sanitizer.ts`, `lib/worksheet-braille.ts`                                 | AI-generated admin documents: the wall between the model and the document, and worksheet braille in the right grade.                                                                                                   |
| `lib/word-blocklist.ts`                                                                   | Family-site blocklist for every word list (`isBlockedWord` also catches inflections).                                                                                                                                  |
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
| `npm test` / `npm run test:accuracy`                                                | Whole suite (≈1,680 tests)                                                        | node 22                                                             |
| `npm run braille:oracle`                                                            | Regenerate `__tests__/fixtures/liblouis-oracle.json` after adding braille content | liblouis + python3-louis (`apt install liblouis-bin python3-louis`) |
| `npm run braille:rulebook`                                                          | Re-extract rulebook tables and verify cited examples                              | poppler-utils (`pdftotext`), internet                               |
| `npm run build`                                                                     | Runs the accuracy suite, then Prisma + Next build (what Vercel runs)              |                                                                     |
| `npm run start -- -p 3100` then `npm run braille:geometry -- http://localhost:3100` | Real-browser check at 1280/390/320px: dot positions, captions, wording, overflow  | Playwright Chromium                                                 |
| (server running) `npm run a11y:axe -- http://localhost:3100`                        | axe-core (WCAG 2.2 A/AA) on every lesson and game page                            | Playwright Chromium                                                 |
| `npx tsx scripts/braille/verification-report.ts <geometry-log>`                     | Regenerate `docs/accuracy/VERIFICATION-RESULTS.md`                                |                                                                     |

**Machines.** Jackson's normal setup is a VPS (source of truth, see `jackson-jpeg/vps-tools`) that syncs
one way to a MacBook. This session ran in an Anthropic cloud container that cannot reach either, so
nothing was run on the VPS or Mac. All commands above run on any Linux machine with the listed tools.
On the VPS use the repo path `/root/braille-course-web`. Don't run `npm install` in a production tree
there (a vps-tools hook blocks it).

## Deploy

Vercel builds production from `master` (git integration; no Vercel CLI or token was available). Merging
to `master` deploys. `npm run build` runs the full accuracy suite first, so a failing or skipped test stops
the deploy. Everything else (oracle regeneration, browser checks, axe) is run by the session before each
merge: see "Before every merge" below.

Vercel builds with `NODE_ENV=production`. React refuses `act()` in production builds, so
`test:accuracy` forces `NODE_ENV=test` for jest; the local checklist builds with `NODE_ENV=production` to
catch this. (The first production deploy of this work failed for exactly this reason and was fixed in a
follow-up PR.)

## Before every merge (required: there is no automatic CI)

GitHub Actions is manual-only on this repo (the owner does not pay for Actions). `.github/workflows/braille-accuracy.yml`
runs only from Actions → Run workflow; nothing runs on push or pull request. The Vercel build still runs the
full accuracy suite, so a failing test cannot reach production, but these checks run nowhere unless the
session runs them. Run all of them locally before merging any PR, and report the results in the PR:

1. `npm run format:check`, `npm run lint`, `npx tsc --noEmit -p .`
2. `npm run braille:oracle`, then `git diff --exit-code -- __tests__/fixtures/liblouis-oracle.json` (needs
   `liblouis-bin python3-louis`). A changed fixture must be committed only if the change is explained.
3. `npm run braille:rulebook` when rulebook data or citations changed (needs `poppler-utils`).
4. `NODE_ENV=production npm run build` (runs the whole jest suite first, as Vercel does).
5. `npm run start -- -p 3100`, then against `http://localhost:3100`:
   - `npm run braille:geometry -- http://localhost:3100` (dot positions, captions, wording, overflow at
     1280/390/320px): must report 0 problems;
   - `npm run a11y:axe -- http://localhost:3100` (axe-core, every lesson and game page): must report 0
     violations.
6. After the merge deploys, run the same two browser checks against `https://teachbraille.org`.

Do not trigger the GitHub workflow unless the owner asks. Dependabot version updates are off (no
`.github/dependabot.yml`); keep it that way.

## How to add or change braille content safely

1. Never type a cell, a braille character, or "dots N" prose. Use `lib/braille` (see `MIGRATION-BRIEF.md`).
2. Put game logic in `lib/games/<game>.ts` with `brailleInventory()` listing every string with the cells
   the component actually draws; register it in `lib/braille/site-inventory.ts`.
3. Run `npm run braille:oracle`, then `npm test`. If liblouis disagrees, the site is probably wrong. Only
   if the ICEB rulebook supports the site: add a citation to `__tests__/fixtures/iceb-rulebook-examples.json`
   ("citations"), verify it with `npm run braille:rulebook`, and add an entry to `lib/braille/discrepancies.ts`.
   Never loosen or skip a test.
4. Enumerate every question in a game test (see `__tests__/games/new-games-logic.test.ts`).

## AI-generated admin documents (how braille is kept out of the model's hands)

The admin "Create" tab asks Claude for slides, handouts, study guides, worksheets and quizzes. The model
is never trusted with braille:

1. The prompt (`lib/ai-braille-reference.ts`) contains no dot numbers at all (tested). It lists sign ids
   and tells the model to write tokens such as `{dots:numeric}` or `{letter:b}`, and to give braille
   worksheet items only a `print` field.
2. `sanitizeGeneratedContent` (`lib/ai-content-sanitizer.ts`) runs on the model output and again when
   the admin builds the documents. It removes sentences with Unicode braille, other codes (Nemeth, EBAE)
   or dot numbers it cannot tie to a sign (including 7/8-dot, "dot-6", "dots one and four",
   "positions 1 and 4"); regenerates claims it can tie to a sign from `lib/braille`; renames superseded
   terms; and rejects unknown tokens. It is idempotent: drafts store tokens; documents render them.
3. Braille worksheet items are rebuilt from `print`: the site writes the prompt, draws the cells and
   writes the answer. The grade follows the admin difficulty (beginner: uncontracted; intermediate and
   advanced: contracted). Contracted words come only from lists verified with liblouis en-ueb-g2
   (Contraction Sprint words, plus 3,389 everyday words whose contracted form equals the uncontracted
   one, `lib/braille/data/plain-contracted-words.json`); anything else is dropped, not guessed.
4. `__tests__/admin-braille/ai-sanitizer.test.ts` feeds adversarial output through the real PDF/PPTX
   builders (recorded) and proves none of it reaches a document.

To refresh the everyday-word list: `npx tsx scripts/braille/dump-candidate-words.ts | python3
scripts/braille/plain-contracted-words.py`, then `npm run braille:oracle`.

## Vercel deployments

- **Only `master` deploys.** `vercel.json` sets `git.deploymentEnabled` to `{ "**": false, "master": true }`
  (if any matching rule is `true`, Vercel deploys), so branch pushes build no preview. Verify changes
  locally with the "Before every merge" checklist instead. `github.silent: true` stops Vercel bot comments.
- **Why previews were turned off.** Every preview failed about a second after it was created because the
  Preview copy of `CRON_SECRET` in the Vercel dashboard has leading or trailing whitespace (Vercel's own
  email). It was not the commit author, as an earlier version of this file said. The owner chose not to
  edit the dashboard. `lib/cron-auth.ts` trims the secret and the bearer token.
- If previews are ever wanted again: first remove the whitespace from the Preview `CRON_SECRET`, then
  drop the `"**": false` rule.
- Vercel's deployment statuses on GitHub went quiet for part of October 12. Confirm a deploy with the
  deployments API, and with the browser checks run against https://teachbraille.org.

## State at handoff

- All work is merged to `master` (PRs #5–#10); merged branches are deleted, so start new work on a fresh
  branch from `master`. Commits are authored as `jackson-jpeg <realjacksons@gmail.com>` (repo-local git
  config).
- All tests pass, none skipped. Numbers are in `VERIFICATION-RESULTS.md`.
- The previous attempt (PR #3, a full redesign) was reverted by the owner in PR #4, and its branches
  (`redesign-oct-2026`, `ccr-0ffb0bff-cn67bc`) were deleted at the owner's request. **This work
  deliberately keeps the current (pre-redesign) design.**

## Open items / ideas (none block accuracy)

- **Slate and stylus**: no game writes with a slate, so mirror writing is untested in practice
  (`mirrorCell` exists and is unit-tested). Add tests if a slate mode is built.
- **Contracted coverage**: only the main one-cell contractions are taught. Initial-letter and final-letter
  contractions and shortforms are not; adding them means extending `CONTRACTIONS` and the rulebook tests.
  The AI worksheet builder drops a contracted word it cannot verify, so it can only draw words from the
  verified lists.
- **Typeform indicators** (italic, bold, underline) are in the data and the AI reference but not taught.

Resolved in the October 12 cleanup pass: Word Game keyboard at 320px (now checked at 320/390/1280 on
every page), unused Contraction Sprint / Sentence Decoder difficulty parameters, admin worksheets now draw
word answers in the worksheet's grade, family-site blocklist test, axe-core check (run locally before each merge; Actions is manual-only).
