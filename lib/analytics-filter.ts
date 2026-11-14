import type { BeforeSendEvent } from '@vercel/analytics';

/** True for the admin dashboard and everything under it (not /administrator-guide). */
export function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}

/** Drops admin pages so Delaney's own dashboard visits don't count as site traffic. */
export function dropAdminEvents(event: BeforeSendEvent): BeforeSendEvent | null {
  const path = new URL(event.url).pathname;
  return isAdminPath(path) ? null : event;
}

/**
 * The same rule for Umami (self-hosted, no cookies): its before-send hook
 * gets the page being counted; false cancels the hit.
 */
export function keepUmamiPayload<T>(pathname: string, payload: T): T | false {
  return isAdminPath(pathname) ? false : payload;
}
