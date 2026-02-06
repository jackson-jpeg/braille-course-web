'use client';

import { useEffect, useState } from 'react';

export default function FloatingCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setVisible(!entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`floating-cta${visible ? ' visible' : ''}`}
    >
      <a href="#cta">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
        Reserve Your Spot
      </a>
    </div>
  );
}
