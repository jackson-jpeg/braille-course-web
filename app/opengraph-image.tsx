import { ImageResponse } from 'next/og';
import { type DotSlot, ogImageCells } from '@/lib/site-chrome-braille';

export const runtime = 'edge';

export const alt = 'TeachBraille.org — Delaney Costello, Teacher of the Visually Impaired';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NAVY = '#1B2A4A';
const GOLD = '#D4A853';
const CREAM = '#FDF8F0';
const DOT_SIZE = 20;
const DOT_GAP = 10;
const CELL_GAP = 32;

/** One braille cell as two flex columns (left and right column, from dotPosition), from lib/site-chrome-braille. */
function OgCell({ columns }: { columns: [DotSlot[], DotSlot[]] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: DOT_GAP }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: DOT_GAP }}>
          {col.map(({ dot, raised }) => (
            <div
              key={dot}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: '50%',
                backgroundColor: raised ? GOLD : 'rgba(253,248,240,0.15)',
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
      {/* Braille cells spelling "teach" (uncontracted, lowercase: no capital indicators) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: CELL_GAP,
          marginBottom: 48,
        }}
      >
        {ogImageCells().map(({ columns }, i) => (
          <OgCell key={i} columns={columns} />
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
