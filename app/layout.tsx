import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import NavBar from '@/components/NavBar';
import ScrollRevealInit from '@/components/ScrollRevealInit';
import './globals.css';

export const metadata: Metadata = {
  title: 'TeachBraille.org — Delaney Costello, TVI',
  description:
    'Learn braille with Delaney Costello, a Teacher of the Visually Impaired with 9 years of experience. Summer courses, 1-on-1 appointments, and interactive braille games.',
  openGraph: {
    title: 'TeachBraille.org — Learn Braille with Delaney Costello',
    description:
      'Summer courses, 1-on-1 braille instruction, and interactive games. Taught by a Teacher of the Visually Impaired.',
    type: 'website',
    url: 'https://teachbraille.org',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⠃</text></svg>",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=Caveat:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="braille-bg" aria-hidden="true"></div>
        <NavBar />
        <ScrollRevealInit />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
