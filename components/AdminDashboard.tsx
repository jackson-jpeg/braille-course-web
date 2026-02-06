'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

/* ── Types ── */
interface Section {
  id: string;
  label: string;
  maxCapacity: number;
  enrolledCount: number;
  status: string;
}

interface Enrollment {
  id: string;
  email: string | null;
  plan: string;
  paymentStatus: string;
  stripeCustomerId: string | null;
  createdAt: string;
  section: { label: string };
}

interface ResendEmail {
  id: string;
  to: string | string[];
  subject: string;
  created_at: string;
  last_event?: string;
}

interface ReceivedEmail {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  created_at: string;
  attachments?: { filename: string; content_type: string; size?: number }[];
}

interface EmailDetail {
  id: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  created_at: string;
  last_event?: string;
  from: string;
  attachments?: { filename: string; content_type: string; size?: number }[];
}

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  scheduleMap: Record<string, string>;
  adminKey: string;
}

/* ── Helpers ── */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function downloadCsv(enrollments: Enrollment[], scheduleMap: Record<string, string>) {
  const headers = ['Email', 'Section', 'Schedule', 'Plan', 'Status', 'Stripe Customer', 'Date'];
  const rows = enrollments.map((e) => [
    e.email || '',
    e.section.label,
    scheduleMap[e.section.label] || e.section.label,
    e.plan,
    e.paymentStatus,
    e.stripeCustomerId || '',
    new Date(e.createdAt).toISOString(),
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ── */
export default function AdminDashboard({ sections, enrollments, scheduleMap, adminKey }: Props) {
  const [tab, setTab] = useState<'enrollments' | 'emails'>('enrollments');

  /* ── Enrollments state ── */
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      if (search && !(e.email || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSection !== 'all' && e.section.label !== filterSection) return false;
      if (filterStatus !== 'all' && e.paymentStatus !== filterStatus) return false;
      if (filterPlan !== 'all' && e.plan !== filterPlan) return false;
      return true;
    });
  }, [enrollments, search, filterSection, filterStatus, filterPlan]);

  /* ── Stats ── */
  const fullCount = enrollments.filter((e) => e.plan === 'FULL').length;
  const depositCount = enrollments.filter((e) => e.plan === 'DEPOSIT').length;
  const waitlistedCount = enrollments.filter((e) => e.paymentStatus === 'WAITLISTED').length;
  const revenueCollected = fullCount * 500 + depositCount * 150;
  const pendingBalance = depositCount * 350;

  /* ── Emails state ── */
  const [emailSubTab, setEmailSubTab] = useState<'sent' | 'received'>('sent');
  const [emails, setEmails] = useState<ResendEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeResult, setComposeResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Received emails state ── */
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedError, setReceivedError] = useState('');

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

  // Load emails when switching to tab
  useEffect(() => {
    if (tab === 'emails' && emailSubTab === 'sent' && emails.length === 0 && !emailsLoading) {
      fetchEmails();
    }
  }, [tab, emailSubTab, emails.length, emailsLoading, fetchEmails]);

  useEffect(() => {
    if (tab === 'emails' && emailSubTab === 'received' && receivedEmails.length === 0 && !receivedLoading) {
      fetchReceivedEmails();
    }
  }, [tab, emailSubTab, receivedEmails.length, receivedLoading, fetchReceivedEmails]);

  async function openEmailDetail(id: string) {
    setEmailDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/admin/emails/${id}?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSelectedEmail(data.email);
    } catch {
      // silently fail — modal just won't open
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
      // silently fail — modal just won't open
    } finally {
      setEmailDetailLoading(false);
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
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
      // Refresh email list
      fetchEmails();
    } catch (err: unknown) {
      setComposeResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setComposeSending(false);
    }
  }

  const allEnrolledEmails = enrollments
    .map((e) => e.email)
    .filter((e): e is string => !!e);
  const uniqueEmails = [...new Set(allEnrolledEmails)];

  function fillAllEnrolled() {
    setComposeTo(uniqueEmails.join(', '));
  }

  return (
    <div className="admin-inner">
      <h1 className="admin-title">Enrollment Dashboard</h1>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'enrollments' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('enrollments')}
        >
          Enrollments
        </button>
        <button
          className={`admin-tab ${tab === 'emails' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('emails')}
        >
          Emails
        </button>
      </div>

      {/* ═══════════════════════════ ENROLLMENTS TAB ═══════════════════════════ */}
      {tab === 'enrollments' && (
        <>
          {/* Summary + Revenue Cards */}
          <div className="admin-cards">
            <div className="admin-card">
              <div className="admin-card-value">{enrollments.length}</div>
              <div className="admin-card-label">Total Enrollments</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-value">{fullCount}</div>
              <div className="admin-card-label">Full Payments</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-value">{depositCount}</div>
              <div className="admin-card-label">Deposits</div>
            </div>
            <div className="admin-card admin-card-revenue">
              <div className="admin-card-value">${revenueCollected.toLocaleString()}</div>
              <div className="admin-card-label">Revenue Collected</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-value">${pendingBalance.toLocaleString()}</div>
              <div className="admin-card-label">Pending Balance (May 1)</div>
            </div>
            {waitlistedCount > 0 && (
              <div className="admin-card admin-card-warning">
                <div className="admin-card-value">{waitlistedCount}</div>
                <div className="admin-card-label">Waitlisted (needs refund)</div>
              </div>
            )}
          </div>

          {/* Section Capacity Progress Bars */}
          <div className="admin-capacity">
            {sections.map((s) => {
              const pct = Math.round((s.enrolledCount / s.maxCapacity) * 100);
              const isFull = s.enrolledCount >= s.maxCapacity;
              return (
                <div key={s.id} className="admin-capacity-row">
                  <div className="admin-capacity-header">
                    <span className="admin-capacity-label">
                      {scheduleMap[s.label] || s.label}
                    </span>
                    <span className={`admin-capacity-badge ${isFull ? 'admin-capacity-full' : 'admin-capacity-open'}`}>
                      {isFull ? 'FULL' : 'OPEN'}
                    </span>
                    <span className="admin-capacity-count">
                      {s.enrolledCount} / {s.maxCapacity}
                    </span>
                  </div>
                  <div className="admin-progress-track">
                    <div
                      className={`admin-progress-fill ${isFull ? 'admin-progress-full' : ''}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filters */}
          <div className="admin-filters">
            <input
              type="text"
              placeholder="Search by email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="admin-select">
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="admin-select">
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="WAITLISTED">Waitlisted</option>
            </select>
            <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="admin-select">
              <option value="all">All Plans</option>
              <option value="FULL">Full</option>
              <option value="DEPOSIT">Deposit</option>
            </select>
            <button onClick={() => downloadCsv(filtered, scheduleMap)} className="admin-export-btn">
              Export CSV
            </button>
          </div>

          {/* Enrollments Table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Schedule</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Stripe</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      {enrollments.length === 0 ? 'No enrollments yet.' : 'No enrollments match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr
                      key={e.id}
                      className={e.paymentStatus === 'WAITLISTED' ? 'admin-row-warning' : ''}
                    >
                      <td>{e.email || '—'}</td>
                      <td>{scheduleMap[e.section.label] || e.section.label}</td>
                      <td>{e.plan === 'FULL' ? 'Full ($500)' : 'Deposit ($150)'}</td>
                      <td>
                        <span className={`admin-status admin-status-${e.paymentStatus.toLowerCase()}`}>
                          {e.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {e.stripeCustomerId ? (
                          <a
                            href={`https://dashboard.stripe.com/customers/${e.stripeCustomerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-stripe-link"
                          >
                            View
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td title={fullDate(e.createdAt)}>{relativeTime(e.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════════════════ EMAILS TAB ═══════════════════════════ */}
      {tab === 'emails' && (
        <>
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

          {/* ── SENT sub-tab ── */}
          {emailSubTab === 'sent' && (
            <>
              <div className="admin-email-actions">
                <button onClick={() => { setShowCompose(!showCompose); setComposeResult(null); }} className="admin-compose-btn">
                  {showCompose ? 'Cancel' : 'Compose Email'}
                </button>
                <button onClick={fetchEmails} className="admin-refresh-btn" disabled={emailsLoading}>
                  {emailsLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {/* Compose Form */}
              {showCompose && (
                <div className="admin-compose">
                  <form onSubmit={handleSendEmail}>
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
                        <button type="button" onClick={fillAllEnrolled} className="admin-fill-all-btn">
                          All Enrolled ({uniqueEmails.length})
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
                      <label>Body (plain text — wrapped in branded template)</label>
                      <textarea
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        placeholder="Write your email here…"
                        className="admin-compose-textarea"
                        rows={8}
                        required
                      />
                    </div>
                    <div className="admin-compose-actions">
                      <button type="submit" className="admin-send-btn" disabled={composeSending}>
                        {composeSending ? 'Sending…' : 'Send Email'}
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

              {/* Email error */}
              {emailsError && (
                <div className="admin-email-error">{emailsError}</div>
              )}

              {/* Sent Email Log Table */}
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
                      <tr>
                        <td colSpan={4} className="admin-empty">Loading emails…</td>
                      </tr>
                    ) : emails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="admin-empty">No emails found.</td>
                      </tr>
                    ) : (
                      emails.map((em) => (
                        <tr
                          key={em.id}
                          className="admin-email-row"
                          onClick={() => openEmailDetail(em.id)}
                        >
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

          {/* ── RECEIVED sub-tab ── */}
          {emailSubTab === 'received' && (
            <>
              <div className="admin-email-actions">
                <button onClick={fetchReceivedEmails} className="admin-refresh-btn" disabled={receivedLoading}>
                  {receivedLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {receivedError && (
                <div className="admin-email-error">{receivedError}</div>
              )}

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
                      <tr>
                        <td colSpan={4} className="admin-empty">Loading received emails…</td>
                      </tr>
                    ) : receivedEmails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="admin-empty">No received emails found.</td>
                      </tr>
                    ) : (
                      receivedEmails.map((em) => (
                        <tr
                          key={em.id}
                          className="admin-email-row"
                          onClick={() => openReceivedEmailDetail(em.id)}
                        >
                          <td>{em.from}</td>
                          <td>{em.subject || '(no subject)'}</td>
                          <td title={fullDate(em.created_at)}>{relativeTime(em.created_at)}</td>
                          <td>
                            {em.attachments && em.attachments.length > 0 ? (
                              <span className="admin-attachment-badge">
                                {em.attachments.length}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════ EMAIL DETAIL MODAL ═══════════════════════════ */}
      {(selectedEmail || emailDetailLoading) && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedEmail(null); setEmailDetailLoading(false); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => { setSelectedEmail(null); setEmailDetailLoading(false); }}>
              &times;
            </button>
            {emailDetailLoading ? (
              <div className="admin-modal-loading">Loading email…</div>
            ) : selectedEmail ? (
              <>
                <div className="admin-modal-header">
                  <div className="admin-modal-meta">
                    <strong>From:</strong> {selectedEmail.from}
                  </div>
                  <div className="admin-modal-meta">
                    <strong>To:</strong> {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to}
                  </div>
                  <div className="admin-modal-meta">
                    <strong>Subject:</strong> {selectedEmail.subject}
                  </div>
                  <div className="admin-modal-meta">
                    <strong>Date:</strong> {fullDate(selectedEmail.created_at)}
                  </div>
                  {selectedEmail.last_event !== undefined && (
                    <div className="admin-modal-meta">
                      <strong>Status:</strong>{' '}
                      <span className={`admin-email-status admin-email-status-${(selectedEmail.last_event || 'queued').toLowerCase()}`}>
                        {selectedEmail.last_event || 'queued'}
                      </span>
                    </div>
                  )}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="admin-modal-meta">
                      <strong>Files:</strong>{' '}
                      <span className="admin-attachment-list">
                        {selectedEmail.attachments.map((a, i) => (
                          <span key={i} className="admin-attachment-chip">
                            {a.filename}
                            {a.size != null && <span className="admin-attachment-size"> ({Math.round(a.size / 1024)}KB)</span>}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
                <div className="admin-modal-body">
                  {selectedEmail.html ? (
                    <iframe
                      srcDoc={selectedEmail.html}
                      title="Email preview"
                      className="admin-modal-iframe"
                      sandbox=""
                    />
                  ) : (
                    <pre className="admin-modal-text">{selectedEmail.text || '(no content)'}</pre>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
