'use client';

import '@/styles/games/number-sense.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Choices,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import BrailleText from '@/components/ui/BrailleText';
import Cell from '@/components/ui/Cell';
import { nemethNumber, nemethProblem, type NemethCell } from '@/lib/nemeth-map';
import { describe } from '@/lib/ueb';
import { generateChoices, generateProblem, type MathProblem } from '@/lib/math-problems';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import type { Difficulty } from '@/lib/progress-types';

const ROUNDS = 10;

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Adding', hint: '+ up to 10' },
  { value: 'intermediate', label: 'Add and subtract', hint: '+ − up to 20' },
  { value: 'advanced', label: 'All three', hint: '+ − × up to 50' },
];

const OP_WORDS: Record<string, string> = { '+': 'plus', '-': 'minus', '×': 'times' };

type Phase = 'ready' | 'question' | 'answered' | 'done';

/** "dots 3 4 5 6, then dot 2, then space, …" — describes the braille without saying what it means. */
function describeRun(cells: NemethCell[]): string {
  return cells.map((c) => (c.dots.length ? describe(c.dots) : 'space')).join(', then ');
}

function spoken(p: MathProblem) {
  return `${p.operands[0]} ${OP_WORDS[p.operator] ?? p.operator} ${p.operands[1]}`;
}

function starsFor(score: number) {
  return score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
}

/** Number Sense: read a little sum written in Nemeth Code and pick the answer. */
export default function BrailleNumberSense() {
  const { difficulty, setDifficulty, stats, finish } = useSession('number-sense');
  const { announce, region } = useAnnouncer();

  const [phase, setPhase] = useState<Phase>('ready');
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const lastDisplay = useRef('');

  const newProblem = useCallback(() => {
    const params = getDifficultyParams('number-sense', difficulty) as { maxNumber: number; operations: string[] };
    let p = generateProblem(params.maxNumber, params.operations);
    for (let i = 0; i < 5 && p.display === lastDisplay.current; i++) {
      p = generateProblem(params.maxNumber, params.operations);
    }
    lastDisplay.current = p.display;
    setProblem(p);
    setChoices(shuffle(generateChoices(p.answer, 3)));
    setPicked(null);
    setPhase('question');
  }, [difficulty]);

  const start = useCallback(() => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setNewBest(false);
    newProblem();
  }, [newProblem]);

  const pick = useCallback(
    (id: string) => {
      if (phase !== 'question' || !problem) return;
      const n = Number(id);
      const correct = n === problem.answer;
      setPicked(n);
      setPhase('answered');
      if (correct) {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
        announce(`Correct! ${spoken(problem)} is ${problem.answer}.`);
      } else {
        setStreak(0);
        announce(`Not quite. ${spoken(problem)} is ${problem.answer}, not ${n}.`);
      }
    },
    [phase, problem, announce],
  );

  const next = useCallback(() => {
    if (phase !== 'answered') return;
    const nextRound = round + 1;
    if (nextRound >= ROUNDS) {
      setNewBest(score > stats.bestScore);
      finish(score >= ROUNDS / 2, score);
      setPhase('done');
      return;
    }
    setRound(nextRound);
    newProblem();
  }, [phase, round, score, stats.bestScore, finish, newProblem]);

  // Move focus to "Next" once the answer buttons lock, so keyboard users never lose their place.
  useEffect(() => {
    if (phase === 'answered') nextRef.current?.focus();
  }, [phase]);

  useGameKeys(
    (e) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (phase === 'ready') start();
      else if (phase === 'answered') next();
    },
    { enabled: phase === 'ready' || phase === 'answered' },
  );

  const cells = problem ? nemethProblem(problem.operands[0], problem.operator, problem.operands[1]) : [];
  const correct = picked !== null && problem !== null && picked === problem.answer;

  return (
    <div className="game-board ns-board" data-testid="game-board">
      {region}
      <p className="ns-note">Math braille here uses Nemeth Code, used in many US schools.</p>

      {phase === 'ready' && (
        <StartPanel heading="Ready to do some braille math?" onStart={start}>
          <p className="game-prompt-sub">
            Read the problem in braille, then choose the answer. Ten problems, no timer.
          </p>
          <ModePicker legend="Problems" name="ns-level" value={difficulty} options={LEVELS} onChange={setDifficulty} />
        </StartPanel>
      )}

      {(phase === 'question' || phase === 'answered') && problem && (
        <>
          <Hud
            items={[
              { label: 'Problem', value: `${round + 1} of ${ROUNDS}` },
              { label: 'Score', value: score },
              { label: 'Streak', value: streak, tone: 'streak' },
            ]}
          />
          <h2 className="game-prompt ns-prompt">What is the answer?</h2>
          <div className="game-cell-stage ns-stage" data-testid="ns-problem">
            <span className="ns-cells" role="img" aria-label={`Math problem in braille: ${describeRun(cells)}`}>
              {cells.map((c, i) =>
                c.dots.length ? <Cell key={i} dots={c.dots} size="lg" /> : <span key={i} className="ns-space" />,
              )}
            </span>
            <span className="ns-blank" aria-hidden="true">
              ?
            </span>
          </div>
          {phase === 'answered' && (
            <p className="ns-print" aria-hidden="true">
              {problem.display} = {problem.answer}
            </p>
          )}
          <Choices
            choices={choices.map((n) => ({
              id: String(n),
              label: String(n),
              content: (
                <span className="ns-choice">
                  <BrailleText cells={nemethNumber(n).map((c) => c.dots)} size="sm" />
                  <span className="ns-choice-print">{n}</span>
                </span>
              ),
            }))}
            onPick={pick}
            correctId={phase === 'answered' ? String(problem.answer) : null}
            pickedId={picked !== null ? String(picked) : null}
            disabled={phase === 'answered'}
            label="Answers"
          />
          <div
            className={`feedback${phase === 'answered' ? (correct ? ' feedback--good' : ' feedback--bad') : ''}`}
            aria-hidden="true"
          >
            {phase === 'answered' && (
              <span className="feedback-pill">
                {correct
                  ? `✓ Correct! ${problem.display} = ${problem.answer}`
                  : `✗ Not quite — the answer is ${problem.answer}`}
              </span>
            )}
          </div>
          {phase === 'answered' && (
            <div className="ns-actions">
              <button ref={nextRef} type="button" className="btn btn--pine" onClick={next}>
                {round + 1 >= ROUNDS ? 'See results' : 'Next problem'}
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
        <Results
          title={
            score === ROUNDS
              ? 'Perfect math!'
              : score >= 7
                ? 'Great job!'
                : score >= 5
                  ? 'Good effort!'
                  : 'Keep practicing!'
          }
          summary={`${score} of ${ROUNDS} correct`}
          stars={starsFor(score)}
          best={stats.bestScore > 0 || score > 0 ? `${Math.max(stats.bestScore, score)} of ${ROUNDS}` : undefined}
          isNewBest={newBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
