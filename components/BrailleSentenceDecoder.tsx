'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import {
  type DecoderDifficulty,
  ROUNDS,
  describeSentence,
  isContracted,
  isCorrect as checkAnswer,
  pickSentences,
} from '@/lib/games/sentence-decoder';
import type { DecoderSentence, DecoderToken } from '@/lib/sentence-generator';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import DifficultySelector from '@/components/DifficultySelector';

function TokenCells({ token }: { token: DecoderToken }) {
  const contraction = token.kind === 'contraction';
  return (
    <>
      {token.cells.map((cell, j) => (
        <div key={j} className={`decoder-cell ${contraction ? 'decoder-cell-contraction' : ''}`}>
          <BrailleCell cell={cell} className="decoder-cell-dots" dotClassName="decoder-dot" />
          {contraction && (
            <span className="decoder-contraction-marker" aria-hidden="true">
              ◆
            </span>
          )}
        </div>
      ))}
    </>
  );
}

/** Tokens grouped into words, so a line never breaks in the middle of a braille word. */
function words(sentence: DecoderSentence): DecoderToken[][] {
  const out: DecoderToken[][] = [[]];
  for (const t of sentence.tokens) {
    if (t.kind === 'space') out.push([]);
    else out[out.length - 1].push(t);
  }
  return out;
}

/** `fixedLevel` pins the level (used by the contracted-sentences lesson, so it opens contracted mode). */
export default function BrailleSentenceDecoder({ fixedLevel }: { fixedLevel?: DecoderDifficulty } = {}) {
  const progress = useGameProgress('sentence-decoder');
  const { recordResult } = progress;
  const difficulty = fixedLevel ?? progress.difficulty;
  const setDifficulty = progress.setDifficulty;
  const level = difficulty as DecoderDifficulty;
  const contracted = isContracted(level);
  const [queue, setQueue] = useState<DecoderSentence[]>([]);
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const totalRounds = ROUNDS;
  const [gameOver, setGameOver] = useState(false);
  const [tip, setTip] = useState('');
  const [described, setDescribed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const sentence = queue[round] ?? null;

  const resetInput = useCallback(() => {
    setUserInput('');
    setSubmitted(false);
    setIsCorrect(false);
    setDescribed(false);
    // Focus input without scrolling the page
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus({ preventScroll: true });
    }, 100);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setRound(0);
    setGameOver(false);
    setTip('');
    setQueue(pickSentences(level, ROUNDS));
    resetInput();
  }, [level, resetInput]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleSubmit = useCallback(() => {
    if (!sentence || submitted || !userInput.trim()) return;

    const correct = checkAnswer(sentence, userInput);

    setSubmitted(true);
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);

    roundTimerRef.current = setTimeout(
      () => {
        const nextR = round + 1;
        if (nextR >= totalRounds) {
          const finalScore = correct ? scoreRef.current + 1 : scoreRef.current;
          setRound(nextR);
          setGameOver(true);
          const achievements = recordResult(finalScore >= totalRounds / 2, finalScore);
          pushAchievements(achievements);
          setTip(getRandomTip().fact);
        } else {
          setRound(nextR);
          resetInput();
        }
      },
      correct ? 1000 : 2500,
    );
  }, [sentence, submitted, userInput, round, totalRounds, resetInput, recordResult]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="decoder-container" ref={containerRef}>
      <div className="decoder-header">
        <span className="section-label">Reading</span>
        <h2>Sentence Decoder</h2>
        <p>{contracted ? 'Read contracted (grade 2) braille sentences' : 'Read uncontracted braille sentences'}</p>
        {!fixedLevel && <DifficultySelector gameId="sentence-decoder" current={difficulty} onChange={setDifficulty} />}
      </div>

      <div className="decoder-body">
        {!gameOver && sentence && (
          <>
            <div className="decoder-status" aria-live="polite" aria-atomic="true">
              <span>
                Sentence {round + 1} / {totalRounds}
              </span>
              <span>Score: {score}</span>
            </div>

            {/* Braille sentence display */}
            <div
              className="decoder-sentence"
              role="img"
              aria-label={`Braille sentence, ${sentence.cells.length} cells. Use “Describe the cells” to hear the dot numbers.`}
            >
              {words(sentence).map((word, wi) => (
                <span key={wi} style={{ display: 'inline-flex', gap: 'inherit' }}>
                  {wi > 0 && <span className="decoder-space" />}
                  {word.map((token, ti) => (
                    <TokenCells key={ti} token={token} />
                  ))}
                </span>
              ))}
            </div>

            <div className="decoder-hint-text">
              {contracted ? '◆ = contraction (one cell for a whole word or a group of letters). ' : ''}
              Capitals and punctuation don’t count: just type the words and numbers you read.{' '}
              <button
                type="button"
                className="decoder-describe-btn"
                onClick={() => setDescribed((d) => !d)}
                aria-expanded={described}
              >
                Describe the cells
              </button>
            </div>
            {described && (
              <p className="decoder-hint-text" aria-live="polite">
                {describeSentence(sentence)}
              </p>
            )}

            {/* User input */}
            <div className="decoder-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className={`decoder-input ${submitted ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type the sentence..."
                disabled={submitted}
                aria-label="Type the decoded sentence"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {!submitted && (
                <button className="decoder-submit-btn" onClick={handleSubmit} disabled={!userInput.trim()}>
                  Check
                </button>
              )}
            </div>

            {submitted && (
              <div className={`decoder-feedback ${isCorrect ? 'correct' : 'wrong'}`} aria-live="assertive">
                {isCorrect ? (
                  'Correct!'
                ) : (
                  <>
                    <span>Answer: </span>
                    <strong>{sentence.print}</strong>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {gameOver && (
          <div className="decoder-result">
            <div className="decoder-result-score">
              {score} / {totalRounds}
            </div>
            <div className="decoder-result-label">
              {score === totalRounds ? 'Perfect reading!' : score >= 3 ? 'Good decoding!' : 'Keep practicing!'}
            </div>
            {tip && <p className="decoder-tip">{tip}</p>}
            <button className="decoder-play-again" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
