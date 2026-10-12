/**
 * The uncontracted transcriber (lib/braille/transcribe.ts) against verbatim ICEB rulebook examples
 * and the known traps. liblouis comparisons for all site content are in liblouis-oracle.test.ts.
 */
import examples from '../fixtures/iceb-rulebook-examples.json';
import { transcribe, transcribeToUnicode, transcribeTokens, TranscriptionError } from '@/lib/braille/transcribe';
import { INDICATORS, cellsToUnicode } from '@/lib/braille/ueb';

const U = (s: string) => transcribeToUnicode(s).replace(/⠀/g, ' ');

describe('ICEB rulebook worked examples (uncontracted) are reproduced exactly', () => {
  test.each(examples.examples.map((e) => [e.rule, e.print, e.braille]))('%s  %s', (_rule, print, braille) => {
    // The rulebook prints straight apostrophes in some examples; the site uses ’ for them.
    expect(U(print)).toBe(braille);
  });
});

describe('Trap 2: the four capitals indicators', () => {
  test('capital letter indicator: one capital letter', () => {
    expect(U('Sam')).toBe('⠠⠎⠁⠍');
    expect(U('I')).toBe('⠠⠊');
  });
  test('capitalized word indicator: a whole word in capitals', () => {
    expect(U('CAT')).toBe('⠠⠠⠉⠁⠞');
    expect(U('OK')).toBe('⠠⠠⠕⠅');
  });
  test('capitalized word indicator ends at a non-letter (8.4.2)', () => {
    expect(U('DON’T')).toBe('⠠⠠⠙⠕⠝⠄⠠⠞');
    expect(U('X-RAY')).toBe('⠠⠭⠤⠠⠠⠗⠁⠽');
  });
  test('capitalized passage indicator: three or more capitalized words, ended by the terminator', () => {
    expect(U('I LOVE MY DOG')).toBe('⠠⠠⠠⠊ ⠇⠕⠧⠑ ⠍⠽ ⠙⠕⠛⠠⠄');
    expect(U('WE WIN TODAY! now')).toBe('⠠⠠⠠⠺⠑ ⠺⠊⠝ ⠞⠕⠙⠁⠽⠖⠠⠄ ⠝⠕⠺');
  });
  test('two capitalized words are two capitalized word indicators, not a passage', () => {
    expect(U('BIG DOG')).toBe('⠠⠠⠃⠊⠛ ⠠⠠⠙⠕⠛');
  });
  test('capitals terminator inside a word (8.6.3)', () => {
    expect(U('ABCs')).toBe('⠠⠠⠁⠃⠉⠠⠄⠎');
  });
  test('the four indicators are distinct and come from the data', () => {
    const tokens = transcribeTokens('Sam SAW I LOVE MY DOG ABCs');
    const ids = new Set(tokens.filter((t) => t.kind === 'indicator').map((t) => t.signId));
    expect(ids).toEqual(new Set(['capitalLetter', 'capitalWord', 'capitalPassage', 'capitalsTerminator']));
    for (const t of tokens.filter((x) => x.kind === 'indicator'))
      expect(t.cells).toEqual(INDICATORS[t.signId as keyof typeof INDICATORS].cells);
  });
  test('a word with a lowercase letter breaks a passage (each capitalized word then takes its own indicator)', () => {
    expect(U('ONE TWo THREE')).toBe('⠠⠠⠕⠝⠑ ⠠⠠⠞⠺⠠⠄⠕ ⠠⠠⠞⠓⠗⠑⠑');
    expect(U('ONE TWO THREE four FIVE')).toBe('⠠⠠⠠⠕⠝⠑ ⠞⠺⠕ ⠞⠓⠗⠑⠑⠠⠄ ⠋⠕⠥⠗ ⠠⠠⠋⠊⠧⠑');
  });
});

describe('Trap 3: numbers', () => {
  test('numeric indicator then a–j', () => {
    expect(U('2026')).toBe('⠼⠃⠚⠃⠋');
    expect(U('10')).toBe('⠼⠁⠚');
  });
  test('one numeric indicator covers commas and decimal points inside a number', () => {
    expect(U('1,000')).toBe('⠼⠁⠂⠚⠚⠚');
    expect(U('3.14')).toBe('⠼⠉⠲⠁⠙');
    expect(U('12,345.67')).toBe('⠼⠁⠃⠂⠉⠙⠑⠲⠋⠛');
  });
  test('a comma or period after a number that is not followed by a digit is punctuation', () => {
    expect(U('I have 3, you have 4.')).toBe('⠠⠊ ⠓⠁⠧⠑ ⠼⠉⠂ ⠽⠕⠥ ⠓⠁⠧⠑ ⠼⠙⠲');
  });
  test('grade 1 indicator before a lowercase a–j right after a digit, not before k–z or capitals', () => {
    expect(U('5a')).toBe('⠼⠑⠰⠁');
    expect(U('4j')).toBe('⠼⠙⠰⠚');
    expect(U('5k')).toBe('⠼⠑⠅');
    expect(U('5A')).toBe('⠼⠑⠠⠁');
    expect(U('3rd')).toBe('⠼⠉⠗⠙');
  });
  test('a space or other symbol ends numeric mode, so the next number needs its own indicator', () => {
    expect(U('3 4')).toBe('⠼⠉ ⠼⠙');
    expect(U('3-4')).toBe('⠼⠉⠤⠼⠙');
    expect(U('3:45')).toBe('⠼⠉⠒⠼⠙⠑');
  });
});

describe('Trap 4: shared cells', () => {
  test('question mark and opening quotation mark share ⠦; position tells them apart', () => {
    expect(U('“Hi?”')).toBe('⠦⠠⠓⠊⠦⠴');
  });
  test('a question mark in an unusual position takes the grade 1 indicator (7.5.3, 5.11.1)', () => {
    expect(U('Is it ? or !')).toBe('⠠⠊⠎ ⠊⠞ ⠰⠦ ⠕⠗ ⠖');
  });
});

describe('Trap 5: uncontracted convention for letters standing alone', () => {
  // ICEB 5.11.1: in a work entirely in grade 1 braille, grade 1 indicators are not used except
  // for a lowercase a–j after a digit and a question mark in an unusual position.
  test('a single letter standing alone is the plain letter, never with a grade 1 indicator', () => {
    for (const l of 'bcdefghjklmnpqrstuvwxyz') expect(U(l)).toBe(cellsToUnicode(transcribe(l)));
    expect(U('b')).toBe('⠃');
    expect(U('x marks the spot')).toBe('⠭ ⠍⠁⠗⠅⠎ ⠞⠓⠑ ⠎⠏⠕⠞');
    expect(U('C is for candy.')).toBe('⠠⠉ ⠊⠎ ⠋⠕⠗ ⠉⠁⠝⠙⠽⠲');
  });
  test('no grade 1 indicator appears anywhere except after a digit or before an unusual question mark', () => {
    const samples = ['b c d', 'a b c d e f g h i j', 'you can do it', 'Ask about it.'];
    for (const s of samples) expect(U(s)).not.toContain('⠰');
  });
  test('words are spelled letter by letter, never contracted', () => {
    expect(U('the')).toBe('⠞⠓⠑');
    expect(U('and')).toBe('⠁⠝⠙');
    expect(U('knowledge')).toBe('⠅⠝⠕⠺⠇⠑⠙⠛⠑');
  });
});

describe('unsupported input is refused, never guessed', () => {
  test.each(['é', '#', '*', '[x]', '😀'])('%s throws', (s) => {
    expect(() => transcribe(s)).toThrow(TranscriptionError);
  });
});
