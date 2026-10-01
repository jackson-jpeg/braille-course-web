'use client';

import Link from 'next/link';
import Cell from '@/components/ui/Cell';
import '@/styles/pages/system.css';

export default function GamesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="system-page lattice">
      <div className="wrap-narrow system-card tile" role="alert">
        <Cell dots={[]} size="xl" framed flat="ghost" />
        <h1>This game tripped over a dot</h1>
        <p className="lead center">Sorry about that. Trying again usually fixes it.</p>
        <div className="cluster system-actions">
          <button type="button" onClick={reset} className="btn">
            Try again
          </button>
          <Link href="/games" className="btn btn--paper">
            All games
          </Link>
        </div>
      </div>
    </div>
  );
}
