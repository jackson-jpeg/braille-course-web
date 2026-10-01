'use client';

import { useEffect, useRef, useState } from 'react';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import '@/styles/pages/forms.css';

/** Same pattern the /api/appointment-request route accepts. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldKey = 'name' | 'email' | 'phone';

/** Field key → input id, in form order (the first invalid one receives focus). */
const FIELD_ID: Record<FieldKey, string> = {
  name: 'appt-name',
  email: 'appt-email',
  phone: 'appt-phone',
};

type FieldErrors = Partial<Record<FieldKey, string>>;

function Req() {
  return <span className="field-req"> (required)</span>;
}
function Opt() {
  return <span className="field-req"> (optional)</span>;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /** Mirrors the inputs' constraints (required / minLength / email) so errors can be shown inline. */
  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = 'Enter your name.';
    else if (name.trim().length < 2) errs.name = 'Your name must be at least 2 characters.';
    if (!email.trim()) errs.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) errs.email = 'Enter a valid email address, like name@example.com.';
    if (!phone.trim()) errs.phone = 'Enter your phone number.';
    else if (phone.trim().length < 10) errs.phone = 'Phone number must be at least 10 characters.';
    return errs;
  };

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

    const errs = validate();
    const invalid = (Object.keys(FIELD_ID) as FieldKey[]).filter((k) => errs[k]);
    setFieldErrors(errs);
    if (invalid.length > 0) {
      setError(
        invalid.length === 1
          ? 'Please fix 1 field marked below.'
          : `Please fix the ${invalid.length} fields marked below.`,
      );
      setLoading(false);
      document.getElementById(FIELD_ID[invalid[0]])?.focus();
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
      <div className="rf-success" role="status" tabIndex={-1} ref={successRef}>
        <BrailleText text="thank you" size="sm" />
        <h3>Request received</h3>
        <p>
          Thank you for your interest in braille instruction. Delaney will reach out within 24 hours to discuss your
          goals and schedule a session.
        </p>
        <p className="rf-success-note">
          Check your email at <strong>{email}</strong> for confirmation.
        </p>
      </div>
    );
  }

  const errId = (key: FieldKey) => (fieldErrors[key] ? `${FIELD_ID[key]}-error` : undefined);
  const errorText = (key: FieldKey) =>
    fieldErrors[key] ? (
      <p id={`${FIELD_ID[key]}-error`} className="form-error">
        {fieldErrors[key]}
      </p>
    ) : null;

  return (
    <form className="rf-form" onSubmit={handleSubmit} noValidate aria-describedby="appt-form-intro">
      <div id="appt-form-intro" className="rf-intro">
        <p>
          Fill out the form below and Delaney will reach out within 24 hours to discuss your goals and schedule your
          first session.
        </p>
        <p className="rf-required-note mt-3">
          Fields marked &ldquo;(required)&rdquo; must be filled in. Everything else is optional.
        </p>
      </div>

      <div className="rf-alert" role="alert">
        {error && <p className="notice notice--error">{error}</p>}
      </div>

      <div className="rf-grid">
        <div className="field">
          <label htmlFor="appt-name">
            Name
            <Req />
          </label>
          <input
            type="text"
            id="appt-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            className="input"
            placeholder="Your full name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            disabled={loading}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={errId('name')}
          />
          {errorText('name')}
        </div>

        <div className="field">
          <label htmlFor="appt-email">
            Email
            <Req />
          </label>
          <input
            type="email"
            id="appt-email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            className="input"
            placeholder="your@email.com"
            required
            autoComplete="email"
            disabled={loading}
            inputMode="email"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={errId('email')}
          />
          {errorText('email')}
        </div>

        <div className="field">
          <label htmlFor="appt-phone">
            Phone number
            <Req />
          </label>
          <input
            type="tel"
            id="appt-phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearFieldError('phone');
            }}
            className="input"
            placeholder="(555) 123-4567"
            required
            minLength={10}
            autoComplete="tel"
            disabled={loading}
            inputMode="tel"
            aria-invalid={fieldErrors.phone ? true : undefined}
            aria-describedby={errId('phone')}
          />
          {errorText('phone')}
        </div>

        <div className="field rf-full">
          <label htmlFor="appt-callback">
            Preferred callback time
            <Opt />
          </label>
          <input
            type="text"
            id="appt-callback"
            value={preferredCallbackTime}
            onChange={(e) => setPreferredCallbackTime(e.target.value)}
            className="input"
            placeholder="e.g., Weekday mornings EST, Afternoons, Evenings after 6pm"
            maxLength={200}
            disabled={loading}
            aria-describedby="appt-callback-hint"
          />
          <p id="appt-callback-hint" className="hint">
            Let us know when you&apos;re typically available for a call
          </p>
        </div>

        <div className="field rf-full">
          <label htmlFor="appt-questions">
            Questions or goals
            <Opt />
          </label>
          <textarea
            id="appt-questions"
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            className="textarea"
            placeholder="Tell us about your experience level, learning goals, or any questions you have..."
            rows={4}
            maxLength={1000}
            disabled={loading}
            aria-describedby="appt-questions-hint"
          />
          <p id="appt-questions-hint" className="hint">
            Helps us prepare for our conversation {questions.length > 0 && `(${questions.length}/1000)`}
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

      <div className="rf-actions">
        <button type="submit" className="btn btn--lg" disabled={loading}>
          <ButtonCell letter="s" />
          {loading ? 'Sending request…' : 'Send request'}
        </button>
        <p className="rf-note">Delaney typically responds within 24 hours.</p>
      </div>
    </form>
  );
}
