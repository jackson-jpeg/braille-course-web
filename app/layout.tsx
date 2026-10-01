import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// Atkinson Hyperlegible was designed by the Braille Institute for low-vision readers.
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-atkinson',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['wdth', 'opsz'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#1e1b2e',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://teachbraille.org'),
  title: {
    default: 'Teach Braille — Free Lessons, Games & Courses | TeachBraille.org',
    template: '%s | TeachBraille.org',
  },
  description:
    'Learn braille for free with warm, beginner-friendly lessons and practice games, then go further with live courses and 1-on-1 instruction from Delaney Costello, a Teacher of the Visually Impaired.',
  keywords: [
    'teach braille',
    'learn braille',
    'braille for parents',
    'braille for beginners',
    'braille games',
    'braille alphabet',
    'UEB braille',
    'Unified English Braille',
    'braille course',
    'teacher of the visually impaired',
    'TVI services',
  ],
  openGraph: {
    title: 'Teach Braille — Free Lessons, Games & Courses | TeachBraille.org',
    description:
      'Free braille lessons and games for families and kids, plus live courses with Delaney Costello, Teacher of the Visually Impaired.',
    type: 'website',
    url: 'https://teachbraille.org',
    siteName: 'TeachBraille.org',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teach Braille — Free Lessons, Games & Courses | TeachBraille.org',
    description:
      'Free braille lessons and games for families and kids, plus live courses with Delaney Costello, Teacher of the Visually Impaired.',
  },
  alternates: { canonical: 'https://teachbraille.org' },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'TeachBraille.org',
      url: 'https://teachbraille.org',
      description: 'Free braille lessons and practice games, live courses, and TVI services.',
    },
    {
      '@type': 'Person',
      name: 'Delaney Costello',
      jobTitle: 'Teacher of the Visually Impaired',
      url: 'https://teachbraille.org',
      email: 'Delaney@TeachBraille.org',
      description:
        'Teacher of the Visually Impaired with 9 years of experience offering braille instruction, assistive technology, compensatory skills, and educational team consultation.',
      knowsAbout: ['Braille', 'Unified English Braille', 'Assistive Technology', 'Visual Impairment Education'],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${atkinson.variable} ${bricolage.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
