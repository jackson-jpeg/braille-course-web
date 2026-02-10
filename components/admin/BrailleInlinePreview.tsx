'use client';

import { brailleMap } from '@/lib/braille-map';
import { contractedBrailleEntries } from '@/lib/contracted-braille-map';

/**
 * Renders inline braille dot-pattern cells for text containing
 * single uppercase letters or known contractions.
 * Read-only display cells using the 2-col 3-row dot grid pattern.
 */

interface BrailleInlinePreviewProps {
  text: string;
}

// Build contraction lookup for quick access
const contractionPatterns = new Map<string, number[]>();
for (const entry of contractedBrailleEntries) {
  contractionPatterns.set(entry.label.toLowerCase(), entry.pattern);
}

function DotCell({ pattern, label }: { pattern: number[]; label: string }) {
  // pattern: [d1, d4, d2, d5, d3, d6]
  const dotMap = [
    { col: 0, row: 0, idx: 0 }, // dot 1
    { col: 1, row: 0, idx: 1 }, // dot 4
    { col: 0, row: 1, idx: 2 }, // dot 2
    { col: 1, row: 1, idx: 3 }, // dot 5
    { col: 0, row: 2, idx: 4 }, // dot 3
    { col: 1, row: 2, idx: 5 }, // dot 6
  ];

  return (
    <span className="admin-braille-inline-cell" title={label}>
      <span className="admin-braille-inline-grid">
        {dotMap.map((dot, i) => (
          <span
            key={i}
            className={`admin-braille-inline-dot ${pattern[dot.idx] ? 'admin-braille-inline-dot-raised' : ''}`}
          />
        ))}
      </span>
      <span className="admin-braille-inline-label">{label}</span>
    </span>
  );
}

export default function BrailleInlinePreview({ text }: BrailleInlinePreviewProps) {
  // Find braille-referenced patterns in the text
  const cells: { label: string; pattern: number[] }[] = [];

  // Look for single uppercase letters
  const letterMatches = text.match(/\b[A-Z]\b/g);
  if (letterMatches) {
    const seen = new Set<string>();
    for (const letter of letterMatches) {
      if (seen.has(letter)) continue;
      seen.add(letter);
      const pattern = brailleMap[letter];
      if (pattern) {
        cells.push({ label: letter, pattern });
      }
    }
  }

  // Look for known contractions mentioned in quotes or as standalone words
  const lowerText = text.toLowerCase();
  for (const entry of contractedBrailleEntries) {
    if (lowerText.includes(`"${entry.label}"`) || lowerText.includes(`'${entry.label}'`)) {
      if (!cells.find((c) => c.label === entry.label)) {
        cells.push({ label: entry.label, pattern: entry.pattern });
      }
    }
  }

  if (cells.length === 0) return null;

  return (
    <span className="admin-braille-inline-preview">
      {cells.map((cell, i) => (
        <DotCell key={i} pattern={cell.pattern} label={cell.label} />
      ))}
    </span>
  );
}
