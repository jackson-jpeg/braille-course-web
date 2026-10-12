'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrailleCell from '@/components/BrailleCell';
import { CHROME_PRINT, chromeCells } from '@/lib/site-chrome-braille';

const NAV_LINKS = [
  { href: '/intro', label: 'Intro to Braille' },
  { href: '/learn', label: 'Free Course' },
  { href: '/games', label: 'Interactive' },
  { href: '/services', label: 'TVI Services' },
  { href: '/summer', label: 'Summer Course' },
  { href: '/appointments', label: 'Appointments' },
];

// Logo: the braille letter t (for TeachBraille), from lib/braille. Decorative: the link has its own label.
const LOGO_CELL = chromeCells(CHROME_PRINT.logo)[0];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef(0);

  // Scroll-aware state
  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrolled(window.scrollY > 10);
    });
  }, []);

  useEffect(() => {
    handleScroll(); // check on mount
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

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

  const navClass = `site-nav${scrolled ? ' site-nav--scrolled' : ''}`;

  return (
    <>
      <nav className={navClass} role="navigation" aria-label="Main navigation">
        <div className="site-nav-inner">
          <Link href="/" className="site-nav-logo" aria-label="TeachBraille home">
            <BrailleCell
              cell={LOGO_CELL}
              className="site-nav-logo-dots"
              dotClassName="site-nav-logo-dot"
              raisedClassName="filled"
              flatClassName="flat"
            />
            TeachBraille
          </Link>

          <button
            className={`site-nav-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="site-nav-links"
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`site-nav-links${menuOpen ? ' open' : ''}`} id="site-nav-links">
            {NAV_LINKS.map(({ href, label }, index) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`site-nav-link${isActive ? ' active' : ''}`}
                  style={{ '--link-index': index } as React.CSSProperties}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
            <div className="site-nav-mobile-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay for mobile menu */}
      <div
        className={`site-nav-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}
