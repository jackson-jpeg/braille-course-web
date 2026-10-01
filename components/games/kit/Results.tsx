'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import Stars from './Stars';
import ButtonCell from '@/components/ui/ButtonCell';

interface ResultsProps {
  title: string;
  /** e.g. "8 of 10 correct" */
  summary: string;
  stars?: number;
  best?: string;
  isNewBest?: boolean;
  onReplay: () => void;
  replayLabel?: string;
  /** Optional suggested next step. */
  next?: { href: string; label: string };
  children?: ReactNode;
}

/** End-of-round card. Moves focus to its heading so screen-reader users hear the result. */
export default function Results({
  title,
  summary,
  stars,
  best,
  isNewBest,
  onReplay,
  replayLabel = 'Play again',
  next,
  children,
}: ResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <div className="results">
      {stars !== undefined && <Stars value={stars} />}
      <h2 ref={headingRef} tabIndex={-1} className="results-title">
        {title}
      </h2>
      <p className="results-summary">{summary}</p>
      {best && (
        <p className={`results-best${isNewBest ? ' is-new' : ''}`}>
          {isNewBest ? `New best: ${best}!` : `Your best: ${best}`}
        </p>
      )}
      {children}
      <div className="cluster results-actions">
        <button type="button" className="btn" onClick={onReplay}>
          <ButtonCell letter="g" />
          {replayLabel}
        </button>
        {next && (
          <Link href={next.href} className="btn btn--paper">
            {next.label}
          </Link>
        )}
      </div>
    </div>
  );
}
