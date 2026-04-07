import { Resend } from 'resend';

/** Admin inbox — receives contact forms, appointment requests, etc. */
export const ADMIN_EMAIL = 'delaney@teachbraille.org';

/** Default "from" for outgoing emails to students/parents */
export const SENDER_EMAIL = 'Delaney Costello <delaney@teachbraille.org>';

/** "from" for automated system notifications (contact confirmations, etc.) */
export const NOREPLY_EMAIL = 'Delaney Costello <noreply@teachbraille.org>';

/** "from" for system-level notifications branded as the site */
export const SYSTEM_NOREPLY_EMAIL = 'TeachBraille.org <noreply@teachbraille.org>';

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
