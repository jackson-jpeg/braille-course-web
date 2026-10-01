'use client';

import { useState, type FocusEvent } from 'react';

/** True while keyboard focus is inside the element — used to scope shortcuts on lesson pages. */
export function useFocusWithin() {
  const [active, setActive] = useState(false);
  return {
    active,
    props: {
      onFocus: () => setActive(true),
      onBlur: (e: FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setActive(false);
      },
    },
  };
}
