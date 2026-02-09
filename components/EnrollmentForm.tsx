'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSpots } from '@/lib/spots-context';
import { SECTION_SCHEDULES } from '@/lib/schedule';

type LoadingStage = null | 'processing' | 'redirecting' | 'slow';

export default function EnrollmentForm() {
  const { sections, totalRemaining, refreshSections } = useSpots();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [error, setError] = useState<string | null>(null);
  const [justFilledId, setJustFilledId] = useState<string | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loading = loadingStage !== null;

  // Auto-select first available section on mount
  useEffect(() => {
    if (selectedSection) return;
    const first = sections.find(
      (s) => s.status !== 'FULL' && s.maxCapacity - s.enrolledCount > 0
    );
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

  // Cleanup slow timer
  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!selectedSection || !selectedPlan) return;

    setLoadingStage('processing');
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          plan: selectedPlan,
        }),
      });

      if (res.status === 409) {
        // Mark the section that just filled
        setJustFilledId(selectedSection);
        await refreshSections();

        // Find the next available section
        const updated = sections.find(
          (s) =>
            s.id !== selectedSection &&
            s.status !== 'FULL' &&
            s.maxCapacity - s.enrolledCount > 0
        );

        if (updated) {
          const schedule = SECTION_SCHEDULES[updated.label] || updated.label;
          const spotsLeft = updated.maxCapacity - updated.enrolledCount;
          setSelectedSection(updated.id);
          setError(
            `That section just filled up. We've selected ${schedule} for you — ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remain.`
          );
        } else {
          setSelectedSection('');
          setError(
            'This section just filled up and no other sections are available.'
          );
        }

        setLoadingStage(null);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoadingStage(null);
        return;
      }

      const data = await res.json();
      setLoadingStage('redirecting');

      // Start slow-connection timer
      slowTimerRef.current = setTimeout(() => {
        setLoadingStage('slow');
      }, 4000);

      window.location.href = data.url;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoadingStage(null);
    }
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
    }
    setWaitlistSubmitting(false);
  };

  if (totalRemaining <= 0) {
    return (
      <div className="enrollment-sold-out">
        <svg
          className="enrollment-sold-out-icon"
          viewBox="0 0 36 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          {/* Braille cell outline */}
          <rect x="2" y="2" width="32" height="44" rx="6" />
          {/* 6 dots — all filled to represent completeness */}
          <circle cx="13" cy="12" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="23" cy="12" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="13" cy="24" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="23" cy="24" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="13" cy="36" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="23" cy="36" r="3.5" fill="currentColor" stroke="none" />
        </svg>
        <div className="enrollment-sold-out-title">
          This session is fully enrolled
        </div>
        <p>
          Join the waitlist and we&rsquo;ll notify you if a spot opens.
        </p>

        {waitlistSuccess ? (
          <div className="enrollment-waitlist-success">
            You&rsquo;re on the list! We&rsquo;ll reach out if a spot opens.
          </div>
        ) : (
          <form className="enrollment-waitlist-form" onSubmit={handleWaitlistSubmit}>
            <input
              type="email"
              placeholder="Your email address"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              required
              className="enrollment-waitlist-input"
              disabled={waitlistSubmitting}
            />
            <button
              type="submit"
              className="enrollment-sold-out-cta"
              disabled={waitlistSubmitting}
            >
              {waitlistSubmitting ? 'Joining...' : 'Join the Waitlist'}
              {!waitlistSubmitting && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                  style={{ width: 16, height: 16 }}
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
            {waitlistError && (
              <div className="enrollment-error">{waitlistError}</div>
            )}
          </form>
        )}

        <div className="enrollment-sold-out-note">
          Or email{' '}
          <a href="mailto:Delaney@TeachBraille.org?subject=Waitlist%20Request%20%E2%80%94%20Summer%20Braille%20Course">
            Delaney@TeachBraille.org
          </a>{' '}
          directly.
        </div>
      </div>
    );
  }

  const canSubmit = selectedSection && selectedPlan && !loading;

  const buttonText = (() => {
    switch (loadingStage) {
      case 'processing':
        return 'Processing...';
      case 'redirecting':
      case 'slow':
        return 'Opening Stripe...';
      default: {
        const price = selectedPlan === 'full' ? '$500' : selectedPlan === 'deposit' ? '$150' : '';
        return price ? `Continue to Checkout — ${price}` : 'Continue to Checkout';
      }
    }
  })();

  return (
    <div className="enrollment-form">
      {/* Step 1: Choose Section */}
      <div className={`enrollment-step${selectedSection ? ' completed' : ''}`}>
        <div className="enrollment-step-label">1. Choose Your Schedule</div>
        <div className="enrollment-options">
          {sections.map((section) => {
            const spotsLeft = section.maxCapacity - section.enrolledCount;
            const isFull = section.status === 'FULL' || spotsLeft <= 0;
            const isSelected = selectedSection === section.id;
            const isJustFilled = justFilledId === section.id;

            return (
              <label
                key={section.id}
                className={`enrollment-option${isSelected ? ' selected' : ''}${
                  isFull ? ' disabled' : ''
                }${isJustFilled ? ' just-filled' : ''}`}
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
                <div className="enrollment-option-text">
                  <div className="enrollment-option-title">
                    {SECTION_SCHEDULES[section.label] || section.label}
                  </div>
                  <div className="enrollment-option-sub">
                    {isJustFilled
                      ? 'Just filled'
                      : isFull
                        ? 'Full'
                        : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Step 2: Choose Plan */}
      <div className={`enrollment-step enrollment-step-2${selectedSection ? ' enrollment-step-active' : ''}${selectedPlan ? ' completed' : ''}`}>
        <div className="enrollment-step-label">2. Choose Your Plan</div>
        <div className="enrollment-options">
          <label
            className={`enrollment-option${
              selectedPlan === 'full' ? ' selected' : ''
            }`}
          >
            <input
              type="radio"
              name="plan"
              value="full"
              checked={selectedPlan === 'full'}
              disabled={loading}
              onChange={() => setSelectedPlan('full')}
            />
            <div className="enrollment-option-text">
              <div className="enrollment-option-title">Pay in Full — $500</div>
              <div className="enrollment-option-sub">One-time payment</div>
            </div>
          </label>
          <label
            className={`enrollment-option${
              selectedPlan === 'deposit' ? ' selected' : ''
            }`}
          >
            <input
              type="radio"
              name="plan"
              value="deposit"
              checked={selectedPlan === 'deposit'}
              disabled={loading}
              onChange={() => setSelectedPlan('deposit')}
            />
            <div className="enrollment-option-text">
              <div className="enrollment-option-title">
                Reserve with $150 Deposit
              </div>
              <div className="enrollment-option-sub">
                $350 balance charged May 1st
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Order Summary */}
      {canSubmit && (() => {
        const section = sections.find((s) => s.id === selectedSection);
        const scheduleText = section ? (SECTION_SCHEDULES[section.label] || section.label) : '';
        const planText = selectedPlan === 'full' ? 'Pay in Full — $500' : '$150 deposit today, $350 on May 1';
        return (
          <div className="enrollment-summary">
            <div className="enrollment-summary-row">
              <span className="enrollment-summary-label">Schedule</span>
              <span className="enrollment-summary-value">{scheduleText}</span>
            </div>
            <div className="enrollment-summary-row">
              <span className="enrollment-summary-label">Plan</span>
              <span className="enrollment-summary-value">{planText}</span>
            </div>
          </div>
        );
      })()}

      {/* Step 3: Submit */}
      <button
        className={`enrollment-submit${loadingStage === 'redirecting' || loadingStage === 'slow' ? ' enrollment-submit--redirecting' : ''}`}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {loadingStage === 'processing' && (
          <span className="enrollment-spinner" aria-hidden="true" />
        )}
        {buttonText}
        {!loading && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
        {(loadingStage === 'redirecting' || loadingStage === 'slow') && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </button>

      {loadingStage === 'slow' && (
        <div className="enrollment-slow-note">
          Taking longer than expected. Please wait&hellip;
        </div>
      )}

      {error && <div className="enrollment-error">{error}</div>}

      <div className="enrollment-trust-row">
        <span className="enrollment-trust-item">
          <svg className="enrollment-trust-lock" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Secure payment
        </span>
        <span className="enrollment-trust-sep">&middot;</span>
        <span className="enrollment-trust-item">100% refundable before May 1</span>
        <span className="enrollment-trust-sep">&middot;</span>
        <span className="enrollment-trust-item">Powered by Stripe</span>
      </div>

      <p className="enrollment-legal">
        By enrolling, you agree to our{' '}
        <Link href="/policies#refunds">Refund Policy</Link> and{' '}
        <Link href="/policies#terms">Terms of Service</Link>.
      </p>
    </div>
  );
}
