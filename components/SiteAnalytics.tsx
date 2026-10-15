'use client';

import { Analytics } from '@vercel/analytics/next';
import { dropAdminEvents } from '@/lib/analytics-filter';

export default function SiteAnalytics() {
  return <Analytics beforeSend={dropAdminEvents} />;
}
