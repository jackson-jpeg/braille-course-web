'use client';

import { useState, useMemo } from 'react';
import { brailleMap } from '@/lib/braille-map';
import { buildContractedReverseLookup } from '@/lib/contracted-braille-map';

type ExplorerMode = 'alphabetic' | 'contracted';

// Build reverse lookup: dot pattern string → letter
function buildReverseLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [letter, pattern] of Object.entries(brailleMap)) {
    map.set(pattern.join(','), letter);
  }
  return map;
}

// Standard dot numbers for display: grid positions [d1, d4, d2, d5, d3, d6]
const DOT_NUMBERS = [1, 4, 2, 5, 3, 6];

export default function BrailleDotExplorer() {
  const [dots, setDots] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [mode, setMode] = useState<ExplorerMode>('alphabetic');
  const reverseLookup = useMemo(() => buildReverseLookup(), []);
  const contractedLookup = useMemo(() => buildContractedReverseLookup(), []);

  const patternKey = dots.join(',');
  const matchedLetter = reverseLookup.get(patternKey) || null;
  const matchedContraction = contractedLookup.get(patternKey) || null;
  const anyActive = dots.some((d) => d === 1);

  function toggleDot(index: number) {
    setDots((prev) => {
      const next = [...prev];
      next[index] = next[index] === 1 ? 0 : 1;
      return next;
    });
  }

  function clearAll() {
    setDots([0, 0, 0, 0, 0, 0]);
  }

  const contractionTypeLabels: Record<string, string> = {
    'wordsign': 'Alphabetic wordsign',
    'strong': 'Strong contraction',
    'groupsign-strong': 'Strong groupsign',
    'groupsign-lower': 'Lower groupsign',
  };

  // Which dot numbers are currently raised
  const raisedDots = dots
    .map((v, i) => (v ? DOT_NUMBERS[i] : null))
    .filter(Boolean)
    .sort((a, b) => a! - b!) as number[];

  return (
    <div className="explorer-container">
      <div className="explorer-header">
        <span className="section-label">Explore</span>
        <h2>Dot Explorer</h2>
        <p>Toggle dots to discover braille {mode === 'contracted' ? 'contractions' : 'letters'}</p>
      </div>

      <div className="explorer-mode-toggle" role="radiogroup" aria-label="Explorer mode">
        <button
          className={`explorer-mode-pill${mode === 'alphabetic' ? ' active' : ''}`}
          role="radio"
          aria-checked={mode === 'alphabetic'}
          onClick={() => setMode('alphabetic')}
        >
          Alphabetic
        </button>
        <button
          className={`explorer-mode-pill${mode === 'contracted' ? ' active' : ''}`}
          role="radio"
          aria-checked={mode === 'contracted'}
          onClick={() => setMode('contracted')}
        >
          Contracted
        </button>
      </div>

      <div className="explorer-body">
        <div className="explorer-cell" role="group" aria-label="Interactive braille cell">
          {dots.map((filled, i) => (
            <button
              key={i}
              className={`explorer-dot${filled ? ' active' : ''}`}
              onClick={() => toggleDot(i)}
              aria-pressed={filled === 1}
              aria-label={`Dot ${DOT_NUMBERS[i]}${filled ? ', raised' : ', lowered'}`}
            >
              <span className="explorer-dot-number">{DOT_NUMBERS[i]}</span>
            </button>
          ))}
        </div>

        <div className="explorer-result">
          {anyActive ? (
            mode === 'alphabetic' ? (
              matchedLetter ? (
                <>
                  <div className="explorer-letter">{matchedLetter}</div>
                  <div className="explorer-dots-label">
                    Dots {raisedDots.join(', ')}
                  </div>
                </>
              ) : (
                <>
                  <div className="explorer-letter explorer-no-match">?</div>
                  <div className="explorer-dots-label">
                    Dots {raisedDots.join(', ')} — No match
                  </div>
                </>
              )
            ) : (
              matchedContraction ? (
                <>
                  <div className="explorer-contraction">{matchedContraction.label}</div>
                  <div className="explorer-contraction-type">
                    {contractionTypeLabels[matchedContraction.type]}
                  </div>
                  <div className="explorer-dots-label">
                    Dots {raisedDots.join(', ')}
                  </div>
                </>
              ) : (
                <>
                  <div className="explorer-letter explorer-no-match">?</div>
                  <div className="explorer-dots-label">
                    Dots {raisedDots.join(', ')} — No match
                  </div>
                </>
              )
            )
          ) : (
            <div className="explorer-prompt">
              Tap dots to begin
            </div>
          )}
        </div>

        <button className="explorer-clear" onClick={clearAll} disabled={!anyActive} aria-label="Clear all dots">
          Clear
        </button>
      </div>
    </div>
  );
}
