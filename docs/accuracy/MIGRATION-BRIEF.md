# Braille accuracy migration brief (for agents working on teachbraille.org)

Audience: sighted parents of blind children learning **Unified English Braille (UEB)**. A wrong dot
pattern teaches a parent something false. Accuracy is the top priority; design stays as it is
(navy / gold / cream, existing CSS classes).

## Ground rules

1. **Single source of truth.** All braille comes from `lib/braille/` (`import ... from '@/lib/braille'`):
   - `ueb.ts`: `LETTER_CELLS`, `DIGIT_CELLS`, `INDICATORS`, `PUNCTUATION`, `SYMBOLS`, `CONTRACTIONS`,
     `getContraction`, `getSign`, `cellsToUnicode`, `Cell` (= ascending dot numbers, e.g. `[1, 2, 5]`).
   - `transcribe.ts`: `transcribe(print)` → uncontracted UEB cells; `transcribeTokens(print)` gives
     tokens with names (capital indicator, digit, punctuation...). Throws on unsupported characters.
   - `prose.ts`: `describeCell(cell)` → "dots 1, 2, 5"; `describeCells(cells)`; `renderProse(template)`
     with tokens like `{dots:numeric}`, `{name:capitalWord}`, `{ueb:Hello}`, `{fact:secondDecadeAdds}`.
   - `contracted.ts`: `contractedWord('bath', ['b','a','th'])` builds contracted (grade 2) words from
     pieces; piece `"be/lower-groupsign"` picks a contraction kind.
   - `shared.ts`: `signsWithCells(cells)`, `contractionsWithCells(cells)`: which signs share a cell.
2. **No hand-typed braille anywhere else**: no Unicode braille characters, no `[0,1,1,...]` arrays, no
   literal cell arrays, no prose like "dots 1 2" or "dot 6" typed by hand (generate it with prose.ts),
   no `brailleMap` / `nemeth-map` / `contracted-braille-map` imports (these legacy files will be deleted),
   no superseded EBAE terms ("number indicator", "number sign" for the numeric indicator, "letter sign",
   "double capital"; the list is `lib/braille/terminology.ts`), no Nemeth, and no digit paired with an
   uppercase letter as its cell ("1(A)"). Enforced by `__tests__/braille/no-hardcoded-braille.test.ts`
   (source) and `scripts/braille/check-rendered-cells.mjs` (rendered page text).
3. **Drawing cells**: only `components/BrailleCell.tsx` (`<BrailleCell cell={...} className dotClassName
raisedClassName flatClassName label? />`) and `components/BrailleDotPad.tsx` (interactive six buttons,
   `toggleDot` helper). Keep each component's existing CSS class names so the look does not change
   (pass `raisedClassName="raised"` etc. if the old code used a different class than `filled`).
   Never render dots by mapping over an array yourself.
4. **Uncontracted convention** (ICEB Rules of UEB 2024, rule 5.11.1): in uncontracted text a letter
   standing alone is just the letter, with no grade 1 indicator. Grade 1 indicator only for a lowercase
   a–j right after a digit (and a question mark in an unusual position). `transcribe` does this.
5. **Contracted content** (contraction games, contracted sentences) must be exactly what UEB contracted
   braille would write, which is checked against liblouis `en-ueb-g2.ctb`. If liblouis writes a word with
   a contraction the site doesn't teach (e.g. "mother" uses ⠐⠍), drop or replace the word; never fake it.
   You can check a word quickly with:
   `python3 -c "import louis; print(louis.translateString(['unicode.dis','en-ueb-g2.ctb'], 'mother'))"`.
6. **Accessibility**: real text alternatives; keyboard play; screen-reader labels that state the dot
   numbers (use `describeCell`/`describeCells`, or `<BrailleCell label="letter h" />`, which appends
   "dots 1, 2, 5"). Every lesson and game page must pass axe-core (`npm run a11y:axe -- <url>`).
7. **Captions say what the cell is.** A plain letter cell is lowercase: caption it "h", never "H" (a
   capital needs the capital letter indicator in front, and that cell gets its own caption). The rule is
   `lib/braille/labels.ts`; the jsdom helper `checkAllCells` and the real-browser check apply it to every
   drawn cell.
8. **AI-generated documents** (admin "Create" tab) never take braille from the model. The model writes
   print and tokens (`{dots:numeric}`, `{letter:b}`); braille worksheet items carry only `print`.
   `lib/ai-content-sanitizer.ts` regenerates or removes everything else, and `lib/worksheet-braille.ts`
   draws items in the worksheet's grade (contracted words only from liblouis-verified lists).

9. **No automatic CI.** GitHub Actions is manual-only (the owner does not pay for it). Before every
   merge, run the checklist in `docs/accuracy/HANDOFF.md` ("Before every merge") locally: format, lint,
   typecheck, `npm run braille:oracle` with a clean fixture diff, `NODE_ENV=production npm run build`, and
   the browser geometry check and axe check against a local production server. After the deploy, run both
   browser checks against https://teachbraille.org. Do not trigger the workflow or add Dependabot
   version updates unless the owner asks.

## Per-game structure

For each game `X`:

- Move all question/content logic into `lib/games/X.ts` (a stub exists). Pure functions, no React.
  Use `lib/games/quiz.ts` (`QuestionSpec`, `buildChoices`, `shuffle`, `seededRandom`).
- Export `brailleInventory(): InventoryItem[]` listing **every** print string the game can show as
  braille, with the cells it shows (`g1Item(where, print)` for uncontracted; for contracted
  `{ where, print, table: 'g2', cells }`). It is already registered in `lib/braille/site-inventory.ts`.
- Export functions that enumerate **every possible question** (e.g. `questionSpecs(difficulty)`), plus
  the answer checker the component actually uses (e.g. `isCorrect(spec, choice)`), so tests check the
  same code path the UI uses.
- Component `components/BrailleX.tsx` imports from `lib/games/X.ts`; UI otherwise unchanged.
- Test `__tests__/games/X.test.ts` that enumerates every question for every difficulty and checks:
  the correct answer is accepted; every wrong answer is rejected; no distractor is accidentally correct
  (judge with an independent check: `LETTER_CELLS` / `transcribe` / the liblouis fixture, not the game's
  own data); no question has two valid answers (e.g. two choices with the same cells, or a cell that
  means two things without context). Also a render test (React Testing Library) that renders the
  component and runs `checkAllCells(container)` from `__tests__/helpers/cells.ts` (expect `[]`).
- After adding inventory, run `npm run braille:oracle` to refresh `__tests__/fixtures/liblouis-oracle.json`
  (liblouis is installed), then `npx jest __tests__/braille __tests__/games`.

## Audit log (required)

For every error you find and fix in existing content, add an entry to
`docs/accuracy/audit/<your-area>.md`:

```
### <short title>
- Where: file:line (and what the user saw)
- Before: <what the site showed/said, include braille/dots>
- After: <what it shows now>
- Source: <ICEB Rules of UEB 2024 section, and/or liblouis en-ueb-g1/g2 output, and/or Unicode>
```

Also note anything where sources genuinely disagree or the rules are ambiguous (do not resolve such
cases silently; write them up in the same file under "## Open questions").

## Don'ts

- Don't edit files owned by another agent (listed in your task). Shared files you may NOT edit:
  `lib/braille/*`, `components/BrailleCell.tsx`, `components/BrailleDotPad.tsx`, `app/globals.css`
  (unless your task says so), `package.json`, `lib/braille/site-inventory.ts`, `lib/progress-types.ts`.
  If you need a change there, describe it in your final report instead.
- Don't loosen or skip tests. Don't commit or push (the lead does that).
