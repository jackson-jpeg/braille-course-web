'use client';

import Cell from '@/components/ui/Cell';
import { LETTERS } from '@/lib/ueb';

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
        const res = await fetch(`/api/enrollment-status?session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            setSchedule(data.schedule || null);
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
      <li>
        <Cell dots={LETTERS.s} size="xs" />
        <span>
          <strong>Your schedule:</strong> {initialSchedule}
        </span>
      </li>
    );
  }

  // Resolved via polling
  if (resolved && schedule) {
    return (
      <li className="is-resolved" role="status">
        <Cell dots={LETTERS.s} size="xs" />
        <span>
          <strong>Your schedule:</strong> {schedule}
        </span>
      </li>
    );
  }

  // Exhausted retries
  if (exhausted) {
    return (
      <li>
        <Cell dots={LETTERS.s} size="xs" />
        <span>Schedule details will be in your confirmation email.</span>
      </li>
    );
  }

  // Polling in progress
  return (
    <li className="is-loading" role="status">
      <Cell dots={LETTERS.s} size="xs" />
      <span>Loading your schedule&hellip;</span>
    </li>
  );
}
