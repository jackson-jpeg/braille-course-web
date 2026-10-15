import type { Metadata } from 'next';
import Link from 'next/link';
import { CHROME_PRINT, chromeUnicode } from '@/lib/site-chrome-braille';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        {/* "404" in UEB: numeric indicator, then d j d. Decorative; the heading says it in print. */}
        <div className="not-found-braille" aria-hidden="true">
          {chromeUnicode(CHROME_PRINT.notFound)}
        </div>
        <h1>Page Not Found</h1>
        <p>The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.</p>
        <Link href="/" className="home-button">
          Back to Home
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
