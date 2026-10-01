/**
 * Print text shown in contracted (UEB grade 2) braille. The braille for each string is
 * produced by liblouis and stored in lib/data/ueb-contracted.json by
 * scripts/generate-ueb-oracle.ts — never typed by hand.
 */

export interface ContractedSentence {
  text: string;
  /** Rough difficulty: 1 = only the most common contractions. */
  level: 1 | 2 | 3;
}

export const CONTRACTED_SENTENCES: ContractedSentence[] = [
  { text: 'the cat and the dog', level: 1 },
  { text: 'you can do it', level: 1 },
  { text: 'I like you', level: 1 },
  { text: 'that is not a cat', level: 1 },
  { text: 'we can go', level: 1 },
  { text: 'it is for you', level: 1 },
  { text: 'just do it', level: 1 },
  { text: 'so very good', level: 1 },
  { text: 'more and more', level: 1 },
  { text: 'people like us', level: 1 },
  { text: 'the sun is up', level: 1 },
  { text: 'a cup of milk', level: 1 },
  { text: 'go with the band', level: 1 },
  { text: 'every day is new', level: 1 },
  { text: 'I will help you', level: 1 },
  { text: 'this child can sing', level: 2 },
  { text: 'which one was his', level: 2 },
  { text: 'we were out in the rain', level: 2 },
  { text: 'she has a fish', level: 2 },
  { text: 'the bird sang', level: 2 },
  { text: 'that is enough for me', level: 2 },
  { text: 'the cow is in the barn', level: 2 },
  { text: 'what a loud shout', level: 2 },
  { text: 'the star is far', level: 2 },
  { text: 'the frog can jump', level: 2 },
  { text: 'he went to the park', level: 2 },
  { text: 'I see the whale', level: 2 },
  { text: 'they read a book', level: 2 },
  { text: 'the rabbit hid in the garden', level: 3 },
  { text: 'she shall bring the ring', level: 3 },
  { text: 'the children were singing', level: 3 },
  { text: 'we have muffins with milk', level: 3 },
  { text: 'the ghost was still there', level: 3 },
  { text: 'thank you for the gift', level: 3 },
  { text: 'the ocean was deep and blue', level: 3 },
  { text: 'my mother and father', level: 3 },
];

export interface ContractionExample {
  /** Contraction text as listed in lib/ueb.ts CONTRACTIONS. */
  contraction: string;
  kind: string;
  /** A short phrase that uses it. */
  sentence: string;
}

export const CONTRACTION_EXAMPLES: ContractionExample[] = [
  { contraction: 'but', kind: 'alphabetic-wordsign', sentence: 'small but strong' },
  { contraction: 'can', kind: 'alphabetic-wordsign', sentence: 'you can do it' },
  { contraction: 'do', kind: 'alphabetic-wordsign', sentence: 'do it now' },
  { contraction: 'every', kind: 'alphabetic-wordsign', sentence: 'every day' },
  { contraction: 'from', kind: 'alphabetic-wordsign', sentence: 'a gift from me' },
  { contraction: 'go', kind: 'alphabetic-wordsign', sentence: 'go up' },
  { contraction: 'have', kind: 'alphabetic-wordsign', sentence: 'I have a cat' },
  { contraction: 'just', kind: 'alphabetic-wordsign', sentence: 'just one' },
  { contraction: 'knowledge', kind: 'alphabetic-wordsign', sentence: 'knowledge is power' },
  { contraction: 'like', kind: 'alphabetic-wordsign', sentence: 'I like jam' },
  { contraction: 'more', kind: 'alphabetic-wordsign', sentence: 'one more' },
  { contraction: 'not', kind: 'alphabetic-wordsign', sentence: 'not now' },
  { contraction: 'people', kind: 'alphabetic-wordsign', sentence: 'kind people' },
  { contraction: 'quite', kind: 'alphabetic-wordsign', sentence: 'quite big' },
  { contraction: 'rather', kind: 'alphabetic-wordsign', sentence: 'I would rather run' },
  { contraction: 'so', kind: 'alphabetic-wordsign', sentence: 'so fun' },
  { contraction: 'that', kind: 'alphabetic-wordsign', sentence: 'that dog' },
  { contraction: 'us', kind: 'alphabetic-wordsign', sentence: 'come with us' },
  { contraction: 'very', kind: 'alphabetic-wordsign', sentence: 'very good' },
  { contraction: 'will', kind: 'alphabetic-wordsign', sentence: 'I will try' },
  { contraction: 'it', kind: 'alphabetic-wordsign', sentence: 'pet it' },
  { contraction: 'you', kind: 'alphabetic-wordsign', sentence: 'thank you' },
  { contraction: 'as', kind: 'alphabetic-wordsign', sentence: 'as big as me' },
  { contraction: 'and', kind: 'strong-contraction', sentence: 'salt and pepper' },
  { contraction: 'for', kind: 'strong-contraction', sentence: 'for me' },
  { contraction: 'of', kind: 'strong-contraction', sentence: 'a cup of tea' },
  { contraction: 'the', kind: 'strong-contraction', sentence: 'the moon' },
  { contraction: 'with', kind: 'strong-contraction', sentence: 'play with me' },
  { contraction: 'ch', kind: 'strong-groupsign', sentence: 'lunch' },
  { contraction: 'gh', kind: 'strong-groupsign', sentence: 'ghost' },
  { contraction: 'sh', kind: 'strong-groupsign', sentence: 'fish' },
  { contraction: 'th', kind: 'strong-groupsign', sentence: 'bath' },
  { contraction: 'wh', kind: 'strong-groupsign', sentence: 'whale' },
  { contraction: 'ed', kind: 'strong-groupsign', sentence: 'red' },
  { contraction: 'er', kind: 'strong-groupsign', sentence: 'her' },
  { contraction: 'ou', kind: 'strong-groupsign', sentence: 'loud' },
  { contraction: 'ow', kind: 'strong-groupsign', sentence: 'cow' },
  { contraction: 'st', kind: 'strong-groupsign', sentence: 'fast' },
  { contraction: 'ar', kind: 'strong-groupsign', sentence: 'car' },
  { contraction: 'ing', kind: 'strong-groupsign', sentence: 'sing' },
  { contraction: 'child', kind: 'strong-wordsign', sentence: 'a happy child' },
  { contraction: 'shall', kind: 'strong-wordsign', sentence: 'shall we' },
  { contraction: 'this', kind: 'strong-wordsign', sentence: 'this one' },
  { contraction: 'which', kind: 'strong-wordsign', sentence: 'which way' },
  { contraction: 'out', kind: 'strong-wordsign', sentence: 'go out' },
  { contraction: 'still', kind: 'strong-wordsign', sentence: 'sit still' },
  { contraction: 'ea', kind: 'lower-groupsign', sentence: 'head' },
  { contraction: 'bb', kind: 'lower-groupsign', sentence: 'rabbit' },
  { contraction: 'cc', kind: 'lower-groupsign', sentence: 'accept' },
  { contraction: 'ff', kind: 'lower-groupsign', sentence: 'muffin' },
  { contraction: 'gg', kind: 'lower-groupsign', sentence: 'bigger' },
  { contraction: 'be', kind: 'lower-groupsign', sentence: 'become' },
  { contraction: 'con', kind: 'lower-groupsign', sentence: 'concert' },
  { contraction: 'dis', kind: 'lower-groupsign', sentence: 'dismay' },
  { contraction: 'en', kind: 'lower-groupsign', sentence: 'tent' },
  { contraction: 'in', kind: 'lower-groupsign', sentence: 'pint' },
  { contraction: 'be', kind: 'lower-wordsign', sentence: 'be kind' },
  { contraction: 'enough', kind: 'lower-wordsign', sentence: 'big enough' },
  { contraction: 'were', kind: 'lower-wordsign', sentence: 'we were' },
  { contraction: 'his', kind: 'lower-wordsign', sentence: 'his hat' },
  { contraction: 'in', kind: 'lower-wordsign', sentence: 'in a box' },
  { contraction: 'was', kind: 'lower-wordsign', sentence: 'it was fun' },
];
