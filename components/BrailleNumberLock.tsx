'use client';

import ChoiceGame, { type ChoiceGameConfig } from '@/components/games/ChoiceGame';
import BrailleText from '@/components/BrailleText';
import { type LockPrompt, type LockSpec, isCorrect, makeRound, questionSpecs } from '@/lib/games/number-lock';
import { describeCells } from '@/lib/braille/prose';
import { transcribe } from '@/lib/braille/transcribe';
import type { Difficulty } from '@/lib/progress-types';
import { spellOut } from '@/lib/games/spell';

const dotsOf = (print: string) => describeCells(transcribe(print));

const config: ChoiceGameConfig<LockPrompt, string> = {
  gameId: 'number-lock',
  title: 'Number Lock',
  kicker: 'Numbers',
  subtitle: 'Crack each lock by reading its code in braille. Watch for commas, decimals and letters after numbers.',
  theme: 'nlock',
  modes: [
    { id: 'read', label: 'Read the code' },
    { id: 'set', label: 'Set the dial' },
  ],
  rounds: 8,
  specs: (d, m) => questionSpecs(d as Difficulty, m as 'read' | 'set'),
  makeRound: (s) => makeRound(s as LockSpec),
  isCorrect: (s, c) => isCorrect(s as LockSpec, c),
  question: (_s, mode) => (mode === 'read' ? 'What is the code on this lock?' : 'Which dial setting spells this code?'),
  renderPrompt: (s, mode) => (
    <div className="nlock-lock" aria-hidden={mode === 'set' ? undefined : undefined}>
      <span className="nlock-shackle" aria-hidden="true" />
      <div className="nlock-face">
        {mode === 'read' ? (
          <BrailleText
            text={s.answer}
            className="braille-text cgame-braille-lg nlock-braille"
            label={`Lock code in braille: ${dotsOf(s.answer)}`}
          />
        ) : (
          <span className="cgame-print-lg nlock-print">{s.answer}</span>
        )}
      </div>
    </div>
  ),
  renderChoice: (c, _s, mode) =>
    mode === 'read' ? (
      <span className="cgame-choice-print">{c}</span>
    ) : (
      <BrailleText text={c} className="braille-text cgame-braille-sm" label={dotsOf(c)} />
    ),
  choiceLabel: (c, _s, mode) => (mode === 'read' ? spellOut(c) : `braille ${dotsOf(c)}`),
  explain: (s) => (
    <>
      <BrailleText
        text={s.answer}
        showLabels
        className="braille-text cgame-explain-braille"
        label={`${s.answer}: ${dotsOf(s.answer)}`}
      />
      <p>{s.prompt.item.lesson}</p>
    </>
  ),
  answerText: (s) => `“${s.answer}”`,
};

export default function BrailleNumberLock() {
  return <ChoiceGame config={config} />;
}
