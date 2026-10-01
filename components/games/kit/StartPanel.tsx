'use client';

import type { ReactNode } from 'react';
import ButtonCell from '@/components/ui/ButtonCell';

/** The "ready?" screen before a round: options + a big start button. */
export default function StartPanel({
  heading,
  children,
  onStart,
  startLabel = 'Start',
  disabled,
}: {
  heading: string;
  children?: ReactNode;
  onStart: () => void;
  startLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="start-panel">
      <h2 className="start-title">{heading}</h2>
      {children}
      <button type="button" className="btn btn--lg" onClick={onStart} disabled={disabled}>
        <ButtonCell letter="g" />
        {startLabel}
      </button>
    </div>
  );
}
