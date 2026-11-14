'use client';

import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { dropAdminEvents, isAdminPath, keepUmamiPayload } from '@/lib/analytics-filter';

// Self-hosted Umami visitor count (no cookies), disclosed on /policies.
// Admin pages are never counted: the script is not loaded when a visit starts
// on one, and once loaded the before-send hook drops any admin hit.
const UMAMI_BEFORE_SEND = 'teachbrailleUmamiBeforeSend';

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)[UMAMI_BEFORE_SEND] = (_type: string, payload: unknown) =>
    keepUmamiPayload(window.location.pathname, payload);
}

export default function SiteAnalytics() {
  const pathname = usePathname() ?? '/';
  return (
    <>
      <Analytics beforeSend={dropAdminEvents} />
      {!isAdminPath(pathname) && (
        <Script
          src="https://a.unpossible.studio/a/sgj.js"
          data-website-id="754bea88-a2bd-40d0-b36e-dbe468a48125"
          data-host-url="https://a.unpossible.studio/a"
          data-before-send={UMAMI_BEFORE_SEND}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
