'use client';

import { useState } from 'react';

export default function AppointmentRequestForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [questions, setQuestions] = useState('');
  const [preferredCallbackTime, setPreferredCallbackTime] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Honeypot check - reject if bot filled the hidden field
    if (honeypot) {
      setError('Invalid submission');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/appointment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          questions: questions.trim() || undefined,
          preferredCallbackTime: preferredCallbackTime.trim() || undefined,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="appointment-success">
        <div className="appointment-success-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="3" />
            <path
              d="M20 32L28 40L44 24"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="appointment-success-title">Request Received!</h3>
        <p className="appointment-success-message">
          Thank you for your interest in braille instruction. Delaney will reach out within 24 hours to discuss your
          goals and schedule a session.
        </p>
        <p className="appointment-success-note">
          Check your email at <strong>{email}</strong> for confirmation.
        </p>
      </div>
    );
  }

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="appointment-form-intro">
        <p>
          Fill out the form below and Delaney will reach out within 24 hours to discuss your goals and schedule your
          first session.
        </p>
      </div>

      {error && (
        <div className="appointment-form-error" role="alert">
          {error}
        </div>
      )}

      <div className="appointment-form-grid">
        <div className="appointment-form-field">
          <label htmlFor="appt-name" className="appointment-form-label">
            Name <span className="appointment-form-required">*</span>
          </label>
          <input
            type="text"
            id="appt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="appointment-form-input"
            placeholder="Your full name"
            required
            minLength={2}
            maxLength={100}
            disabled={loading}
          />
        </div>

        <div className="appointment-form-field">
          <label htmlFor="appt-email" className="appointment-form-label">
            Email <span className="appointment-form-required">*</span>
          </label>
          <input
            type="email"
            id="appt-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appointment-form-input"
            placeholder="your@email.com"
            required
            disabled={loading}
            inputMode="email"
          />
        </div>

        <div className="appointment-form-field">
          <label htmlFor="appt-phone" className="appointment-form-label">
            Phone Number <span className="appointment-form-required">*</span>
          </label>
          <input
            type="tel"
            id="appt-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="appointment-form-input"
            placeholder="(555) 123-4567"
            required
            minLength={10}
            disabled={loading}
            inputMode="tel"
          />
        </div>

        <div className="appointment-form-field appointment-form-field-full">
          <label htmlFor="appt-callback" className="appointment-form-label">
            Preferred Callback Time
          </label>
          <input
            type="text"
            id="appt-callback"
            value={preferredCallbackTime}
            onChange={(e) => setPreferredCallbackTime(e.target.value)}
            className="appointment-form-input"
            placeholder="e.g., Weekday mornings EST, Afternoons, Evenings after 6pm"
            maxLength={200}
            disabled={loading}
          />
          <p className="appointment-form-hint">Let us know when you're typically available for a call</p>
        </div>

        <div className="appointment-form-field appointment-form-field-full">
          <label htmlFor="appt-questions" className="appointment-form-label">
            Questions or Goals
          </label>
          <textarea
            id="appt-questions"
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            className="appointment-form-textarea"
            placeholder="Tell us about your experience level, learning goals, or any questions you have..."
            rows={4}
            maxLength={1000}
            disabled={loading}
          />
          <p className="appointment-form-hint">
            Optional — helps us prepare for our conversation {questions.length > 0 && `(${questions.length}/1000)`}
          </p>
        </div>

        {/* Honeypot field for spam protection - hidden from real users */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <button type="submit" className="appointment-form-submit" disabled={loading}>
        {loading ? (
          <>
            <span className="appointment-form-spinner" aria-hidden="true" />
            Sending Request...
          </>
        ) : (
          <>
            Send Request
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>

      <p className="appointment-form-note">Delaney typically responds within 24 hours</p>
    </form>
  );
}
