/**
 * StorybookArt — flat, mid-century decorative spot illustrations in the spirit of
 * Mary Blair and the Provensens. Purely ornamental (aria-hidden), built from the
 * shared accent tokens (--teal / --clay / --mustard / --gold / --sage) so they stay
 * in key with the rest of the site. Positioned by the parent via the `.storybook-art`
 * CSS classes; they sit behind hero content and fade out on small screens.
 */

type Variant = 'reading' | 'summer';

/** A stylized sun — a soft disc with simple radiating rays (mid-century flat). */
function Sun({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const rays = Array.from({ length: 8 }).map((_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const x1 = x + Math.cos(a) * (r + 5);
    const y1 = y + Math.sin(a) * (r + 5);
    const x2 = x + Math.cos(a) * (r + 15);
    const y2 = y + Math.sin(a) * (r + 15);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" />;
  });
  return (
    <g>
      {rays}
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
}

/** A small leafy sprig. */
function Sprig({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 40 C0 20 0 8 0 0" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M0 12 C10 6 16 10 14 20 C6 22 0 20 0 12 Z" fill={color} />
      <path d="M0 24 C-10 18 -16 22 -14 32 C-6 34 0 32 0 24 Z" fill={color} />
    </g>
  );
}

export default function StorybookArt({ variant }: { variant: Variant }) {
  if (variant === 'summer') {
    return (
      <svg
        className="storybook-art storybook-art-summer"
        viewBox="0 0 180 180"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <Sun x={128} y={52} r={22} color="var(--mustard)" />
        {/* rolling hills */}
        <path d="M0 150 C40 118 78 132 110 150 Z" fill="var(--teal)" opacity="0.85" />
        <path d="M60 155 C100 120 150 138 180 152 L180 180 L0 180 Z" fill="var(--sage-dark)" opacity="0.55" />
        {/* a single stylized flower */}
        <g transform="translate(38 118)">
          <line x1="0" y1="0" x2="0" y2="34" stroke="var(--sage-dark)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="-6" r="6" fill="var(--clay)" />
          <circle cx="8" cy="0" r="6" fill="var(--clay)" />
          <circle cx="-8" cy="0" r="6" fill="var(--clay)" />
          <circle cx="0" cy="6" r="6" fill="var(--clay)" />
          <circle cx="0" cy="0" r="4.5" fill="var(--mustard)" />
        </g>
      </svg>
    );
  }

  // 'reading' — an arched window framing a small braille page + a sprig
  return (
    <svg
      className="storybook-art storybook-art-reading"
      viewBox="0 0 160 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* arch */}
      <path
        d="M30 190 L30 70 A50 50 0 0 1 130 70 L130 190"
        stroke="var(--clay)"
        strokeWidth="4"
        fill="var(--teal-soft)"
        opacity="0.9"
      />
      {/* an open braille page inside the arch */}
      <rect x="52" y="96" width="56" height="70" rx="4" fill="#fff" stroke="var(--teal)" strokeWidth="2" />
      <line x1="80" y1="98" x2="80" y2="164" stroke="var(--teal)" strokeWidth="1.5" opacity="0.4" />
      {/* braille dots as page text */}
      {[110, 124, 138, 152].map((cy) =>
        [60, 66, 90, 96].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" fill="var(--navy)" />),
      )}
      {/* a little sun peeking at the top of the arch */}
      <Sun x={80} y={54} r={12} color="var(--mustard)" />
      <Sprig x={124} y={150} color="var(--sage-dark)" />
    </svg>
  );
}
