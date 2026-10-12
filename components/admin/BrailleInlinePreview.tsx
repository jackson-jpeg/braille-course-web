'use client';

import BrailleCell from '@/components/BrailleCell';
import { type Cell, CONTRACTIONS, LETTER_CELLS, cellsKey } from '@/lib/braille/ueb';

/**
 * Renders inline braille cells for the letters and contractions mentioned in a piece of
 * AI-generated text, so the admin can eyeball them while reviewing. Read-only.
 *
 * Single uppercase letters (e.g. "B") show that letter's cell; contractions named in quotes
 * (e.g. "and") show the contraction's cell. All cells come from lib/braille.
 */

interface BrailleInlinePreviewProps {
  text: string;
}

export interface InlinePreviewItem {
  /** Visible caption, e.g. "B" or "and". */
  label: string;
  /** Screen-reader name, e.g. "Letter B" or "Contraction and". */
  name: string;
  cells: readonly Cell[];
}

/** One entry per contraction text whose cells are the same for every kind (e.g. "be", "in"). */
function unambiguousContractions(): { text: string; cells: readonly Cell[] }[] {
  const byText = new Map<string, Set<string>>();
  for (const c of CONTRACTIONS) byText.set(c.text, (byText.get(c.text) ?? new Set()).add(cellsKey(c.cells)));
  return [...byText.entries()]
    .filter(([, keys]) => keys.size === 1)
    .map(([text]) => ({ text, cells: CONTRACTIONS.find((c) => c.text === text)!.cells }));
}

const PREVIEW_CONTRACTIONS = unambiguousContractions();

/** The cells the preview shows for a piece of text, in order of discovery. */
export function inlinePreviewItems(text: string): InlinePreviewItem[] {
  const items: InlinePreviewItem[] = [];

  const seen = new Set<string>();
  for (const letter of text.match(/\b[A-Z]\b/g) ?? []) {
    if (seen.has(letter)) continue;
    seen.add(letter);
    items.push({ label: letter, name: `Letter ${letter}`, cells: [LETTER_CELLS[letter.toLowerCase()]] });
  }

  const lowerText = text.toLowerCase();
  for (const c of PREVIEW_CONTRACTIONS) {
    if (lowerText.includes(`"${c.text}"`) || lowerText.includes(`'${c.text}'`)) {
      if (!items.find((i) => i.label === c.text)) {
        items.push({ label: c.text, name: `Contraction ${c.text}`, cells: c.cells });
      }
    }
  }
  return items;
}

export default function BrailleInlinePreview({ text }: BrailleInlinePreviewProps) {
  const items = inlinePreviewItems(text);
  if (items.length === 0) return null;

  return (
    <span className="admin-braille-inline-preview">
      {items.map((item) => (
        <span key={item.label} className="admin-braille-inline-cell" title={item.label}>
          {item.cells.map((cell, i) => (
            <BrailleCell
              key={i}
              cell={cell}
              className="admin-braille-inline-grid"
              dotClassName="admin-braille-inline-dot"
              raisedClassName="admin-braille-inline-dot-raised raised"
              flatClassName="flat"
              label={item.name}
            />
          ))}
          <span className="admin-braille-inline-label" aria-hidden="true">
            {item.label}
          </span>
        </span>
      ))}
    </span>
  );
}
