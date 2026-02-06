import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
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
      <nav className="footer-links" aria-label="Legal">
        <Link href="/policies#refunds">Refund Policy</Link>
        <Link href="/policies#privacy">Privacy</Link>
        <Link href="/policies#terms">Terms</Link>
      </nav>
      <p>
        &copy; 2026 Delaney Costello, Teacher of the Visually Impaired &middot;
        TVI Services &amp; Braille Instruction
      </p>
    </footer>
  );
}
