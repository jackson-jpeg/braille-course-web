import Cell from '@/components/ui/Cell';
import { LETTERS } from '@/lib/ueb';

export type MascotMood = 'happy' | 'oops' | 'think';

/**
 * Pip, the Braille Bay guide: a round pebble whose eyes are the top row of a real cell
 * (the letter c, dots 1 4). Purely decorative — the words next to Pip carry the meaning.
 */
export default function Mascot({ mood = 'happy', size = 'md' }: { mood?: MascotMood; size?: 'sm' | 'md' }) {
  return (
    <span className={`dq-mascot dq-mascot--${mood} dq-mascot--${size}`} aria-hidden="true">
      <span className="dq-mascot-body">
        <Cell dots={LETTERS.c} size={size === 'sm' ? 'xs' : 'sm'} tone="ink" className="dq-mascot-eyes" />
        <span className="dq-mascot-mouth" />
        <span className="dq-mascot-cheek dq-mascot-cheek--l" />
        <span className="dq-mascot-cheek dq-mascot-cheek--r" />
      </span>
    </span>
  );
}
