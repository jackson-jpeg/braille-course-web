/**
 * Educational braille facts and tips shown after game wins.
 */
import { renderProse } from '@/lib/braille/prose';

export interface LearningTip {
  fact: string;
  category: 'history' | 'technique' | 'fun-fact' | 'encouragement';
}

/**
 * Tips are written as prose templates: any cell or dot number they mention is rendered from
 * lib/braille (renderProse), never typed by hand. Sources for the facts are in
 * docs/accuracy/audit/contractions.md.
 */
const templates: LearningTip[] = [
  // History
  {
    fact: 'Louis Braille developed his reading system as a teenager in the 1820s; he was 15 in 1824.',
    category: 'history',
  },
  {
    fact: 'Braille grew out of “night writing,” a raised-dot code by the French army officer Charles Barbier.',
    category: 'history',
  },
  {
    fact: 'The six-dot cell Louis Braille developed in the 1820s is still the basis of braille today: 2 columns of 3 dots.',
    category: 'history',
  },
  {
    fact: 'Unified English Braille (UEB) was first adopted by Australia in 2005. The first edition of its rulebook appeared in 2010, and by 2016 every member country of the International Council on English Braille had adopted it.',
    category: 'history',
  },
  { fact: 'Before braille, raised print letters were used, but they were slow to read by touch.', category: 'history' },

  // Technique
  {
    fact: 'The first 10 braille letters (a–j) use only {fact:firstDecadeDots}: the top two rows of the cell.',
    category: 'technique',
  },
  { fact: 'Letters k–t are the same as a–j with {fact:secondDecadeAdds} added.', category: 'technique' },
  {
    fact: 'The {name:numeric} ({braille:numeric}, {dots:numeric}) tells the reader that the letters a–j that follow are digits.',
    category: 'technique',
  },
  {
    fact: 'Digits 1 to 9 and 0 use the same cells as the letters a to j, after the {name:numeric}.',
    category: 'technique',
  },
  {
    fact: 'Contracted (grade 2) braille saves space: the word “the” is a single cell ({braille:contraction:the}, {dots:contraction:the}).',
    category: 'technique',
  },
  {
    fact: 'Alphabetic wordsigns write a common word with one letter standing alone: b means “but”, c means “can”.',
    category: 'technique',
  },
  {
    fact: 'The UEB rulebook’s contractions summary (rule 2.2) lists 180 different contractions and shortforms. Mastering them takes practice!',
    category: 'technique',
  },
  {
    fact: 'Strong contractions like “and” ({braille:contraction:and}), “for” ({braille:contraction:for}) and “the” ({braille:contraction:the}) turn up in almost any paragraph.',
    category: 'technique',
  },

  // Fun facts
  { fact: 'Skilled braille readers read fluently by touch, often using both hands.', category: 'fun-fact' },
  { fact: 'LEGO makes braille bricks to help children learn braille through play.', category: 'fun-fact' },
  {
    fact: 'Across the European Union, medicine packaging must show the name of the medicine in braille.',
    category: 'fun-fact',
  },
  { fact: 'There are braille codes for music, mathematics, and even computer programming.', category: 'fun-fact' },
  { fact: "January 4th is World Braille Day, celebrating Louis Braille's birthday.", category: 'fun-fact' },
  {
    fact: 'Braille can be written with a slate and stylus, a braillewriter, or a computer and braille embosser.',
    category: 'fun-fact',
  },

  // Encouragement
  {
    fact: 'Every braille pattern you recognize builds your braille literacy — keep practicing!',
    category: 'encouragement',
  },
  { fact: 'Learning braille patterns helps you understand how tactile reading works.', category: 'encouragement' },
  {
    fact: "You're building pattern recognition skills that transfer to all kinds of learning.",
    category: 'encouragement',
  },
  {
    fact: 'Consistency beats intensity — even 5 minutes of practice daily makes a difference.',
    category: 'encouragement',
  },
  {
    fact: 'Making mistakes is part of learning — each wrong guess teaches your brain something new.',
    category: 'encouragement',
  },
];

/** The tips with their braille rendered from lib/braille. */
export const tips: readonly LearningTip[] = templates.map((t) => ({ ...t, fact: renderProse(t.fact) }));

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
