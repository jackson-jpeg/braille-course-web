/**
 * Tests for admin-auth.ts — HMAC session token auth.
 */

// Must set before dynamic import
process.env.ADMIN_PASSWORD = 'test-secret-password';

let createSessionToken: () => string;
let verifySessionToken: (token: string) => boolean;

beforeAll(async () => {
  const mod = await import('@/lib/admin-auth');
  createSessionToken = mod.createSessionToken;
  verifySessionToken = mod.verifySessionToken;
});

describe('createSessionToken', () => {
  it('returns a string with timestamp:nonce.signature format', () => {
    const token = createSessionToken();
    expect(token).toContain(':');
    expect(token).toContain('.');
    const [payload, sig] = token.split('.');
    expect(payload).toBeTruthy();
    expect(sig).toBeTruthy();
    expect(sig.length).toBe(64); // SHA-256 hex
  });

  it('generates unique tokens each call', () => {
    const t1 = createSessionToken();
    const t2 = createSessionToken();
    expect(t1).not.toBe(t2);
  });
});

describe('verifySessionToken', () => {
  it('returns true for a valid token', () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it('returns false for a tampered signature', () => {
    const token = createSessionToken();
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verifySessionToken(tampered)).toBe(false);
  });

  it('returns false for a tampered payload', () => {
    const token = createSessionToken();
    const [, sig] = token.split('.');
    expect(verifySessionToken(`0:fakepayload.${sig}`)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(verifySessionToken('')).toBe(false);
  });

  it('returns false for string without dot separator', () => {
    expect(verifySessionToken('nodot')).toBe(false);
  });

  it('returns false for expired token (24h+)', () => {
    const { createHmac } = require('crypto');
    const oldTs = (Date.now() - 25 * 60 * 60 * 1000).toString();
    const nonce = 'testnonce123';
    const payload = `${oldTs}:${nonce}`;
    const sig = createHmac('sha256', 'test-secret-password').update(payload).digest('hex');
    const expiredToken = `${payload}.${sig}`;
    expect(verifySessionToken(expiredToken)).toBe(false);
  });
});
