'use client';

import { useState, useEffect } from 'react';
import type { Enrollment, StudentDetail, Note } from './admin-types';
import { relativeTime, formatDate, fullDate } from './admin-utils';

interface Props {
  enrollment: Enrollment;
  scheduleMap: Record<string, string>;
  onClose: () => void;
  onSendEmail: (email: string) => void;
}

export default function AdminStudentModal({ enrollment, scheduleMap, onClose, onSendEmail }: Props) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    if (!enrollment.stripeCustomerId) {
      setLoading(false);
      setError('No Stripe customer linked');
      return;
    }

    async function fetchStudent() {
      try {
        const res = await fetch(`/api/admin/students/${enrollment.stripeCustomerId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch');
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student details');
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [enrollment.stripeCustomerId]);

  // Fetch notes for this student
  useEffect(() => {
    if (!enrollment.email) return;
    async function fetchNotes() {
      try {
        const res = await fetch(`/api/admin/notes?email=${encodeURIComponent(enrollment.email!)}`);
        const json = await res.json();
        if (res.ok) setNotes(json.notes);
      } catch { /* silent */ }
    }
    fetchNotes();
  }, [enrollment.email]);

  async function addNote() {
    if (!newNote.trim() || !enrollment.email) return;
    setNoteLoading(true);
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: enrollment.email, content: newNote.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setNotes((prev) => [json.note, ...prev]);
        setNewNote('');
      }
    } catch { /* silent */ }
    setNoteLoading(false);
  }

  async function deleteNote(id: string) {
    try {
      const res = await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' });
      if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch { /* silent */ }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-student-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>&times;</button>

        {loading ? (
          <div className="admin-modal-loading">Loading student details&hellip;</div>
        ) : error ? (
          <div className="admin-student-modal-content">
            <div className="admin-student-header">
              <h3>{enrollment.email || 'Unknown Student'}</h3>
            </div>
            <div className="admin-email-error" style={{ margin: 24 }}>{error}</div>
          </div>
        ) : (
          <div className="admin-student-modal-content">
            {/* Header */}
            <div className="admin-student-header">
              <h3>{data?.customer.name || enrollment.email || 'Unknown Student'}</h3>
              {data?.customer.name && enrollment.email && (
                <p className="admin-student-email">{enrollment.email}</p>
              )}
            </div>

            <div className="admin-student-grid">
              {/* Left Column: Info */}
              <div className="admin-student-info">
                <div className="admin-student-info-section">
                  <h4>Enrollment</h4>
                  <div className="admin-student-detail-row">
                    <span>Section</span>
                    <span>{scheduleMap[enrollment.section.label] || enrollment.section.label}</span>
                  </div>
                  <div className="admin-student-detail-row">
                    <span>Plan</span>
                    <span>{enrollment.plan === 'FULL' ? 'Full ($500)' : 'Deposit ($150 + $350 May 1)'}</span>
                  </div>
                  <div className="admin-student-detail-row">
                    <span>Status</span>
                    <span className={`admin-status admin-status-${enrollment.paymentStatus.toLowerCase()}`}>
                      {enrollment.paymentStatus}
                    </span>
                  </div>
                  <div className="admin-student-detail-row">
                    <span>Enrolled</span>
                    <span>{relativeTime(enrollment.createdAt)}</span>
                  </div>
                </div>

                {data?.customer.card && (
                  <div className="admin-student-info-section">
                    <h4>Card on File</h4>
                    <p className="admin-student-card">{data.customer.card}</p>
                  </div>
                )}

                <div className="admin-student-actions">
                  {enrollment.email && (
                    <button
                      className="admin-compose-btn"
                      onClick={() => onSendEmail(enrollment.email!)}
                    >
                      Send Email
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: History */}
              <div className="admin-student-history">
                {/* Payments */}
                <div className="admin-student-info-section">
                  <h4>Payments</h4>
                  {data && data.charges.length > 0 ? (
                    <div className="admin-student-payment-list">
                      {data.charges.map((c) => (
                        <div key={c.id} className="admin-student-payment-row">
                          <div className="admin-student-payment-info">
                            <strong>${(c.amount / 100).toFixed(2)}</strong>
                            <span className="admin-student-payment-date">{formatDate(c.created)}</span>
                          </div>
                          <div className="admin-student-payment-actions">
                            <span className={`admin-status admin-status-${c.status === 'succeeded' ? 'completed' : 'pending'}`}>
                              {c.status === 'succeeded' ? 'Successful' : c.status}
                            </span>
                            {c.receipt_url && (
                              <a
                                href={c.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-stripe-link"
                              >
                                Receipt
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-student-empty">No payments found</p>
                  )}
                </div>

                {/* Invoices */}
                {data && data.invoices.length > 0 && (
                  <div className="admin-student-info-section">
                    <h4>Invoices</h4>
                    <div className="admin-student-payment-list">
                      {data.invoices.map((inv) => (
                        <div key={inv.id} className="admin-student-payment-row">
                          <div className="admin-student-payment-info">
                            <strong>${(inv.amount_due / 100).toFixed(2)}</strong>
                            <span className={`admin-invoice-badge admin-invoice-${inv.status}`}>
                              {inv.status_label}
                            </span>
                          </div>
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-stripe-link"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emails */}
                <div className="admin-student-info-section">
                  <h4>Emails Sent</h4>
                  {data && data.emails.length > 0 ? (
                    <div className="admin-student-email-list">
                      {data.emails.map((em) => (
                        <div key={em.id} className="admin-student-email-row">
                          <span className="admin-student-email-subject">{em.subject || '(no subject)'}</span>
                          <span className="admin-student-email-meta">
                            {relativeTime(em.created_at)}
                            {em.last_event && (
                              <span className={`admin-email-status admin-email-status-${em.last_event.toLowerCase()}`}>
                                {em.last_event}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-student-empty">No emails sent to this student</p>
                  )}
                </div>

                {/* Notes */}
                <div className="admin-student-info-section">
                  <h4>Notes</h4>
                  <div className="admin-notes-list">
                    {notes.map((n) => (
                      <div key={n.id} className="admin-note-item">
                        <div className="admin-note-content">{n.content}</div>
                        <div className="admin-note-meta">
                          <span title={fullDate(n.createdAt)}>{relativeTime(n.createdAt)}</span>
                          <button className="admin-note-delete" onClick={() => deleteNote(n.id)}>&times;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="admin-note-add">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this student..."
                      className="admin-compose-input"
                      rows={2}
                      style={{ resize: 'vertical' }}
                    />
                    <button
                      className="admin-send-btn"
                      onClick={addNote}
                      disabled={noteLoading || !newNote.trim()}
                      style={{ marginTop: 6, fontSize: '0.8rem', padding: '4px 12px' }}
                    >
                      {noteLoading ? 'Adding\u2026' : 'Add Note'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
