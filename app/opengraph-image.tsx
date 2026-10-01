import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'TeachBraille.org — Delaney Costello, Teacher of the Visually Impaired';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Braille dot patterns: [d1, d4, d2, d5, d3, d6]
const patterns: Record<string, number[]> = {
  T: [0, 1, 1, 1, 1, 0],
  E: [1, 0, 0, 1, 0, 0],
  A: [1, 0, 0, 0, 0, 0],
  C: [1, 1, 0, 0, 0, 0],
  H: [1, 0, 1, 1, 0, 0],
};

const NAVY = '#1B2A4A';
const GOLD = '#D4A853';
const CREAM = '#FDF8F0';
const DOT_SIZE = 20;
const DOT_GAP = 10;
const CELL_GAP = 32;

function BrailleCell({ pattern }: { pattern: number[] }) {
  // pattern is [d1, d4, d2, d5, d3, d6]
  // Render as 2 columns x 3 rows: col0=[d1,d2,d3], col1=[d4,d5,d6]
  const col0 = [pattern[0], pattern[2], pattern[4]];
  const col1 = [pattern[1], pattern[3], pattern[5]];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: DOT_GAP }}>
      {[col0, col1].map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: DOT_GAP }}>
          {col.map((filled, ri) => (
            <div
              key={ri}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: '50%',
                backgroundColor: filled ? GOLD : 'rgba(253,248,240,0.15)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default async function OGImage() {
  const fontData = await fetch('https://fonts.gstatic.com/s/dmseriftext/v12/rnCu-xZa_krGOkCWldXRa15pvF2OQFP-.ttf', {
    cache: 'force-cache',
  }).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: NAVY,
        padding: '60px',
      }}
    >
      {/* Braille cells spelling TEACH */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: CELL_GAP,
          marginBottom: 48,
        }}
      >
        {'TEACH'.split('').map((letter) => (
          <BrailleCell key={letter} pattern={patterns[letter]} />
        ))}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: '"DM Serif Text"',
          fontSize: 64,
          color: GOLD,
          marginBottom: 24,
        }}
      >
        TeachBraille.org
      </div>

      {/* Divider */}
      <div
        style={{
          width: 120,
          height: 2,
          backgroundColor: GOLD,
          marginBottom: 24,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          fontSize: 28,
          color: CREAM,
          fontFamily: 'sans-serif',
        }}
      >
        Delaney Costello, Teacher of the Visually Impaired
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'DM Serif Text',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    },
  );
}
