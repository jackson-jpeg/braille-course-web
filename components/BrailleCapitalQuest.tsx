'use client';

import ChoiceGame, { type ChoiceGameConfig } from '@/components/games/ChoiceGame';
import BrailleText from '@/components/BrailleText';
import { type CapitalPrompt, type CapitalSpec, isCorrect, makeRound, questionSpecs } from '@/lib/games/capital-quest';
import { describeCells } from '@/lib/braille/prose';
import { transcribe } from '@/lib/braille/transcribe';
import type { Difficulty } from '@/lib/progress-types';
import { spellOut } from '@/lib/games/spell';

const dotsOf = (print: string) => describeCells(transcribe(print));

const config: ChoiceGameConfig<CapitalPrompt, string> = {
  gameId: 'capital-quest',
  title: 'Capital Quest',
  kicker: 'Capitals',
  subtitle: 'Spot the capital indicators: one letter, a whole word, or a whole passage.',
  theme: 'cquest',
  modes: [
    { id: 'read', label: 'Read the braille' },
    { id: 'write', label: 'Pick the braille' },
  ],
  rounds: 8,
  specs: (d, m) => questionSpecs(d as Difficulty, m as 'read' | 'write'),
  makeRound: (s) => makeRound(s as CapitalSpec),
  isCorrect: (s, c) => isCorrect(s as CapitalSpec, c),
  question: (_s, mode) => (mode === 'read' ? 'Which print matches this braille?' : 'Which braille matches this print?'),
  renderPrompt: (s, mode) =>
    mode === 'read' ? (
      <BrailleText text={s.answer} className="braille-text cgame-braille-lg" label={`Braille: ${dotsOf(s.answer)}`} />
    ) : (
      <span className="cgame-print-lg">{s.answer}</span>
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

export default function BrailleCapitalQuest() {
  return <ChoiceGame config={config} />;
}
