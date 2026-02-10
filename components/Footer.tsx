import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="footer-heading">TeachBraille.org</div>
          <p className="footer-description">
            Specialized TVI services and braille instruction by Delaney Costello.
          </p>
          <a href="mailto:Delaney@TeachBraille.org" className="footer-email">
            Delaney@TeachBraille.org
          </a>
        </div>
        <div className="footer-col footer-col-nav">
          <div className="footer-link-group">
            <div className="footer-heading">Pages</div>
            <nav aria-label="Footer pages">
              <Link href="/">Home</Link>
              <Link href="/intro">Braille Intro</Link>
              <Link href="/summer">Summer Course</Link>
              <Link href="/games">Interactive</Link>
            </nav>
          </div>
          <div className="footer-link-group">
            <div className="footer-heading">Info</div>
            <nav aria-label="Footer info">
              <Link href="/services">TVI Services</Link>
              <Link href="/appointments">Appointments</Link>
              <Link href="/policies">Policies</Link>
            </nav>
          </div>
        </div>
      </div>

      <a className="back-to-top" href="#top" aria-label="Back to top">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        Back to top
      </a>
      <p>
        &copy; 2026 Frankly the Best Education, LLC &middot;
        Delaney Costello, Teacher of the Visually Impaired
      </p>
    </footer>
  );
}
