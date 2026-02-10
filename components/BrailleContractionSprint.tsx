'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap } from '@/lib/braille-map';
import { contractedBrailleEntries } from '@/lib/contracted-braille-map';
import { getContractionWords, type ContractionWord } from '@/lib/contraction-words';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';

type Phase = 'ready' | 'playing' | 'result';

/** Get the braille pattern for a piece (letter or contraction) */
function getPiecePattern(piece: string): number[] {
  // Single letter
  if (piece.length === 1 && /^[A-Z]$/.test(piece)) {
    return brailleMap[piece] || [0, 0, 0, 0, 0, 0];
  }
  // Contraction label
  const entry = contractedBrailleEntries.find(
    (e) => e.label.toLowerCase() === piece.toLowerCase()
  );
  return entry?.pattern || [0, 0, 0, 0, 0, 0];
}

const TYPE_LABELS: Record<string, string> = {
  wordsign: 'Alphabetic wordsign',
  strong: 'Strong contraction',
  'groupsign-strong': 'Strong groupsign',
  'groupsign-lower': 'Lower groupsign',
  'wordsign-lower': 'Lower wordsign',
};

const TYPE_PRIORITY = ['groupsign-strong', 'groupsign-lower', 'strong', 'wordsign-lower', 'wordsign'];

/** Return a human-readable contraction type for the most interesting piece in a word */
function getWordType(pieces: string[]): string | null {
  let best: string | null = null;
  let bestPri = TYPE_PRIORITY.length;
  for (const piece of pieces) {
    if (piece.length === 1 && /^[A-Z]$/.test(piece)) continue; // plain letter
    const entry = contractedBrailleEntries.find(
      (e) => e.label.toLowerCase() === piece.toLowerCase()
    );
    if (entry) {
      const pri = TYPE_PRIORITY.indexOf(entry.type);
      if (pri !== -1 && pri < bestPri) {
        bestPri = pri;
        best = entry.type;
      }
    }
  }
  return best ? (TYPE_LABELS[best] || null) : null;
}

function BrailleCell({ pattern, size = 'medium' }: { pattern: number[]; size?: 'small' | 'medium' }) {
  return (
    <div className={`csprint-cell csprint-cell-${size}`} aria-hidden="true">
      {pattern.map((v, i) => (
        <span key={i} className={`csprint-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

export default function BrailleContractionSprint() {
  const { difficulty, recordResult } = useGameProgress('contraction-sprint');
  const [phase, setPhase] = useState<Phase>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<ContractionWord | null>(null);
  const [availableTiles, setAvailableTiles] = useState<string[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [usedTileIndices, setUsedTileIndices] = useState<Set<number>>(new Set());
  const [tip, setTip] = useState('');
  const [words, setWords] = useState<ContractionWord[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Visibility-scoped keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load words based on difficulty
  useEffect(() => {
    setWords(getContractionWords(difficulty));
  }, [difficulty]);

  const pickNewWord = useCallback(() => {
    if (words.length === 0) return;
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setSelectedPieces([]);
    setUsedTileIndices(new Set());
    setFeedback(null);

    // Generate tiles: correct pieces + distractors
    const correctPieces = [...word.pieces];
    const distractors: string[] = [];
    const allLabels = contractedBrailleEntries.map((e) => e.label);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    while (distractors.length < 3) {
      const isLetter = Math.random() > 0.5;
      const pick = isLetter
        ? letters[Math.floor(Math.random() * letters.length)]
        : allLabels[Math.floor(Math.random() * allLabels.length)];
      if (!correctPieces.includes(pick) && !distractors.includes(pick)) {
        distractors.push(pick);
      }
    }

    setAvailableTiles([...correctPieces, ...distractors].sort(() => Math.random() - 0.5));
  }, [words]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeLimit = difficulty === 'beginner' ? 60 : difficulty === 'intermediate' ? 45 : 30;
    setPhase('playing');
    setScore(0);
    setTimeLeft(timeLimit);
    pickNewWord();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [difficulty, pickNewWord]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Record result when game ends
  useEffect(() => {
    if (phase === 'result') {
      const s = scoreRef.current;
      const achievements = recordResult(s >= 3, s);
      pushAchievements(achievements);
      setTip(getRandomTip().fact);
    }
  }, [phase, recordResult]);

  const handleTileClick = useCallback((piece: string, tileIndex: number) => {
    if (phase !== 'playing' || !currentWord) return;
    if (usedTileIndices.has(tileIndex)) return;

    const newSelected = [...selectedPieces, piece];
    const newUsed = new Set(usedTileIndices);
    newUsed.add(tileIndex);
    setSelectedPieces(newSelected);
    setUsedTileIndices(newUsed);

    // Check if selection matches when all slots filled
    if (newSelected.length === currentWord.pieces.length) {
      const isCorrect = newSelected.length > 0 &&
        newSelected.every((p, i) => p === currentWord.pieces[i]);
      if (isCorrect) {
        setFeedback('correct');
        setScore((s) => s + 1);
        feedbackTimerRef.current = setTimeout(() => pickNewWord(), 600);
      } else {
        setFeedback('wrong');
        feedbackTimerRef.current = setTimeout(() => {
          setSelectedPieces([]);
          setUsedTileIndices(new Set());
          setFeedback(null);
        }, 1200);
      }
    }
  }, [phase, currentWord, selectedPieces, usedTileIndices, pickNewWord]);

  const handleUndo = useCallback(() => {
    if (feedback) return;
    setSelectedPieces((prev) => prev.slice(0, -1));
    setUsedTileIndices((prev) => {
      const next = new Set(prev);
      const arr = [...next];
      if (arr.length > 0) next.delete(arr[arr.length - 1]);
      return next;
    });
  }, [feedback]);

  const wordType = currentWord ? getWordType(currentWord.pieces) : null;

  return (
    <div className="csprint-container" ref={containerRef}>
      <div className="csprint-header">
        <span className="section-label">Grade 2</span>
        <h2>Contraction Sprint</h2>
        <p>Build words using braille contractions</p>
      </div>

      <div className="csprint-body">
        {phase === 'ready' && (
          <div className="csprint-ready">
            <p className="csprint-instructions">
              Select the correct braille contraction tiles to spell each word.
              Score as many as you can before time runs out!
            </p>
            <button className="csprint-start-btn" onClick={startGame}>
              Start Sprint
            </button>
          </div>
        )}

        {phase === 'playing' && currentWord && (
          <>
            <div className="csprint-status" aria-live="polite" aria-atomic="true">
              <span className="csprint-timer">{timeLeft}s</span>
              <span className="csprint-score">Score: {score}</span>
            </div>

            <div className="csprint-target">
              <span className="csprint-target-word">{currentWord.word}</span>
              {wordType && <span className="csprint-type-tag">{wordType}</span>}
              <span className="csprint-target-hint">
                {currentWord.pieces.length} piece{currentWord.pieces.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Selected pieces */}
            <div className="csprint-selected" aria-label="Selected pieces">
              {currentWord.pieces.map((_, i) => (
                <div
                  key={i}
                  className={`csprint-slot ${
                    selectedPieces[i]
                      ? feedback === 'correct' ? 'correct'
                      : feedback === 'wrong'
                        ? (selectedPieces[i] === currentWord.pieces[i] ? 'slot-right' : 'wrong')
                      : 'filled'
                    : 'empty'
                  }`}
                >
                  {selectedPieces[i] && (
                    <>
                      <BrailleCell pattern={getPiecePattern(selectedPieces[i])} size="small" />
                      <span className="csprint-slot-label">{selectedPieces[i]}</span>
                    </>
                  )}
                </div>
              ))}
              {selectedPieces.length > 0 && !feedback && (
                <button className="csprint-undo" onClick={handleUndo} aria-label="Undo last piece">
                  ⌫
                </button>
              )}
            </div>

            {/* Show correct answer when wrong */}
            {feedback === 'wrong' && (
              <div className="csprint-answer">
                <span className="csprint-answer-label">Answer:</span>
                <div className="csprint-answer-pieces">
                  {currentWord.pieces.map((piece, i) => (
                    <div key={i} className="csprint-answer-piece">
                      <BrailleCell pattern={getPiecePattern(piece)} size="small" />
                      <span className="csprint-answer-piece-label">{piece}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available tiles */}
            <div className="csprint-tiles" role="group" aria-label="Available contraction tiles">
              {availableTiles.map((piece, i) => (
                <button
                  key={`${piece}-${i}`}
                  className={`csprint-tile ${usedTileIndices.has(i) ? 'used' : ''}`}
                  onClick={() => handleTileClick(piece, i)}
                  disabled={usedTileIndices.has(i)}
                  aria-label={`Contraction: ${piece}`}
                >
                  <BrailleCell pattern={getPiecePattern(piece)} size="medium" />
                  <span className="csprint-tile-label">{piece}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'result' && (
          <div className="csprint-result" aria-live="polite">
            <div className="csprint-result-score">{score}</div>
            <div className="csprint-result-label">
              {score === 0 ? 'Keep practicing!' : score < 5 ? 'Good effort!' : score < 10 ? 'Great job!' : 'Amazing!'}
            </div>
            {tip && <p className="csprint-tip">{tip}</p>}
            <button className="csprint-start-btn" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
