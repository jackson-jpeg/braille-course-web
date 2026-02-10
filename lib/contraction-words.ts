/**
 * Word lists for Contraction Sprint game.
 * Each word maps to its contracted braille representation.
 */

export interface ContractionWord {
  word: string;
  /** Array of pieces: letter or contraction label */
  pieces: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const contractionWords: ContractionWord[] = [
  // Beginner: single contraction (alphabetic wordsigns)
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

  // Intermediate: strong contractions or single groupsign + letters
  { word: 'AND', pieces: ['and'], difficulty: 'intermediate' },
  { word: 'FOR', pieces: ['for'], difficulty: 'intermediate' },
  { word: 'THE', pieces: ['the'], difficulty: 'intermediate' },
  { word: 'WITH', pieces: ['with'], difficulty: 'intermediate' },
  { word: 'CHILD', pieces: ['ch', 'I', 'L', 'do'], difficulty: 'intermediate' },
  { word: 'MOTHER', pieces: ['more', 'th', 'er'], difficulty: 'intermediate' },
  { word: 'FATHER', pieces: ['F', 'A', 'th', 'er'], difficulty: 'intermediate' },
  { word: 'OTHER', pieces: ['O', 'th', 'er'], difficulty: 'intermediate' },
  { word: 'THERE', pieces: ['the', 'R', 'E'], difficulty: 'intermediate' },
  { word: 'THING', pieces: ['th', 'ing'], difficulty: 'intermediate' },
  { word: 'WHEN', pieces: ['wh', 'E', 'N'], difficulty: 'intermediate' },
  { word: 'WHERE', pieces: ['wh', 'er', 'E'], difficulty: 'intermediate' },
  { word: 'SHOW', pieces: ['sh', 'ow'], difficulty: 'intermediate' },
  { word: 'STING', pieces: ['st', 'ing'], difficulty: 'intermediate' },
  { word: 'STAR', pieces: ['st', 'ar'], difficulty: 'intermediate' },

  // Advanced: multi-contraction words
  { word: 'TOGETHER', pieces: ['T', 'O', 'go', 'E', 'th', 'er'], difficulty: 'advanced' },
  { word: 'WEATHER', pieces: ['W', 'E', 'A', 'th', 'er'], difficulty: 'advanced' },
  { word: 'ANOTHER', pieces: ['A', 'N', 'O', 'th', 'er'], difficulty: 'advanced' },
  { word: 'BROTHER', pieces: ['B', 'R', 'O', 'th', 'er'], difficulty: 'advanced' },
  { word: 'NOTHING', pieces: ['not', 'H', 'ing'], difficulty: 'advanced' },
  { word: 'EVERYTHING', pieces: ['every', 'th', 'ing'], difficulty: 'advanced' },
  { word: 'SOMETHING', pieces: ['S', 'O', 'M', 'E', 'th', 'ing'], difficulty: 'advanced' },
  { word: 'SHOWER', pieces: ['sh', 'ow', 'er'], difficulty: 'advanced' },
  { word: 'THOUSAND', pieces: ['th', 'ou', 'S', 'and'], difficulty: 'advanced' },
  { word: 'WISHING', pieces: ['W', 'I', 'sh', 'ing'], difficulty: 'advanced' },
  { word: 'CHURCH', pieces: ['ch', 'U', 'R', 'ch'], difficulty: 'advanced' },
  { word: 'TEACHING', pieces: ['T', 'E', 'A', 'ch', 'ing'], difficulty: 'advanced' },
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
