'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/intro', label: 'Intro to Braille' },
  { href: '/services', label: 'TVI Services' },
  { href: '/summer', label: 'Summer Course' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/games', label: 'Interactive' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className="site-nav" role="navigation" aria-label="Main navigation">
      <div className="site-nav-inner">
        <Link href="/" className="site-nav-logo" aria-label="TeachBraille home">
          TeachBraille
        </Link>

        <button
          className={`site-nav-toggle${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`site-nav-links${menuOpen ? ' open' : ''}`}
          aria-hidden={!menuOpen ? undefined : undefined}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`site-nav-link${isActive ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
