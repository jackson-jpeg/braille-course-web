import { LETTERS, type Dots } from '@/lib/ueb';

/** A braille cell for next/og ImageResponse (flexbox only). Dots come from lib/ueb.ts. */
export function OgCell({ dots, dot, gap, on, off }: { dots: Dots; dot: number; gap: number; on: string; off: string }) {
  const col = (nums: number[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {nums.map((n) => (
        <div
          key={n}
          style={{ width: dot, height: dot, borderRadius: '50%', backgroundColor: dots.includes(n) ? on : off }}
        />
      ))}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap }}>
      {col([1, 2, 3])}
      {col([4, 5, 6])}
    </div>
  );
}

export const OG = {
  ink: '#1E1B2E',
  paper: '#FFFDF9',
  tomato: '#E04A2F',
  marigold: '#F2B33D',
  T: LETTERS.t,
};
