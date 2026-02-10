import type { Metadata } from 'next';
import { Outfit, DM_Serif_Display, Caveat } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import NavBar from '@/components/NavBar';
import ScrollRevealInit from '@/components/ScrollRevealInit';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-accent',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TeachBraille.org — Delaney Costello, TVI',
  description:
    'Delaney Costello is a Teacher of the Visually Impaired with 9 years of experience offering braille instruction, assistive technology, compensatory skills, and educational team consultation.',
  openGraph: {
    title: 'TeachBraille.org — Delaney Costello, Teacher of the Visually Impaired',
    description:
      'TVI services including braille instruction, assistive technology, and compensatory skills. Summer courses, 1-on-1 sessions, and free interactive braille practice.',
    type: 'website',
    url: 'https://teachbraille.org',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSerif.variable} ${caveat.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="braille-bg" aria-hidden="true"></div>
        <NavBar />
        <ScrollRevealInit />
        <main id="main-content">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
