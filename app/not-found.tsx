import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import '@/styles/pages/system.css';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="system-page lattice">
        <div className="wrap-narrow system-card tile">
          <BrailleText text="404" size="lg" label="404 in braille: number sign, d, j, d" />
          <h1>We couldn&rsquo;t find that page</h1>
          <p className="lead center">
            It may have moved when we redesigned the site. Try one of these instead — they&rsquo;re all free.
          </p>
          <div className="cluster system-actions">
            <Link href="/" className="btn">
              <ButtonCell letter="h" />
              Home
            </Link>
            <Link href="/learn" className="btn btn--paper">
              Lessons
            </Link>
            <Link href="/games" className="btn btn--paper">
              Games
            </Link>
          </div>
          <p className="muted">
            Looking for something specific? Email <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
