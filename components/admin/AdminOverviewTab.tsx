'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminStudentModal from './AdminStudentModal';
import type { Section, Enrollment, Lead, PaymentSummary } from './admin-types';
import { relativeTime } from './admin-utils';

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  leads: Lead[];
  scheduleMap: Record<string, string>;
  onNavigate: (tab: string) => void;
}

export default function AdminOverviewTab({ sections, enrollments, leads, scheduleMap, onNavigate }: Props) {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);

  // Fallback estimates while real data loads
  const fullCount = enrollments.filter((e) => e.plan === 'FULL' && e.paymentStatus === 'COMPLETED').length;
  const depositCount = enrollments.filter((e) => e.plan === 'DEPOSIT' && e.paymentStatus === 'COMPLETED').length;
  const fallbackRevenue = fullCount * 500 + depositCount * 150;
  const fallbackPending = depositCount * 350;

  const revenueCollected = paymentSummary ? paymentSummary.totalCollected : fallbackRevenue;
  const pendingBalance = paymentSummary ? paymentSummary.pendingInvoices : fallbackPending;

  const fetchPaymentSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (res.ok) setPaymentSummary(data.summary);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPaymentSummary(); }, [fetchPaymentSummary]);

  // Attention items — only things that need action
  const newLeads = useMemo(() => leads.filter((l) => l.status === 'NEW'), [leads]);
  const waitlisted = useMemo(() => enrollments.filter((e) => e.paymentStatus === 'WAITLISTED'), [enrollments]);
  const hasAttention = newLeads.length > 0 || waitlisted.length > 0 || (pendingBalance > 0 && paymentSummary);

  // Group enrollments by section for the roster cards
  const sectionRosters = useMemo(() => {
    return sections.map((s) => {
      const sectionEnrollments = enrollments
        .filter((e) => e.section.label === s.label && e.paymentStatus === 'COMPLETED')
        .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      const sectionWaitlisted = enrollments
        .filter((e) => e.section.label === s.label && e.paymentStatus === 'WAITLISTED')
        .sort((a, b) => (a.waitlistPosition ?? 99) - (b.waitlistPosition ?? 99));
      return { section: s, enrolled: sectionEnrollments, waitlisted: sectionWaitlisted };
    });
  }, [sections, enrollments]);

  function handleSendEmail(email: string) {
    setSelectedStudent(null);
    onNavigate('emails');
  }

  return (
    <>
      {/* ── Top metrics: 3 numbers, clean ── */}
      <div className="admin-overview-metrics">
        <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('students')}>
          <div className="admin-overview-card-value">
            {enrollments.filter((e) => e.paymentStatus === 'COMPLETED').length}
          </div>
          <div className="admin-overview-card-label">Enrolled Students</div>
        </div>
        <div className="admin-overview-card admin-overview-card-green">
          <div className="admin-overview-card-value">
            ${paymentSummary
              ? revenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })
              : revenueCollected.toLocaleString()}
          </div>
          <div className="admin-overview-card-label">Revenue Collected</div>
        </div>
        <div className="admin-overview-card admin-overview-card-gold">
          <div className="admin-overview-card-value">
            ${paymentSummary
              ? pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
              : pendingBalance.toLocaleString()}
          </div>
          <div className="admin-overview-card-label">Pending Balance</div>
        </div>
      </div>

      {/* ── Needs attention — only renders when there's something to do ── */}
      {hasAttention && (
        <div className="admin-attention">
          <h3 className="admin-attention-title">Needs your attention</h3>
          <div className="admin-attention-list">
            {newLeads.length > 0 && (
              <button className="admin-attention-item" onClick={() => onNavigate('students')}>
                <span className="admin-attention-dot admin-attention-dot-blue" />
                <span className="admin-attention-text">
                  <strong>{newLeads.length} new {newLeads.length === 1 ? 'inquiry' : 'inquiries'}</strong>
                  {' \u2014 '}
                  {newLeads.slice(0, 2).map((l) => l.name || l.email).join(', ')}
                  {newLeads.length > 2 && ` +${newLeads.length - 2} more`}
                </span>
                <span className="admin-attention-action">Reply &rarr;</span>
              </button>
            )}
            {waitlisted.length > 0 && (
              <button className="admin-attention-item" onClick={() => onNavigate('students')}>
                <span className="admin-attention-dot admin-attention-dot-orange" />
                <span className="admin-attention-text">
                  <strong>{waitlisted.length} {waitlisted.length === 1 ? 'student' : 'students'} waitlisted</strong>
                  {' \u2014 '}
                  {waitlisted.slice(0, 2).map((e) => e.email || 'Unknown').join(', ')}
                  {waitlisted.length > 2 && ` +${waitlisted.length - 2} more`}
                </span>
                <span className="admin-attention-action">Manage &rarr;</span>
              </button>
            )}
            {pendingBalance > 0 && paymentSummary && (
              <button className="admin-attention-item" onClick={() => onNavigate('payments')}>
                <span className="admin-attention-dot admin-attention-dot-gold" />
                <span className="admin-attention-text">
                  <strong>${pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> in deposit balances due May 1
                </span>
                <span className="admin-attention-action">View &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Section roster cards ── */}
      <div className="admin-roster-grid">
        {sectionRosters.map(({ section, enrolled, waitlisted: wl }) => {
          const pct = Math.round((section.enrolledCount / section.maxCapacity) * 100);
          const isFull = section.enrolledCount >= section.maxCapacity;
          return (
            <div key={section.id} className="admin-roster-card">
              <div className="admin-roster-header">
                <div>
                  <div className="admin-roster-section-label">{section.label}</div>
                  <div className="admin-roster-schedule">{scheduleMap[section.label] || ''}</div>
                </div>
                <div className="admin-roster-stats">
                  <span className={`admin-capacity-badge ${isFull ? 'admin-capacity-full' : 'admin-capacity-open'}`}>
                    {isFull ? 'FULL' : 'OPEN'}
                  </span>
                  <span className="admin-roster-count">{section.enrolledCount}/{section.maxCapacity}</span>
                </div>
              </div>

              <div className="admin-progress-track" style={{ marginBottom: 16 }}>
                <div
                  className={`admin-progress-fill ${isFull ? 'admin-progress-full' : ''}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              {enrolled.length === 0 && wl.length === 0 ? (
                <p className="admin-roster-empty">No students yet</p>
              ) : (
                <div className="admin-roster-list">
                  {enrolled.map((e) => (
                    <button
                      key={e.id}
                      className="admin-roster-student"
                      onClick={() => setSelectedStudent(e)}
                    >
                      <span className="admin-roster-student-email">{e.email || 'Unknown'}</span>
                      <span className="admin-roster-student-meta">
                        {e.plan === 'DEPOSIT' ? 'Deposit' : 'Full'}
                        <span className="admin-roster-student-time">{relativeTime(e.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                  {wl.length > 0 && (
                    <>
                      <div className="admin-roster-divider">
                        <span>Waitlisted</span>
                      </div>
                      {wl.map((e) => (
                        <button
                          key={e.id}
                          className="admin-roster-student admin-roster-student-waitlisted"
                          onClick={() => setSelectedStudent(e)}
                        >
                          <span className="admin-roster-student-email">
                            <span className="admin-roster-wl-num">{e.waitlistPosition || '#'}</span>
                            {e.email || 'Unknown'}
                          </span>
                          <span className="admin-roster-student-meta">{e.plan === 'DEPOSIT' ? 'Deposit' : 'Full'}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Student detail modal */}
      {selectedStudent && (
        <AdminStudentModal
          enrollment={selectedStudent}
          scheduleMap={scheduleMap}
          onClose={() => setSelectedStudent(null)}
          onSendEmail={handleSendEmail}
        />
      )}
    </>
  );
}
