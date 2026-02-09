'use client';

import { useState, useEffect, useRef } from 'react';

export default function SuccessPoller({
  sessionId,
  initialSchedule,
}: {
  sessionId: string;
  initialSchedule: string | null;
}) {
  const [schedule, setSchedule] = useState<string | null>(initialSchedule);
  const [exhausted, setExhausted] = useState(false);
  const [resolved, setResolved] = useState(!!initialSchedule);
  const attempts = useRef(0);

  useEffect(() => {
    if (schedule) return;

    const interval = setInterval(async () => {
      attempts.current += 1;

      try {
        const res = await fetch(
          `/api/enrollment-status?session_id=${encodeURIComponent(sessionId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.schedule) {
            setSchedule(data.schedule);
            setResolved(true);
            clearInterval(interval);
            return;
          }
        }
      } catch {
        // Silently retry
      }

      if (attempts.current >= 15) {
        setExhausted(true);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, schedule]);

  // Already had schedule from SSR
  if (initialSchedule) {
    return (
      <div className="detail-row">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <span>
          <strong>Your schedule:</strong> {initialSchedule}
        </span>
      </div>
    );
  }

  // Resolved via polling
  if (resolved && schedule) {
    return (
      <div className="detail-row schedule-resolved">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <span>
          <strong>Your schedule:</strong> {schedule}
        </span>
      </div>
    );
  }

  // Exhausted retries
  if (exhausted) {
    return (
      <div className="detail-row">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <span>
          Schedule details will be in your confirmation email.
        </span>
      </div>
    );
  }

  // Polling in progress
  return (
    <div className="detail-row schedule-shimmer">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
      <span>
        <strong>16 sessions</strong> — loading your schedule&hellip;
      </span>
    </div>
  );
}
