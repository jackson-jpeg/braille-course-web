'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="global-error-page">
      <div className="global-error-card">
        <div className="global-error-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
        </div>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again or return to the home page.</p>
        {error.digest && (
          <p className="global-error-digest">Error ID: {error.digest}</p>
        )}
        <div className="global-error-actions">
          <button onClick={reset} className="global-error-retry">
            Try Again
          </button>
          <a href="/" className="global-error-home">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
