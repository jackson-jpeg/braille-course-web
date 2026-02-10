'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRandomSentence, resetSentenceHistory, type SentenceData, type BrailleToken } from '@/lib/sentence-generator';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';

function BrailleTokenCell({ token }: { token: BrailleToken }) {
  if (token.type === 'space') {
    return <span className="decoder-space" />;
  }
  return (
    <div
      className={`decoder-cell ${token.type === 'contraction' ? 'decoder-cell-contraction' : ''}`}
      aria-label={token.type === 'contraction' ? `Contraction for "${token.meaning}"` : `Letter ${token.value}`}
    >
      <div className="decoder-cell-dots">
        {token.pattern.map((v, i) => (
          <span key={i} className={`decoder-dot ${v ? 'filled' : 'empty'}`} />
        ))}
      </div>
      {token.type === 'contraction' && (
        <span className="decoder-contraction-marker">◆</span>
      )}
    </div>
  );
}

export default function BrailleSentenceDecoder() {
  const { difficulty, recordResult } = useGameProgress('sentence-decoder');
  const [sentence, setSentence] = useState<SentenceData | null>(null);
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [tip, setTip] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const params = getDifficultyParams('sentence-decoder', difficulty) as {
    maxWords: number;
  };

  const loadSentence = useCallback(() => {
    const s = getRandomSentence(params.maxWords);
    setSentence(s);
    setUserInput('');
    setSubmitted(false);
    setIsCorrect(false);
    // Focus input only if the game section is visible (prevent page scroll-jump)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 100);
  }, [params.maxWords]);

  const startGame = useCallback(() => {
    setScore(0);
    setRound(0);
    setGameOver(false);
    setTip('');
    resetSentenceHistory();
    loadSentence();
  }, [loadSentence]);

  useEffect(() => {
    startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(() => {
    if (!sentence || submitted || !userInput.trim()) return;

    const normalized = userInput.trim().toLowerCase().replace(/\s+/g, ' ');
    const expected = sentence.plainText.toLowerCase().replace(/\s+/g, ' ');
    const correct = normalized === expected;

    setSubmitted(true);
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);

    roundTimerRef.current = setTimeout(() => {
      const nextR = round + 1;
      setRound(nextR);
      if (nextR >= totalRounds) {
        const finalScore = correct ? scoreRef.current + 1 : scoreRef.current;
        setGameOver(true);
        const achievements = recordResult(finalScore >= totalRounds / 2, finalScore);
        pushAchievements(achievements);
        setTip(getRandomTip().fact);
      } else {
        loadSentence();
      }
    }, correct ? 1000 : 2500);
  }, [sentence, submitted, userInput, round, totalRounds, loadSentence, recordResult]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (roundTimerRef.current) clearTimeout(roundTimerRef.current); };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="decoder-container" ref={containerRef}>
      <div className="decoder-header">
        <span className="section-label">Reading</span>
        <h2>Sentence Decoder</h2>
        <p>Read contracted braille sentences</p>
      </div>

      <div className="decoder-body">
        {!gameOver && sentence && (
          <>
            <div className="decoder-status" aria-live="polite" aria-atomic="true">
              <span>Sentence {round + 1} / {totalRounds}</span>
              <span>Score: {score}</span>
            </div>

            {/* Braille sentence display */}
            <div className="decoder-sentence" aria-label="Braille sentence to decode">
              {sentence.brailleTokens.map((token, i) => (
                <BrailleTokenCell key={i} token={token} />
              ))}
            </div>

            <div className="decoder-hint-text">
              ◆ = contraction (one cell = whole word or syllable)
            </div>

            {/* User input */}
            <div className="decoder-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className={`decoder-input ${
                  submitted ? (isCorrect ? 'correct' : 'wrong') : ''
                }`}
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
                <button
                  className="decoder-submit-btn"
                  onClick={handleSubmit}
                  disabled={!userInput.trim()}
                >
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
                    <strong>{sentence.plainText}</strong>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {gameOver && (
          <div className="decoder-result">
            <div className="decoder-result-score">{score} / {totalRounds}</div>
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
