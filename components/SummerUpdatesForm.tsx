'use client';

import { useState } from 'react';
import { useSpots } from '@/lib/spots-context';

/** Email capture on /summer for visitors who are not ready to enroll yet. Saves a Lead. */
export default function SummerUpdatesForm() {
  const { totalRemaining } = useSpots();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/waitlist-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), list: 'summer-updates' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // When the course is full, EnrollmentForm shows the waitlist instead.
  if (totalRemaining <= 0) return null;

  return (
    <div className="summer-updates" id="updates">
      <h3 className="summer-updates-title">Not ready to enroll yet?</h3>
      <p className="summer-updates-text">
        Leave your email and Delaney will send you course news and a reminder before the summer spots fill. No spam, and
        you can ask to be removed at any time.
      </p>

      {success ? (
        <div className="enrollment-waitlist-success" role="status">
          Thanks! You&rsquo;re on the list for summer course updates.
        </div>
      ) : (
        <form className="enrollment-waitlist-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="enrollment-waitlist-input"
            aria-label="Email address for summer course updates"
            disabled={submitting}
          />
          <button type="submit" className="summer-updates-button" disabled={submitting}>
            {submitting ? 'Saving...' : 'Email Me Updates'}
          </button>
          {error && (
            <div className="enrollment-error" role="alert">
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
