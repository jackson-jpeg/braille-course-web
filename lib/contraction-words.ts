/**
 * Word lists for Contraction Sprint game.
 * Each word maps to its contracted braille representation.
 *
 * Every word's pieces are checked against liblouis's UEB grade 2 translation in
 * __tests__/lib/ueb.test.ts. Words that need contractions this game does not teach
 * (initial-letter contractions like "mother", shortforms like "together") are left out.
 *
 * - Wordsigns (but, can, child, this…) stand for whole words
 * - Strong contractions (and, for, of, the, with) are used as words AND inside words ("them")
 * - Groupsigns (ch, th, er, ing, ea…) appear within words
 * - Single letters use uppercase: 'A', 'B', etc.
 */

export interface ContractionWord {
  word: string;
  /** Array of pieces: uppercase letter or contraction/groupsign label */
  pieces: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const contractionWords: ContractionWord[] = [
  // ── Beginner: single-cell wordsigns (whole word = one braille cell) ──
  { word: 'BUT', pieces: ['but'], difficulty: 'beginner' },
  { word: 'CAN', pieces: ['can'], difficulty: 'beginner' },
  { word: 'DO', pieces: ['do'], difficulty: 'beginner' },
  { word: 'EVERY', pieces: ['every'], difficulty: 'beginner' },
  { word: 'FROM', pieces: ['from'], difficulty: 'beginner' },
  { word: 'GO', pieces: ['go'], difficulty: 'beginner' },
  { word: 'HAVE', pieces: ['have'], difficulty: 'beginner' },
  { word: 'JUST', pieces: ['just'], difficulty: 'beginner' },
  { word: 'LIKE', pieces: ['like'], difficulty: 'beginner' },
  { word: 'MORE', pieces: ['more'], difficulty: 'beginner' },
  { word: 'NOT', pieces: ['not'], difficulty: 'beginner' },
  { word: 'PEOPLE', pieces: ['people'], difficulty: 'beginner' },
  { word: 'RATHER', pieces: ['rather'], difficulty: 'beginner' },
  { word: 'SO', pieces: ['so'], difficulty: 'beginner' },
  { word: 'THAT', pieces: ['that'], difficulty: 'beginner' },
  { word: 'VERY', pieces: ['very'], difficulty: 'beginner' },
  { word: 'WILL', pieces: ['will'], difficulty: 'beginner' },
  { word: 'YOU', pieces: ['you'], difficulty: 'beginner' },
  { word: 'IT', pieces: ['it'], difficulty: 'beginner' },
  { word: 'US', pieces: ['us'], difficulty: 'beginner' },
  { word: 'AS', pieces: ['as'], difficulty: 'beginner' },

  // ── Intermediate: strong contractions + groupsign words ──
  { word: 'AND', pieces: ['and'], difficulty: 'intermediate' },
  { word: 'FOR', pieces: ['for'], difficulty: 'intermediate' },
  { word: 'THE', pieces: ['the'], difficulty: 'intermediate' },
  { word: 'WITH', pieces: ['with'], difficulty: 'intermediate' },
  { word: 'OF', pieces: ['of'], difficulty: 'intermediate' },
  // Groupsign words: ch, th, sh, wh, er, ing, st, ar, ou, ow, ed
  { word: 'CHILD', pieces: ['child'], difficulty: 'intermediate' },
  { word: 'OTHER', pieces: ['O', 'the', 'R'], difficulty: 'intermediate' },
  { word: 'THING', pieces: ['th', 'ing'], difficulty: 'intermediate' },
  { word: 'WHEN', pieces: ['wh', 'en'], difficulty: 'intermediate' },
  { word: 'SHOW', pieces: ['sh', 'ow'], difficulty: 'intermediate' },
  { word: 'STING', pieces: ['st', 'ing'], difficulty: 'intermediate' },
  { word: 'STAR', pieces: ['st', 'ar'], difficulty: 'intermediate' },
  { word: 'SHED', pieces: ['sh', 'ed'], difficulty: 'intermediate' },
  { word: 'ARCH', pieces: ['ar', 'ch'], difficulty: 'intermediate' },
  { word: 'WHICH', pieces: ['which'], difficulty: 'intermediate' },
  { word: 'THEN', pieces: ['the', 'N'], difficulty: 'intermediate' },
  { word: 'THEM', pieces: ['the', 'M'], difficulty: 'intermediate' },
  { word: 'THIS', pieces: ['this'], difficulty: 'intermediate' },
  { word: 'EACH', pieces: ['E', 'A', 'ch'], difficulty: 'intermediate' },
  { word: 'SUCH', pieces: ['S', 'ch'], difficulty: 'intermediate' },

  // ── Advanced: multi-groupsign words ──
  { word: 'WEATHER', pieces: ['W', 'ea', 'the', 'R'], difficulty: 'advanced' },
  { word: 'ANOTHER', pieces: ['A', 'N', 'O', 'the', 'R'], difficulty: 'advanced' },
  { word: 'BROTHER', pieces: ['B', 'R', 'O', 'the', 'R'], difficulty: 'advanced' },
  { word: 'NOTHING', pieces: ['N', 'O', 'th', 'ing'], difficulty: 'advanced' },
  { word: 'SHOWER', pieces: ['sh', 'ow', 'er'], difficulty: 'advanced' },
  { word: 'THOUSAND', pieces: ['th', 'ou', 'S', 'and'], difficulty: 'advanced' },
  { word: 'WISHING', pieces: ['W', 'I', 'sh', 'ing'], difficulty: 'advanced' },
  { word: 'CHURCH', pieces: ['ch', 'U', 'R', 'ch'], difficulty: 'advanced' },
  { word: 'TEACHING', pieces: ['T', 'ea', 'ch', 'ing'], difficulty: 'advanced' },
  { word: 'REACHING', pieces: ['R', 'ea', 'ch', 'ing'], difficulty: 'advanced' },
  { word: 'STARTING', pieces: ['st', 'ar', 'T', 'ing'], difficulty: 'advanced' },
  { word: 'SHOWING', pieces: ['sh', 'ow', 'ing'], difficulty: 'advanced' },
  { word: 'STARING', pieces: ['st', 'ar', 'ing'], difficulty: 'advanced' },
  { word: 'ARCHING', pieces: ['ar', 'ch', 'ing'], difficulty: 'advanced' },
  { word: 'THIRST', pieces: ['th', 'I', 'R', 'st'], difficulty: 'advanced' },
  { word: 'CHANGED', pieces: ['ch', 'A', 'N', 'G', 'ed'], difficulty: 'advanced' },
  { word: 'WISHED', pieces: ['W', 'I', 'sh', 'ed'], difficulty: 'advanced' },
  { word: 'OWNED', pieces: ['ow', 'N', 'ed'], difficulty: 'advanced' },
];

/** Get words filtered by difficulty */
export function getContractionWords(difficulty: 'beginner' | 'intermediate' | 'advanced'): ContractionWord[] {
  if (difficulty === 'beginner') {
    return contractionWords.filter((w) => w.difficulty === 'beginner');
  }
  if (difficulty === 'intermediate') {
    return contractionWords.filter((w) => w.difficulty === 'beginner' || w.difficulty === 'intermediate');
  }
  return contractionWords;
}
