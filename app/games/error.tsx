'use client';

export default function GamesError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="games-error">
      <h2>Something went wrong</h2>
      <p>An error occurred while loading the games page.</p>
      <button onClick={reset} className="games-error-retry">
        Try Again
      </button>
    </section>
  );
}
