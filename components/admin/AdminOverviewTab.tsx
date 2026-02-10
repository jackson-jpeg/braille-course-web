'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminStudentModal from './AdminStudentModal';
import AdminTodoWidget from './AdminTodoWidget';
import AdminCalendarView from './AdminCalendarView';
import type { Section, Enrollment, Lead, SchoolInquiry, PaymentSummary } from './admin-types';
import { relativeTime } from './admin-utils';

interface AnalyticsData {
  monthlyRevenue: { month: string; amount: number }[];
  funnel: { signups: number; enrolled: number; completed: number };
  pipeline: { status: string; count: number }[];
  sections: { label: string; enrolledCount: number; maxCapacity: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW_INQUIRY: 'New',
  CONTACTED: 'Contacted',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATING: 'Negotiating',
  CONTRACTED: 'Contracted',
  ON_HOLD: 'On Hold',
  CLOSED_WON: 'Won',
  CLOSED_LOST: 'Lost',
};

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  leads: Lead[];
  schoolInquiries: SchoolInquiry[];
  scheduleMap: Record<string, string>;
  onNavigate: (tab: string) => void;
  onSendEmail: (email: string) => void;
}

function downloadDataCsv(
  data: Record<string, string | number>[],
  headers: string[],
  filename: string,
) {
  const rows = data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOverviewTab({
  sections,
  enrollments,
  leads,
  schoolInquiries,
  scheduleMap,
  onNavigate,
  onSendEmail,
}: Props) {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar'>('dashboard');

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
    } catch (err) {
      console.error('Failed to fetch payment summary:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchPaymentSummary();
    fetchAnalytics();
  }, [fetchPaymentSummary, fetchAnalytics]);

  // Attention items
  const newLeads = useMemo(() => leads.filter((l) => l.status === 'NEW'), [leads]);
  const waitlisted = useMemo(() => enrollments.filter((e) => e.paymentStatus === 'WAITLISTED'), [enrollments]);
  const newSchoolInquiries = useMemo(
    () => schoolInquiries.filter((s) => s.status === 'NEW_INQUIRY'),
    [schoolInquiries],
  );
  const hasAttention =
    newLeads.length > 0 ||
    waitlisted.length > 0 ||
    newSchoolInquiries.length > 0 ||
    (pendingBalance > 0 && paymentSummary);

  // Roster
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

  // Revenue chart helpers
  const maxRevenue = analytics ? Math.max(...analytics.monthlyRevenue.map((m) => m.amount), 1) : 1;

  // Pipeline chart helpers
  const maxPipeline = analytics ? Math.max(...analytics.pipeline.map((p) => p.count), 1) : 1;

  // Funnel data
  const funnelMax = analytics ? Math.max(analytics.funnel.signups, 1) : 1;

  // CSV exports
  function exportStudents() {
    const rows = enrollments.map((e) => ({
      Email: e.email || '',
      Section: e.section.label,
      Plan: e.plan,
      Status: e.paymentStatus,
      Date: new Date(e.createdAt).toISOString().slice(0, 10),
    }));
    downloadDataCsv(rows, ['Email', 'Section', 'Plan', 'Status', 'Date'], `students-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportSchools() {
    const rows = schoolInquiries.map((s) => ({
      School: s.schoolName,
      Contact: s.contactName,
      Email: s.contactEmail,
      Status: s.status,
      State: s.state || '',
      Date: new Date(s.createdAt).toISOString().slice(0, 10),
    }));
    downloadDataCsv(rows, ['School', 'Contact', 'Email', 'Status', 'State', 'Date'], `schools-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportPayments() {
    const rows = enrollments
      .filter((e) => e.paymentStatus === 'COMPLETED')
      .map((e) => ({
        Email: e.email || '',
        Plan: e.plan,
        Amount: e.plan === 'FULL' ? '500' : '150',
        Date: new Date(e.createdAt).toISOString().slice(0, 10),
      }));
    downloadDataCsv(rows, ['Email', 'Plan', 'Amount', 'Date'], `payments-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleSendEmail(email: string) {
    setSelectedStudent(null);
    onSendEmail(email);
  }

  return (
    <>
      {/* ── View toggle ── */}
      <div className="admin-overview-toggle">
        <button
          className={`admin-overview-toggle-btn ${viewMode === 'dashboard' ? 'admin-overview-toggle-active' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`admin-overview-toggle-btn ${viewMode === 'calendar' ? 'admin-overview-toggle-active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          Calendar
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <AdminCalendarView onNavigate={onNavigate} />
      ) : (
        <>
          {/* ── Top metrics ── */}
          <div className="admin-overview-metrics">
            <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('students')}>
              <div className="admin-overview-card-value">
                {enrollments.filter((e) => e.paymentStatus === 'COMPLETED').length}
              </div>
              <div className="admin-overview-card-label">Enrolled Students</div>
            </div>
            <div className="admin-overview-card admin-overview-card-green">
              <div className="admin-overview-card-value">
                $
                {paymentSummary
                  ? revenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : revenueCollected.toLocaleString()}
              </div>
              <div className="admin-overview-card-label">Revenue Collected</div>
            </div>
            <div className="admin-overview-card admin-overview-card-gold">
              <div className="admin-overview-card-value">
                $
                {paymentSummary
                  ? pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : pendingBalance.toLocaleString()}
              </div>
              <div className="admin-overview-card-label">Pending Balance</div>
            </div>
          </div>

          {/* ── Needs attention ── */}
          {hasAttention && (
            <div className="admin-attention">
              <h3 className="admin-attention-title">Needs your attention</h3>
              <div className="admin-attention-list">
                {newSchoolInquiries.length > 0 && (
                  <button className="admin-attention-item" onClick={() => onNavigate('schools')}>
                    <span className="admin-attention-dot admin-attention-dot-blue" />
                    <span className="admin-attention-text">
                      <strong>
                        {newSchoolInquiries.length} new school{' '}
                        {newSchoolInquiries.length === 1 ? 'inquiry' : 'inquiries'}
                      </strong>
                      {' \u2014 '}
                      {newSchoolInquiries
                        .slice(0, 2)
                        .map((s) => s.schoolName)
                        .join(', ')}
                      {newSchoolInquiries.length > 2 && ` +${newSchoolInquiries.length - 2} more`}
                    </span>
                    <span className="admin-attention-action">Review &rarr;</span>
                  </button>
                )}
                {newLeads.length > 0 && (
                  <button className="admin-attention-item" onClick={() => onNavigate('students')}>
                    <span className="admin-attention-dot admin-attention-dot-blue" />
                    <span className="admin-attention-text">
                      <strong>
                        {newLeads.length} new {newLeads.length === 1 ? 'inquiry' : 'inquiries'}
                      </strong>
                      {' \u2014 '}
                      {newLeads
                        .slice(0, 2)
                        .map((l) => l.name || l.email)
                        .join(', ')}
                      {newLeads.length > 2 && ` +${newLeads.length - 2} more`}
                    </span>
                    <span className="admin-attention-action">Reply &rarr;</span>
                  </button>
                )}
                {waitlisted.length > 0 && (
                  <button className="admin-attention-item" onClick={() => onNavigate('students')}>
                    <span className="admin-attention-dot admin-attention-dot-orange" />
                    <span className="admin-attention-text">
                      <strong>
                        {waitlisted.length} {waitlisted.length === 1 ? 'student' : 'students'} waitlisted
                      </strong>
                      {' \u2014 '}
                      {waitlisted
                        .slice(0, 2)
                        .map((e) => e.email || 'Unknown')
                        .join(', ')}
                      {waitlisted.length > 2 && ` +${waitlisted.length - 2} more`}
                    </span>
                    <span className="admin-attention-action">Manage &rarr;</span>
                  </button>
                )}
                {pendingBalance > 0 && paymentSummary && (
                  <button className="admin-attention-item" onClick={() => onNavigate('payments')}>
                    <span className="admin-attention-dot admin-attention-dot-gold" />
                    <span className="admin-attention-text">
                      <strong>${pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> in
                      deposit balances due May 1
                    </span>
                    <span className="admin-attention-action">View &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Quick actions ── */}
          <div className="admin-analytics-section">
            <h3>Quick Actions</h3>
            <div className="admin-quick-actions">
              <button className="admin-quick-action-btn" onClick={() => onNavigate('payments')}>
                Manage Coupons
              </button>
              <button className="admin-quick-action-btn" onClick={() => onNavigate('emails')}>
                Send Bulk Email
              </button>
              <button className="admin-quick-action-btn" onClick={exportStudents}>
                Export Students CSV
              </button>
              <button className="admin-quick-action-btn" onClick={exportPayments}>
                Export Payments CSV
              </button>
              <button className="admin-quick-action-btn" onClick={exportSchools}>
                Export Schools CSV
              </button>
            </div>
          </div>

          {/* ── Revenue chart ── */}
          {analytics && (
            <div className="admin-analytics-section">
              <h3>Monthly Revenue (Last 6 Months)</h3>
              <div className="admin-bar-chart">
                {analytics.monthlyRevenue.map((m) => (
                  <div key={m.month} className="admin-bar-col">
                    {m.amount > 0 && (
                      <span className="admin-bar-value">${m.amount.toLocaleString()}</span>
                    )}
                    <div
                      className="admin-bar"
                      style={{ height: `${Math.max((m.amount / maxRevenue) * 100, 3)}%` }}
                    />
                    <span className="admin-bar-label">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Enrollment funnel ── */}
          {analytics && (
            <div className="admin-analytics-section">
              <h3>Enrollment Funnel</h3>
              <div className="admin-hbar-chart">
                <div className="admin-hbar-row">
                  <span className="admin-hbar-label">Signups</span>
                  <div className="admin-hbar-track">
                    <div
                      className="admin-hbar-fill admin-hbar-fill-navy"
                      style={{ width: `${(analytics.funnel.signups / funnelMax) * 100}%` }}
                    />
                  </div>
                  <span className="admin-hbar-count">{analytics.funnel.signups}</span>
                </div>
                <div className="admin-hbar-row">
                  <span className="admin-hbar-label">Enrolled</span>
                  <div className="admin-hbar-track">
                    <div
                      className="admin-hbar-fill admin-hbar-fill-sage"
                      style={{ width: `${(analytics.funnel.enrolled / funnelMax) * 100}%` }}
                    />
                  </div>
                  <span className="admin-hbar-count">{analytics.funnel.enrolled}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── School pipeline ── */}
          {analytics && analytics.pipeline.length > 0 && (
            <div className="admin-analytics-section">
              <h3>School Pipeline</h3>
              <div className="admin-hbar-chart">
                {analytics.pipeline.map((p) => (
                  <div key={p.status} className="admin-hbar-row">
                    <span className="admin-hbar-label">{STATUS_LABELS[p.status] || p.status}</span>
                    <div className="admin-hbar-track">
                      <div
                        className="admin-hbar-fill"
                        style={{ width: `${(p.count / maxPipeline) * 100}%` }}
                      />
                    </div>
                    <span className="admin-hbar-count">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section enrollment overview ── */}
          {analytics && analytics.sections.length > 0 && (
            <div className="admin-analytics-section">
              <h3>Section Enrollment</h3>
              <table className="admin-progress-overview-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Enrolled</th>
                    <th>Capacity</th>
                    <th>Fill Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.sections.map((s) => {
                    const pct = Math.round((s.enrolledCount / s.maxCapacity) * 100);
                    return (
                      <tr key={s.label}>
                        <td>{scheduleMap[s.label] || s.label}</td>
                        <td>{s.enrolledCount}</td>
                        <td>{s.maxCapacity}</td>
                        <td>
                          <div className="admin-mini-progress">
                            <div className="admin-mini-progress-track">
                              <div
                                className="admin-mini-progress-fill"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="admin-mini-progress-pct">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Todo checklist ── */}
          <AdminTodoWidget />

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
                      <span
                        className={`admin-capacity-badge ${isFull ? 'admin-capacity-full' : 'admin-capacity-open'}`}
                      >
                        {isFull ? 'FULL' : 'OPEN'}
                      </span>
                      <span className="admin-roster-count">
                        {section.enrolledCount}/{section.maxCapacity}
                      </span>
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
                        <button key={e.id} className="admin-roster-student" onClick={() => setSelectedStudent(e)}>
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
                              <span className="admin-roster-student-meta">
                                {e.plan === 'DEPOSIT' ? 'Deposit' : 'Full'}
                              </span>
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
        </>
      )}

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
