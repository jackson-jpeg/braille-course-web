/**
 * Every piece of braille the site can show, collected from the canonical data and from each
 * lesson and game module. See lib/braille/inventory.ts.
 */
import { type InventoryItem, g1Item } from './inventory';
import { brailleInventory as numberSenseInventory } from '../games/number-sense';
import { brailleInventory as courseInventory } from '../course-curriculum';
import { brailleInventory as siteChromeInventory } from '../site-chrome-braille';
import { brailleInventory as capitalQuestInventory } from '../games/capital-quest';
import { brailleInventory as numberLockInventory } from '../games/number-lock';
import { brailleInventory as punctuationDetectiveInventory } from '../games/punctuation-detective';
import { brailleInventory as braillerChallengeInventory } from '../games/brailler-challenge';
import { brailleInventory as wordgameInventory } from '../games/wordgame';
import { brailleInventory as hangmanInventory } from '../games/hangman';
import { brailleInventory as speedmatchInventory } from '../games/speedmatch';
import { brailleInventory as memorymatchInventory } from '../games/memorymatch';
import { brailleInventory as sequenceInventory } from '../games/sequence';
import { brailleInventory as bingoInventory } from '../games/bingo';
import { brailleInventory as rainInventory } from '../games/rain';
import { brailleInventory as reflexInventory } from '../games/reflex';
import { brailleInventory as heroInventory } from '../games/hero';
import { brailleInventory as explorerInventory } from '../games/explorer';
import { brailleInventory as contractionSprintInventory } from '../games/contraction-sprint';
import { brailleInventory as sentenceDecoderInventory } from '../games/sentence-decoder';
import { DISCREPANCIES } from './discrepancies';
import { VERIFICATION_SAMPLES } from './verification-samples';
import { ALPHABET, DIGITS_IN_ORDER, PUNCTUATION, SYMBOLS } from './ueb';

/** Context strings that put each print sign where it normally appears. */
export function signContext(print: string): string {
  if (['(', '“', '‘'].includes(print)) return `${print}word`;
  if (['$'].includes(print)) return `${print}5`;
  if (['+', '−', '×', '÷', '='].includes(print)) return `2 ${print} 3`;
  if (print === '–') return 'word – word';
  if (print === '-') return 'well-known';
  if (print === '/') return 'yes/no';
  if (print === '&') return 'salt & pepper';
  if (print === '@') return 'me@home';
  if (print === '%') return '50%';
  if (print === '’') return 'it’s';
  if (print === ')') return '(word)';
  if (print === '”') return '“word”';
  return `word${print}`;
}

export function baseInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const l of ALPHABET) {
    items.push(g1Item('data:letters', l));
    items.push(g1Item('data:letters', l.toUpperCase()));
  }
  for (const d of DIGITS_IN_ORDER) items.push(g1Item('data:digits', d));
  for (const sign of [...Object.values(PUNCTUATION), ...Object.values(SYMBOLS)]) {
    if (sign.id === 'closeSingleQuote') {
      items.push(g1Item('data:punctuation', '‘word’'));
      continue;
    }
    items.push(g1Item(`data:${sign.kind}`, signContext(sign.print)));
  }
  return items;
}

/**
 * Strings used by the verification tests themselves (trap tests, rulebook examples, discrepancies),
 * so liblouis checks them too.
 */
export function verificationInventory(): InventoryItem[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const examples = require('../../__tests__/fixtures/iceb-rulebook-examples.json') as { examples: { print: string }[] };
  const samples = [
    ...examples.examples.map((e) => e.print),
    ...VERIFICATION_SAMPLES,
    ...DISCREPANCIES.map((d) => d.print),
  ];
  return samples.map((p) => g1Item('verification', p));
}

/** Registered content modules. Each game and the curriculum add themselves here. */
const SOURCES: (() => InventoryItem[])[] = [
  baseInventory,
  verificationInventory,
  numberSenseInventory,
  courseInventory,
  siteChromeInventory,
  capitalQuestInventory,
  numberLockInventory,
  punctuationDetectiveInventory,
  braillerChallengeInventory,
  wordgameInventory,
  hangmanInventory,
  speedmatchInventory,
  memorymatchInventory,
  sequenceInventory,
  bingoInventory,
  rainInventory,
  reflexInventory,
  heroInventory,
  explorerInventory,
  contractionSprintInventory,
  sentenceDecoderInventory,
];

export function siteInventory(): InventoryItem[] {
  return SOURCES.flatMap((f) => f());
}
