'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * A polite live region for game feedback ("Correct! That's b."). Render `region` once inside
 * the game. Repeated identical messages are re-announced by toggling a zero-width suffix.
 */
export function useAnnouncer() {
  const [message, setMessage] = useState('');
  const flip = useRef(false);
  const announce = useCallback((text: string) => {
    flip.current = !flip.current;
    setMessage(text + (flip.current ? '​' : ''));
  }, []);
  const region = (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
  return { announce, region };
}
