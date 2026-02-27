import { Resend } from 'resend';

let _client: Resend | null = null;

function getResendClient(): Resend {
  if (!_client) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}

export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResendClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
