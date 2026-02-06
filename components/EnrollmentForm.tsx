'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSpots } from '@/lib/spots-context';
import { SECTION_SCHEDULES } from '@/lib/schedule';

export default function EnrollmentForm() {
  const { sections, totalRemaining, refreshSections } = useSpots();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!selectedSection || !selectedPlan) return;

    setLoading(true);
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
        setError(
          'This section just filled up! Please choose another section.'
        );
        setSelectedSection('');
        await refreshSections();
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (totalRemaining <= 0) {
    return (
      <div className="enrollment-sold-out">
        <p>All spots have been filled for this session.</p>
        <p>
          Reach out to{' '}
          <a href="mailto:delaneycostello23@gmail.com">
            delaneycostello23@gmail.com
          </a>{' '}
          to join the waitlist.
        </p>
      </div>
    );
  }

  const canSubmit = selectedSection && selectedPlan && !loading;

  return (
    <div className="enrollment-form">
      {/* Step 1: Choose Section */}
      <div className="enrollment-step">
        <div className="enrollment-step-label">1. Choose Your Schedule</div>
        <div className="enrollment-options">
          {sections.map((section) => {
            const spotsLeft = section.maxCapacity - section.enrolledCount;
            const isFull = section.status === 'FULL' || spotsLeft <= 0;
            const isSelected = selectedSection === section.id;

            return (
              <label
                key={section.id}
                className={`enrollment-option${isSelected ? ' selected' : ''}${
                  isFull ? ' disabled' : ''
                }`}
              >
                <input
                  type="radio"
                  name="section"
                  value={section.id}
                  checked={isSelected}
                  disabled={isFull || loading}
                  onChange={() => setSelectedSection(section.id)}
                />
                <div className="enrollment-option-text">
                  <div className="enrollment-option-title">
                    {SECTION_SCHEDULES[section.label] || section.label}
                  </div>
                  <div className="enrollment-option-sub">
                    {isFull
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
      <div className="enrollment-step">
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

      {/* Step 3: Submit */}
      <button
        className="enrollment-submit"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {loading ? 'Redirecting to Checkout...' : 'Continue to Checkout'}
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
      </button>

      {error && <div className="enrollment-error">{error}</div>}

      <p className="enrollment-legal">
        By enrolling, you agree to our{' '}
        <Link href="/policies#refunds">Refund Policy</Link> and{' '}
        <Link href="/policies#terms">Terms of Service</Link>.
      </p>
    </div>
  );
}
