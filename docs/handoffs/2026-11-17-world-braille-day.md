# Handoff, 2026-11-17: `/world-braille-day` on a branch (not live)

Asked by the lead on Jackson's behalf: build the page scoped in `docs/outreach/2026-11-17/JANUARY-PAGE-PLAN.md` on a
branch with a preview, not live. Live waits on Jackson. No PR opened (PRs email Jackson).

## Where it is

- Branch `world-braille-day`, pushed (3 commits on `de00805`): `6b9361c` name box, card and paths; `3c538bf` styles
  and print stylesheet; `45b0b1b` geometry and axe page lists.
- Worktree `/root/braille-course-web-wbd` holds **uncommitted** work (below). Keep the worktree until it is committed.

## What the page is

`app/world-braille-day/page.tsx`, `components/NameInBraille.tsx`, `lib/world-braille-day.ts`,
`__tests__/site/world-braille-day.test.tsx`.

- What the day is: three sentences, a draft for Delaney to rewrite.
- Write your name in braille: uncontracted UEB through `lib/braille/transcribe.ts`; letters, spaces, hyphens and
  apostrophes only. Anything else (accents, digits, other punctuation) shows no braille and the character is marked
  and named. Nothing typed is sent, stored or put in the URL (tested). Dot rows from `describeCells`.
- Printable card: same name, one sheet; the note that printed dots are flat and not for touch reading. Printing
  shows only the card.
- Paths: ten minutes (Braille Cell lesson, Dot Explorer); thirty (Letters a to j, Speed Match, Memory Match, names);
  one week (lessons 1 to 4 Monday to Thursday; Friday Hangman and name cards). Lesson titles come from the
  curriculum; game anchors are tested against `app/games/page.tsx`.
- For teachers, and Take it with you (App Store id6833681749, checked live and free; `/services`).
- 15 sample names plus the hero word "world braille day" are in the site inventory (`page:world-braille-day`).
- Not in `app/sitemap.ts`, not linked from the home page. Both are go-live steps.

## Checks run on the pushed commits

- format, lint (no new warnings), tsc: clean.
- `npm run braille:oracle`: fixture gains exactly the 16 new strings, no existing entry changed (committed).
- `NODE_ENV=production npm run build`: 46 suites, 1913 tests passed; page prerendered static.
- `braille:geometry` on a local production server: 2954 cells, 0 problems. `a11y:axe`: 0 violations (page included
  at 1280 and 390).

## Found by looking, fixed but not yet verified (uncommitted in the worktree)

Screenshots showed a long single word (for example "Mary-Jane", 11 cells) runs past the printed card's edge, and
would run past a phone screen too: braille words never wrap (`.braille-text-word` is nowrap) and the checks only
saw the default name "Louis". The fix sizes the dots from the longest word (`--wbd-cells`, container query units),
between a floor and the old size, with an `overflow-x: auto` box as the last resort, on screen and in print (print:
3 to 7 mm). Plus a test that the variable is set.

**Not run on the fix**: the rebuild was stopped by Claude Code for low box memory while it was still queued for
`heavy` (1.7 GB available at 16:10 UTC). To finish: in the worktree run, through `heavy`, prettier check, tsc,
lint, `NODE_ENV=production npm run build`, then `npx next start -p 3190 -H 127.0.0.1` and `braille:geometry` /
`a11y:axe` against it, then the capture script (`scripts` were not changed for it; it lived in the session
scratchpad: desktop, phone with long names measuring page and row overflow, and the print PDF). Commit, push.

## Preview

Vercel builds only `master` (`vercel.json`, the owner's choice because of the Preview `CRON_SECRET` whitespace), so a
branch push makes no preview link. Not changed. The plan is a private review page of screenshots and the print PDF
once the fix is verified.

## Open for Delaney or Jackson (from the plan)

Go or no go; the address (`/world-braille-day` built); Delaney's own "what the day is" paragraph; whether to mention
her paid lessons (one line linking `/services` is in, easy to drop); an alphabet sheet as well as the name card.

## Blocks hit

- `require-pipefail` refused a `heavy -- bash -c '... | tail'`; ran it with output to a file instead.
- Auto mode could not review one read-only Bash call the pipefail hook rewrote; reissued as instructed, it ran.

## At context clear (16:15 UTC)

- Nothing running: the local server on 3190 is stopped; no job holds or waits for `heavy`; no browser left open.
- In flight: only the uncommitted fit fix in `/root/braille-course-web-wbd` (3 files: `components/NameInBraille.tsx`,
  `app/globals.css`, `__tests__/site/world-braille-day.test.tsx`). Start there; `docs/NEXT.md` item 0 lists the steps.
- The worktree's `.next` may hold a partial build; the next `npm run build` replaces it.

## Second session (16:15 to 17:00 UTC)

- The fit fix is verified and pushed: `18ea5ad` on `world-braille-day`. All through `heavy`: prettier, tsc, the page
  test (94), lint (no new warnings), `NODE_ENV=production npm run build` (46 suites, 1914 tests), then on a local
  production server `braille:geometry` (2956 cells, 0 problems) and `a11y:axe` (0 violations).
- **Not done: the review captures.** First run failed because `playwright` does not resolve from the scratchpad;
  the rerun from inside the worktree was stopped by Claude Code for low box memory (about 1 GB available, other
  projects' jobs in both `heavy` slots). Nothing was captured. Next: when memory allows, in the worktree start
  `npx next start -p 3190 -H 127.0.0.1` (the `.next` there is the verified build of `18ea5ad`), copy
  `docs/handoffs/2026-11-17-wbd-capture.mjs` into the worktree, run it through `heavy` with the server URL and an
  output folder, read the logged page and row overflow for the long names, look at every image and the PDF, then
  publish the review page and link it to the lead. Stop the server and delete the copied script afterwards.
- The worktree `/root/braille-course-web-wbd` is clean (everything pushed) and is kept only for the captures; remove
  it with `git worktree remove` after them.
- Left running: nothing. The server on 3190 is stopped; no `heavy` job of ours holds or waits.
- Blocks hit: `require-pipefail` refused `ssh macbook "df -h / | tail -1"` (pipeline in a remote command); reran it without the pipe. Two background jobs were stopped by Claude Code for memory pressure (this capture, and last
  session's build).
