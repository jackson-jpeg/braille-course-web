'use client';

import { useState, useCallback, useEffect } from 'react';
import AdminEmailModal from './AdminEmailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import type { ResendEmail, ReceivedEmail, EmailDetail, Enrollment } from './admin-types';
import { relativeTime, fullDate } from './admin-utils';

const EMAIL_TEMPLATES = [
  {
    label: 'Class Reminder',
    subject: 'Reminder: Upcoming Braille Class',
    body: `Hi there!\n\nThis is a friendly reminder that your braille class is coming up soon. Please make sure you have your materials ready.\n\nIf you have any questions, feel free to reply to this email.\n\nSee you in class!\nDelaney`,
  },
  {
    label: 'Payment Follow-up',
    subject: 'Reminder: Remaining Balance Due',
    body: `Hi there!\n\nThis is a friendly reminder that your remaining balance is due. Please check your email for the invoice, or reach out if you have any questions about your payment.\n\nThank you!\nDelaney`,
  },
  {
    label: 'Course Update',
    subject: 'Course Update',
    body: `Hi everyone!\n\nI wanted to share a quick update about our braille course.\n\n[Your update here]\n\nLooking forward to our next class!\nDelaney`,
  },
  {
    label: 'Welcome',
    subject: 'Welcome to the Braille Course!',
    body: `Welcome!\n\nThank you for enrolling in the summer braille course. I'm excited to have you in class!\n\nHere are a few things to know before we get started:\n\n- [Detail 1]\n- [Detail 2]\n- [Detail 3]\n\nFeel free to reply if you have any questions.\n\nBest,\nDelaney`,
  },
];

interface Props {
  adminKey: string;
  enrollments: Enrollment[];
  initialComposeTo?: string;
}

export default function AdminEmailsTab({ adminKey, enrollments, initialComposeTo }: Props) {
  const [emailSubTab, setEmailSubTab] = useState<'sent' | 'received'>('sent');
  const [emails, setEmails] = useState<ResendEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(!!initialComposeTo);
  const [composeTo, setComposeTo] = useState(initialComposeTo || '');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeResult, setComposeResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedError, setReceivedError] = useState('');

  // Update composeTo when initialComposeTo changes (from student modal)
  useEffect(() => {
    if (initialComposeTo) {
      setComposeTo(initialComposeTo);
      setShowCompose(true);
    }
  }, [initialComposeTo]);

  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true);
    setEmailsError('');
    try {
      const res = await fetch(`/api/admin/emails?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setEmails(data.emails);
    } catch (err: unknown) {
      setEmailsError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setEmailsLoading(false);
    }
  }, [adminKey]);

  const fetchReceivedEmails = useCallback(async () => {
    setReceivedLoading(true);
    setReceivedError('');
    try {
      const res = await fetch(`/api/admin/emails/received?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setReceivedEmails(data.emails);
    } catch (err: unknown) {
      setReceivedError(err instanceof Error ? err.message : 'Failed to load received emails');
    } finally {
      setReceivedLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (emailSubTab === 'sent' && emails.length === 0 && !emailsLoading) {
      fetchEmails();
    }
  }, [emailSubTab, emails.length, emailsLoading, fetchEmails]);

  useEffect(() => {
    if (emailSubTab === 'received' && receivedEmails.length === 0 && !receivedLoading) {
      fetchReceivedEmails();
    }
  }, [emailSubTab, receivedEmails.length, receivedLoading, fetchReceivedEmails]);

  async function openEmailDetail(id: string) {
    setEmailDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/admin/emails/${id}?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSelectedEmail(data.email);
    } catch {
      /* modal won't open */
    } finally {
      setEmailDetailLoading(false);
    }
  }

  async function openReceivedEmailDetail(id: string) {
    setEmailDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/admin/emails/received/${id}?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSelectedEmail(data.email);
    } catch {
      /* modal won't open */
    } finally {
      setEmailDetailLoading(false);
    }
  }

  async function doSendEmail() {
    setComposeSending(true);
    setComposeResult(null);
    try {
      const recipients = composeTo.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/emails?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject: composeSubject, body: composeBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setComposeResult({ ok: true, msg: 'Email sent successfully!' });
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setSelectedTemplate('');
      fetchEmails();
    } catch (err: unknown) {
      setComposeResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setComposeSending(false);
    }
  }

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const recipients = composeTo.split(',').map((s) => s.trim()).filter(Boolean);
    if (recipients.length >= 3) {
      setShowSendConfirm(true);
    } else {
      doSendEmail();
    }
  }

  function handleTemplateChange(value: string) {
    setSelectedTemplate(value);
    if (value) {
      const template = EMAIL_TEMPLATES.find((t) => t.label === value);
      if (template) {
        setComposeSubject(template.subject);
        setComposeBody(template.body);
      }
    }
  }

  function handleReply(email: EmailDetail) {
    const sender = email.from;
    setComposeTo(sender);
    setComposeSubject(email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`);
    const quotedText = email.text || '';
    setComposeBody(`\n\n---\nOn ${fullDate(email.created_at)}, ${sender} wrote:\n\n${quotedText}`);
    setShowCompose(true);
    setEmailSubTab('sent');
    setSelectedTemplate('');
  }

  function handleForward(email: EmailDetail) {
    setComposeTo('');
    setComposeSubject(email.subject.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`);
    const quotedText = email.text || '';
    setComposeBody(`\n\n---\nForwarded message:\nFrom: ${email.from}\nDate: ${fullDate(email.created_at)}\nSubject: ${email.subject}\n\n${quotedText}`);
    setShowCompose(true);
    setEmailSubTab('sent');
    setSelectedTemplate('');
  }

  // Only course students (from enrollment DB), not 1-1 invoice-only customers
  const courseStudentEmails = enrollments.map((e) => e.email).filter((e): e is string => !!e);
  const uniqueEmails = [...new Set(courseStudentEmails)];

  // Delivery stats
  const sentCount = emails.length;
  const deliveredCount = emails.filter((e) => e.last_event === 'delivered' || e.last_event === 'opened' || e.last_event === 'clicked').length;
  const openedCount = emails.filter((e) => e.last_event === 'opened' || e.last_event === 'clicked').length;
  const bouncedCount = emails.filter((e) => e.last_event === 'bounced' || e.last_event === 'complained').length;

  return (
    <>
      {/* Delivery Stats Bar */}
      {emails.length > 0 && (
        <div className="admin-delivery-stats">
          <span className="admin-delivery-pill">{sentCount} Sent</span>
          <span className="admin-delivery-pill admin-delivery-delivered">{deliveredCount} Delivered</span>
          <span className="admin-delivery-pill admin-delivery-opened">{openedCount} Opened</span>
          {bouncedCount > 0 && (
            <span className="admin-delivery-pill admin-delivery-bounced">{bouncedCount} Bounced</span>
          )}
        </div>
      )}

      {/* Sub-toggle: Sent / Received */}
      <div className="admin-email-subtabs">
        <button
          className={`admin-email-subtab ${emailSubTab === 'sent' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setEmailSubTab('sent')}
        >
          Sent
        </button>
        <button
          className={`admin-email-subtab ${emailSubTab === 'received' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setEmailSubTab('received')}
        >
          Received
        </button>
      </div>

      {/* SENT sub-tab */}
      {emailSubTab === 'sent' && (
        <>
          <div className="admin-email-actions">
            <button
              onClick={() => { setShowCompose(!showCompose); setComposeResult(null); }}
              className="admin-compose-btn"
            >
              {showCompose ? 'Cancel' : 'Compose Email'}
            </button>
            <button onClick={fetchEmails} className="admin-refresh-btn" disabled={emailsLoading}>
              {emailsLoading ? 'Loading\u2026' : 'Refresh'}
            </button>
          </div>

          {showCompose && (
            <div className="admin-compose">
              <form onSubmit={handleSendEmail}>
                <div className="admin-compose-field">
                  <label>Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">Start from scratch</option>
                    {EMAIL_TEMPLATES.map((t) => (
                      <option key={t.label} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-compose-field">
                  <label>To</label>
                  <div className="admin-compose-to-row">
                    <input
                      type="text"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="email@example.com, email2@example.com"
                      className="admin-compose-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setComposeTo(uniqueEmails.join(', '))}
                      className="admin-fill-all-btn"
                    >
                      All Course Students ({uniqueEmails.length})
                    </button>
                  </div>
                </div>
                <div className="admin-compose-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject line"
                    className="admin-compose-input"
                    required
                  />
                </div>
                <div className="admin-compose-field">
                  <label>Body (plain text &mdash; wrapped in branded template)</label>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your email here\u2026"
                    className="admin-compose-textarea"
                    rows={8}
                    required
                  />
                </div>
                <div className="admin-compose-actions">
                  <button type="submit" className="admin-send-btn" disabled={composeSending}>
                    {composeSending ? 'Sending\u2026' : 'Send Email'}
                  </button>
                  {composeResult && (
                    <span className={`admin-compose-result ${composeResult.ok ? 'admin-compose-success' : 'admin-compose-error'}`}>
                      {composeResult.msg}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {emailsError && <div className="admin-email-error">{emailsError}</div>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {emailsLoading && emails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty">Loading emails&hellip;</td></tr>
                ) : emails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty">No emails found.</td></tr>
                ) : (
                  emails.map((em) => (
                    <tr key={em.id} className="admin-email-row" onClick={() => openEmailDetail(em.id)}>
                      <td>{Array.isArray(em.to) ? em.to.join(', ') : em.to}</td>
                      <td>{em.subject || '(no subject)'}</td>
                      <td>
                        <span className={`admin-email-status admin-email-status-${(em.last_event || 'queued').toLowerCase()}`}>
                          {em.last_event || 'queued'}
                        </span>
                      </td>
                      <td title={fullDate(em.created_at)}>{relativeTime(em.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* RECEIVED sub-tab */}
      {emailSubTab === 'received' && (
        <>
          <div className="admin-email-actions">
            <button onClick={fetchReceivedEmails} className="admin-refresh-btn" disabled={receivedLoading}>
              {receivedLoading ? 'Loading\u2026' : 'Refresh'}
            </button>
          </div>

          {receivedError && <div className="admin-email-error">{receivedError}</div>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {receivedLoading && receivedEmails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty">Loading received emails&hellip;</td></tr>
                ) : receivedEmails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty">No received emails found.</td></tr>
                ) : (
                  receivedEmails.map((em) => (
                    <tr key={em.id} className="admin-email-row" onClick={() => openReceivedEmailDetail(em.id)}>
                      <td>{em.from}</td>
                      <td>{em.subject || '(no subject)'}</td>
                      <td title={fullDate(em.created_at)}>{relativeTime(em.created_at)}</td>
                      <td>
                        {em.attachments && em.attachments.length > 0 ? (
                          <span className="admin-attachment-badge">{em.attachments.length}</span>
                        ) : '\u2014'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Email detail modal */}
      <AdminEmailModal
        email={selectedEmail}
        loading={emailDetailLoading}
        onClose={() => { setSelectedEmail(null); setEmailDetailLoading(false); }}
        onReply={handleReply}
        onForward={handleForward}
      />

      {/* Mass send confirmation dialog */}
      {showSendConfirm && (
        <AdminConfirmDialog
          title="Send to Multiple Recipients"
          message={`You're about to send this email to ${composeTo.split(',').map((s) => s.trim()).filter(Boolean).length} recipients. Continue?`}
          confirmLabel="Send Email"
          confirmVariant="primary"
          loading={composeSending}
          onConfirm={() => {
            setShowSendConfirm(false);
            doSendEmail();
          }}
          onCancel={() => setShowSendConfirm(false)}
        />
      )}
    </>
  );
}
