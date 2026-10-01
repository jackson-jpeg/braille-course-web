import { ImageResponse } from 'next/og';
import { OgCell, OG } from '@/lib/og-cell';
import { transcribe } from '@/lib/ueb';

export const runtime = 'edge';
export const alt = 'TeachBraille.org — free braille lessons and games for families, by Delaney Costello, TVI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const word = transcribe('teach braille');
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        backgroundColor: OG.ink,
        color: OG.paper,
      }}
    >
      <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
        {word.map((c, i) =>
          c.dots.length === 0 ? (
            <div key={i} style={{ width: 40 }} />
          ) : (
            <OgCell key={i} dots={c.dots} dot={18} gap={9} on={OG.tomato} off="rgba(255,253,249,0.12)" />
          ),
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
          Braille, one dot at a time.
        </div>
        <div style={{ fontSize: 34, color: '#D9D4E6' }}>
          Free lessons &amp; games for families · Live courses with Delaney Costello, TVI
        </div>
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, color: OG.marigold, fontWeight: 700 }}
      >
        <OgCell dots={OG.T} dot={10} gap={5} on={OG.marigold} off="rgba(255,253,249,0.14)" />
        TeachBraille.org
      </div>
    </div>,
    { ...size },
  );
}
