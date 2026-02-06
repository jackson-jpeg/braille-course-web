'use client';

import { useState, useEffect } from 'react';
import type { Enrollment, StudentDetail } from './admin-types';
import { relativeTime, formatDate } from './admin-utils';

interface Props {
  enrollment: Enrollment;
  scheduleMap: Record<string, string>;
  adminKey: string;
  onClose: () => void;
  onSendEmail: (email: string) => void;
}

export default function AdminStudentModal({ enrollment, scheduleMap, adminKey, onClose, onSendEmail }: Props) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enrollment.stripeCustomerId) {
      setLoading(false);
      setError('No Stripe customer linked');
      return;
    }

    async function fetchStudent() {
      try {
        const res = await fetch(
          `/api/admin/students/${enrollment.stripeCustomerId}?key=${encodeURIComponent(adminKey)}`
        );
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
  }, [enrollment.stripeCustomerId, adminKey]);

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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
