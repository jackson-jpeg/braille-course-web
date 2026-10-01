import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TeachBraille.org — Delaney Costello, TVI',
    short_name: 'TeachBraille',
    description:
      'Free braille lessons and games for families, plus live courses and TVI services from Delaney Costello.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffdf9',
    theme_color: '#1e1b2e',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
