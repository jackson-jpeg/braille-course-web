/**
 * Candidate everyday words for plain-contracted-words.py: the site's game word lists plus the most
 * frequent English words (scripts/braille/data/common-words.json), minus the family-site blocklist.
 */
import { answerWords, validGuesses } from '../../lib/game-words';
import { hangmanWords } from '../../lib/hangman-words';
import { isBlockedWord } from '../../lib/word-blocklist';
import common from './data/common-words.json';

const words = new Set<string>(
  [...answerWords, ...validGuesses, ...hangmanWords, ...common.words].filter(
    (w) => /^[a-z]+$/.test(w) && !isBlockedWord(w),
  ),
);
process.stdout.write(JSON.stringify([...words]));
