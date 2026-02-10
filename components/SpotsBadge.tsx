'use client';

import { useSpots } from '@/lib/spots-context';

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export default function SpotsBadge({ variant }: { variant: 'hero-chip' | 'cta-badge' }) {
  const { totalRemaining, totalSpots, stale, lastUpdated, refreshSections } = useSpots();
  const soldOut = totalRemaining <= 0;

  if (variant === 'hero-chip') {
    return <>{soldOut ? 'Sold Out' : `${totalRemaining} of ${totalSpots} Spots Left`}</>;
  }

  // cta-badge
  return (
    <>
      {!soldOut && <span className="pulse-dot" aria-hidden="true"></span>}
      {soldOut ? 'All spots have been filled' : `${totalRemaining} of ${totalSpots} spots available`}
      {stale && lastUpdated && (
        <div className="spots-stale-note">
          Updated {timeSince(lastUpdated)}.
          <button onClick={refreshSections} type="button">
            Refresh
          </button>
        </div>
      )}
    </>
  );
}
