'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import AdminStudentModal from './AdminStudentModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import type { Section, Enrollment, Lead } from './admin-types';
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
  leads: Lead[];
  scheduleMap: Record<string, string>;
  adminKey: string;
  onSendEmail: (email: string, template?: string) => void;
}

export default function AdminStudentsTab({ sections, enrollments, leads: initialLeads, scheduleMap, adminKey, onSendEmail }: Props) {
  const [subTab, setSubTab] = useState<'enrolled' | 'prospective'>('enrolled');

  // ── Enrolled state ──
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);

  // ── Prospective state ──
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilterStatus, setLeadFilterStatus] = useState('all');
  const [showAddLead, setShowAddLead] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const hasSynced = useRef(false);

  // Fetch leads from API
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/leads?key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (res.ok) setLeadsList(data.leads);
    } catch { /* silent */ }
  }, [adminKey]);

  // Auto-sync on first Prospective open
  useEffect(() => {
    if (subTab === 'prospective' && !hasSynced.current) {
      hasSynced.current = true;
      (async () => {
        try {
          await fetch(`/api/admin/leads/sync?key=${encodeURIComponent(adminKey)}`, {
            method: 'POST',
          });
          await fetchLeads();
        } catch { /* silent */ }
      })();
    }
  }, [subTab, adminKey, fetchLeads]);

  // ── Enrolled filters ──
  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      if (search && !(e.email || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSection !== 'all' && e.section.label !== filterSection) return false;
      if (filterStatus !== 'all' && e.paymentStatus !== filterStatus) return false;
      if (filterPlan !== 'all' && e.plan !== filterPlan) return false;
      return true;
    });
  }, [enrollments, search, filterSection, filterStatus, filterPlan]);

  // ── Prospective filters ──
  const filteredLeads = useMemo(() => {
    return leadsList.filter((l) => {
      if (leadSearch) {
        const q = leadSearch.toLowerCase();
        if (!l.email.toLowerCase().includes(q) && !(l.name || '').toLowerCase().includes(q)) return false;
      }
      if (leadFilterStatus !== 'all' && l.status !== leadFilterStatus) return false;
      return true;
    });
  }, [leadsList, leadSearch, leadFilterStatus]);

  // ── Lead CRUD handlers ──
  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch(`/api/admin/leads?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, name: addName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add lead');
      setAddEmail('');
      setAddName('');
      setShowAddLead(false);
      await fetchLeads();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      setAddLoading(false);
    }
  }

  function startEdit(lead: Lead) {
    setEditingLead(lead.id);
    setEditName(lead.name || '');
    setEditEmail(lead.email);
    setEditStatus(lead.status);
  }

  async function saveEdit(id: string) {
    try {
      await fetch(`/api/admin/leads/${id}?key=${encodeURIComponent(adminKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, status: editStatus }),
      });
      setEditingLead(null);
      await fetchLeads();
    } catch { /* silent */ }
  }

  async function handleDelete() {
    if (!deletingLead) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/admin/leads/${deletingLead.id}?key=${encodeURIComponent(adminKey)}`, {
        method: 'DELETE',
      });
      setDeletingLead(null);
      await fetchLeads();
    } catch { /* silent */ }
    setDeleteLoading(false);
  }

  async function handleSendToLead(lead: Lead) {
    // Mark as CONTACTED
    try {
      await fetch(`/api/admin/leads/${lead.id}?key=${encodeURIComponent(adminKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONTACTED' }),
      });
      await fetchLeads();
    } catch { /* silent */ }
    onSendEmail(lead.email, 'Inquiry Response');
  }

  return (
    <>
      {/* Sub-tab toggle */}
      <div className="admin-email-subtabs">
        <button
          className={`admin-email-subtab ${subTab === 'enrolled' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setSubTab('enrolled')}
        >
          Enrolled ({enrollments.length})
        </button>
        <button
          className={`admin-email-subtab ${subTab === 'prospective' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setSubTab('prospective')}
        >
          Prospective ({leadsList.length})
        </button>
      </div>

      {/* ── ENROLLED SUB-TAB ── */}
      {subTab === 'enrolled' && (
        <>
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
      )}

      {/* ── PROSPECTIVE SUB-TAB ── */}
      {subTab === 'prospective' && (
        <>
          <div className="admin-filters">
            <input
              type="text"
              placeholder="Search by email or name\u2026"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              className="admin-search"
            />
            <select value={leadFilterStatus} onChange={(e) => setLeadFilterStatus(e.target.value)} className="admin-select">
              <option value="all">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
            </select>
            <button
              onClick={() => { setShowAddLead(!showAddLead); setAddError(''); }}
              className="admin-compose-btn"
            >
              {showAddLead ? 'Cancel' : '+ Add Lead'}
            </button>
          </div>

          {/* Add Lead form */}
          {showAddLead && (
            <div className="admin-compose" style={{ marginBottom: 16 }}>
              <form onSubmit={handleAddLead}>
                <div className="admin-compose-field">
                  <label>Email (required)</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="admin-compose-input"
                    required
                  />
                </div>
                <div className="admin-compose-field">
                  <label>Name (optional)</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Jane Doe"
                    className="admin-compose-input"
                  />
                </div>
                <div className="admin-compose-actions">
                  <button type="submit" className="admin-send-btn" disabled={addLoading}>
                    {addLoading ? 'Adding\u2026' : 'Add Lead'}
                  </button>
                  {addError && <span className="admin-compose-error">{addError}</span>}
                </div>
              </form>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      {leadsList.length === 0
                        ? 'No prospective students yet.'
                        : 'No leads match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l) =>
                    editingLead === l.id ? (
                      <tr key={l.id}>
                        <td>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="admin-compose-input"
                            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="admin-compose-input"
                            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                          />
                        </td>
                        <td>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="admin-select"
                            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                          </select>
                        </td>
                        <td title={fullDate(l.createdAt)}>{relativeTime(l.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-send-btn" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => saveEdit(l.id)}>
                              Save
                            </button>
                            <button className="admin-refresh-btn" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setEditingLead(null)}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={l.id}>
                        <td>{l.email}</td>
                        <td>{l.name || '\u2014'}</td>
                        <td>
                          <span className={`admin-status admin-status-${l.status.toLowerCase()}`}>
                            {l.status}
                          </span>
                        </td>
                        <td title={fullDate(l.createdAt)}>{relativeTime(l.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="admin-send-btn"
                              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              onClick={() => handleSendToLead(l)}
                            >
                              Send Email
                            </button>
                            <button
                              className="admin-refresh-btn"
                              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              onClick={() => startEdit(l)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-refund-confirm"
                              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              onClick={() => setDeletingLead(l)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Delete confirmation */}
          {deletingLead && (
            <AdminConfirmDialog
              title="Delete Lead"
              message={`Remove ${deletingLead.email} from prospective students? This cannot be undone.`}
              confirmLabel="Delete"
              confirmVariant="danger"
              loading={deleteLoading}
              onConfirm={handleDelete}
              onCancel={() => setDeletingLead(null)}
            />
          )}
        </>
      )}
    </>
  );
}
