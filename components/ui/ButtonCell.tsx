import Cell from './Cell';
import { LETTERS } from '@/lib/ueb';

/** The tiny cell inside buttons — spells the first letter of the action ("g" for Go). */
export default function ButtonCell({ letter = 'g' }: { letter?: string }) {
  return <Cell dots={LETTERS[letter] ?? LETTERS.g} size="xs" className="btn-cell" />;
}
