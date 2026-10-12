'use client';

import ChoiceGame, { type ChoiceGameConfig } from '@/components/games/ChoiceGame';
import BrailleText from '@/components/BrailleText';
import {
  type DetectiveItem,
  type DetectiveSpec,
  fullText,
  isCorrect,
  makeRound,
  printWithBlank,
  questionSpecs,
  shownTokens,
} from '@/lib/games/punctuation-detective';
import { PUNCTUATION, type PunctuationId } from '@/lib/braille/ueb';
import { describeCells } from '@/lib/braille/prose';
import { signsWithCells } from '@/lib/braille/shared';
import type { Difficulty } from '@/lib/progress-types';

function highlighted(s: DetectiveSpec) {
  const { tokens, index } = shownTokens(s.prompt);
  return { tokens, index, cells: tokens[index].cells };
}

const config: ChoiceGameConfig<DetectiveItem, PunctuationId> = {
  gameId: 'punctuation-detective',
  title: 'Punctuation Detective',
  kicker: 'Punctuation',
  subtitle: 'One clue is highlighted in each braille sentence. Which punctuation mark is it?',
  theme: 'pdetect',
  modes: [{ id: 'read', label: 'Read' }],
  rounds: 8,
  specs: (d) => questionSpecs(d as Difficulty),
  makeRound: (s) => makeRound(s as DetectiveSpec),
  isCorrect: (s, c) => isCorrect(s as DetectiveSpec, c),
  question: () => 'Which mark is the highlighted cell group?',
  renderPrompt: (s) => {
    const { tokens, index, cells } = highlighted(s as DetectiveSpec);
    return (
      <div className="pdetect-case">
        <BrailleText
          tokens={tokens}
          highlight={index}
          className="braille-text cgame-braille-md"
          label={`Braille sentence. The highlighted cells are ${describeCells(cells)}.`}
        />
        <p className="pdetect-clue">
          <span className="pdetect-clue-label">Print, with the mark hidden:</span> {printWithBlank(s.prompt)}
        </p>
      </div>
    );
  },
  renderChoice: (c) => (
    <span className="pdetect-choice">
      <span className="pdetect-glyph" aria-hidden="true">
        {PUNCTUATION[c].print}
      </span>
      <span className="pdetect-name">{PUNCTUATION[c].name}</span>
    </span>
  ),
  choiceLabel: (c) => PUNCTUATION[c].name,
  explain: (s) => {
    const { cells } = highlighted(s as DetectiveSpec);
    const sign = PUNCTUATION[s.answer];
    const sharing = signsWithCells(sign.cells).filter((x) => x.id !== sign.id);
    return (
      <>
        <p>
          The highlighted cells are {describeCells(cells)}: the {sign.name}.
          {sharing.length > 0 &&
            ` The ${sharing.map((x) => x.name).join(' and the ')} uses the same cell; ${
              s.answer === 'question'
                ? 'here it comes at the end of a word, so it is a question mark.'
                : 'here it comes at the start of a word, so it opens a quotation.'
            }`}
        </p>
        <p className="pdetect-full">{fullText(s.prompt)}</p>
      </>
    );
  },
  answerText: (s) => `the ${PUNCTUATION[s.answer].name} (${PUNCTUATION[s.answer].print})`,
};

export default function BraillePunctuationDetective() {
  return <ChoiceGame config={config} />;
}
