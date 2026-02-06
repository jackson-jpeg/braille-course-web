'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/intro', label: 'Intro to Braille' },
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

        <div className={`site-nav-links${menuOpen ? ' open' : ''}`}>
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
