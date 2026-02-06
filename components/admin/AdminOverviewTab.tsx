'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Section, Enrollment, Lead, ResendEmail, PaymentSummary } from './admin-types';
import { relativeTime } from './admin-utils';

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  leads: Lead[];
  scheduleMap: Record<string, string>;
  adminKey: string;
  onNavigate: (tab: string) => void;
}

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'email' | 'lead';
  label: string;
  time: string;
  timestamp: number;
}

export default function AdminOverviewTab({ sections, enrollments, leads, scheduleMap, adminKey, onNavigate }: Props) {
  const [recentEmails, setRecentEmails] = useState<ResendEmail[]>([]);
  const [emailsLoaded, setEmailsLoaded] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);

  // Fallback estimates while real data loads
  const fullCount = enrollments.filter((e) => e.plan === 'FULL').length;
  const depositCount = enrollments.filter((e) => e.plan === 'DEPOSIT').length;
  const fallbackRevenue = fullCount * 500 + depositCount * 150;
  const fallbackPending = depositCount * 350;

  const revenueCollected = paymentSummary ? paymentSummary.totalCollected : fallbackRevenue;
  const pendingBalance = paymentSummary ? paymentSummary.pendingInvoices : fallbackPending;
  const totalCapacity = sections.reduce((sum, s) => sum + s.maxCapacity, 0);
  const totalEnrolled = sections.reduce((sum, s) => sum + s.enrolledCount, 0);
  const openSpots = totalCapacity - totalEnrolled;

  // Fetch recent emails for activity feed
  const fetchRecentEmails = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/emails?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (res.ok) setRecentEmails(data.emails?.slice(0, 5) || []);
    } catch { /* silent */ }
    setEmailsLoaded(true);
  }, [adminKey]);

  // Fetch real payment data from Stripe
  const fetchPaymentSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/payments?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (res.ok) setPaymentSummary(data.summary);
    } catch { /* silent — fallback numbers remain */ }
  }, [adminKey]);

  useEffect(() => {
    if (!emailsLoaded) {
      fetchRecentEmails();
      fetchPaymentSummary();
    }
  }, [emailsLoaded, fetchRecentEmails, fetchPaymentSummary]);

  // Build activity feed
  const activityItems: ActivityItem[] = [
    ...enrollments.slice(0, 5).map((e) => ({
      id: `enroll-${e.id}`,
      type: 'enrollment' as const,
      label: `${e.email || 'Unknown'} enrolled in ${scheduleMap[e.section.label] || e.section.label}`,
      time: relativeTime(e.createdAt),
      timestamp: new Date(e.createdAt).getTime(),
    })),
    ...recentEmails.map((em) => ({
      id: `email-${em.id}`,
      type: 'email' as const,
      label: `Email sent: ${em.subject || '(no subject)'}`,
      time: relativeTime(em.created_at),
      timestamp: new Date(em.created_at).getTime(),
    })),
    ...leads.slice(0, 5).map((l) => ({
      id: `lead-${l.id}`,
      type: 'lead' as const,
      label: `Inquiry from ${l.name || l.email}${l.status === 'NEW' ? ' (needs reply)' : ''}`,
      time: relativeTime(l.createdAt),
      timestamp: new Date(l.createdAt).getTime(),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  return (
    <>
      {/* Metric Cards */}
      <div className="admin-overview-metrics">
        <div className="admin-overview-card">
          <div className="admin-overview-card-value">{enrollments.length}</div>
          <div className="admin-overview-card-label">Total Students</div>
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
          <div className="admin-overview-card-label">Upcoming Invoices</div>
        </div>
        <div className="admin-overview-card">
          <div className="admin-overview-card-value">{openSpots}</div>
          <div className="admin-overview-card-label">Open Spots</div>
        </div>
        <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('students')}>
          <div className="admin-overview-card-value" style={{ color: '#2563eb' }}>
            {leads.filter((l) => l.status === 'NEW').length}
          </div>
          <div className="admin-overview-card-label">New Inquiries</div>
        </div>
      </div>

      {/* Section Capacity Bars */}
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

      {/* Recent Activity */}
      <div className="admin-overview-section">
        <h3 className="admin-overview-section-title">Recent Activity</h3>
        {activityItems.length === 0 ? (
          <p className="admin-overview-empty">No recent activity</p>
        ) : (
          <div className="admin-activity-feed">
            {activityItems.map((item) => (
              <div
                key={item.id}
                className="admin-activity-item"
                onClick={() => onNavigate(item.type === 'email' ? 'emails' : 'students')}
              >
                <span className={`admin-activity-dot admin-activity-dot-${item.type}`} />
                <span className="admin-activity-label">{item.label}</span>
                <span className="admin-activity-time">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="admin-overview-section">
        <h3 className="admin-overview-section-title">Quick Actions</h3>
        <div className="admin-quick-actions">
          <button className="admin-quick-action" onClick={() => onNavigate('emails-compose')}>
            Email All Students
          </button>
          <button className="admin-quick-action" onClick={() => onNavigate('students')}>
            Export Student List
          </button>
          <button className="admin-quick-action" onClick={() => onNavigate('payments')}>
            View Payments
          </button>
        </div>
      </div>
    </>
  );
}
