import { ImageResponse } from 'next/og';
import { cellColumns, iconCell } from '@/lib/site-chrome-braille';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// The braille letter t (same cell as the nav logo), as two columns laid out by dotPosition.
const COLUMNS = cellColumns(iconCell());

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
        {COLUMNS.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap }}>
            {col.map(({ dot, raised: filled }) => (
              <div
                key={dot}
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
