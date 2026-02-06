import { NextRequest } from 'next/server';

export function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}
