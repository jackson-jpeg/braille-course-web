/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Pick `count` wrong answers, preferring ones that look similar to the right answer
 * (similarity = how many dot positions match) so the choice is a real reading test.
 */
export function pickDistractors<T>(
  answer: T,
  pool: readonly T[],
  count: number,
  similarity?: (a: T, b: T) => number,
): T[] {
  const others = pool.filter((x) => x !== answer);
  if (!similarity) return shuffle(others).slice(0, count);
  const ranked = shuffle(others).sort((a, b) => similarity(answer, b) - similarity(answer, a));
  // Mix: mostly look-alikes, one random, so it is never purely adversarial.
  const near = ranked.slice(0, Math.max(1, count - 1));
  const rest = shuffle(ranked.slice(count - 1)).slice(0, count - near.length);
  return shuffle([...near, ...rest]).slice(0, count);
}

/** Similarity between two dot lists: positions that agree (0–6). */
export function dotSimilarity(a: readonly number[], b: readonly number[]): number {
  let same = 0;
  for (let d = 1; d <= 6; d++) if (a.includes(d) === b.includes(d)) same++;
  return same;
}
