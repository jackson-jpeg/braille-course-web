/**
 * The "BRAILLE REFERENCE DATA" block given to the AI model that drafts teaching materials
 * (app/api/admin/generate/route.ts), plus the accuracy rules that go with it.
 *
 * Everything here is generated from lib/braille: cells from ueb.ts, dot wording from prose.ts,
 * examples from transcribe.ts. No dot pattern is typed by hand, so the prompt cannot drift from
 * what the rest of the site teaches.
 */
import {
  type Cell,
  type ContractionKind,
  type Sign,
  ALL_DOTS,
  ALPHABET,
  CONTRACTIONS,
  CONTRACTION_KIND_LABELS,
  DIGITS_IN_ORDER,
  DIGIT_CELLS,
  DIGIT_LETTER,
  INDICATORS,
  LETTER_CELLS,
  PUNCTUATION,
  RULEBOOK,
  SYMBOLS,
  cellsKey,
  dotPosition,
} from '@/lib/braille/ueb';
import { describeCell, describeCells, renderProse } from '@/lib/braille/prose';
import { contractionsWithCells, sharedSignGroups } from '@/lib/braille/shared';
import { transcribe } from '@/lib/braille/transcribe';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const REFERENCE_START = '=== BRAILLE REFERENCE DATA (ground truth: do NOT guess dot patterns) ===';
export const REFERENCE_END = '=== END BRAILLE REFERENCE DATA ===';

/** Which contraction kinds each level is given. Beginner material is uncontracted. */
export const CONTRACTION_KINDS_BY_LEVEL: Readonly<Record<Difficulty, readonly ContractionKind[]>> = {
  beginner: [],
  intermediate: ['alphabetic-wordsign', 'strong-wordsign', 'strong-contraction', 'strong-groupsign'],
  advanced: [
    'alphabetic-wordsign',
    'strong-wordsign',
    'strong-contraction',
    'strong-groupsign',
    'lower-wordsign',
    'lower-groupsign',
  ],
};

/** Print strings used as worked examples in the reference block (all uncontracted). */
export const REFERENCE_EXAMPLES: readonly string[] = ['Hello', 'USA', '2024', '3b', 'Is it 5?'];

function rule(r: string): string {
  return `[ICEB ${r}]`;
}

function signLine(sign: Sign): string {
  const print = sign.print ? ` (${sign.print})` : '';
  const usage = sign.usage ? ` — ${sign.usage}` : '';
  return `  ${sign.name}${print}: ${describeCells(sign.cells)} ${rule(sign.rule)}${usage}`;
}

/** The cell layout, generated from dotPosition. */
function cellLayoutLines(): string[] {
  const at = (column: 1 | 2, row: 1 | 2 | 3) =>
    ALL_DOTS.find((d) => {
      const p = dotPosition(d);
      return p.column === column && p.row === row;
    })!;
  const left: Cell = ALL_DOTS.filter((d) => dotPosition(d).column === 1);
  const right: Cell = ALL_DOTS.filter((d) => dotPosition(d).column === 2);
  return [
    'The braille cell has six dots in two columns of three:',
    ...([1, 2, 3] as const).map((row) => `  ${at(1, row)} ${at(2, row)}`),
    `Left column, top to bottom: ${describeCell(left)}. Right column, top to bottom: ${describeCell(right)}.`,
  ];
}

/** Alphabetic wordsigns whose letter is NOT the first letter of the word (e.g. "it", "as"). */
export function wordsignsNotFirstLetter(): { word: string; letter: string }[] {
  return CONTRACTIONS.filter((c) => c.kind === 'alphabetic-wordsign')
    .map((c) => ({ word: c.text, letter: ALPHABET.find((l) => cellsKey([LETTER_CELLS[l]]) === cellsKey(c.cells))! }))
    .filter(({ word, letter }) => word[0] !== letter);
}

function contractionLines(kinds: readonly ContractionKind[]): string[] {
  if (kinds.length === 0) {
    return [
      '--- Contractions ---',
      '  Not used at this level. Beginner material is uncontracted (grade 1) braille: every word is spelled letter by letter.',
    ];
  }
  const lines = ['--- Contractions (UEB contracted braille, ICEB section 10) ---'];
  for (const kind of kinds) {
    lines.push('', `  ${CONTRACTION_KIND_LABELS[kind]}s:`);
    for (const c of CONTRACTIONS.filter((x) => x.kind === kind)) {
      let letterNote = '';
      if (kind === 'alphabetic-wordsign') {
        const letter = ALPHABET.find((l) => cellsKey([LETTER_CELLS[l]]) === cellsKey(c.cells))!;
        letterNote = ` (the letter ${letter})`;
      }
      lines.push(`    "${c.text}": ${describeCells(c.cells)}${letterNote} ${rule(c.rule)} — ${c.usage}`);
    }
  }
  const odd = wordsignsNotFirstLetter();
  if (kinds.includes('alphabetic-wordsign') && odd.length > 0) {
    lines.push(
      '',
      `  WARNING: an alphabetic wordsign is not always the first letter of its word: ${odd
        .map(({ word, letter }) => `"${word}" is the letter ${letter}`)
        .join(', ')}.`,
    );
  }
  return lines;
}

/** Cells that mean different things depending on position: the model must not mix them up. */
function sharedCellLines(withContractions: boolean): string[] {
  const lines = ['--- Signs that share a cell (context decides the meaning) ---'];
  for (const group of sharedSignGroups()) {
    lines.push(`  ${describeCells(group[0].cells)}: ${group.map((s) => s.name).join(' / ')}`);
  }
  if (withContractions) {
    const singles = [...Object.values(PUNCTUATION), ...Object.values(SYMBOLS)].filter((s) => s.cells.length === 1);
    for (const s of singles) {
      const texts = [...new Set(contractionsWithCells(s.cells).map((c) => `"${c.text}"`))];
      if (texts.length > 0) lines.push(`  ${describeCells(s.cells)}: ${s.name} / contraction ${texts.join(', ')}`);
    }
  }
  return lines;
}

/** The reference block for one difficulty level. */
export function buildBrailleReference(difficulty: Difficulty): string {
  const kinds = CONTRACTION_KINDS_BY_LEVEL[difficulty];
  const lines: string[] = [
    REFERENCE_START,
    '',
    `Braille code: Unified English Braille (UEB), as defined by ${RULEBOOK.publisher}, "${RULEBOOK.title}", ${RULEBOOK.edition}.`,
    'Teach UEB only. Do not use English Braille American Edition (the older US code that UEB replaced) or a separate',
    'mathematics braille code: several of their signs differ from UEB. Use UEB names for indicators (for example',
    `"${INDICATORS.numeric.name}", "${INDICATORS.grade1Symbol.name}", "${INDICATORS.capitalLetter.name}").`,
    '',
    `How to write dot numbers: list the raised dots in ascending order, like "${describeCell(LETTER_CELLS.h)}" (this is how this`,
    'reference writes them). For a sign of more than one cell, write each cell in order joined by "then", like',
    `"${describeCells(INDICATORS.capitalsTerminator.cells)}". Do not output Unicode braille characters; describe cells with dot numbers.`,
    '',
    ...cellLayoutLines(),
    '',
    '--- Letters [ICEB 4.1] ---',
    ...ALPHABET.map((l) => `  Letter ${l}: ${describeCell(LETTER_CELLS[l])}`),
    '',
    '--- Numbers [ICEB section 6] ---',
    signLine(INDICATORS.numeric),
    ...DIGITS_IN_ORDER.map(
      (d) =>
        `  Digit ${d}: ${describeCells([INDICATORS.numeric.cells[0], DIGIT_CELLS[d]])} (${INDICATORS.numeric.name}, then the cell of the letter ${DIGIT_LETTER[d]})`,
    ),
    `  In a number with several digits the ${INDICATORS.numeric.name} is written once, before the first digit.`,
    '',
    '--- Indicators [ICEB sections 5, 6, 8 and 9] ---',
    ...Object.values(INDICATORS).map(signLine),
    '  Script, transcriber-defined and passage-level typeform indicators [ICEB 9.2–9.5] are not listed here: do not',
    '  state dot numbers for them; tell the reader to look them up in the rulebook.',
    '',
    '--- Uncontracted (grade 1) convention [ICEB 5.11.1] ---',
    '  In uncontracted text, a letter standing alone is written as just the letter, with no grade 1 indicator.',
    `  The ${INDICATORS.grade1Symbol.name} is needed only for a lowercase letter a to j right after a digit (and for a`,
    '  question mark in an unusual position).',
    '',
    '--- Worked examples (uncontracted UEB) ---',
    ...REFERENCE_EXAMPLES.map((p) => `  Example "${p}": ${describeCells(transcribe(p))}`),
    '',
    '--- Punctuation [ICEB section 7] ---',
    ...Object.values(PUNCTUATION).map(signLine),
    '',
    '--- Symbols [ICEB section 3] ---',
    ...Object.values(SYMBOLS).map(signLine),
    '',
    ...sharedCellLines(kinds.length > 0),
    '',
    ...contractionLines(kinds),
    '',
    REFERENCE_END,
  ];
  return lines.join('\n');
}

/** Level guidelines plus the accuracy rules that apply to every level. */
export function buildPedagogicalPreamble(difficulty: Difficulty): string {
  const common = [
    'CRITICAL ACCURACY RULES (apply to all content you generate):',
    '- The braille code is Unified English Braille (UEB). ALWAYS verify dot patterns against the reference data provided below.',
    '- NEVER guess or invent dot patterns from memory — use ONLY the reference data. If a sign is not in the reference, do not give its dots.',
    renderProse(
      '- ALWAYS include dot numbers when you name a braille sign (e.g., "The letter A is {letter:a}", "The letter B is {letter:b}").',
    ),
    '- When describing a braille cell, specify which dots are raised, in ascending order.',
    '- In uncontracted material, a letter standing alone is just the letter (no grade 1 indicator).',
    '',
  ].join('\n');

  const odd = wordsignsNotFirstLetter()
    .map(({ word, letter }) => `"${word}" uses the letter ${letter}`)
    .join(' and ');

  const levelGuidelines: Record<Difficulty, string> = {
    beginner: [
      'PEDAGOGICAL GUIDELINES — BEGINNER LEVEL:',
      '- Use ONLY uncontracted (grade 1) braille. Do NOT introduce any contractions.',
      '- Always include dot numbers for every letter or symbol introduced.',
      '- Start with simple, familiar letters (A, B, C, L) before moving to complex ones.',
      '- Use short, familiar words (cat, bag, bed, all) for practice.',
      '- Limit to 3-5 new characters or concepts per section.',
      '- Build from single letters → short words → simple sentences.',
      '- Include the six-dot cell diagram explanation early in the material.',
      '',
    ].join('\n'),
    intermediate: [
      'PEDAGOGICAL GUIDELINES — INTERMEDIATE LEVEL:',
      '- Introduce common contractions of UEB contracted (grade 2) braille, building on uncontracted braille.',
      '- Introduce alphabetic wordsigns (e.g., b = "but", c = "can") and strong contractions (e.g., "and", "the", "for").',
      `- Relate alphabetic wordsigns to their letters, but check the reference: not every wordsign uses its first letter (${odd}).`,
      '- Include 5-8 new concepts per section.',
      '- Provide context for when contractions are used vs. spelled out.',
      '- Include dot numbers for all new contractions introduced.',
      '',
    ].join('\n'),
    advanced: [
      'PEDAGOGICAL GUIDELINES — ADVANCED LEVEL:',
      '- Emphasize UEB contracted (grade 2) braille throughout.',
      '- Include strong groupsigns (ch, gh, sh, th, wh, ed, er, ou, ow, st, ar, ing) and lower groupsigns and wordsigns.',
      '- Cover context-dependent rules and exceptions (e.g., when a contraction cannot be used).',
      '- Use full sentences and longer passages for practice.',
      '- Include 8-12 concepts per section.',
      '- Address real-world reading and writing scenarios.',
      '',
    ].join('\n'),
  };

  return levelGuidelines[difficulty] + common;
}

/** Worked example strings used inside the format prompts (generated, never typed). */
export const PROMPT_EXAMPLES = {
  brailleToPrint: renderProse('{ "prompt": "What letter is represented by {letter:b}?", "answer": "B" }'),
  printToBraille: renderProse('{ "prompt": "Write the dot numbers for the letter F.", "answer": "{letter:f}" }'),
  dotIdentification: renderProse(
    '{ "prompt": "A cell has the top-left and middle-left dots raised. Which dot numbers are these?", "answer": "{letter:b}" }',
  ),
  dotDescription: renderProse('"{letter:b}"'),
};
