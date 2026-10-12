/**
 * Curated sentences for the Sentence Decoder game.
 *
 * Every sentence is shown exactly as UEB writes it, and every one is checked cell by cell
 * against liblouis (en-ueb-g1.ctb for uncontracted, en-ueb-g2.ctb for contracted) through
 * lib/games/sentence-decoder.ts brailleInventory.
 *
 * - Uncontracted (grade 1) sentences are transcribed by lib/braille/transcribe.ts.
 * - Contracted (grade 2) sentences list the pieces of every word ("the", "b r ea d"), using only
 *   the contractions in lib/braille/ueb.ts. Words whose contracted form needs anything else
 *   (initial-letter contractions such as "there", final-letter groupsigns such as "song",
 *   shortforms such as "good") are not used.
 */

/** Beginner: short uncontracted sentences with capitals and simple punctuation. */
export const BEGINNER_SENTENCES: readonly string[] = [
  'I see a cat.',
  'Sam has a red hat.',
  'Is it hot?',
  'We can go now!',
  'My dog is big.',
  'The sun is up.',
  'Can you hop?',
  'Ben likes jam.',
  'Look at the bird!',
  'Yes, I can.',
  'It’s fun.',
  'Where is Tom?',
  'OK, let us go.',
  'Max ran fast.',
  'I love NYC!',
];

/** Intermediate: uncontracted, with numbers, capitalized words and more punctuation. */
export const INTERMEDIATE_SENTENCES: readonly string[] = [
  'I have 3 cats and 2 dogs.',
  'The year is 2026.',
  'Add 1.5 cups of milk.',
  'Go to room 3b.',
  'Mom said, “Come here!”',
  'Kim (my sister) is 12.',
  'It’s a well-known song.',
  'Is it 3.5 or 4?',
  'BEN WON!',
  'We have 1,000 beads.',
  'Turn to page 9.',
  'Who won? We did!',
  'My code is 4j.',
  'Dad’s bus left at 10.',
  '“Can we go?” asked Jo.',
];

export interface ContractedSentenceSpec {
  print: string;
  /** Pieces of each word, words separated by "|", pieces by spaces. */
  pieces: string;
}

/** Advanced: contracted (grade 2) sentences. */
export const CONTRACTED_SENTENCES: readonly ContractedSentenceSpec[] = [
  { print: 'The child can go out.', pieces: 'the | child | can | go | out' },
  { print: 'You will like this.', pieces: 'you | will | like | this' },
  { print: 'It is so cold.', pieces: 'it | i s | so | c o l d' },
  { print: 'We can do it!', pieces: 'w e | can | do | it' },
  { print: 'That bird has a nest.', pieces: 'that | b i r d | h a s | a | n e st' },
  { print: 'Which way did she go?', pieces: 'which | w a y | d i d | sh e | go' },
  { print: 'Rather than sit, we stand.', pieces: 'rather | th a n | s i t | w e | st and' },
  { print: 'I shall bring the cake.', pieces: 'i | shall | b r ing | the | c a k e' },
  { print: 'People like to read.', pieces: 'people | like | t o | r ea d' },
  { print: 'Go and get his hat.', pieces: 'go | and | g e t | his | h a t' },
  { print: 'She was in the park.', pieces: 'sh e | was | in | the | p ar k' },
  { print: 'Can you see the star?', pieces: 'can | you | s e e | the | st ar' },
  { print: 'Just do it now.', pieces: 'just | do | it | n ow' },
  { print: 'The fish swam with us.', pieces: 'the | f i sh | s w a m | with | us' },
  { print: 'Every bird can sing.', pieces: 'every | b i r d | can | s ing' },
  { print: 'We were in the shop.', pieces: 'w e | were | in | the | sh o p' },
  { print: 'Have you seen this?', pieces: 'have | you | s e en | this' },
  { print: 'Still, the ship is very big.', pieces: 'still | the | sh i p | i s | very | b i g' },
  { print: 'More people will be at the farm.', pieces: 'more | people | will | be | a t | the | f ar m' },
  { print: 'Bread and cheese are for us.', pieces: 'b r ea d | and | ch e e s e | ar e | for | us' },
  { print: 'His teacher can sing.', pieces: 'his | t ea ch er | can | s ing' },
  { print: 'Do not chase the rabbit.', pieces: 'do | not | ch a s e | the | r a bb i t' },
  { print: 'Was it enough for you?', pieces: 'was | it | enough | for | you' },
  { print: 'Dad will begin the concert.', pieces: 'd a d | will | be g in | the | con c er t' },
];
