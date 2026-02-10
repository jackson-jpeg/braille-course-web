/**
 * Contracted (Grade 2) braille data for the Dot Explorer.
 * Array format: [d1, d4, d2, d5, d3, d6] — same as brailleMap.
 */

import { brailleMap } from './braille-map';

export type ContractionType = 'wordsign' | 'strong' | 'groupsign-strong' | 'groupsign-lower' | 'wordsign-lower';

export interface ContractionEntry {
  label: string;
  pattern: number[];
  type: ContractionType;
}

/** Alphabetic wordsigns — same pattern as the letter, used as whole-word meaning */
const wordsigns: ContractionEntry[] = [
  { label: 'but', pattern: brailleMap.B, type: 'wordsign' },
  { label: 'can', pattern: brailleMap.C, type: 'wordsign' },
  { label: 'do', pattern: brailleMap.D, type: 'wordsign' },
  { label: 'every', pattern: brailleMap.E, type: 'wordsign' },
  { label: 'from', pattern: brailleMap.F, type: 'wordsign' },
  { label: 'go', pattern: brailleMap.G, type: 'wordsign' },
  { label: 'have', pattern: brailleMap.H, type: 'wordsign' },
  { label: 'just', pattern: brailleMap.J, type: 'wordsign' },
  { label: 'knowledge', pattern: brailleMap.K, type: 'wordsign' },
  { label: 'like', pattern: brailleMap.L, type: 'wordsign' },
  { label: 'more', pattern: brailleMap.M, type: 'wordsign' },
  { label: 'not', pattern: brailleMap.N, type: 'wordsign' },
  { label: 'people', pattern: brailleMap.P, type: 'wordsign' },
  { label: 'quite', pattern: brailleMap.Q, type: 'wordsign' },
  { label: 'rather', pattern: brailleMap.R, type: 'wordsign' },
  { label: 'so', pattern: brailleMap.S, type: 'wordsign' },
  { label: 'that', pattern: brailleMap.T, type: 'wordsign' },
  { label: 'us', pattern: brailleMap.U, type: 'wordsign' },
  { label: 'very', pattern: brailleMap.V, type: 'wordsign' },
  { label: 'will', pattern: brailleMap.W, type: 'wordsign' },
  { label: 'it', pattern: brailleMap.X, type: 'wordsign' },
  { label: 'you', pattern: brailleMap.Y, type: 'wordsign' },
  { label: 'as', pattern: brailleMap.Z, type: 'wordsign' },
];

/** Strong contractions — unique patterns not shared with any letter */
const strongContractions: ContractionEntry[] = [
  { label: 'and', pattern: [1, 1, 1, 0, 1, 1], type: 'strong' },
  { label: 'for', pattern: [1, 1, 1, 1, 1, 1], type: 'strong' },
  { label: 'of', pattern: [1, 0, 1, 1, 1, 1], type: 'strong' },
  { label: 'the', pattern: [0, 1, 1, 0, 1, 1], type: 'strong' },
  { label: 'with', pattern: [0, 1, 1, 1, 1, 1], type: 'strong' },
];

/** Strong groupsigns — can appear within words */
const strongGroupsigns: ContractionEntry[] = [
  { label: 'ch', pattern: [1, 0, 0, 0, 0, 1], type: 'groupsign-strong' }, // dots 1,6
  { label: 'gh', pattern: [1, 0, 1, 0, 0, 1], type: 'groupsign-strong' }, // dots 1,2,6
  { label: 'sh', pattern: [1, 1, 0, 0, 0, 1], type: 'groupsign-strong' }, // dots 1,4,6
  { label: 'th', pattern: [1, 1, 0, 1, 0, 1], type: 'groupsign-strong' }, // dots 1,4,5,6
  { label: 'wh', pattern: [1, 0, 0, 1, 0, 1], type: 'groupsign-strong' }, // dots 1,5,6
  { label: 'ed', pattern: [1, 1, 1, 0, 0, 1], type: 'groupsign-strong' }, // dots 1,2,4,6
  { label: 'er', pattern: [1, 1, 1, 1, 0, 1], type: 'groupsign-strong' }, // dots 1,2,4,5,6
  { label: 'ou', pattern: [1, 0, 1, 1, 0, 1], type: 'groupsign-strong' }, // dots 1,2,5,6
  { label: 'ow', pattern: [0, 1, 1, 0, 0, 1], type: 'groupsign-strong' }, // dots 2,4,6
  { label: 'st', pattern: [0, 1, 0, 0, 1, 0], type: 'groupsign-strong' }, // dots 3,4
  { label: 'ar', pattern: [0, 1, 0, 1, 1, 0], type: 'groupsign-strong' }, // dots 3,4,5
  { label: 'ing', pattern: [0, 1, 0, 0, 1, 1], type: 'groupsign-strong' }, // dots 3,4,6
];

/** Lower groupsigns — dots 2,3,5,6 region */
const lowerGroupsigns: ContractionEntry[] = [
  { label: 'be', pattern: [0, 0, 1, 0, 1, 0], type: 'groupsign-lower' }, // dots 2,3
  { label: 'con', pattern: [0, 0, 1, 1, 0, 0], type: 'groupsign-lower' }, // dots 2,5
  { label: 'dis', pattern: [0, 0, 1, 1, 0, 1], type: 'groupsign-lower' }, // dots 2,5,6
  { label: 'en (enough)', pattern: [0, 0, 1, 0, 0, 1], type: 'groupsign-lower' }, // dots 2,6
  { label: 'in', pattern: [0, 0, 0, 1, 1, 0], type: 'groupsign-lower' }, // dots 3,5
];

/** Lower wordsigns — standalone words using lower cell region */
const lowerWordsigns: ContractionEntry[] = [
  { label: 'his', pattern: [0, 0, 1, 0, 1, 1], type: 'wordsign-lower' }, // dots 2,3,6
  { label: 'was', pattern: [0, 0, 0, 1, 1, 1], type: 'wordsign-lower' }, // dots 3,5,6
  { label: 'were', pattern: [0, 0, 1, 1, 1, 1], type: 'wordsign-lower' }, // dots 2,3,5,6
];

/** All contracted braille entries */
export const contractedBrailleEntries: ContractionEntry[] = [
  ...wordsigns,
  ...strongContractions,
  ...strongGroupsigns,
  ...lowerGroupsigns,
  ...lowerWordsigns,
];

/** Build a reverse lookup: pattern key → ContractionEntry */
export function buildContractedReverseLookup(): Map<string, ContractionEntry> {
  const map = new Map<string, ContractionEntry>();
  for (const entry of contractedBrailleEntries) {
    map.set(entry.pattern.join(','), entry);
  }
  return map;
}
