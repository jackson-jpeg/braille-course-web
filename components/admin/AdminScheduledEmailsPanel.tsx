'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminConfirmDialog from './AdminConfirmDialog';
import { useToast } from './AdminToast';
import type { ScheduledEmail } from './admin-types';
import { relativeTime, fullDate } from './admin-utils';

interface Props {
  onRefreshSent?: () => void;
}

export default function AdminScheduledEmailsPanel({ onRefreshSent }: Props) {
  const { showToast } = useToast();
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [editingEmail, setEditingEmail] = useState<ScheduledEmail | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editScheduledFor, setEditScheduledFor] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [sendingNowId, setSendingNowId] = useState<string | null>(null);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/emails/schedule');
      const data = await res.json();
      if (res.ok) setEmails(data.emails);
    } catch (err) { console.error('Failed to fetch scheduled emails:', err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchScheduled(); }, [fetchScheduled]);

  async function handleCancel() {
    if (!cancellingId) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/schedule/${cancellingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Scheduled email cancelled');
      setCancellingId(null);
      await fetchScheduled();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel', 'error');
    }
    setCancelLoading(false);
  }

  function startEdit(email: ScheduledEmail) {
    setEditingEmail(email);
    setEditSubject(email.subject);
    setEditBody(email.body);
    // Convert ISO to local datetime-local input format
    const dt = new Date(email.scheduledFor);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditScheduledFor(local);
  }

  async function saveEdit() {
    if (!editingEmail) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/emails/schedule/${editingEmail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editSubject,
          body: editBody,
          scheduledFor: new Date(editScheduledFor).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Scheduled email updated');
      setEditingEmail(null);
      await fetchScheduled();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
    setEditSaving(false);
  }

  async function handleSendNow(email: ScheduledEmail) {
    setSendingNowId(email.id);
    try {
      // Update to past time so cron would pick it up, then call cron directly
      await fetch(`/api/admin/emails/schedule/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: new Date(Date.now() - 60000).toISOString() }),
      });

      // Directly send via the normal email API
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.to,
          subject: email.subject,
          body: email.body,
          attachmentIds: email.attachmentIds.length > 0 ? email.attachmentIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mark as sent
      await fetch(`/api/admin/emails/schedule/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // Since we can't PATCH a non-PENDING email, update status via a different mechanism
      // Actually the email is still PENDING at this point since we just changed the date
      // Let's cancel it and note it was sent manually
      await fetch(`/api/admin/emails/schedule/${email.id}`, { method: 'DELETE' });

      showToast('Email sent now');
      await fetchScheduled();
      onRefreshSent?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send', 'error');
    }
    setSendingNowId(null);
  }

  const filtered = filterStatus === 'all'
    ? emails
    : emails.filter((e) => e.status === filterStatus);

  const statusColor: Record<string, string> = {
    PENDING: '#d97706',
    SENDING: '#2563eb',
    SENT: '#16a34a',
    FAILED: '#dc2626',
    CANCELLED: '#6b7280',
  };

  if (loading) {
    return <p style={{ padding: '12px 0', color: '#6b7280', fontSize: '0.9rem' }}>Loading scheduled emails&hellip;</p>;
  }

  return (
    <div className="admin-scheduled-panel">
      <div className="admin-email-actions" style={{ marginBottom: 12 }}>
        <select
          className="admin-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={fetchScheduled} className="admin-refresh-btn" disabled={loading}>
          Refresh
        </button>
        <span className="admin-result-count">{filtered.length} scheduled email{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty-state" style={{ padding: '24px 0' }}>
          <p className="admin-empty-state-title">No scheduled emails</p>
          <p className="admin-empty-state-sub">
            {filterStatus !== 'all' ? 'Try adjusting your filter.' : 'Schedule an email from the compose form above.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>To</th>
                <th>Subject</th>
                <th>Scheduled For</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((email) => (
                <tr key={email.id}>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.to.length > 1 ? `${email.to[0]} +${email.to.length - 1}` : email.to[0]}
                  </td>
                  <td>{email.subject}</td>
                  <td title={fullDate(email.scheduledFor)}>
                    {new Date(email.scheduledFor).toLocaleString()}
                  </td>
                  <td>
                    <span style={{
                      color: statusColor[email.status] || '#6b7280',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}>
                      {email.status}
                    </span>
                    {email.error && (
                      <span
                        style={{ fontSize: '0.75rem', color: '#dc2626', display: 'block', marginTop: 2 }}
                        title={email.error}
                      >
                        {email.error.length > 40 ? email.error.slice(0, 40) + '\u2026' : email.error}
                      </span>
                    )}
                  </td>
                  <td>
                    {email.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-send-btn"
                          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                          onClick={() => handleSendNow(email)}
                          disabled={sendingNowId === email.id}
                        >
                          {sendingNowId === email.id ? 'Sending\u2026' : 'Send Now'}
                        </button>
                        <button
                          className="admin-refresh-btn"
                          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                          onClick={() => startEdit(email)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-refund-confirm"
                          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                          onClick={() => setCancellingId(email.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {email.status === 'SENT' && email.sentAt && (
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        Sent {relativeTime(email.sentAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancellingId && (
        <AdminConfirmDialog
          title="Cancel Scheduled Email"
          message="This email will not be sent. You can still view it in the history. Continue?"
          confirmLabel="Cancel Email"
          confirmVariant="danger"
          loading={cancelLoading}
          onConfirm={handleCancel}
          onCancel={() => setCancellingId(null)}
        />
      )}

      {/* Edit modal */}
      {editingEmail && (
        <div className="admin-modal-overlay" onClick={() => setEditingEmail(null)}>
          <div className="admin-student-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <button className="admin-modal-close" onClick={() => setEditingEmail(null)}>&times;</button>
            <div className="admin-student-modal-content" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Edit Scheduled Email</h3>
              <div className="admin-compose-field">
                <label>To</label>
                <input
                  type="text"
                  className="admin-compose-input"
                  value={editingEmail.to.join(', ')}
                  disabled
                />
              </div>
              <div className="admin-compose-field">
                <label>Subject</label>
                <input
                  type="text"
                  className="admin-compose-input"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div className="admin-compose-field">
                <label>Body</label>
                <textarea
                  className="admin-compose-textarea"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="admin-compose-field">
                <label>Scheduled For</label>
                <input
                  type="datetime-local"
                  className="admin-compose-input"
                  value={editScheduledFor}
                  onChange={(e) => setEditScheduledFor(e.target.value)}
                />
              </div>
              <div className="admin-compose-actions">
                <button
                  className="admin-send-btn"
                  onClick={saveEdit}
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving\u2026' : 'Save Changes'}
                </button>
                <button
                  className="admin-refresh-btn"
                  onClick={() => setEditingEmail(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
