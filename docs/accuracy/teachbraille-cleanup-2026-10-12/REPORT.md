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

  | Commit                                      | Author       | Vercel                                                                |
  | ------------------------------------------- | ------------ | --------------------------------------------------------------------- |
  | 5eb9923, 6e64a50, 454b557, 20eef64, c9fb796 | Claude       | Deployment created, then failed about 1 s later, before any build ran |
  | 859126d (test commit)                       | jackson-jpeg | No deployment at all (watched for 30 min)                             |
  | 197f3ad (this PR's commit)                  | jackson-jpeg | See "Preview result" below                                            |
  | master merges (#5, #6)                      | jackson-jpeg | Production built (#5 failed on `act()`, fixed by #6)                  |

- **What the evidence shows.** A deployment that fails one second after it is created is how Vercel
  rejects a commit author who is not on the team, so your theory fits the Claude-authored pushes. With you
  as the author, that rejection stops. Vercel then created no preview deployment at all, which points to a
  dashboard setting rather than the repo.
- **What to check.** Two Vercel dashboard settings that this session cannot reach:
  - Project → Settings → Git: are preview deployments enabled for non-production branches?
  - Project → Settings → Build and Deployment: is an Ignored Build Step set?

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

## Preview result and live check

See the end of the session (filled in after CI, merge and deploy).
