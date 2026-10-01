'use client';

import { useEffect, useRef } from 'react';

/**
 * Game keyboard shortcuts. Ignores keys while the user types in a text field (unless
 * `allowInInputs`), and when modifier keys are held so browser shortcuts keep working.
 */
export function useGameKeys(
  handler: (e: KeyboardEvent) => void,
  { enabled = true, allowInInputs = false }: { enabled?: boolean; allowInInputs?: boolean } = {},
) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (typing && !allowInInputs) return;
      // Enter and Space on a link or button must do that control's own job (follow the skip link,
      // press "Next"...), never trigger a page-level game shortcut.
      const onControl =
        typeof t?.closest === 'function' && t.closest('a, button, summary, [role="button"], [role="link"]');
      if ((e.key === 'Enter' || e.key === ' ') && onControl) return;
      if (document.querySelector('dialog[open]')) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, allowInInputs]);
}
