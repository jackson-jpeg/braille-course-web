import Link from 'next/link';
import BrailleText from '@/components/ui/BrailleText';
import { CONTACT_EMAIL } from './nav';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-signature">
          <p className="footer-tagline">Braille opens doors. Let&rsquo;s open them together.</p>
          <div>
            <BrailleText text="teach braille" size="md" onInk tone="marigold" />
            <p className="sr-only">The words &ldquo;teach braille&rdquo; written in braille.</p>
          </div>
        </div>

        <div className="footer-grid">
          <div>
            <h2>Learn free</h2>
            <ul>
              <li>
                <Link href="/learn">Beginner lessons</Link>
              </li>
              <li>
                <Link href="/games">Practice games</Link>
              </li>
              <li>
                <Link href="/intro">Braille alphabet guide</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Work with Delaney</h2>
            <ul>
              <li>
                <Link href="/courses">Live braille courses</Link>
              </li>
              <li>
                <Link href="/services">TVI services</Link>
              </li>
              <li>
                <Link href="/appointments">Book a session</Link>
              </li>
              <li>
                <Link href="/services#schools">For schools</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Say hello</h2>
            <ul>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                <Link href="/policies">Policies &amp; privacy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-legal">
          <p>
            &copy; {new Date().getFullYear()} Frankly the Best Education, LLC &middot; Delaney Costello, Teacher of the
            Visually Impaired
          </p>
          <p>Braille on this site is Unified English Braille (UEB), checked against liblouis.</p>
        </div>
      </div>
    </footer>
  );
}
