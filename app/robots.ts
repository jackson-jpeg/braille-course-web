import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/summer/checkout', '/summer/success'],
    },
    sitemap: 'https://www.teachbraille.org/sitemap.xml',
  };
}
