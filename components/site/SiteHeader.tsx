'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cell from '@/components/ui/Cell';
import ButtonCell from '@/components/ui/ButtonCell';
import { LETTERS } from '@/lib/ueb';
import { PRIMARY_NAV } from './nav';

export default function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="wrap site-header-inner">
        <Link href="/" className="brand" aria-label="TeachBraille.org home">
          <Cell dots={LETTERS.t} size="sm" />
          <span>
            TeachBraille<span className="brand-org">.org</span>
          </span>
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <Cell dots={open ? LETTERS.x : [1, 2, 3, 4, 5, 6]} size="xs" />
          {open ? 'Close' : 'Menu'}
        </button>

        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Main">
          <ul>
            {PRIMARY_NAV.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} aria-current={isCurrent(href) ? 'page' : undefined}>
                  {label}
                </Link>
              </li>
            ))}
            <li className="nav-cta">
              <Link href="/learn/what-is-braille" className="btn btn--sm">
                <ButtonCell letter="s" />
                Start free
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
