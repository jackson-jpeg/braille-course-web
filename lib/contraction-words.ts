/**
 * Word lists for Contraction Sprint game.
 * Each word maps to its contracted braille representation.
 *
 * UEB rules enforced:
 * - Wordsigns (but, can, do, etc.) are ONLY used as standalone words
 * - Strong contractions (and, for, of, the, with) are ONLY standalone
 * - Groupsigns (ch, th, er, ing, etc.) CAN appear within words
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
  { word: 'CHILD', pieces: ['ch', 'I', 'L', 'D'], difficulty: 'intermediate' },
  { word: 'MOTHER', pieces: ['M', 'O', 'th', 'er'], difficulty: 'intermediate' },
  { word: 'FATHER', pieces: ['F', 'A', 'th', 'er'], difficulty: 'intermediate' },
  { word: 'OTHER', pieces: ['O', 'th', 'er'], difficulty: 'intermediate' },
  { word: 'THERE', pieces: ['th', 'E', 'R', 'E'], difficulty: 'intermediate' },
  { word: 'THING', pieces: ['th', 'ing'], difficulty: 'intermediate' },
  { word: 'WHEN', pieces: ['wh', 'E', 'N'], difficulty: 'intermediate' },
  { word: 'WHERE', pieces: ['wh', 'E', 'R', 'E'], difficulty: 'intermediate' },
  { word: 'SHOW', pieces: ['sh', 'ow'], difficulty: 'intermediate' },
  { word: 'STING', pieces: ['st', 'ing'], difficulty: 'intermediate' },
  { word: 'STAR', pieces: ['st', 'ar'], difficulty: 'intermediate' },
  { word: 'SHED', pieces: ['sh', 'ed'], difficulty: 'intermediate' },
  { word: 'ARCH', pieces: ['ar', 'ch'], difficulty: 'intermediate' },
  { word: 'WHICH', pieces: ['wh', 'I', 'ch'], difficulty: 'intermediate' },
  { word: 'THEN', pieces: ['th', 'E', 'N'], difficulty: 'intermediate' },
  { word: 'THEM', pieces: ['th', 'E', 'M'], difficulty: 'intermediate' },
  { word: 'THIS', pieces: ['th', 'I', 'S'], difficulty: 'intermediate' },
  { word: 'EACH', pieces: ['E', 'A', 'ch'], difficulty: 'intermediate' },
  { word: 'SUCH', pieces: ['S', 'U', 'ch'], difficulty: 'intermediate' },

  // ── Advanced: multi-groupsign words ──
  { word: 'TOGETHER', pieces: ['T', 'O', 'G', 'E', 'th', 'er'], difficulty: 'advanced' },
  { word: 'WEATHER', pieces: ['W', 'E', 'A', 'th', 'er'], difficulty: 'advanced' },
  { word: 'ANOTHER', pieces: ['A', 'N', 'O', 'th', 'er'], difficulty: 'advanced' },
  { word: 'BROTHER', pieces: ['B', 'R', 'O', 'th', 'er'], difficulty: 'advanced' },
  { word: 'NOTHING', pieces: ['N', 'O', 'th', 'ing'], difficulty: 'advanced' },
  { word: 'EVERYTHING', pieces: ['E', 'V', 'er', 'Y', 'th', 'ing'], difficulty: 'advanced' },
  { word: 'SOMETHING', pieces: ['S', 'O', 'M', 'E', 'th', 'ing'], difficulty: 'advanced' },
  { word: 'SHOWER', pieces: ['sh', 'ow', 'er'], difficulty: 'advanced' },
  { word: 'THOUSAND', pieces: ['th', 'ou', 'S', 'A', 'N', 'D'], difficulty: 'advanced' },
  { word: 'WISHING', pieces: ['W', 'I', 'sh', 'ing'], difficulty: 'advanced' },
  { word: 'CHURCH', pieces: ['ch', 'U', 'R', 'ch'], difficulty: 'advanced' },
  { word: 'TEACHING', pieces: ['T', 'E', 'A', 'ch', 'ing'], difficulty: 'advanced' },
  { word: 'REACHING', pieces: ['R', 'E', 'A', 'ch', 'ing'], difficulty: 'advanced' },
  { word: 'STARTING', pieces: ['st', 'ar', 'T', 'ing'], difficulty: 'advanced' },
  { word: 'SHOWING', pieces: ['sh', 'ow', 'ing'], difficulty: 'advanced' },
  { word: 'STARING', pieces: ['st', 'ar', 'ing'], difficulty: 'advanced' },
  { word: 'ARCHING', pieces: ['ar', 'ch', 'ing'], difficulty: 'advanced' },
  { word: 'THIRST', pieces: ['th', 'I', 'R', 'st'], difficulty: 'advanced' },
  { word: 'THEIRS', pieces: ['th', 'E', 'I', 'R', 'S'], difficulty: 'advanced' },
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
