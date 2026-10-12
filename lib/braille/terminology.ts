/**
 * Braille terminology the site must never teach, in one place.
 *
 * UEB replaced English Braille American Edition (EBAE) in the US in 2016, and the names changed
 * with it: the sign before digits is the numeric indicator (ICEB 6.1), the sign that sets a single
 * letter to grade 1 is the grade 1 indicator (ICEB 5.2), and the sign for a fully capitalized word
 * is the capitalized word indicator (ICEB 8.4). The older names are wrong in UEB material.
 *
 * Used by:
 *   - lib/ai-content-sanitizer.ts, to rewrite or remove these terms in AI-generated documents;
 *   - lib/braille-validator.ts, to recognize a claim written with an old name;
 *   - __tests__/braille/no-hardcoded-braille.test.ts, which fails the build if any of them appears
 *     in the site's source (outside this folder).
 */

/** Any Unicode braille pattern character (U+2800–U+28FF). */
export const BRAILLE_CHAR_RE = /[⠀-⣿]/u;

/** "number sign" is also the name of the print # symbol: that use is allowed when # is nearby. */
const NOT_ABOUT_HASH = String.raw`(?![^.!?\n]{0,30}(?:#|crosshatch|hash|pound))`;

/** A superseded term, the UEB name that replaces it, and the rule that names the UEB sign. */
export interface SupersededTerm {
  /** Matches the old term (global, case-insensitive). */
  re: RegExp;
  /** The UEB sign name to use instead (matches lib/braille/ueb.ts INDICATORS). */
  ueb: string;
  rule: string;
}

export const SUPERSEDED_TERMS: readonly SupersededTerm[] = [
  // (Not "capital letter indicator", which is the UEB name of the capital sign, ICEB 8.3.)
  { re: /(?<!capital )\bletter (?:sign|indicator)s?\b/gi, ueb: 'grade 1 indicator', rule: '5.2' },
  {
    re: /\bdouble[- ]capitals? (?:sign|indicator)s?\b|\bdouble[- ]capitals?\b/gi,
    ueb: 'capitalized word indicator',
    rule: '8.4',
  },
  {
    re: new RegExp(String.raw`\bnumber (?:sign|indicator)s?\b${NOT_ABOUT_HASH}`, 'gi'),
    ueb: 'numeric indicator',
    rule: '6.1',
  },
  { re: /\bnumeral (?:sign|indicator)s?\b/gi, ueb: 'numeric indicator', rule: '6.1' },
];

/** Names of other braille codes. The site teaches UEB only; AI text that mentions them is removed. */
export const OTHER_CODE_RE = /\bnemeth\b|\bebae\b|english braille,? american edition|\bcomputer braille code\b/i;

/**
 * Old names that a claim may use for a UEB sign, by sign id. Only for recognizing claims in AI text
 * (so "the number sign is dots …" is checked against the numeric indicator); never shown.
 */
export const SUPERSEDED_SIGN_NAMES: Readonly<Record<string, readonly string[]>> = {
  capitalWord: ['double capital indicator', 'double capital sign'],
  numeric: ['number indicator', 'number sign', 'numeral sign'],
  grade1Symbol: ['letter sign', 'letter indicator'],
};
