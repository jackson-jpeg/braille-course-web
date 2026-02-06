'use client';

import { useState, useMemo } from 'react';
import AdminStudentModal from './AdminStudentModal';
import type { Section, Enrollment } from './admin-types';
import { relativeTime, fullDate } from './admin-utils';

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
  a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  scheduleMap: Record<string, string>;
  adminKey: string;
  onSendEmail: (email: string) => void;
}

export default function AdminStudentsTab({ sections, enrollments, scheduleMap, adminKey, onSendEmail }: Props) {
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      if (search && !(e.email || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSection !== 'all' && e.section.label !== filterSection) return false;
      if (filterStatus !== 'all' && e.paymentStatus !== filterStatus) return false;
      if (filterPlan !== 'all' && e.plan !== filterPlan) return false;
      return true;
    });
  }, [enrollments, search, filterSection, filterStatus, filterPlan]);

  return (
    <>
      {/* Search & Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by email\u2026"
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

      {/* Students Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Schedule</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty">
                  {enrollments.length === 0 ? 'No students yet.' : 'No students match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className={`admin-student-row-clickable ${e.paymentStatus === 'WAITLISTED' ? 'admin-row-warning' : ''}`}
                  onClick={() => setSelectedStudent(e)}
                >
                  <td>{e.email || '\u2014'}</td>
                  <td>{scheduleMap[e.section.label] || e.section.label}</td>
                  <td>{e.plan === 'FULL' ? 'Full ($500)' : 'Deposit ($150 + $350 May 1)'}</td>
                  <td>
                    <span className={`admin-status admin-status-${e.paymentStatus.toLowerCase()}`}>
                      {e.paymentStatus}
                    </span>
                  </td>
                  <td title={fullDate(e.createdAt)}>{relativeTime(e.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <AdminStudentModal
          enrollment={selectedStudent}
          scheduleMap={scheduleMap}
          adminKey={adminKey}
          onClose={() => setSelectedStudent(null)}
          onSendEmail={(email) => {
            setSelectedStudent(null);
            onSendEmail(email);
          }}
        />
      )}
    </>
  );
}
