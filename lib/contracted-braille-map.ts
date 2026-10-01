/**
 * Legacy grid-order view of UEB contractions, derived from lib/ueb.ts (the single source of
 * truth). Do not add patterns here — add them to lib/ueb.ts.
 * Array format: [d1, d4, d2, d5, d3, d6] — same as brailleMap.
 */

import { CONTRACTIONS, toGrid, type ContractionKind } from './ueb';

export type ContractionType = 'wordsign' | 'strong' | 'groupsign-strong' | 'groupsign-lower' | 'wordsign-lower';

export interface ContractionEntry {
  label: string;
  pattern: number[];
  type: ContractionType;
}

const KIND_TO_TYPE: Partial<Record<ContractionKind, ContractionType>> = {
  'alphabetic-wordsign': 'wordsign',
  'strong-contraction': 'strong',
  'strong-groupsign': 'groupsign-strong',
  'strong-wordsign': 'wordsign',
  'lower-groupsign': 'groupsign-lower',
  'lower-wordsign': 'wordsign-lower',
};

/** All contracted braille entries used by the legacy games. */
export const contractedBrailleEntries: ContractionEntry[] = CONTRACTIONS.flatMap((c) => {
  const type = KIND_TO_TYPE[c.kind];
  return type ? [{ label: c.text, pattern: toGrid(c.dots), type }] : [];
});

/**
 * Reverse lookup: pattern key → entry. Several contractions can share one cell (for example
 * "be" and "bb"); their labels are joined ("be / bb") so the lookup never hides a meaning.
 */
export function buildContractedReverseLookup(): Map<string, ContractionEntry> {
  const map = new Map<string, ContractionEntry>();
  for (const c of CONTRACTIONS) {
    const key = toGrid(c.dots).join(',');
    const existing = map.get(key);
    const type = KIND_TO_TYPE[c.kind] ?? (c.kind === 'strong-wordsign' ? 'groupsign-strong' : 'wordsign');
    if (!existing) map.set(key, { label: c.text, pattern: toGrid(c.dots), type });
    else if (!existing.label.split(' / ').includes(c.text)) existing.label += ` / ${c.text}`;
  }
  return map;
}
