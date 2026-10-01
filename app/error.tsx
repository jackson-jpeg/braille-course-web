'use client';

import Link from 'next/link';
import Cell from '@/components/ui/Cell';
import '@/styles/pages/system.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="system-page lattice">
      <div className="wrap-narrow system-card tile">
        <Cell dots={[]} size="xl" framed flat="ghost" />
        <h1>Something slipped</h1>
        <p className="lead center">Sorry — this page hit an unexpected error. Trying again usually fixes it.</p>
        {error.digest && <p className="muted">Error reference: {error.digest}</p>}
        <div className="cluster system-actions">
          <button type="button" onClick={reset} className="btn">
            Try again
          </button>
          <Link href="/" className="btn btn--paper">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
