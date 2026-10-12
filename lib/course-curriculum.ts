/**
 * Free braille course: curriculum definition.
 *
 * Accuracy guarantee: lessons never contain a dot pattern or a hand-typed dot number. Every cell
 * comes from lib/braille (letters, signs, contractions, or print transcribed to uncontracted UEB),
 * and every sentence that names dots is a template rendered by renderProse (lib/braille/prose.ts),
 * so the words always agree with the cells. __tests__/lib/course-curriculum.test.ts and the
 * liblouis oracle check the result.
 *
 * Convention (stated in the lessons): the beginner track is uncontracted UEB. Following ICEB rule
 * 5.11.1, uncontracted braille uses no grade 1 indicator for a letter standing alone; the grade 1
 * indicator appears only before a lowercase a–j right after a number (and before a question mark
 * in an unusual position). Contractions are introduced only in the Grade 2 module.
 */

import {
  type Cell,
  type Contraction,
  ALPHABETIC_WORDSIGNS,
  CONTRACTIONS,
  INDICATORS,
  LETTER_CELLS,
  PUNCTUATION,
  getContraction,
} from './braille/ueb';
import { transcribeTokens } from './braille/transcribe';
import { contractedWord } from './braille/contracted';
import { describeCells, renderProse } from './braille/prose';
import type { InventoryItem } from './braille/inventory';
import type { GameId } from './progress-types';

/** Something the learner writes in the drill: one or more cells. */
export interface CharItem {
  /** Print label shown to the learner, e.g. "a", "S", "3b", "numeric indicator", "the". */
  print: string;
  /** The cells to write, in order. */
  cells: Cell[];
  /** What each cell is, for feedback ("capital letter indicator", "letter s"). */
  cellNames: string[];
  /** Short teaching note (already rendered). */
  note?: string;
  /** Where the cells came from: a letter, a sign on its own, print transcribed, or a contraction. */
  source: 'letter' | 'sign' | 'print' | 'contraction';
  /** For contractions: the kind (wordsign, groupsign…). */
  contractionKind?: Contraction['kind'];
}

/** A print example shown with its braille, cell by cell. */
export interface LessonExample {
  print: string;
  note?: string;
}

export interface Lesson {
  slug: string;
  title: string;
  moduleId: string;
  summary: string;
  /** Teaching paragraphs (rendered). */
  intro: string[];
  /** Characters this lesson teaches; drives the cells and the writing drill. */
  chars: CharItem[];
  /** Worked examples in uncontracted UEB (print → braille, cell by cell). */
  examples?: LessonExample[];
  practiceGameId?: GameId;
  practiceGameLabel?: string;
  /** Props for the practice game, e.g. a fixed level. */
  practiceGameProps?: Record<string, unknown>;
  tip?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

/* ── Building blocks (all cells from lib/braille) ───────────────────────────── */

const P = renderProse;

/** A letter cell, labelled in lowercase: a plain letter cell is a lowercase letter (ICEB 4.1). */
function letter(l: string, note?: string): CharItem {
  const cell = LETTER_CELLS[l];
  if (!cell) throw new Error(`course-curriculum: unknown letter "${l}"`);
  return { print: l, cells: [cell], cellNames: [`letter ${l}`], note: note && P(note), source: 'letter' };
}

/** Any print, written as uncontracted UEB (capitals, digits, punctuation…). */
function printItem(print: string, note?: string): CharItem {
  const tokens = transcribeTokens(print);
  return {
    print,
    cells: tokens.flatMap((t) => t.cells),
    cellNames: tokens.flatMap((t) => t.cells.map(() => t.name)),
    note: note && P(note),
    source: 'print',
  };
}

/** An indicator or punctuation sign on its own, by id. */
function signItem(sign: { name: string; cells: readonly Cell[] }, note?: string): CharItem {
  return {
    print: sign.name,
    cells: [...sign.cells],
    cellNames: sign.cells.map((_, i) => (sign.cells.length > 1 ? `${sign.name}, cell ${i + 1}` : sign.name)),
    note: note && P(note),
    source: 'sign',
  };
}

function contractionItem(text: string, kind?: Contraction['kind'], note?: string): CharItem {
  const c = getContraction(text, kind);
  return {
    print: c.text,
    cells: [...c.cells],
    cellNames: [`${c.text} contraction`],
    note: note ?? c.usage,
    source: 'contraction',
    contractionKind: c.kind,
  };
}

const STRONG_WORDSIGN_SENTENCE = (() => {
  const pairs = CONTRACTIONS.filter((c) => c.kind === 'strong-wordsign').map((w) => {
    const group = CONTRACTIONS.find(
      (g) => g.kind === 'strong-groupsign' && describeCells(g.cells) === describeCells(w.cells),
    );
    if (!group) throw new Error(`course-curriculum: no groupsign shares a cell with ${w.text}`);
    return `${group.text} → ${w.text}`;
  });
  return `Standing alone, six groupsign cells mean whole words: ${pairs.join(', ')}.`;
})();

/** “bath” = b, a, th: the example used in the strong groupsigns lesson (checked against liblouis g2). */
export const BATH = contractedWord('bath', ['b', 'a', 'th']);

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

const LOWER_WORDSIGNS = CONTRACTIONS.filter((c) => c.kind === 'lower-wordsign').map((c) => c.text);

/* ── The curriculum ────────────────────────────────────────────────────────── */

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'orientation',
    title: 'Orientation',
    blurb: 'Meet the braille cell and learn how its six dots are numbered.',
    lessons: [
      {
        slug: 'the-braille-cell',
        title: 'The Braille Cell',
        moduleId: 'orientation',
        summary: 'How the six-dot cell is arranged and numbered.',
        intro: [
          'Every braille character lives inside one “cell”: six dot positions arranged in two columns of three.',
          P(
            'The left column holds {fact:leftColumn}, top to bottom. The right column holds {fact:rightColumn}. Raising different dots makes every letter, number and symbol. Write a few to feel how position works.',
          ),
          'This course teaches Unified English Braille (UEB), the braille code used in the United States and every other English-speaking country.',
        ],
        chars: [
          letter('a', 'A single dot in the top left: {letter:a}.'),
          letter('c', 'The whole top row: {fact:topRow}.'),
          letter('l', 'The whole left column: {fact:leftColumn}.'),
        ],
        practiceGameId: 'explorer',
        practiceGameLabel: 'Dot Explorer',
        tip: 'There’s no need to memorize everything now. You’ll build the cell up letter by letter.',
      },
    ],
  },
  {
    id: 'grade1-letters',
    title: 'Grade 1 · The Alphabet',
    blurb: 'Learn all 26 letters in the order braille was designed to be learned.',
    lessons: [
      {
        slug: 'letters-a-j',
        title: 'Letters a–j',
        moduleId: 'grade1-letters',
        summary: 'The first ten letters, the foundation of the whole system.',
        intro: [
          P(
            'Braille’s first ten letters use only the top two rows of the cell: {fact:firstDecadeDots}. Master these and you’ve learned the pattern the entire alphabet is built from.',
          ),
          'A plain letter cell is a lowercase letter. Capitals come later, in their own lesson. Write each letter below by raising its dots.',
        ],
        chars: 'abcdefghij'.split('').map((c) => letter(c)),
        practiceGameId: 'explorer',
        practiceGameLabel: 'Dot Explorer',
        tip: P('Look for mirror images: {fact:firstDecadeMirrors} are left–right mirrors of each other.'),
      },
      {
        slug: 'letters-k-t',
        title: 'Letters k–t',
        moduleId: 'grade1-letters',
        summary: P('a–j again, plus {fact:secondDecadeAdds}.'),
        intro: [
          P(
            'Here’s the elegant trick: k through t are exactly a through j with {fact:secondDecadeAdds} added. k is a plus {fact:secondDecadeAdds}, l is b plus {fact:secondDecadeAdds}, and so on.',
          ),
          P(
            'If you know the first ten letters, you already know these. Just add {fact:secondDecadeAdds}, the {fact:secondDecadeAddsPlace} dot.',
          ),
        ],
        chars: 'klmnopqrst'.split('').map((c) => letter(c)),
        practiceGameId: 'speedmatch',
        practiceGameLabel: 'Speed Match',
        tip: 'Try covering the labels and reading the cells by their dot numbers alone.',
      },
      {
        slug: 'letters-u-z',
        title: 'Letters u–z',
        moduleId: 'grade1-letters',
        summary: 'The final letters, and w, the famous exception.',
        intro: [
          P('u, v, x, y and z are a, b, c, d and e with {fact:thirdDecadeAdds} added.'),
          P(
            'w is the odd one out. Louis Braille designed his code for French, which rarely used w, so w was fitted in later. It is j plus {fact:wAddsToJ}.',
          ),
        ],
        chars: [
          letter('u'),
          letter('v'),
          letter('x'),
          letter('y'),
          letter('z'),
          letter('w', 'The exception: j plus {fact:wAddsToJ}.'),
        ],
        practiceGameId: 'memorymatch',
        practiceGameLabel: 'Memory Match',
        tip: 'That’s the whole alphabet! From here, it’s all about reading speed.',
      },
      {
        slug: 'reading-words',
        title: 'Reading Your First Words',
        moduleId: 'grade1-letters',
        summary: 'Put letters together and read whole words.',
        intro: [
          'Letters become words when you read them left to right, one cell at a time, with a blank cell between words. Warm up by writing the letters in a few short words, then head to the Word Game to read whole words under gentle pressure.',
          'Everything in these first lessons is uncontracted braille: every letter is written out. A single letter on its own, like the “b” in “plan b”, is simply that letter.',
        ],
        chars: [letter('c'), letter('a'), letter('t'), letter('d'), letter('o'), letter('g')],
        examples: [{ print: 'cat' }, { print: 'dog' }, { print: 'a big red bus' }],
        practiceGameId: 'wordgame',
        practiceGameLabel: 'Word Game',
        tip: 'Reading braille is a skill of recognition. The more words you meet, the faster it clicks.',
      },
    ],
  },
  {
    id: 'numbers-indicators',
    title: 'Capitals, Numbers & Punctuation',
    blurb: 'Capital letters, numbers and punctuation marks: everything you need to read a whole sentence.',
    lessons: [
      {
        slug: 'capitals',
        title: 'Capital Letters',
        moduleId: 'numbers-indicators',
        summary: 'The capital letter indicator and how it works.',
        intro: [
          P(
            'Braille has no separate shapes for capital letters. Every letter cell you have learned is a lowercase letter. To make a capital, write the {name:capitalLetter} ({dots:capitalLetter}) just before the letter.',
          ),
          'So “Sam” takes four cells: the capital letter indicator, then s, a and m. The indicator changes only the one letter right after it.',
          'Braille alphabet charts often print the letter names as capitals, A to Z, but the cells they show are the lowercase letters.',
        ],
        chars: [
          signItem(INDICATORS.capitalLetter, 'Placed right before a letter: {dots:capitalLetter}.'),
          printItem('S', 'The capital letter indicator, then s.'),
          printItem('I', 'The word “I” is always a capital.'),
        ],
        examples: [
          { print: 'Sam', note: 'One capital letter: one capital letter indicator.' },
          { print: 'I am Ana.', note: 'Each capital gets its own indicator.' },
          { print: 'McKay', note: 'A capital in the middle of a word gets the indicator too.' },
        ],
        practiceGameId: 'capital-quest',
        practiceGameLabel: 'Capital Quest',
        tip: 'The capital letter indicator and the numeric indicator are both “indicators”: cells that change how the next cells are read.',
      },
      {
        slug: 'capital-words',
        title: 'Words in Capitals',
        moduleId: 'numbers-indicators',
        summary: 'Capitalized words, capitalized passages, and the capitals terminator.',
        intro: [
          P(
            'When a whole word is in capitals, write the {name:capitalWord} ({dots:capitalWord}) once, before the word. “CAT” is the indicator followed by c, a, t.',
          ),
          'The capitals stop at the end of the word, or at any symbol that is not a letter, such as an apostrophe or a hyphen. That’s why “DON’T” needs a capital letter indicator again before the T.',
          P(
            'For three or more capitalized words in a row, use the {name:capitalPassage} ({dots:capitalPassage}) at the start and the {name:capitalsTerminator} ({dots:capitalsTerminator}) right after the last capitalized word.',
          ),
          'The capitals terminator also ends capitals partway through a word, as in “ABCs”.',
        ],
        chars: [
          signItem(INDICATORS.capitalWord),
          signItem(INDICATORS.capitalPassage),
          signItem(INDICATORS.capitalsTerminator),
          printItem('CAT'),
        ],
        examples: [
          { print: 'CAT', note: 'One capitalized word indicator covers the whole word.' },
          { print: 'BIG DOG', note: 'Only two words, so each gets its own capitalized word indicator.' },
          {
            print: 'I LOVE YOU',
            note: 'Three capitalized words: passage indicator at the start, terminator at the end.',
          },
          { print: 'DON’T', note: 'The apostrophe ends the capitals, so T gets its own capital letter indicator.' },
          { print: 'ABCs', note: 'The terminator ends the capitals before the lowercase s.' },
        ],
        practiceGameId: 'capital-quest',
        practiceGameLabel: 'Capital Quest',
        tip: P('Count the {dots:capitalLetter} cells: one for a letter, two for a word, three for a passage.'),
      },
      {
        slug: 'numbers',
        title: 'Numbers',
        moduleId: 'numbers-indicators',
        summary: 'The numeric indicator, and how digits reuse a–j.',
        intro: [
          P(
            'Braille uses the first ten letters for the digits. The {name:numeric} ({dots:numeric}) in front tells the reader that what follows is a number: 1 is the numeric indicator then a, 2 is the numeric indicator then b, and so on up to 9. Zero uses j.',
          ),
          P(
            'One numeric indicator covers the whole number. “2026” is the numeric indicator followed by {digit:2}, {digit:0}, {digit:2}, {digit:6}. You don’t repeat it before each digit.',
          ),
        ],
        chars: [
          signItem(INDICATORS.numeric, 'Placed before a number: {dots:numeric}.'),
          printItem('1', 'The numeric indicator, then {digit:1}.'),
          printItem('2', 'The numeric indicator, then {digit:2}.'),
          printItem('3', 'The numeric indicator, then {digit:3}.'),
          printItem('0', 'The numeric indicator, then {digit:0}.'),
          printItem('10', 'One numeric indicator for both digits.'),
        ],
        examples: [
          { print: '7' },
          { print: '10' },
          { print: '2026', note: 'One numeric indicator for the whole number.' },
          { print: 'I am 9.', note: 'The period after the number is an ordinary period.' },
        ],
        practiceGameId: 'number-lock',
        practiceGameLabel: 'Number Lock',
        tip: 'One numeric indicator covers a whole run of digits.',
      },
      {
        slug: 'numbers-in-text',
        title: 'Numbers in Real Text',
        moduleId: 'numbers-indicators',
        summary: 'Commas and decimals, times and ranges, and letters after numbers.',
        intro: [
          'A comma or a period inside a number keeps the number going, so “1,000” and “3.5” each need only one numeric indicator.',
          'A space, a hyphen, a colon or a slash ends the number. A new number after it gets its own numeric indicator, as in the time 5:30 or the range 3-4.',
          P(
            'Watch for letters right after a number. Because a to j double as digits, a lowercase a to j written straight after a number needs the {name:grade1Symbol} ({dots:grade1Symbol}) first, so “3b” can’t be misread as 32. Letters k to z don’t need it (“3rd”), and neither do capitals, because the capital indicator already ends the number (“4B”).',
          ),
          'This is where you’ll meet the grade 1 indicator most often in uncontracted braille. You may also see it before a question mark at the start of a word or after a hyphen or dash.',
        ],
        chars: [
          signItem(INDICATORS.grade1Symbol, 'Before a lowercase a–j right after a number: {dots:grade1Symbol}.'),
          printItem('3.5'),
          printItem('3b'),
        ],
        examples: [
          { print: '1,000', note: 'The comma stays inside the number.' },
          { print: '3.5', note: 'So does the decimal point.' },
          { print: '5:30', note: 'The colon ends the number; 30 needs a new numeric indicator.' },
          { print: '3-4', note: 'So does the hyphen.' },
          { print: '3b', note: 'b right after a digit: grade 1 indicator first.' },
          { print: '32', note: 'Without the grade 1 indicator, the same cells read as 32.' },
          { print: '3rd', note: 'r is not one of a–j, so no grade 1 indicator.' },
          { print: '4B', note: 'A capital letter indicator ends the number by itself.' },
        ],
        practiceGameId: 'number-lock',
        practiceGameLabel: 'Number Lock',
        tip: 'If a letter right after a number could be a digit, it needs the grade 1 indicator.',
      },
      {
        slug: 'punctuation',
        title: 'Punctuation Basics',
        moduleId: 'numbers-indicators',
        summary: 'Period, comma, question mark, exclamation mark and apostrophe.',
        intro: [
          P(
            'Punctuation marks have their own cells. Several are letter shapes moved down one row: the period is a lowered {lowered:period}, the comma a lowered {lowered:comma}, the question mark a lowered {lowered:question}, the exclamation mark a lowered {lowered:exclamation}.',
          ),
          'Like print, they come right after the last letter of a word, with no space.',
          P(
            'Watch the question mark: its cell ({dots:question}) is also the opening quotation mark. Position tells you which it is: a question mark comes at the end of a word, an opening quotation mark at the start.',
          ),
          P('The apostrophe is {dots:apostrophe}, as in “it’s”.'),
        ],
        chars: [
          signItem(PUNCTUATION.period, 'A lowered {lowered:period}: {dots:period}.'),
          signItem(PUNCTUATION.comma, 'A lowered {lowered:comma}: {dots:comma}.'),
          signItem(PUNCTUATION.question, 'A lowered {lowered:question}: {dots:question}.'),
          signItem(PUNCTUATION.exclamation, 'A lowered {lowered:exclamation}: {dots:exclamation}.'),
          signItem(PUNCTUATION.apostrophe, 'One cell, low in the cell: {dots:apostrophe}.'),
        ],
        examples: [
          { print: 'Hi, Sam.' },
          { print: 'Can you see it?' },
          { print: 'We won!' },
          { print: 'It’s Ben’s hat.', note: 'The apostrophe is one cell.' },
        ],
        practiceGameId: 'punctuation-detective',
        practiceGameLabel: 'Punctuation Detective',
        tip: 'Only one blank cell follows a period in braille, even if print uses two spaces.',
      },
      {
        slug: 'punctuation-more',
        title: 'More Punctuation',
        moduleId: 'numbers-indicators',
        summary: 'Quotation marks, hyphen and dash, parentheses, colon, semicolon and slash.',
        intro: [
          P(
            'Quotation marks open and close with different cells: the {name:openQuote} is {dots:openQuote} and the {name:closeQuote} is {dots:closeQuote}.',
          ),
          'Remember: the opening quotation mark shares its cell with the question mark. At the start of a word it is a quotation mark; at the end, a question mark.',
          P('The hyphen is one cell ({dots:hyphen}). The dash is two cells: {dots:dash}.'),
          P(
            'Parentheses take two cells each: {dots:openParen} to open and {dots:closeParen} to close. If an older braille book uses one cell for both, it was written in the older American code; the United States has used UEB since 2016.',
          ),
          P('The colon is {dots:colon}, the semicolon {dots:semicolon}, and the slash is two cells: {dots:slash}.'),
        ],
        chars: [
          signItem(PUNCTUATION.openQuote),
          signItem(PUNCTUATION.closeQuote),
          signItem(PUNCTUATION.hyphen),
          signItem(PUNCTUATION.dash),
          signItem(PUNCTUATION.openParen),
          signItem(PUNCTUATION.closeParen),
          signItem(PUNCTUATION.colon, 'A lowered {lowered:colon}: {dots:colon}.'),
        ],
        examples: [
          { print: '“Hi,” said Mom.' },
          {
            print: '“Is it time?”',
            note: 'Opening quotation mark at the start, question mark then closing quotation mark at the end.',
          },
          { print: 'a well-known song', note: 'Hyphen: one cell.' },
          { print: 'Wait – look!', note: 'Dash: two cells.' },
          { print: 'my dog (Max)' },
          { print: 'Note: bring 2 pens; yes/no.' },
        ],
        practiceGameId: 'brailler-challenge',
        practiceGameLabel: 'Brailler Challenge',
        tip: 'You can now read any uncontracted sentence: letters, capitals, numbers and punctuation.',
      },
    ],
  },
  {
    id: 'grade2',
    title: 'Grade 2 · Contractions',
    blurb: 'The shortcuts that make braille fast to read and write.',
    lessons: [
      {
        slug: 'alphabet-wordsigns',
        title: 'Alphabet Wordsigns',
        moduleId: 'grade2',
        summary: 'Single letters that stand for whole words.',
        intro: [
          'Everything so far has been uncontracted braille. Grade 2 (contracted) braille adds contractions: shortcuts that save space and speed up reading. Most braille books are written in contracted braille.',
          'The simplest are alphabetic wordsigns: a single letter, standing alone, that means a whole word. b means “but,” c means “can,” d means “do.” The cell is identical to the letter; only its standing-alone use changes the meaning.',
        ],
        chars: [
          contractionItem('but'),
          contractionItem('can'),
          contractionItem('do'),
          contractionItem('every'),
          contractionItem('from'),
          contractionItem('go'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: `There are ${ALPHABETIC_WORDSIGNS.length} alphabetic wordsigns in all. You’ve just met the first handful.`,
      },
      {
        slug: 'strong-contractions',
        title: 'Strong Contractions',
        moduleId: 'grade2',
        summary: 'One-cell shortcuts for the most common words.',
        intro: [
          'Some of the most common words in English get their own one-cell contraction: and, for, of, the, and with. These cells don’t match any letter.',
          'They are used for the whole word and inside longer words too, so learning them gives an immediate reading-speed boost.',
        ],
        chars: [
          contractionItem('and'),
          contractionItem('for'),
          contractionItem('of'),
          contractionItem('the'),
          contractionItem('with'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'These five words alone make up a big share of everyday text.',
      },
      {
        slug: 'strong-groupsigns',
        title: 'Strong Groupsigns',
        moduleId: 'grade2',
        summary: 'Single cells for common letter groups like ch and th.',
        intro: [
          'Groupsigns stand for letter groups inside words. One cell can stand for “ch,” “sh,” “th,” “wh,” “er,” or “ing.”',
          'So “bath” is b, a, then the th groupsign. Most groupsigns are used anywhere in a word; the ing sign is never used at the very beginning of a word.',
          STRONG_WORDSIGN_SENTENCE,
        ],
        chars: [
          contractionItem('ch', 'strong-groupsign'),
          contractionItem('sh', 'strong-groupsign'),
          contractionItem('th', 'strong-groupsign'),
          contractionItem('wh', 'strong-groupsign'),
          contractionItem('er', 'strong-groupsign'),
          contractionItem('ing', 'strong-groupsign'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'If one of those six cells stands alone, read it as the whole word.',
      },
      {
        slug: 'lower-groupsigns',
        title: 'Lower Groupsigns',
        moduleId: 'grade2',
        summary: 'Contractions written in the lower part of the cell.',
        intro: [
          'Lower groupsigns sit in the lower part of the cell, never using the top row. “be,” “con,” and “dis” stand for those letters at the beginning of a word; “en” and “in” can appear anywhere in a word.',
          'Because they leave the top row empty, they’re easy to tell apart from the letter shapes you already know.',
        ],
        chars: [
          contractionItem('be', 'lower-groupsign'),
          contractionItem('con', 'lower-groupsign'),
          contractionItem('dis', 'lower-groupsign'),
          contractionItem('en', 'lower-groupsign'),
          contractionItem('in', 'lower-groupsign'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'Lower-cell shapes are the same as some punctuation marks. Context tells the reader which is meant.',
      },
      {
        slug: 'lower-wordsigns',
        title: 'Lower Wordsigns',
        moduleId: 'grade2',
        summary: 'Whole words written in the lower part of the cell.',
        intro: [
          `${NUMBER_WORDS[LOWER_WORDSIGNS.length]} whole words are written in the lower part of the cell: ${LOWER_WORDSIGNS.slice(0, -1).join(', ')} and ${LOWER_WORDSIGNS[LOWER_WORDSIGNS.length - 1]}. Here are three of them.`,
          'Standing alone, each is a single cell. These round out the core contractions you need to start reading real Grade 2 text.',
        ],
        chars: [
          contractionItem('his', 'lower-wordsign'),
          contractionItem('was', 'lower-wordsign'),
          contractionItem('were', 'lower-wordsign'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'You now know the most common one-cell contractions. Contracted braille also has initial-letter contractions, final-letter groupsigns and shortforms, which a full braille course covers next.',
      },
    ],
  },
  {
    id: 'bring-it-together',
    title: 'Bring It Together',
    blurb: 'Read real sentences and plan your next steps.',
    lessons: [
      {
        slug: 'reading-sentences',
        title: 'Reading Contracted Sentences',
        moduleId: 'bring-it-together',
        summary: 'Combine letters and contractions into full sentences.',
        intro: [
          'Real braille mixes letters and contractions together. Refresh three of the most common contractions below, then read complete contracted sentences in the Sentence Decoder below, the way a braille reader does.',
        ],
        chars: [contractionItem('the'), contractionItem('and'), contractionItem('of')],
        practiceGameId: 'sentence-decoder',
        practiceGameLabel: 'Sentence Decoder',
        practiceGameProps: { fixedLevel: 'advanced' },
        tip: 'Reading fluency comes from meeting the same patterns again and again. Keep going!',
      },
      {
        slug: 'wrap-up',
        title: 'Wrap-Up & Next Steps',
        moduleId: 'bring-it-together',
        summary: 'Celebrate, and choose where to go next.',
        intro: [
          'You’ve gone from a blank cell to reading capitals, numbers, punctuation and the most common contractions. That’s the whole foundation. From here, fluency is a matter of practice.',
          'Keep the practice games in rotation, and when you’re ready for personalized instruction, the summer course and 1-on-1 sessions are here for you.',
        ],
        chars: [],
        practiceGameId: 'bingo',
        practiceGameLabel: 'Braille Bingo',
        tip: 'Consistency beats intensity. Even a few minutes a day builds lasting recognition.',
      },
    ],
  },
];

/* ── Derived helpers ───────────────────────────────────────────────────────── */

export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap((m) => m.lessons);

export const LESSON_SLUGS: string[] = ALL_LESSONS.map((l) => l.slug);

export const TOTAL_LESSONS = ALL_LESSONS.length;

export function getLessonBySlug(slug: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}

export function getLessonIndex(slug: string): number {
  return ALL_LESSONS.findIndex((l) => l.slug === slug);
}

export function getModuleForLesson(lesson: Lesson): CourseModule | undefined {
  return COURSE_MODULES.find((m) => m.id === lesson.moduleId);
}

/** Previous / next lesson slugs for in-lesson navigation (null at the ends). */
export function getAdjacentLessons(slug: string): { prev: Lesson | null; next: Lesson | null } {
  const idx = getLessonIndex(slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : null,
    next: idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null,
  };
}

/** Every uncontracted print string the course shows as braille (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const lesson of ALL_LESSONS) {
    const where = `lesson:${lesson.slug}`;
    for (const ex of lesson.examples ?? []) {
      items.push({ where, print: ex.print, table: 'g1', cells: transcribeTokens(ex.print).flatMap((t) => t.cells) });
    }
    for (const c of lesson.chars) {
      if (c.source === 'letter' || c.source === 'print')
        items.push({ where, print: c.print, table: 'g1', cells: c.cells });
      // A wordsign or strong contraction shown for a whole word must be how contracted braille writes that word.
      const wholeWord = ['alphabetic-wordsign', 'strong-contraction', 'strong-wordsign', 'lower-wordsign'];
      if (c.source === 'contraction' && wholeWord.includes(c.contractionKind!))
        items.push({ where, print: c.print, table: 'g2', cells: c.cells });
    }
  }
  // Words the lessons spell out in contracted braille.
  items.push({ where: 'lesson:strong-groupsigns', print: 'bath', table: 'g2', cells: BATH.cells });
  return items;
}
