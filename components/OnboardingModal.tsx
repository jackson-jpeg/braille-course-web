'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadProgress, markOnboardingSeen, setTrackingConsent } from '@/lib/progress-storage';

const STEPS = [
  {
    title: 'Welcome to Braille Interactive!',
    description: 'Practice and master braille with 10 interactive games — from letter recognition to sentence reading.',
    icon: '⠃',
  },
  {
    title: 'Track Your Progress',
    description: 'Your scores, streaks, and achievements are saved locally on your device. Nothing is sent to any server.',
    icon: '📊',
  },
  {
    title: 'Daily Challenges',
    description: 'Check back each day for 3 new challenges. Build streaks and unlock achievements as you learn!',
    icon: '🎯',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  const handleClose = useCallback((consent: boolean) => {
    markOnboardingSeen();
    setTrackingConsent(consent);
    setVisible(false);
  }, []);

  useEffect(() => {
    const progress = loadProgress();
    if (!progress.settings.hasSeenOnboarding) {
      setVisible(true);
    }
  }, []);

  // Escape key dismisses
  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, handleClose]);

  if (!visible) return null;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose(true);
    }
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="onboarding-modal">
        <button
          className="onboarding-close"
          onClick={() => handleClose(true)}
          aria-label="Close"
        >
          ×
        </button>

        <div className="onboarding-icon">{current.icon}</div>
        <h3 className="onboarding-title">{current.title}</h3>
        <p className="onboarding-desc">{current.description}</p>

        {/* Step dots */}
        <div className="onboarding-dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button className="onboarding-back" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="onboarding-next" onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>

        {isLast && (
          <p className="onboarding-privacy">
            All progress data stays on your device.{' '}
            <button
              className="onboarding-privacy-link"
              onClick={() => handleClose(false)}
            >
              Skip tracking
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
