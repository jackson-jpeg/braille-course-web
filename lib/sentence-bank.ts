/**
 * Word bank and sentence frames for the Sentence Decoder game.
 *
 * Every word that can appear as a standalone contraction (wordsign, strong,
 * or lower wordsign) is tagged `contraction: true`.  The generator wraps
 * those in {braces} so `templateToTokens` renders them as single-cell
 * contracted braille.
 *
 * Frames are patterns with slot references.  Every combination of slot
 * fillers is guaranteed to be grammatical.
 */

// ── Word lists ──────────────────────────────────────────────

export interface Word {
  text: string;
  /** true → render as single-cell braille contraction */
  contraction: boolean;
}

function c(text: string): Word { return { text, contraction: true }; }
function w(text: string): Word { return { text, contraction: false }; }

// Pronouns
export const pronouns: Word[] = [
  w('I'), c('you'), w('he'), w('she'), w('we'), c('it'), w('they'),
];

// Nouns (all spelled letter-by-letter)
export const nouns: Word[] = [
  w('cat'), w('dog'), w('sun'), w('bird'), w('fish'), w('kid'), w('cup'),
  w('tree'), w('park'), w('home'), w('book'), w('ball'), w('hat'), w('pen'),
  w('pie'), w('bed'), w('door'), w('lake'), w('road'), w('song'), w('star'),
  w('bell'), w('cake'), w('frog'), w('hill'), w('map'), w('nest'), w('rock'),
  w('yard'), w('bug'), w('gift'), w('team'), w('fox'), w('egg'), w('van'),
  w('tent'), w('seed'), w('kite'), w('wig'), w('jam'), w('wall'),
];

// Modals (all contractions)
export const modals: Word[] = [c('can'), c('will'), c('do')];

// Base-form verbs
export const verbsBase: Word[] = [
  w('run'), w('sit'), w('sing'), w('play'), w('read'), w('jump'), w('swim'),
  w('walk'), w('fly'), w('eat'), w('stop'), w('win'), w('try'), w('nap'),
  c('go'), c('like'), c('have'),
];

// Past-tense verbs
export const verbsPast: Word[] = [
  w('ran'), w('sat'), w('sang'), w('played'), w('got'), w('fell'), w('slept'),
  w('ate'), w('swam'), w('won'), w('went'), w('made'), w('held'), w('left'),
  w('tried'), w('dug'), w('hit'), w('hid'),
];

// Linking verbs
export const linking: Word[] = [w('is'), c('was'), c('were')];

// Adjectives
export const adjectives: Word[] = [
  w('big'), w('hot'), w('red'), w('old'), w('nice'), w('fast'), w('good'),
  w('kind'), w('new'), w('soft'), w('tall'), w('wet'), w('warm'), w('cold'),
  w('blue'), w('fun'), w('safe'), w('dark'), w('lost'), w('bold'),
];

// Adverbs
export const adverbs: Word[] = [
  w('well'), w('now'), w('soon'), w('here'), w('hard'), w('far'),
  c('just'), c('so'), c('very'), c('quite'), c('rather'), c('not'),
  w('yet'), w('still'), w('home'),
];

// Determiners
export const determiners: Word[] = [
  c('the'), w('a'), c('his'), c('every'), c('that'), c('more'),
];

// Prepositions
export const prepositions: Word[] = [
  c('for'), c('from'), c('with'), c('of'), w('on'), w('in'), w('to'),
  w('at'), w('up'),
];

// Connectors
export const connectors: Word[] = [c('and'), c('but'), c('as')];

// ── Sentence frames ─────────────────────────────────────────

export interface SlotRef {
  list: Word[];
  /** Optional filter to restrict to a subset (e.g. only contractions) */
  filter?: (w: Word) => boolean;
}

export interface SentenceFrame {
  /** Number of words produced */
  wordCount: number;
  /** Each element is either a SlotRef (pick-random) or a fixed Word */
  slots: (SlotRef | Word)[];
}

/** Subset helpers */
const pick = (list: Word[], filter?: (w: Word) => boolean): SlotRef => ({ list, filter });

// Small curated subsets for certain slots
const pronounSubj: Word[] = [w('I'), c('you'), w('he'), w('she'), w('we'), w('they')];
const pronounSingular: Word[] = [w('he'), w('she'), c('it')];
const pronounPlural: Word[] = [w('we'), w('they')];
const linkingSingular: Word[] = [w('is'), c('was')];
const detSimple: Word[] = [c('the'), w('a'), c('his')];
const detThe: Word = c('the');
const adverbsShort: Word[] = [w('well'), w('now'), w('soon'), w('hard'), w('far'), w('fast')];

export const frames: SentenceFrame[] = [
  // ── 3-word frames ──

  // [pronoun] [modal] [verb_base] → "you can run"
  { wordCount: 3, slots: [pick(pronounSubj), pick(modals), pick(verbsBase)] },

  // [det] [noun] [verb_past] → "the cat sat"
  { wordCount: 3, slots: [pick(detSimple), pick(nouns), pick(verbsPast)] },

  // [pronoun] [verb_past] [adv] → "he ran fast"
  { wordCount: 3, slots: [pick(pronounSubj), pick(verbsPast), pick(adverbsShort)] },

  // [pronoun] [contraction_verb] [noun] → "I like pie"
  { wordCount: 3, slots: [
    pick(pronounSubj),
    pick(verbsBase, v => v.contraction),
    pick(nouns),
  ]},

  // [pronoun] [linking] [adj] → "it was cold"
  { wordCount: 3, slots: [pick(pronounSingular), pick(linkingSingular), pick(adjectives)] },

  // [noun] [linking] [adj] → "pie is good"
  { wordCount: 3, slots: [pick(nouns), pick(linkingSingular), pick(adjectives)] },

  // ── 4-word frames ──

  // [det] [noun] is [adj] → "the sun is hot"
  { wordCount: 4, slots: [pick(detSimple), pick(nouns), w('is'), pick(adjectives)] },

  // [pronoun] [modal] [verb] [adv] → "she can sing well"
  { wordCount: 4, slots: [pick(pronounSubj), pick(modals), pick(verbsBase), pick(adverbsShort)] },

  // [pronoun] [verb] [det] [noun] → "we like the park"
  { wordCount: 4, slots: [
    pick(pronounSubj),
    pick(verbsBase, v => v.contraction),
    detThe,
    pick(nouns),
  ]},

  // [det] [noun] [modal] [verb] → "the bird can fly"
  { wordCount: 4, slots: [pick(detSimple), pick(nouns), pick(modals), pick(verbsBase)] },

  // [pronoun] [modal] not [verb] → "I do not go"
  { wordCount: 4, slots: [pick(pronounSubj), pick(modals), c('not'), pick(verbsBase)] },

  // [pronoun] was [adv] [adj] → "she was quite kind"
  { wordCount: 4, slots: [
    pick(pronounSingular),
    c('was'),
    pick([c('quite'), c('very'), c('so'), c('rather')]),
    pick(adjectives),
  ]},

  // have a [adj] [noun] → "have a nice day"
  { wordCount: 4, slots: [c('have'), w('a'), pick(adjectives), pick(nouns)] },

  // people [verb] [det] [noun] → "people like the park"
  { wordCount: 4, slots: [
    c('people'),
    pick(verbsBase, v => v.contraction),
    detThe,
    pick(nouns),
  ]},

  // ── 5-word frames ──

  // [pronoun] [modal] [verb] [prep] [noun] → "we will go for it"
  { wordCount: 5, slots: [pick(pronounSubj), pick(modals), pick(verbsBase), pick(prepositions), pick(nouns)] },

  // [pronoun] [verb] [det] [adj] [noun] → "I like the red hat"
  { wordCount: 5, slots: [
    pick(pronounSubj),
    pick(verbsBase, v => v.contraction),
    detThe,
    pick(adjectives),
    pick(nouns),
  ]},

  // [det] [noun] [verb_past] [prep] [noun] → "the cat sat on it"
  { wordCount: 5, slots: [pick(detSimple), pick(nouns), pick(verbsPast), pick(prepositions), pick(nouns)] },

  // [det] [noun] and [noun] [verb_past] → "the dog and cat played"
  { wordCount: 5, slots: [pick(detSimple), pick(nouns), c('and'), pick(nouns), pick(verbsPast)] },

  // [pronoun] were not [adv] [adj] → "they were not so bad"
  { wordCount: 5, slots: [
    pick(pronounPlural),
    c('were'),
    c('not'),
    pick([c('so'), c('very'), c('quite')]),
    pick(adjectives),
  ]},

  // every [noun] [modal] [verb] [adv] → "every kid can read well"
  { wordCount: 5, slots: [c('every'), pick(nouns), pick(modals), pick(verbsBase), pick(adverbsShort)] },

  // knowledge is [adv] [adj] [noun] → "knowledge is quite good fun"
  { wordCount: 5, slots: [
    c('knowledge'),
    w('is'),
    pick([c('quite'), c('very'), c('rather')]),
    pick(adjectives),
    pick(nouns),
  ]},

  // [pronoun] [verb_past] as [pronoun] [verb_past] → "he ran as I sat"
  { wordCount: 5, slots: [pick(pronounSubj), pick(verbsPast), c('as'), pick(pronounSubj), pick(verbsPast)] },

  // ── 6-word frames ──

  // [pronoun] [modal] [verb] [prep] [det] [noun] → "I will go with the dog"
  { wordCount: 6, slots: [pick(pronounSubj), pick(modals), pick(verbsBase), pick(prepositions), detThe, pick(nouns)] },

  // [pronoun] and [pronoun] [modal] [verb] [noun] → "you and I can play ball"
  { wordCount: 6, slots: [pick(pronounSubj), c('and'), pick(pronounSubj), pick(modals), pick(verbsBase), pick(nouns)] },

  // [det] [adj] [noun] [verb_past] [prep] [noun] → "the old man sat on hill"
  { wordCount: 6, slots: [pick(detSimple), pick(adjectives), pick(nouns), pick(verbsPast), pick(prepositions), pick(nouns)] },

  // [det] [noun] [prep] [det] [noun] [verb_past] → "the cup of the kid fell"
  { wordCount: 6, slots: [detThe, pick(nouns), pick(prepositions), detThe, pick(nouns), pick(verbsPast)] },

  // [pronoun] [modal] rather [verb] [prep] [noun] → "I will rather go with us"
  { wordCount: 6, slots: [pick(pronounSubj), pick(modals), c('rather'), pick(verbsBase), pick(prepositions), c('us')] },

  // [pronoun] just [verb_past] [prep] [det] [noun] → "she just went from the park"
  { wordCount: 6, slots: [pick(pronounSubj), c('just'), pick(verbsPast), pick(prepositions), detThe, pick(nouns)] },

  // [pronoun] [linking] [adv] [adj] [prep] [noun] → "it was quite warm for us"
  { wordCount: 6, slots: [
    pick(pronounSingular),
    pick(linkingSingular),
    pick([c('quite'), c('very'), c('so'), c('rather')]),
    pick(adjectives),
    pick(prepositions),
    pick(nouns),
  ]},

  // ── 7-word frames ──

  // [pronoun] and [pronoun] [modal] [verb] [prep] [noun] → "you and I will go for it"
  { wordCount: 7, slots: [pick(pronounSubj), c('and'), pick(pronounSubj), pick(modals), pick(verbsBase), pick(prepositions), pick(nouns)] },

  // [det] [noun] and [det] [noun] [verb_past] [adv] → "the cat and the dog ran far"
  { wordCount: 7, slots: [detThe, pick(nouns), c('and'), detThe, pick(nouns), pick(verbsPast), pick(adverbsShort)] },

  // [pronoun] [modal] not [verb] [prep] [det] [noun] → "we do not go with the dog"
  { wordCount: 7, slots: [pick(pronounSubj), pick(modals), c('not'), pick(verbsBase), pick(prepositions), detThe, pick(nouns)] },

  // but [det] [adj] [noun] [linking] [adv] [adj] → "but the old man was very kind"
  { wordCount: 7, slots: [
    c('but'),
    detThe,
    pick(adjectives),
    pick(nouns),
    pick(linkingSingular),
    pick([c('very'), c('quite'), c('so'), c('rather')]),
    pick(adjectives),
  ]},

  // people [verb] [det] [noun] [prep] [det] [noun] → "people like the park with the lake"
  { wordCount: 7, slots: [
    c('people'),
    pick(verbsBase, v => v.contraction),
    detThe,
    pick(nouns),
    pick(prepositions),
    detThe,
    pick(nouns),
  ]},

  // [pronoun] have just [det] [noun] [prep] [pronoun] → "I have just the thing for you"
  { wordCount: 7, slots: [pick(pronounSubj), c('have'), c('just'), detThe, pick(nouns), pick(prepositions), pick(pronouns)] },
];
