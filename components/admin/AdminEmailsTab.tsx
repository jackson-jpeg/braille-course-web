'use client';

import { useState, useCallback, useEffect } from 'react';
import AdminEmailModal from './AdminEmailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { useToast } from './AdminToast';
import { SkeletonTable } from './AdminSkeleton';
import type { ResendEmail, ReceivedEmail, EmailDetail, Enrollment, Material } from './admin-types';
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
  {
    label: 'Inquiry Response',
    subject: 'Re: Braille Session Inquiry',
    body: `Hi there!\n\nThank you for reaching out about 1-on-1 braille sessions! I'd love to help.\n\nHere's what I offer:\n- [Session details]\n- [Pricing]\n- [Availability]\n\nWould you like to schedule a time to chat? Feel free to reply with any questions.\n\nBest,\nDelaney`,
  },
];

interface Props {
  enrollments: Enrollment[];
  initialComposeTo?: string;
  initialTemplate?: string;
  pendingAttachmentIds?: string[];
  onClearAttachments?: () => void;
}

export default function AdminEmailsTab({ enrollments, initialComposeTo, initialTemplate, pendingAttachmentIds, onClearAttachments }: Props) {
  const { showToast } = useToast();
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

  // Attachment state
  const [attachments, setAttachments] = useState<Material[]>([]);

  // Update composeTo when initialComposeTo changes (from student modal)
  useEffect(() => {
    if (initialComposeTo) {
      setComposeTo(initialComposeTo);
      setShowCompose(true);
    }
  }, [initialComposeTo]);

  // Fetch material metadata when pendingAttachmentIds arrives
  useEffect(() => {
    if (pendingAttachmentIds && pendingAttachmentIds.length > 0) {
      setShowCompose(true);
      setEmailSubTab('sent');
      // Fetch metadata for each attachment
      Promise.all(
        pendingAttachmentIds.map((id) =>
          fetch('/api/admin/materials')
            .then((r) => r.json())
            .then((json) => (json.materials as Material[]).find((m) => m.id === id))
        )
      ).then((results) => {
        setAttachments(results.filter((m): m is Material => !!m));
      });
    }
  }, [pendingAttachmentIds]);

  // Auto-select template when initialTemplate is passed (from prospective leads)
  useEffect(() => {
    if (initialTemplate) {
      const template = EMAIL_TEMPLATES.find((t) => t.label === initialTemplate);
      if (template) {
        setSelectedTemplate(template.label);
        setComposeSubject(template.subject);
        setComposeBody(template.body);
        setShowCompose(true);
        setEmailSubTab('sent');
      }
    }
  }, [initialTemplate]);

  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true);
    setEmailsError('');
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setEmails(data.emails);
    } catch (err: unknown) {
      setEmailsError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setEmailsLoading(false);
    }
  }, []);

  const fetchReceivedEmails = useCallback(async () => {
    setReceivedLoading(true);
    setReceivedError('');
    try {
      const res = await fetch('/api/admin/emails/received');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setReceivedEmails(data.emails);
    } catch (err: unknown) {
      setReceivedError(err instanceof Error ? err.message : 'Failed to load received emails');
    } finally {
      setReceivedLoading(false);
    }
  }, []);

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
      const res = await fetch(`/api/admin/emails/${id}`);
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
      const res = await fetch(`/api/admin/emails/received/${id}`);
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
      const payload: Record<string, unknown> = { to: recipients, subject: composeSubject, body: composeBody };
      if (attachments.length > 0) {
        payload.attachmentIds = attachments.map((a) => a.id);
      }
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      showToast('Email sent successfully');
      setComposeResult(null);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setSelectedTemplate('');
      setAttachments([]);
      onClearAttachments?.();
      setShowCompose(false);
      fetchEmails();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send', 'error');
      setComposeResult(null);
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
                {attachments.length > 0 && (
                  <div className="admin-compose-field">
                    <label>Attachments</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {attachments.map((a) => (
                        <span key={a.id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'var(--bg-secondary, #f0f0f0)', padding: '4px 10px',
                          borderRadius: 6, fontSize: '0.85rem',
                        }}>
                          {a.filename}
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((m) => m.id !== a.id))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="admin-compose-actions">
                  <button type="submit" className="admin-send-btn" disabled={composeSending}>
                    {composeSending ? 'Sending\u2026' : attachments.length > 0 ? `Send Email (${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : 'Send Email'}
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
                  <tr><td colSpan={4} className="admin-empty"><SkeletonTable rows={4} cols={4} /></td></tr>
                ) : emails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">No emails sent yet</p><p className="admin-empty-state-sub">Compose your first email to get started.</p><button className="admin-empty-state-cta" onClick={() => { setShowCompose(true); setComposeResult(null); }}>Compose Email</button></div></td></tr>
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
                  <tr><td colSpan={4} className="admin-empty"><SkeletonTable rows={4} cols={4} /></td></tr>
                ) : receivedEmails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">No received emails</p><p className="admin-empty-state-sub">Emails sent to your course address will appear here.</p></div></td></tr>
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
