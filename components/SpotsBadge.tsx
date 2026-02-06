'use client';

import { useSpots } from '@/lib/spots-context';

export default function SpotsBadge({ variant }: { variant: 'hero-chip' | 'cta-badge' }) {
  const { totalRemaining, totalSpots } = useSpots();
  const soldOut = totalRemaining <= 0;

  if (variant === 'hero-chip') {
    return <>{soldOut ? 'Sold Out' : `${totalRemaining} of ${totalSpots} Spots Left`}</>;
  }

  // cta-badge
  return (
    <>
      {!soldOut && <span className="pulse-dot" aria-hidden="true"></span>}
      {soldOut
        ? 'All spots have been filled'
        : `${totalRemaining} of ${totalSpots} spots available`}
    </>
  );
}
