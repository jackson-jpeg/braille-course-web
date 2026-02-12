'use client';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-wrap">
      <div className="admin-error">
        <h1>Dashboard Error</h1>
        <p>Something went wrong loading the admin dashboard.</p>
        {error.digest && <p className="admin-error-digest">Error ID: {error.digest}</p>}
        <button onClick={reset} className="admin-error-retry">
          Try Again
        </button>
      </div>
    </div>
  );
}
