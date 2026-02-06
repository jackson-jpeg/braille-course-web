import { ImapFlow } from 'imapflow';
import type { ParsedMail } from 'mailparser';

// Dynamic import avoids overload resolution issues with simpleParser types
async function parseEmail(source: Buffer): Promise<ParsedMail> {
  const { simpleParser } = await import('mailparser');
  return simpleParser(source, {}) as Promise<ParsedMail>;
}

interface AddressObj {
  name?: string;
  address?: string;
}

function createClient() {
  return new ImapFlow({
    host: 'imap.mail.me.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.ICLOUD_EMAIL!,
      pass: process.env.ICLOUD_APP_PASSWORD!,
    },
    logger: {
      debug: () => {},
      info: (obj: unknown) => console.log('[IMAP]', JSON.stringify(obj)),
      warn: (obj: unknown) => console.warn('[IMAP]', JSON.stringify(obj)),
      error: (obj: unknown) => console.error('[IMAP]', JSON.stringify(obj)),
    },
  });
}

function fmtAddr(a: AddressObj | undefined): string {
  if (!a) return '';
  if (a.name) return `${a.name} <${a.address}>`;
  return a.address || '';
}

export interface ImapEmail {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  created_at: string;
  attachments?: { filename: string; content_type: string; size?: number }[];
}

export interface ImapEmailDetail extends ImapEmail {
  html: string;
  text: string;
}

export async function listReceivedEmails(limit = 50): Promise<ImapEmail[]> {
  if (!process.env.ICLOUD_EMAIL || !process.env.ICLOUD_APP_PASSWORD) {
    throw new Error('Missing ICLOUD_EMAIL or ICLOUD_APP_PASSWORD env vars');
  }
  const client = createClient();
  const emails: ImapEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const mailbox = client.mailbox;
      if (!mailbox || mailbox.exists === 0) return [];
      const total = mailbox.exists;

      const startSeq = Math.max(1, total - limit + 1);
      const range = `${startSeq}:*`;

      for await (const msg of client.fetch(range, {
        uid: true,
        envelope: true,
        bodyStructure: true,
      })) {
        const env = msg.envelope;
        if (!env) continue;

        const fromArr = (env.from || []) as AddressObj[];
        const toArr = (env.to || []) as AddressObj[];

        const from = fmtAddr(fromArr[0]);
        const to = toArr.map((t) => fmtAddr(t)).filter(Boolean);

        const attachments: { filename: string; content_type: string; size?: number }[] = [];
        if (msg.bodyStructure) {
          walkStructure(msg.bodyStructure, attachments);
        }

        emails.push({
          id: String(msg.uid),
          from,
          to: to.length === 1 ? to[0] : to,
          subject: env.subject || '',
          created_at: env.date?.toISOString() || new Date().toISOString(),
          ...(attachments.length > 0 ? { attachments } : {}),
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return emails.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkStructure(node: any, out: { filename: string; content_type: string; size?: number }[]) {
  if (node.disposition === 'attachment' || (node.disposition === 'inline' && node.parameters?.name)) {
    out.push({
      filename: node.parameters?.name || node.dispositionParameters?.filename || 'attachment',
      content_type: node.type ? `${node.type}/${node.subtype || 'octet-stream'}` : 'application/octet-stream',
      size: node.size,
    });
  }
  if (node.childNodes) {
    for (const child of node.childNodes) {
      walkStructure(child, out);
    }
  }
}

export async function getReceivedEmail(uid: string): Promise<ImapEmailDetail | null> {
  if (!process.env.ICLOUD_EMAIL || !process.env.ICLOUD_APP_PASSWORD) {
    throw new Error('Missing ICLOUD_EMAIL or ICLOUD_APP_PASSWORD env vars');
  }
  const client = createClient();

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const result = await client.fetchOne(uid, { source: true }, { uid: true });
      if (!result || !result.source) return null;

      const parsed = await parseEmail(result.source);

      const attachments = (parsed.attachments || []).map((a) => ({
        filename: a.filename || 'attachment',
        content_type: a.contentType || 'application/octet-stream',
        size: a.size,
      }));

      // Extract addresses from parsed mail
      const fromList = parsed.from?.value || [];
      const toList = parsed.to
        ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]).flatMap((a) => a.value)
        : [];

      return {
        id: uid,
        from: fmtAddr(fromList[0]),
        to: toList.map((t) => fmtAddr(t)),
        subject: parsed.subject || '',
        created_at: parsed.date?.toISOString() || new Date().toISOString(),
        html: parsed.html || '',
        text: parsed.text || '',
        ...(attachments.length > 0 ? { attachments } : {}),
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function searchEmailsBySubject(query: string): Promise<ImapEmail[]> {
  const client = createClient();
  const emails: ImapEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const uids = await client.search({ subject: query }, { uid: true });
      if (!uids || uids.length === 0) return [];

      for await (const msg of client.fetch(uids as number[], {
        uid: true,
        envelope: true,
      }, { uid: true })) {
        const env = msg.envelope;
        if (!env) continue;

        const fromArr = (env.from || []) as AddressObj[];
        const toArr = (env.to || []) as AddressObj[];

        emails.push({
          id: String(msg.uid),
          from: fmtAddr(fromArr[0]),
          to: toArr.map((t) => t.address || ''),
          subject: env.subject || '',
          created_at: env.date?.toISOString() || new Date().toISOString(),
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return emails;
}
