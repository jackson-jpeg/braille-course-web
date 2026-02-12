import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/summer/checkout', '/summer/success'],
    },
    sitemap: 'https://teachbraille.org/sitemap.xml',
  };
}
