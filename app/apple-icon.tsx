import { ImageResponse } from 'next/og';
import { OgCell, OG } from '@/lib/og-cell';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: OG.ink,
      }}
    >
      <OgCell dots={OG.T} dot={30} gap={14} on={OG.tomato} off="rgba(255,253,249,0.14)" />
    </div>,
    { ...size },
  );
}
