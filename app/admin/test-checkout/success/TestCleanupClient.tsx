'use client';

import { useState } from 'react';

export default function TestCleanupClient() {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleCleanup() {
    setCleaning(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/test-checkout', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error || 'Cleanup failed'}`);
      } else {
        setResult(data.message || 'Test data cleaned up successfully.');
      }
    } catch {
      setResult('Error: Network request failed');
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
      <div
        style={{
          width: 48,
          height: 48,
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'var(--gold-subtle, rgba(212, 168, 83, 0.12))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Test Payment Complete</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        The $1.00 test charge was successful. A test enrollment with email{' '}
        <code style={{ fontSize: '0.85em' }}>test@test.invalid</code> should appear in the dashboard
        once the webhook processes (usually within a few seconds).
      </p>

      <button
        onClick={handleCleanup}
        disabled={cleaning}
        style={{
          padding: '10px 24px',
          background: cleaning ? '#ccc' : 'var(--gold)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: cleaning ? 'not-allowed' : 'pointer',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}
      >
        {cleaning ? 'Cleaning Up...' : 'Clean Up Test Data'}
      </button>

      {result && (
        <p
          style={{
            marginTop: 16,
            padding: '10px 16px',
            borderRadius: 8,
            background: result.startsWith('Error')
              ? 'rgba(220, 38, 38, 0.08)'
              : 'rgba(34, 197, 94, 0.08)',
            color: result.startsWith('Error') ? '#dc2626' : '#16a34a',
            fontSize: '0.9rem',
          }}
        >
          {result}
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <a href="/admin" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </a>
      </div>
    </div>
  );
}
