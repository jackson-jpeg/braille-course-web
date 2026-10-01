# Raised — TeachBraille design system

The whole site is built from the six-dot braille cell. Read this before changing any UI.

## Principles

1. **The cell is the core visual unit.** Ornaments, loaders, buttons, stars and progress are made of cells.
   Raised dots are tomato-red and look embossed; flat dots are quiet pits in the paper.
2. **Every cell is real UEB.** Never type a dot pattern. Get dots from `lib/ueb.ts`
   (`LETTERS`, `DIGITS`, `INDICATORS`, `PUNCTUATION`, `CONTRACTIONS`, `transcribe()`), or contracted braille
   from `lib/data/ueb-contracted.json` (liblouis output). Decorative braille must still spell a real word.
3. **Tactile, not flat.** Surfaces are heavy paper with soft lift (`--lift-*`); buttons press down
   (`translateY` + edge shadow); dots pop up in reading order (`.cell--pop`).
4. **Two audiences on one screen.** A parent on a laptop and a kid on a tablet. Big targets
   (min 44px, game targets 56px+), plain words, no tiny gray text.
5. **Accessible by default.** WCAG 2.2 AA. Visible focus (3px pine outline), full keyboard play,
   real buttons, `aria-live` feedback, `prefers-reduced-motion` honored (global rule in globals.css).

## Tokens (app/globals.css)

| Token                                               | Use                                                       |
| --------------------------------------------------- | --------------------------------------------------------- |
| `--ink` `#1e1b2e`                                   | text, dark bands                                          |
| `--ink-soft` `#4f4a63`                              | secondary text (8.3:1 on paper)                           |
| `--paper` `#fffdf9`, `--paper-sunk`, `--paper-deep` | surfaces                                                  |
| `--tomato` `#e04a2f`                                | raised dots, large display, UI marks only (not body text) |
| `--tomato-deep` `#b33a20`                           | primary buttons (white text 5.9:1), eyebrow text          |
| `--pine` `#12695f`                                  | links, success, focus ring                                |
| `--marigold` `#f2b33d`                              | rewards, streaks, accents on ink                          |
| `--*-tint`                                          | soft backgrounds (tomato, pine, marigold, sky, plum)      |

Fonts: `--font-display` Bricolage Grotesque (headings, buttons, numbers), `--font-body` Atkinson
Hyperlegible (designed by the Braille Institute for low-vision readers).

Spacing: `--s-1`…`--s-9`; type scale `--step--1`…`--step-5`; radii `--r-1`…`--r-4`, `--r-pill`.

## Components

| Component                                     | Where                            | Notes                                                                   |
| --------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `<Cell dots size tone framed pop flat label>` | `components/ui/Cell.tsx`         | Decorative unless `label` given (then `role="img"`, label + "dots 1 2") |
| `<BrailleText text                            | cells size label>`               | `components/ui/BrailleText.tsx`                                         | A run of cells; transcribes print with `lib/ueb.ts` |
| `<Eyebrow>Games</Eyebrow>`                    | `components/ui/Eyebrow.tsx`      | Uppercase label with its braille spelling                               |
| `<ButtonCell letter="g">`                     | `components/ui/ButtonCell.tsx`   | Tiny cell inside `.btn`                                                 |
| `<CellLoader>`                                | `components/ui/CellLoader.tsx`   | Loading state, `role="status"`                                          |
| `<DotRule>`                                   | `components/ui/DotRule.tsx`      | Divider                                                                 |
| `<NextUp>`                                    | `components/progress/NextUp.tsx` | Personal "what to practise next"                                        |

CSS classes: `.btn` (+ `--pine --ink --paper --marigold --sm --lg --block`), `.tile`, `.tile-link`,
`.tile--sunk`, `.chip--*`, `.eyebrow`, `.lead`, `.wrap`, `.wrap-narrow`, `.section`, `.band-sunk`,
`.band-ink`, `.lattice` (dot texture), `.callout--*`, `.field`, `.input`, `.select`, `.textarea`,
`.notice`, `.meter`, `.prose`, `.sr-only`, `.cluster`, `.stack`.

## Game kit (`components/games/kit`)

Every game renders inside `<div className="game-board" data-testid="game-board">` and uses:

- `useSession(gameId)` → `{ difficulty, setDifficulty, stats, finish(won, score), answer(itemKey, correct) }`.
  Call `answer('letter:q', true)` on every answer (keys: `letter:x`, `digit:7`, `contraction:the`,
  `punct:period`), and `finish()` once per round. This powers streaks, achievements and "next up".
- `<StartPanel heading onStart>` — options + a big Start button.
- `<Hud items=[{label, value, tone}]>` — score / streak / timer.
- `<Choices choices onPick correctId pickedId>` — answer buttons, keys 1–4, optional type-to-pick.
- `<DotPad value onChange onSubmit marks>` — writable cell; keys 1–6 and Perkins F D S J K L, Enter, Backspace.
- `<ModePicker legend name value options onChange>` — native radio segmented control.
- `<Results title summary stars best onReplay next>` — focuses its heading when shown.
- `useAnnouncer()` → `{ announce, region }` — render `region` once; announce every result.
- `useGameKeys(handler)` — page-level shortcuts that ignore typing in inputs.
- `shuffle`, `sample`, `pickDistractors(answer, pool, n, dotSimilarity)`.

Game styles: `styles/games/kit.css` (shared) + `styles/games/<slug>.css` imported by the game component.

## Accessibility checklist for every screen

- One `h1` per page (the game page owns it; games start at `h2`).
- Every control is a native `button`/`input`/`a`, reachable by Tab, with a visible focus ring.
- Braille shown as a question has an accessible description that does **not** give away the answer
  (e.g. "Braille cell: dots 1 2"), so screen-reader users play the same game.
- Feedback goes through `announce()`; timers can be turned off (Relaxed mode) — WCAG 2.2.1.
- Color is never the only signal (✓ / ✗ marks, text).
- Motion is decorative and disabled under `prefers-reduced-motion`.
