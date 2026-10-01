import { ImageResponse } from 'next/og';
import { OgCell, OG } from '@/lib/og-cell';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon: the braille letter t (dots 2 3 4 5) in tomato on ink. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: OG.ink,
        borderRadius: 7,
      }}
    >
      <OgCell dots={OG.T} dot={6} gap={2} on={OG.tomato} off="rgba(255,253,249,0.16)" />
    </div>,
    { ...size },
  );
}
