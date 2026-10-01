'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpots } from '@/lib/spots-context';
import { SECTION_SCHEDULES } from '@/lib/schedule';
import { PRICING, formatPrice } from '@/lib/pricing';
import Cell from '@/components/ui/Cell';

type LoadingStage = null | 'processing';

export default function EnrollmentForm() {
  const router = useRouter();
  const { sections, totalRemaining } = useSpots();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [error, setError] = useState<string | null>(null);
  const [justFilledId, setJustFilledId] = useState<string | null>(null);

  const loading = loadingStage !== null;

  // Auto-select first available section on mount
  useEffect(() => {
    if (selectedSection) return;
    const first = sections.find((s) => s.status !== 'FULL' && s.maxCapacity - s.enrolledCount > 0);
    if (first) setSelectedSection(first.id);
  }, [sections, selectedSection]);

  // If selected section becomes full, clear selection
  useEffect(() => {
    if (!selectedSection) return;
    const section = sections.find((s) => s.id === selectedSection);
    if (section && (section.status === 'FULL' || section.maxCapacity - section.enrolledCount <= 0)) {
      setSelectedSection('');
    }
  }, [sections, selectedSection]);

  const handleSubmit = () => {
    if (!selectedSection || !selectedPlan) return;

    // Pre-flight: check if local state already shows section is full
    const section = sections.find((s) => s.id === selectedSection);
    if (section && section.maxCapacity - section.enrolledCount <= 0) {
      setJustFilledId(selectedSection);
      setSelectedSection('');
      setError('This section just filled up. Please choose another.');
      return;
    }

    setLoadingStage('processing');
    setError(null);
    router.push(
      `/summer/checkout?sectionId=${encodeURIComponent(selectedSection)}&plan=${encodeURIComponent(selectedPlan)}`,
    );
  };

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitting(true);
    setWaitlistError('');
    try {
      const res = await fetch('/api/waitlist-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setWaitlistError(data.error || 'Something went wrong. Please try again.');
      } else {
        setWaitlistSuccess(true);
      }
    } catch {
      setWaitlistError('Network error. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  if (totalRemaining <= 0) {
    return (
      <div className="enroll-soldout">
        <Cell dots={[1, 2, 3, 4, 5, 6]} size="lg" framed />
        <h3>This course is fully enrolled</h3>
        <p>Join the waitlist and we&rsquo;ll email you if a spot opens.</p>

        {waitlistSuccess ? (
          <div className="notice" role="status">
            You&rsquo;re on the list! We&rsquo;ll reach out if a spot opens.
          </div>
        ) : (
          <form className="interest-form" onSubmit={handleWaitlistSubmit}>
            <div className="field">
              <label htmlFor="waitlist-email">Your email address</label>
              <div className="interest-row">
                <input
                  id="waitlist-email"
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="input"
                  disabled={waitlistSubmitting}
                />
                <button type="submit" className="btn" disabled={waitlistSubmitting}>
                  {waitlistSubmitting ? 'Joining…' : 'Join the waitlist'}
                </button>
              </div>
              {waitlistError && (
                <p className="form-error" role="alert">
                  {waitlistError}
                </p>
              )}
            </div>
          </form>
        )}

        <p className="muted">
          Or email{' '}
          <a href="mailto:Delaney@TeachBraille.org?subject=Waitlist%20Request%20%E2%80%94%20Braille%20Course">
            Delaney@TeachBraille.org
          </a>{' '}
          directly.
        </p>
      </div>
    );
  }

  const canSubmit = selectedSection && selectedPlan && !loading;

  const buttonText = (() => {
    if (loadingStage === 'processing') return 'Processing…';
    const price =
      selectedPlan === 'full'
        ? formatPrice(PRICING.full)
        : selectedPlan === 'deposit'
          ? formatPrice(PRICING.deposit)
          : '';
    return price ? `Continue to checkout — ${price}` : 'Continue to checkout';
  })();

  return (
    <div className="enroll-form">
      <fieldset className="enroll-step">
        <legend>1. Choose your schedule</legend>
        <div className="enroll-options">
          {sections.map((section) => {
            const spotsLeft = section.maxCapacity - section.enrolledCount;
            const isFull = section.status === 'FULL' || spotsLeft <= 0;
            const isSelected = selectedSection === section.id;
            const isJustFilled = justFilledId === section.id;

            return (
              <label
                key={section.id}
                className={`enroll-option${isSelected ? ' is-selected' : ''}${isFull ? ' is-disabled' : ''}`}
              >
                <input
                  type="radio"
                  name="section"
                  value={section.id}
                  checked={isSelected}
                  disabled={isFull || loading}
                  onChange={() => {
                    setSelectedSection(section.id);
                    setJustFilledId(null);
                  }}
                />
                <span className="enroll-option-text">
                  <span className="enroll-option-title">{SECTION_SCHEDULES[section.label] || section.label}</span>
                  <span className="enroll-option-sub">
                    {isJustFilled
                      ? 'Just filled'
                      : isFull
                        ? 'Full'
                        : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="enroll-step" disabled={!selectedSection}>
        <legend>2. Choose your plan</legend>
        <div className="enroll-options">
          <label className={`enroll-option${selectedPlan === 'full' ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="plan"
              value="full"
              checked={selectedPlan === 'full'}
              disabled={loading}
              onChange={() => setSelectedPlan('full')}
            />
            <span className="enroll-option-text">
              <span className="enroll-option-title">Pay in full — {formatPrice(PRICING.full)}</span>
              <span className="enroll-option-sub">One-time payment</span>
            </span>
          </label>
          <label className={`enroll-option${selectedPlan === 'deposit' ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="plan"
              value="deposit"
              checked={selectedPlan === 'deposit'}
              disabled={loading}
              onChange={() => setSelectedPlan('deposit')}
            />
            <span className="enroll-option-text">
              <span className="enroll-option-title">Reserve with a {formatPrice(PRICING.deposit)} deposit</span>
              <span className="enroll-option-sub">
                {formatPrice(PRICING.balance)} balance charged {PRICING.balanceDueDate}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {canSubmit &&
        (() => {
          const section = sections.find((s) => s.id === selectedSection);
          const scheduleText = section ? SECTION_SCHEDULES[section.label] || section.label : '';
          const planText =
            selectedPlan === 'full'
              ? `Pay in full — ${formatPrice(PRICING.full)}`
              : `${formatPrice(PRICING.deposit)} deposit today, ${formatPrice(PRICING.balance)} on ${PRICING.balanceDueDate}`;
          return (
            <dl className="enroll-summary">
              <div>
                <dt>Schedule</dt>
                <dd>{scheduleText}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{planText}</dd>
              </div>
            </dl>
          );
        })()}

      <button className="btn btn--lg btn--block" disabled={!canSubmit} onClick={handleSubmit} type="button">
        {loadingStage === 'processing' && <CellLoaderInline />}
        {buttonText}
      </button>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <p className="enroll-trust muted">Secure payment by Stripe · Fully refundable before {PRICING.balanceDueDate}</p>
      <p className="enroll-legal muted">
        By enrolling, you agree to our <Link href="/policies#refunds">Refund Policy</Link> and{' '}
        <Link href="/policies#terms">Terms of Service</Link>.
      </p>
    </div>
  );
}

function CellLoaderInline() {
  return <Cell dots={[1, 4]} size="xs" className="btn-cell" />;
}
