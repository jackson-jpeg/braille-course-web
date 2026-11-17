# January page: World Braille Day and Braille Literacy Month (scope only)

Written 2026-11-17. **Nothing is built.** This is the plan to approve, change or drop.

## Why

- January 4 is World Braille Day (Louis Braille's birthday, 1809; a United Nations day since 2019), and January is
  Braille Literacy Month in the United States. Teachers, librarians and parents search for classroom activities in
  the two weeks before and all through January.
- The site is already found by teachers. One page that answers "what can my class do for World Braille Day?" with
  things that work in ten minutes gives them a reason to link it, and gives the outreach note something timely to
  point at.

## The page

One page, at `/world-braille-day` (the name people search for), with Braille Literacy Month in its title and first
paragraph. It stays up all year and is refreshed each December.

Sections, in order:

1. **What the day is.** Three plain sentences: who Louis Braille was, why January 4, why braille still matters.
2. **Write your name in braille.** A box to type a name or short word, shown in braille cells with the dot numbers
   for each letter beneath. Uncontracted braille only, which is what the site's checked transcriber
   (`lib/braille/transcribe.ts`) produces, and the page says so.
3. **A printable name card.** The same name laid out for printing on one sheet, with a note that printed dots are
   for sighted learners to study, not for reading by touch.
4. **Ten minutes, thirty minutes, a week.** Three ready paths made of what already exists: the Braille Cell lesson
   and one game for ten minutes; letters a to j and two games for thirty; the first four lessons across a school
   week.
5. **For teachers.** How to use it with a class (one screen, pairs, or homework), that it needs no accounts, and what
   it does and does not teach (uncontracted first, then the main one-cell contractions).
6. **Take it with you.** The free iPhone and iPad app, and Delaney's lessons for anyone who wants a teacher.

## What it reuses, and what is new

- Reused: the braille transcriber and cell drawing (`BrailleText`, `BrailleCell`), the lessons at `/learn`, the
  games, the page layout and type.
- New: the name box (one small client component), a print stylesheet for the card, the page copy, a sitemap entry,
  and a link from the home page during December and January.
- Not needed: database changes, accounts, email, new images.

## Rules it has to follow

- Every braille cell comes from `lib/braille/`; the page registers its braille with the site inventory, and the
  accuracy tests, the liblouis oracle, the geometry check and the axe check all run before it ships.
- The name box must refuse or clearly mark what it cannot write correctly (characters outside the checked set) and
  never guess.
- Clean and editorial like the rest of the site: no decorative graphics, no new colours. No em dashes in the copy.
- Nothing typed in the name box is sent anywhere or counted. Page visits are counted by the site's existing visitor
  count, as on every page.

## Size and dates

- About three working sessions: the page and name box, the print card, then checks and copy edits.
- Copy approved by Delaney by December 5. Built and checked by December 12. Live by December 15, so search engines
  have it before the holidays and the outreach note can mention it.
- January 4, 2027 is a Monday, the first school day back for many, which suits a classroom activity.

## What only Delaney or Jackson can decide

1. Go or no go.
2. The address: `/world-braille-day` (recommended) or `/braille-literacy-month`.
3. Whether Delaney writes the "what the day is" paragraph herself (recommended: it is her voice teachers trust).
4. Whether the page mentions her paid lessons and summer course, or stays free resources only.
5. Whether to offer a printable classroom sheet of the alphabet as well as the name card.

## Left out on purpose

- A sign-up form or email list.
- Contracted braille in the name box (names are not contracted, and a wrong contraction is worse than none).
- Social media graphics, a countdown, or anything that needs upkeep through the month.
