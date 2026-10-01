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
  metadataBase: new URL('https://teachbraille.org'),
  title: {
    default: 'Teach Braille — Free Practice, Courses & TVI Services | TeachBraille.org',
    template: '%s | TeachBraille.org',
  },
  description:
    'Teach and learn braille with free interactive practice games, a beginner-friendly guide, summer courses, and 1-on-1 instruction from Delaney Costello, a certified Teacher of the Visually Impaired.',
  keywords: [
    'teach braille',
    'learn braille',
    'braille instruction',
    'braille practice',
    'braille course',
    'braille alphabet',
    'braille games',
    'teacher of the visually impaired',
    'TVI services',
    'braille for parents',
    'braille for beginners',
    'UEB braille',
  ],
  openGraph: {
    title: 'Teach Braille — Free Practice, Courses & TVI Services | TeachBraille.org',
    description:
      'Learn braille with free interactive games, a step-by-step introduction, summer courses, and personalized TVI instruction from Delaney Costello.',
    type: 'website',
    url: 'https://teachbraille.org',
    siteName: 'TeachBraille.org',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teach Braille — Free Practice, Courses & TVI Services | TeachBraille.org',
    description:
      'Learn braille with free interactive games, a step-by-step introduction, summer courses, and personalized TVI instruction from Delaney Costello.',
  },
  alternates: {
    canonical: 'https://teachbraille.org',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'TeachBraille.org',
      url: 'https://teachbraille.org',
      description:
        'Teach and learn braille with free interactive practice, online courses, and personalized TVI instruction.',
    },
    {
      '@type': 'Person',
      name: 'Delaney Costello',
      jobTitle: 'Teacher of the Visually Impaired',
      url: 'https://teachbraille.org',
      email: 'Delaney@TeachBraille.org',
      description:
        'Teacher of the Visually Impaired with 9 years of experience offering braille instruction, assistive technology, compensatory skills, and educational team consultation.',
      knowsAbout: [
        'Braille',
        'Unified English Braille',
        'Assistive Technology',
        'Visual Impairment Education',
        'Compensatory Skills',
      ],
      sameAs: [],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSerif.variable} ${caveat.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="braille-bg" aria-hidden="true"></div>
        <NavBar />
        <ScrollRevealInit />
        <main id="main-content">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
