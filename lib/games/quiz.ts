/**
 * Shared shape for multiple-choice game questions, so every game's questions can be enumerated
 * and checked the same way (see __tests__/games/*.test.ts).
 *
 * A game describes each possible question as a QuestionSpec: the prompt, the one right answer,
 * and the full pool of distractors the game may draw from. At play time the game picks a few
 * distractors from the pool; because the tests check every pool member, every possible question
 * the game can ever show has been checked.
 */

export interface QuestionSpec<P, A> {
  /** Stable id, e.g. "speedmatch:read:k". */
  id: string;
  prompt: P;
  answer: A;
  /** Every distractor this question may show. All must be wrong answers. */
  distractorPool: A[];
}

/** Fisher–Yates shuffle with an injectable random source. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickOne<T>(items: readonly T[], random: () => number = Math.random): T {
  if (items.length === 0) throw new Error('pickOne: empty list');
  return items[Math.floor(random() * items.length)];
}

/** Build the shown choices: the answer plus `count - 1` distractors from the pool, shuffled. */
export function buildChoices<P, A>(
  spec: QuestionSpec<P, A>,
  count: number,
  random: () => number = Math.random,
): { choices: A[]; correctIndex: number } {
  const distractors = shuffle(spec.distractorPool, random).slice(0, Math.max(0, count - 1));
  const choices = shuffle([spec.answer, ...distractors], random);
  return { choices, correctIndex: choices.indexOf(spec.answer) };
}

/** Small seeded RNG (mulberry32) so tests and daily challenges are reproducible. */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
