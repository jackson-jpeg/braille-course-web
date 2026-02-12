import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TeachBraille.org — Delaney Costello, TVI',
    short_name: 'TeachBraille',
    description:
      'Braille instruction, assistive technology, and TVI services from Delaney Costello. Summer courses, 1-on-1 sessions, and free interactive braille practice.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf8f0',
    theme_color: '#1b2a4a',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
