/** True for the admin dashboard and everything under it (not /administrator-guide). */
export function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}

/**
 * Drops admin pages so Delaney's own dashboard visits don't count as site
 * traffic. Umami (self-hosted, no cookies) passes its before-send hook the
 * page being counted; false cancels the hit.
 */
export function keepUmamiPayload<T>(pathname: string, payload: T): T | false {
  return isAdminPath(pathname) ? false : payload;
}
