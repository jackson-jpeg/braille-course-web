import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Braille T: [d1, d4, d2, d5, d3, d6] = [0,1,1,1,1,0]
// col0 = [d1, d2, d3] = [0, 1, 1]   col1 = [d4, d5, d6] = [1, 1, 0]
const COL0 = [0, 1, 1];
const COL1 = [1, 1, 0];

const NAVY = '#1B2A4A';
const GOLD = '#D4A853';

export default function Icon() {
  const dotSize = 5;
  const gap = 3;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: NAVY,
        borderRadius: 6,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap }}>
        {[COL0, COL1].map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap }}>
            {col.map((filled, ri) => (
              <div
                key={ri}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: '50%',
                  backgroundColor: filled ? GOLD : 'rgba(253,248,240,0.18)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
