import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Summer Braille Course for Parents — Delaney Costello, TVI',
  description:
    'An 8-week introductory remote Braille course for parents and loved ones of visually impaired individuals. Taught by Delaney Costello, Teacher of the Visually Impaired. Only 10 spots available — Summer 2026.',
  openGraph: {
    title: 'Learn Braille This Summer — Remote Course for Parents',
    description:
      'An 8-week introductory remote Braille course for parents and loved ones. Only 10 spots available. Starts June 8.',
    type: 'website',
    url: 'https://braille-course-web.vercel.app',
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
        {children}
      </body>
    </html>
  );
}
