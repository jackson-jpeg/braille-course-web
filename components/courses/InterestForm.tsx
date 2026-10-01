'use client';

import { useRef, useState, type FormEvent } from 'react';
import ButtonCell from '@/components/ui/ButtonCell';

/**
 * "Join the list" for the next live course. Posts to /api/waitlist-signup, which saves a Lead
 * (subject "Waitlist Request") that Delaney sees in Admin → Students → Waitlist.
 */
export default function InterestForm({ id = 'interest' }: { id?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState('error');
      setError('Please enter an email address like name@example.com.');
      inputRef.current?.focus();
      return;
    }
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/waitlist-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState('error');
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setError('We couldn’t reach the server. Please check your connection and try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className="notice interest-done" role="status">
        You&rsquo;re on the list! Delaney will email you as soon as the next course is scheduled.
      </div>
    );
  }

  const errId = `${id}-error`;
  return (
    <form className="interest-form" onSubmit={submit} noValidate aria-describedby={`${id}-help`}>
      <div className="field">
        <label htmlFor={`${id}-email`}>Your email address</label>
        <div className="interest-row">
          <input
            ref={inputRef}
            id={`${id}-email`}
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={state === 'error'}
            aria-describedby={state === 'error' ? errId : undefined}
            disabled={state === 'sending'}
          />
          <button type="submit" className="btn" disabled={state === 'sending'}>
            <ButtonCell letter="j" />
            {state === 'sending' ? 'Joining…' : 'Join the list'}
          </button>
        </div>
        <p id={`${id}-help`} className="hint">
          One email when dates are set. No spam, and you can ask to be removed anytime.
        </p>
        {state === 'error' && (
          <p id={errId} className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
