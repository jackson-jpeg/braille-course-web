/**
 * Words for the Contraction Sprint game, written in contracted (grade 2) UEB.
 *
 * Each word is the list of pieces a braille reader sees: plain letters, or contractions from
 * lib/braille/ueb.ts CONTRACTIONS. The cells are built by contractedWord() and every word is
 * checked cell by cell against liblouis en-ueb-g2.ctb (see lib/games/contraction-sprint.ts
 * brailleInventory and __tests__/braille/liblouis-oracle.test.ts).
 *
 * Only words whose real contracted form uses nothing but the contractions this site teaches are
 * listed. Words that need an initial-letter contraction (mother, father, there, where, some...),
 * a final-letter groupsign (song, found...) or a shortform (such, much, together, children...)
 * are deliberately left out: showing them spelled with other signs would teach a wrong form.
 *
 * Spec format: pieces separated by spaces. Inside a longer word, "be" and "in" are the lower
 * groupsigns (ICEB 10.6.2, 10.6.8); standing alone they are the lower wordsigns (10.5).
 */
import { type ContractedWord, contractedWord } from '@/lib/braille/contracted';
import { CONTRACTIONS } from '@/lib/braille/ueb';

function pieceSpec(p: string, pieceCount: number): string {
  if (pieceCount > 1 && (p === 'be' || p === 'in')) return `${p}/lower-groupsign`;
  return p;
}

function word(spec: string): ContractedWord {
  const parts = spec.split(' ');
  return contractedWord(
    parts.join(''),
    parts.map((p) => pieceSpec(p, parts.length)),
  );
}

/**
 * Whole words that are a single contraction standing alone: the alphabetic wordsigns (10.1),
 * strong wordsigns (10.2), strong contractions used as words (10.3) and lower wordsigns (10.5).
 */
export const standaloneWords: readonly ContractedWord[] = [
  ...new Set(
    CONTRACTIONS.filter((c) =>
      ['alphabetic-wordsign', 'strong-wordsign', 'strong-contraction', 'lower-wordsign'].includes(c.kind),
    ).map((c) => c.text),
  ),
].map((t) => contractedWord(t, [t]));

/** Words that combine letters with one or more contractions. */
export const contractionWords: readonly ContractedWord[] = [
  // Strong groupsigns (10.4) and strong contractions inside words (10.3)
  'b a th',
  'ch a t',
  'sh i p',
  'sh o p',
  'f i sh',
  'w i sh',
  'r i ch',
  'ch o p',
  'ch i p',
  'l u n ch',
  'c a sh',
  'b r u sh',
  'sh e e p',
  'ch a n g e',
  'ch u r ch',
  'ch e er',
  'th a n',
  'th ing',
  's ing',
  'k ing',
  'b r ing',
  'st ing',
  'st r ing',
  'sh ow',
  's n ow',
  'g r ow',
  't ow n',
  'c ow',
  'ow n',
  'sh ow ing',
  'sh ow er',
  'st ar',
  'c ar',
  'c ar d',
  'f ar m',
  'p ar k',
  'st ar t',
  'st ar ing',
  'st o p',
  'f a st',
  'n e st',
  'h er',
  'o v er',
  'w a t er',
  'p a p er',
  'r ed',
  'b ed',
  'sh ed',
  'p l a y ed',
  'j u m p ed',
  'w i sh ed',
  'l ou d',
  'h ou s e',
  'sh ou t',
  'th ou s and',
  'n i gh t',
  'l i gh t',
  'h i gh',
  'gh o st',
  'wh a t',
  'wh y',
  'wh i t e',
  'wh i p',
  'st and',
  's and',
  'h and',
  'c and y',
  'the m',
  'the n',
  'the y',
  'o the r',
  'b r o the r',
  'wh e the r',
  'of f',
  'of f er',
  'for m',
  'for g e t',
  'for e st',
  'with in',
  'with ou t',
  // Lower groupsigns (10.6)
  'b r ea d',
  'h ea d',
  'r ea d',
  'r ea ch',
  't ea ch',
  't ea ch ing',
  'm ea t',
  'c l ea n',
  'd r ea m',
  'l ea f',
  'wh ea t',
  'w ea the r',
  'r a bb i t',
  'r i bb o n',
  'h o bb y',
  'r o bb er',
  'b u bb l e',
  'a cc e p t',
  'a cc en t',
  'o cc u r',
  's o cc er',
  'g i r a ff e',
  'd i ff er en t',
  'b i gg er',
  'd r a gg ed',
  'e gg s',
  'g i gg l e',
  's u gg e st',
  'be g in',
  'be c a m e',
  'be l i e v e',
  'con t a in',
  'con c er t',
  'con n e c t',
  'con t r o l',
  'con t e st',
  'dis c o v er',
  'dis m i s s',
  'dis l i k e',
  'dis t a n t',
  'en t er',
  'en j o y',
  't en t',
  'w en t',
  'p en',
  's e v en',
  'o p en',
  'of t en',
  'w o m en',
  'c en t er',
  's p en d',
  'b en ch',
  'in s i d e',
  'in t o',
  'p r in t',
  'f in i sh',
  'th in',
  'th in k',
  'th in k ing',
  'ch in',
  's k in',
  'w in d',
  'f in d',
  'in t er e st',
].map(word);
