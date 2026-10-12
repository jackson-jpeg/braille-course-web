/**
 * The "BRAILLE REFERENCE DATA" block given to the AI model that drafts teaching materials
 * (app/api/admin/generate/route.ts), plus the rules that go with it.
 *
 * The model never writes dot numbers or braille characters. This block gives it the names and ids
 * of the signs and the tokens it uses instead ({dots:numeric}, {letter:b}, …); worksheet items that
 * show braille carry only their print. lib/ai-content-sanitizer.ts renders the tokens from lib/braille
 * and removes anything else that looks like a dot claim. The block itself contains no dot numbers
 * (tested), so it cannot teach the model a pattern, right or wrong.
 */
import {
  type ContractionKind,
  type Sign,
  ALPHABET,
  CONTRACTIONS,
  CONTRACTION_KIND_LABELS,
  DIGITS_IN_ORDER,
  DIGIT_LETTER,
  INDICATORS,
  LETTER_CELLS,
  PUNCTUATION,
  RULEBOOK,
  SYMBOLS,
  cellsKey,
} from '@/lib/braille/ueb';
import { contractionsWithCells, sharedSignGroups } from '@/lib/braille/shared';

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

function rule(r: string): string {
  return `[ICEB ${r}]`;
}

/** One catalog line: the token id, the sign's name and print, its rule and usage. Never its dots. */
function signLine(sign: Sign): string {
  const print = sign.print ? ` (${sign.print})` : '';
  const usage = sign.usage ? ` — ${sign.usage}` : '';
  return `  ${sign.id}: ${sign.name}${print} ${rule(sign.rule)}${usage}`;
}

/** Facts the model may cite with {fact:NAME} (rendered by lib/braille/prose.ts). */
export const FACT_TOKENS: Readonly<Record<string, string>> = {
  firstDecadeDots: 'the dots that the letters a to j are made from',
  secondDecadeAdds: 'the dot added to a–j to make k–t',
  secondDecadeAddsPlace: 'where that dot sits in the cell (e.g. "bottom-left")',
  thirdDecadeAdds: 'the dots added to a–e to make u, v, x, y, z',
  wAddsToJ: 'what w adds to j (w is the exception to the pattern)',
  firstDecadeMirrors: 'pairs of letters in a–j that are mirror images',
  leftColumn: 'the dots of the left column',
  rightColumn: 'the dots of the right column',
  topRow: 'the dots of the top row',
};

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
  const lines = ['--- Contractions (UEB contracted braille, ICEB section 10). Token id: contraction:TEXT ---'];
  for (const kind of kinds) {
    lines.push('', `  ${CONTRACTION_KIND_LABELS[kind]}s:`);
    const seen = new Set<string>();
    for (const c of CONTRACTIONS.filter((x) => x.kind === kind)) {
      if (seen.has(c.text)) continue;
      seen.add(c.text);
      let letterNote = '';
      if (kind === 'alphabetic-wordsign') {
        const letter = ALPHABET.find((l) => cellsKey([LETTER_CELLS[l]]) === cellsKey(c.cells))!;
        letterNote = ` (the letter ${letter})`;
      }
      lines.push(`    "${c.text}"${letterNote} ${rule(c.rule)} — ${c.usage}`);
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

/** Signs that share a cell, by name only: the model must not mix them up. */
function sharedCellLines(withContractions: boolean): string[] {
  const lines = ['--- Signs that share a cell (context decides the meaning) ---'];
  for (const group of sharedSignGroups()) lines.push(`  same cell: ${group.map((s) => s.name).join(' / ')}`);
  if (withContractions) {
    const singles = [...Object.values(PUNCTUATION), ...Object.values(SYMBOLS)].filter((s) => s.cells.length === 1);
    for (const s of singles) {
      const texts = [...new Set(contractionsWithCells(s.cells).map((c) => `"${c.text}"`))];
      if (texts.length > 0) lines.push(`  same cell: ${s.name} / contraction ${texts.join(', ')}`);
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
    'Teach UEB only. Do not mention or use the older US literary code that UEB replaced or a separate mathematics',
    'braille code: several of their signs differ from UEB. Use UEB names for indicators (for example',
    `"${INDICATORS.numeric.name}", "${INDICATORS.grade1Symbol.name}", "${INDICATORS.capitalLetter.name}").`,
    '',
    'YOU NEVER WRITE BRAILLE. Do not write dot numbers in any form (digits, words, "positions", lists) and do not',
    'output Unicode braille characters. The site draws every cell and writes every dot description itself, from its',
    'own verified data. Anything else that looks like a dot claim is deleted before the document is built.',
    '',
    'To say which dots a sign has, write a token and the site fills in the words:',
    '  {dots:ID}    the dots of a sign, by its id below          e.g. "The numeric indicator is {dots:numeric}."',
    '  {letter:x}   the dots of a letter                          e.g. "The letter b is {letter:b}."',
    '  {name:ID}    the UEB name of a sign',
    '  {digit:N}    the letter a digit shares its cell with       e.g. "1 is written like {digit:1}"',
    '  {lowered:ID} the letter a–j a lower punctuation sign is a lowered form of',
    '  {fact:NAME}  a pattern of the alphabet (names below)',
    ...(kinds.length === 0
      ? ['  {uebdots:TEXT} the dots of a short print word or number, cell by cell (uncontracted)']
      : []),
    'An unknown token, or one used at the wrong level, deletes its sentence. Never write the dots yourself.',
    '',
    'Worksheet items that show braille (braille-to-print, print-to-braille, dot-identification, practice-drill) give',
    'ONLY the print in a "print" field: a letter, a number or a single word. The site writes the prompt, draws the',
    "cells and writes the answer for the worksheet's grade. Do not describe the braille in the prompt or answer.",
    '',
    '--- Facts for {fact:NAME} ---',
    ...Object.entries(FACT_TOKENS).map(([k, v]) => `  ${k}: ${v}`),
    '',
    '--- Letters [ICEB 4.1]: use {letter:a} … {letter:z} ---',
    '',
    '--- Numbers [ICEB section 6] ---',
    signLine(INDICATORS.numeric),
    `  Digits 1 to 9 and 0 are the ${INDICATORS.numeric.name} followed by the letters a to j: ${DIGITS_IN_ORDER.map(
      (d) => `${d}=${DIGIT_LETTER[d]}`,
    ).join(', ')}. Token ids digit-1 … digit-0.`,
    `  In a number with several digits the ${INDICATORS.numeric.name} is written once, before the first digit.`,
    '',
    '--- Indicators [ICEB sections 5, 6, 8 and 9] ---',
    ...Object.values(INDICATORS).map(signLine),
    '  Script, transcriber-defined and passage-level typeform indicators [ICEB 9.2–9.5] are not listed: do not',
    '  describe them; tell the reader to look them up in the rulebook.',
    '',
    '--- Uncontracted (grade 1) convention [ICEB 5.11.1] ---',
    '  In uncontracted text, a letter standing alone is written as just the letter, with no grade 1 indicator.',
    `  The ${INDICATORS.grade1Symbol.name} is needed only for a lowercase letter a to j right after a digit (and for a`,
    '  question mark in an unusual position).',
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

/** Level guidelines plus the rules that apply to every level. */
export function buildPedagogicalPreamble(difficulty: Difficulty): string {
  const common = [
    'CRITICAL ACCURACY RULES (apply to all content you generate):',
    '- The braille code is Unified English Braille (UEB).',
    '- NEVER write dot numbers or braille characters. When you name a sign and want its dots shown, write a token',
    '  from the reference ("The letter b is {letter:b}.", "The numeric indicator is {dots:numeric}.").',
    '- Braille worksheet items carry only a "print" field; the site generates their braille.',
    '- In uncontracted material, a letter standing alone is just the letter (no grade 1 indicator).',
    '',
  ].join('\n');

  const odd = wordsignsNotFirstLetter()
    .map(({ word, letter }) => `"${word}" uses the letter ${letter}`)
    .join(' and ');

  const levelGuidelines: Record<Difficulty, string> = {
    beginner: [
      'PEDAGOGICAL GUIDELINES — BEGINNER LEVEL (uncontracted braille):',
      '- Use ONLY uncontracted (grade 1) braille. Do NOT introduce any contractions.',
      '- Show the dots (with tokens) for every letter or symbol introduced.',
      '- Start with simple, familiar letters (a, b, c, l) before moving to complex ones.',
      '- Use short, familiar words (cat, bag, bed, all) for practice.',
      '- Limit to 3-5 new characters or concepts per section.',
      '- Build from single letters → short words → simple sentences.',
      '- Include the six-dot cell explanation early in the material.',
      '',
    ].join('\n'),
    intermediate: [
      'PEDAGOGICAL GUIDELINES — INTERMEDIATE LEVEL (contracted braille):',
      '- Introduce common contractions of UEB contracted (grade 2) braille, building on uncontracted braille.',
      '- Introduce alphabetic wordsigns (e.g., b = "but", c = "can") and strong contractions (e.g., "and", "the", "for").',
      `- Relate alphabetic wordsigns to their letters, but check the reference: not every wordsign uses its first letter (${odd}).`,
      '- Include 5-8 new concepts per section.',
      '- Provide context for when contractions are used vs. spelled out.',
      '- Show the dots of new contractions with {dots:contraction:TEXT}.',
      '',
    ].join('\n'),
    advanced: [
      'PEDAGOGICAL GUIDELINES — ADVANCED LEVEL (contracted braille):',
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

/** Worked examples used inside the format prompts: print and tokens only, never dots. */
export const PROMPT_EXAMPLES = {
  brailleToPrint: '{ "print": "bed" }',
  printToBraille: '{ "print": "cat" }',
  dotIdentification: '{ "print": "f" }',
  practiceDrill: '{ "prompt": "Say each letter as you write this word.", "print": "bag" }',
  tokenSentence: 'The letter b is {letter:b}.',
};
