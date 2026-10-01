/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'pptxgenjs', 'imapflow', 'mailparser'],
    outputFileTracingIncludes: {
      '/api/admin/generate': ['./node_modules/pdfkit/js/data/**/*.afm'],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'imapflow', 'mailparser'];
    }
    return config;
  },
  async redirects() {
    // Keep old URLs working for bookmarks and search engines (301).
    const lessonMoves = {
      'reading-words': 'first-words',
      'alphabet-wordsigns': 'first-contractions',
      'strong-contractions': 'first-contractions',
      'strong-groupsigns': 'more-contractions',
      'lower-groupsigns': 'more-contractions',
      'lower-wordsigns': 'more-contractions',
      'reading-sentences': 'more-contractions',
      'wrap-up': 'next-steps',
    };
    return [
      // The summer course page is now the evergreen /courses page. Checkout and success stay under /summer.
      { source: '/summer', destination: '/courses', permanent: true },
      ...Object.entries(lessonMoves).map(([from, to]) => ({
        source: `/learn/${from}`,
        destination: `/learn/${to}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
              "connect-src 'self' https://api.stripe.com https://va.vercel-scripts.com",
              'frame-src https://js.stripe.com https://calendly.com',
              "frame-ancestors 'self' https://sang3r.com https://www.sang3r.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
