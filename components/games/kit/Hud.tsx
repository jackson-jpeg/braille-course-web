import type { ReactNode } from 'react';

export interface HudItem {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'streak' | 'timer' | 'warn';
}

/** Score / streak / timer strip at the top of a game board. */
export default function Hud({ items }: { items: HudItem[] }) {
  return (
    <dl className="hud">
      {items.map((it) => (
        <div key={it.label} className={`hud-item hud-item--${it.tone ?? 'default'}`}>
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
