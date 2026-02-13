import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <span className="footer-brand">TeachBraille.org</span>
        <span className="footer-sep">&middot;</span>
        <a href="mailto:Delaney@TeachBraille.org" className="footer-email">
          Delaney@TeachBraille.org
        </a>
        <span className="footer-sep">&middot;</span>
        <Link href="/policies" className="footer-link">
          Policies
        </Link>
      </div>
      <p>&copy; 2026 Frankly the Best Education, LLC &middot; Delaney Costello, Teacher of the Visually Impaired</p>
    </footer>
  );
}
