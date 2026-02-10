/**
 * Educational braille facts and tips shown after game wins.
 */

export interface LearningTip {
  fact: string;
  category: 'history' | 'technique' | 'fun-fact' | 'encouragement';
}

const tips: LearningTip[] = [
  // History
  { fact: 'Louis Braille invented the braille system in 1824, when he was just 15 years old.', category: 'history' },
  { fact: 'Braille was inspired by a military communication system called "night writing."', category: 'history' },
  { fact: 'The braille cell has remained unchanged since 1824 — still 6 dots in a 2×3 grid.', category: 'history' },
  { fact: 'UEB (Unified English Braille) was adopted in 2012 to standardize braille worldwide.', category: 'history' },
  { fact: 'Before braille, raised print letters were used, but they were slow to read by touch.', category: 'history' },

  // Technique
  { fact: 'The first 10 braille letters (A–J) only use dots 1, 2, 4, and 5 — the top four positions.', category: 'technique' },
  { fact: 'Letters K–T are the same as A–J but with dot 3 added.', category: 'technique' },
  { fact: 'The number indicator (⠼) tells the reader that the following letters represent numbers.', category: 'technique' },
  { fact: 'In braille, numbers use the same patterns as letters A–J, preceded by a number sign.', category: 'technique' },
  { fact: 'Grade 2 braille uses contractions to save space — "the" is written as a single cell (⠮).', category: 'technique' },
  { fact: 'Alphabetic wordsigns let you write common words with just one braille cell: B = "but", C = "can".', category: 'technique' },
  { fact: 'There are over 180 contractions in Grade 2 braille — mastering them takes practice!', category: 'technique' },
  { fact: 'Strong contractions like "and" (⠯), "for" (⠿), and "the" (⠮) appear in almost every sentence.', category: 'technique' },

  // Fun facts
  { fact: 'Experienced braille readers can read at speeds of 200+ words per minute.', category: 'fun-fact' },
  { fact: 'LEGO now makes braille bricks to help children learn braille through play.', category: 'fun-fact' },
  { fact: 'Braille is used on currency in many countries, including the US, UK, and EU.', category: 'fun-fact' },
  { fact: 'There are braille codes for music, mathematics, and even computer programming.', category: 'fun-fact' },
  { fact: 'January 4th is World Braille Day, celebrating Louis Braille\'s birthday.', category: 'fun-fact' },
  { fact: 'Braille can be written on paper using a slate and stylus, embosser, or braille display.', category: 'fun-fact' },

  // Encouragement
  { fact: 'Every braille pattern you recognize builds your visual literacy — keep practicing!', category: 'encouragement' },
  { fact: 'Learning braille patterns helps you understand how tactile reading works.', category: 'encouragement' },
  { fact: 'You\'re building pattern recognition skills that transfer to all kinds of learning.', category: 'encouragement' },
  { fact: 'Consistency beats intensity — even 5 minutes of practice daily makes a difference.', category: 'encouragement' },
  { fact: 'Making mistakes is part of learning — each wrong guess teaches your brain something new.', category: 'encouragement' },
];

let lastIndex = -1;

/** Get a random learning tip (avoids repeating the last one) */
export function getRandomTip(): LearningTip {
  let index: number;
  do {
    index = Math.floor(Math.random() * tips.length);
  } while (index === lastIndex && tips.length > 1);
  lastIndex = index;
  return tips[index];
}

/** Get tip by category */
export function getTipByCategory(category: LearningTip['category']): LearningTip {
  const filtered = tips.filter((t) => t.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)];
}
