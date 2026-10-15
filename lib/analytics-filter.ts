import type { BeforeSendEvent } from '@vercel/analytics';

/** Drops admin pages so Delaney's own dashboard visits don't count as site traffic. */
export function dropAdminEvents(event: BeforeSendEvent): BeforeSendEvent | null {
  const path = new URL(event.url).pathname;
  return path === '/admin' || path.startsWith('/admin/') ? null : event;
}
