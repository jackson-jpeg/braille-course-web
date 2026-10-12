# teachbraille.org cleanup pass: what changed (October 12, 2026)

All five items went into one pull request:
[jackson-jpeg/braille-course-web#7](https://github.com/jackson-jpeg/braille-course-web/pull/7).
The updated session handoff is `HANDOFF.md` in this folder (the same file as `docs/accuracy/HANDOFF.md`).

## 1. Vercel previews

- **Commit author.** Every earlier branch commit was authored by `Claude <noreply@anthropic.com>`. The repo's
  git identity is now `jackson-jpeg <realjacksons@gmail.com>`, and every commit in this pass is authored as you.
- **Config.** `vercel.json` has only `framework` and `crons`. There is no `ignoreCommand`, no
  `git.deploymentEnabled`, no `.vercelignore` and no `vercel` key in `package.json`. Nothing in the repo
  turns preview deployments off.
- **What Vercel did.**

  | Commit                                      | Author       | What GitHub shows from Vercel                                             |
  | ------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
  | 5eb9923, 6e64a50, 454b557, 20eef64, c9fb796 | Claude       | A deployment that failed about 1 s after it was created (no build)        |
  | ed3ed16, 36bf471 (merges of #5, #6)         | Jackson      | Production deployment (#5 failed on `act()`, #6 succeeded)                |
  | 859126d, 197f3ad, bdf5469 (branch, PR #7)   | jackson-jpeg | Nothing: no deployment, no status, no bot comment on the PR               |
  | f44c30c (merge of #7)                       | Jackson      | Nothing on GitHub, **but the site is live**: production serves this build |

- **What the evidence shows.**
  - The one-second failures on the Claude-authored pushes are how Vercel rejects a commit author who is not
    on the team, so your theory fits them, and authoring commits as you removes that cause.
  - Since about 04:13 UTC today, though, Vercel has stopped reporting anything to GitHub. The merge of #7
    has no GitHub deployment or status at all, yet www.teachbraille.org serves its CSS and passes its
    checks. So Vercel is building but no longer posting deployments and statuses to GitHub.
  - That means previews for the branch may well have built too, unreported. Their URLs are hashed for a
    branch name this long, and the project's vercel.app URL needs a Vercel login, so this session cannot
    confirm either way.
- **What to check** in the Vercel dashboard (this session cannot reach it):
  - Project → Deployments, filtered to branch `claude/teachbraille-accuracy-audit-j6y95w`: are there preview
    builds for 197f3ad / bdf5469?
  - Project → Settings → Git: preview deployments enabled for other branches, and the GitHub connection
    (deployment statuses / PR comments) still connected.
  - Project → Settings → Build and Deployment: no Ignored Build Step.

## 2. AI worksheet generator: the model never writes braille

- **What the model writes.** Print and tokens only (`{dots:numeric}`, `{letter:b}`). The prompt
  (`lib/ai-braille-reference.ts`) now contains no dot numbers at all, which is tested. Admin presets give it
  tokens instead of dots.
- **Braille worksheet items.** Each item carries only `print`. The site writes the prompt, draws the cells
  and writes the answer.
- **Grade.** It follows the admin difficulty: beginner is uncontracted; intermediate and advanced are
  contracted.
- **Contracted words.** They come only from lists verified with liblouis en-ueb-g2:
  - the Contraction Sprint words;
  - 3,389 everyday words written the same in both grades.

  A word the site cannot verify is dropped, never guessed. Every contracted form the builder can draw
  (letters, capitals and words) is in the liblouis oracle, which agrees on all of them.

- **What `lib/ai-content-sanitizer.ts` does.** It runs on the model's output and again when the documents
  are built, so admin edits are checked too. It:
  - removes sentences that contain Unicode braille, Nemeth or EBAE, or dot numbers it cannot tie to a sign.
    That includes dots 7 and 8, "dot-6", "dots one and four" and "positions 1 and 4".
  - regenerates claims about a named sign from `lib/braille` ("the letter B is dots 1 4" becomes the
    correct dots);
  - renames superseded terms;
  - drops unknown tokens.
- **Tests.** `__tests__/admin-braille/ai-sanitizer.test.ts` feeds adversarial model output through the real
  PDF and PPTX builders, recording every drawn cell and every line of text. The inputs include wrong dots,
  EBAE terms, Nemeth, made-up cells, 8-dot claims, braille characters, fake tokens and wrong worksheet answers.
  - Every drawn cell is the generated braille of an item's print.
  - Every dot phrase in the output is canonical and true.
  - None of the adversarial input survives.
- **Bug found and fixed.** Writing these tests caught one: "the letter b is dots 1 2 7" used to keep a
  stray "7".
- **Review screen.** Braille items now show a print field and a live preview of the generated cells. The
  change list now explains what was regenerated or removed.

## 3. Intro digit chart and the terminology ban

- **The chart.** `components/BrailleNumbers.tsx` was already fixed. It says "numeric indicator" and labels
  digits with lowercase letters ("1 (a)").
- **New `lib/braille/terminology.ts`.** One list of superseded terms: "number indicator", "number sign"
  (unless it is about #), "letter sign", "letter indicator", "numeral sign" and "double capital". It also
  names the other braille codes. The sanitizer, the claim validator and the lint test all use it.
- **The lint test** now fails the build on any of those terms, and on "1(A)"-style digit/uppercase pairs,
  anywhere in the site source.
- **Bug found and fixed.** The lint test caught one: the old term regex would have rewritten the correct
  UEB name "capital letter indicator".
- **New `lib/braille/labels.ts`.** A plain letter cell may not be captioned with an uppercase letter.
  - It is checked on every drawn cell, in the jsdom rendering tests and in Chromium on every page at three
    widths.
  - It found real cases: lesson captions under letters ("A" under the cell for a, after the capital
    indicator), and the admin inline preview ("B" on the b cell). Both now use lowercase captions.
  - Letter sign names are now lowercase ("letter a").
- **The real-browser check** also fails if visible page text uses a superseded term.
- **Preset rename.** The admin preset "Number Signs" is now "Numbers & Math".

## 4. Leftovers

- **a. Word Game keyboard.** The bottom row was 338 px wide on a 320 px screen; it now fits. Keys stay
  at least 24 px. The real-browser check runs every page at **1280, 390 and 320 px**. It now also fails on
  any sideways overflow.
- **b. Difficulty parameters.** Removed the unused Contraction Sprint and Sentence Decoder parameters from
  `lib/difficulty-settings.ts`.
- **c. Family-site words.** `lib/word-blocklist.ts` now has `isBlockedWord`, which also catches inflections
  (kills, hated, stabbed).
  - **Test.** `__tests__/games/word-blocklist.test.ts` checks the Word Game answers and guesses, the
    Hangman words, the contraction words, the hero words, the worksheet word list, and every word of every
    braille string on the site. It confirms slave, bomb, drunk and jerk are on the blocklist and in none of
    those lists.
  - **Removed in this pass:** beer, bomb, boob, butt, crap, damn, dead, dick, died, drug, dumb, fats, gore,
    guns, hate, hell, hoed, kill, lame, nude, nuke, pimp, piss, rape, sext, sexy, slay, stab, tits, turd,
    ugly, wars, wine, knife, rifle, shoot.

## 5. Accessibility

- **The check.** `scripts/a11y/check-axe.mjs` (`npm run a11y:axe`) runs axe-core with the WCAG 2.0/2.1/2.2
  A and AA rules. It covers the home page, the intro, the lesson index, every lesson, and the games page
  with every game mounted, at 1280 and 390 px. It runs in CI after the real-browser check.
- **Before: 71 violations.** All are fixed:
  - **Colour contrast.** White text on gold buttons was 2.2:1; it is now navy, in 28 places. Also fixed:
    the footer email, "space" captions and keyboard hints.
  - **Target size.** Hero letters were 16 px wide on phones; they are now at least 24 px.
  - **ARIA.** Labels on plain divs now have proper roles.
  - **Keyboard.** The daily-challenge list scrolls sideways, so it now takes keyboard focus.
- **After: 0 violations.**

## Verification (before merge)

- `npm test`: **1,680 passed**, 0 failed, 0 skipped, in 35 files.
- liblouis oracle: **14,771** strings compared cell by cell. Regenerating it gives an identical fixture.
- `NODE_ENV=production npm run build`: passes (the accuracy suite runs first).
- Real-browser check at 1280/390/320 px: **2,869** cells, 0 problems.
- axe-core: **0** violations.

## After merge: live check (production, www.teachbraille.org)

- The real-browser check against production at 1280/390/320 px found **2,877** cells and 0 problems. That
  covers dot positions, captions, wording and overflow, including the Word Game keyboard at 320 px.
- axe-core against production found one thing the local run missed: the "tap a letter" hint fades in
  after 1.5 s at half opacity, and that was only 2.3:1 contrast. The local check measured before it
  appeared.
  - Fixed in a small follow-up PR: the hint is now full-strength secondary text.
  - The axe script now waits 2.5 s and for the page title before measuring.
  - The same run once measured a page that hadn't finished loading. It reported "no title", but the live
    page has its title on every fetch.
- See the follow-up PR and the final session message for the post-fix live axe result.
