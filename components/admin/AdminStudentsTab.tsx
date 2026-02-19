'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import AdminStudentModal from './AdminStudentModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminWaitlistPanel from './AdminWaitlistPanel';
import AdminAttendanceTab from './AdminAttendanceTab';
import AdminProgressTab from './AdminProgressTab';
import CopyButton from './CopyButton';
import { useToast } from './AdminToast';
import type { Section, Enrollment, Lead } from './admin-types';
import { relativeTime, fullDate, downloadCsv, sortArrow as sortArrowUtil } from './admin-utils';
import { PRICING, formatPrice } from '@/lib/pricing';

type StudentSortKey = 'email' | 'schedule' | 'plan' | 'status' | 'date';

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  leads: Lead[];
  scheduleMap: Record<string, string>;
  onSendEmail: (email: string, template?: string) => void;
}

export default function AdminStudentsTab({
  sections,
  enrollments,
  leads: initialLeads,
  scheduleMap,
  onSendEmail,
}: Props) {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'enrolled' | 'prospective' | 'attendance' | 'progress'>('enrolled');
  const waitlistedCount = enrollments.filter((e) => e.paymentStatus === 'WAITLISTED').length;

  // ── Enrolled state ──
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);

  // Sorting for enrolled
  const [sortKey, setSortKey] = useState<StudentSortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: StudentSortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  }

  function sortArrowFor(key: StudentSortKey) {
    return sortArrowUtil(sortKey === key, sortDir);
  }

  // ── Prospective state ──
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilterStatus, setLeadFilterStatus] = useState('all');
  const [leadFilterSubject, setLeadFilterSubject] = useState('all');
  const [showAddLead, setShowAddLead] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCallbackTime, setEditCallbackTime] = useState('');
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const hasSynced = useRef(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch leads from API
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (res.ok) setLeadsList(data.leads);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  }, []);

  // Sync leads from inbox
  const syncLeads = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch('/api/admin/leads/sync', { method: 'POST' });
      await fetchLeads();
    } catch (err) {
      console.error('Failed to sync leads:', err);
    } finally {
      setSyncing(false);
    }
  }, [fetchLeads]);

  // Auto-sync on first Prospective open
  useEffect(() => {
    if (subTab === 'prospective' && !hasSynced.current) {
      hasSynced.current = true;
      syncLeads();
    }
  }, [subTab, syncLeads]);

  // ── Enrolled filters + sort ──
  const filtered = useMemo(() => {
    const list = enrollments.filter((e) => {
      if (search && !(e.email || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSection !== 'all' && e.section.label !== filterSection) return false;
      if (filterStatus !== 'all' && e.paymentStatus !== filterStatus) return false;
      if (filterPlan !== 'all' && e.plan !== filterPlan) return false;
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '');
          break;
        case 'schedule':
          cmp = (scheduleMap[a.section.label] || a.section.label).localeCompare(
            scheduleMap[b.section.label] || b.section.label,
          );
          break;
        case 'plan':
          cmp = a.plan.localeCompare(b.plan);
          break;
        case 'status':
          cmp = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [enrollments, search, filterSection, filterStatus, filterPlan, sortKey, sortDir, scheduleMap]);

  // ── Prospective filters ──
  const filteredLeads = useMemo(() => {
    return leadsList.filter((l) => {
      if (leadSearch) {
        const q = leadSearch.toLowerCase();
        if (!l.email.toLowerCase().includes(q) && !(l.name || '').toLowerCase().includes(q)) return false;
      }
      if (leadFilterStatus !== 'all' && l.status !== leadFilterStatus) return false;
      if (leadFilterSubject !== 'all' && l.subject !== leadFilterSubject) return false;
      return true;
    });
  }, [leadsList, leadSearch, leadFilterStatus, leadFilterSubject]);

  // ── Lead CRUD handlers ──
  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
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
    setEditNotes(lead.notes || '');
    setEditSubject(lead.subject || '');
    setEditPhone(lead.phone || '');
    setEditCallbackTime(lead.preferredCallbackTime || '');
  }

  async function saveEdit(id: string) {
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          status: editStatus,
          notes: editNotes,
          subject: editSubject,
          phone: editPhone,
          preferredCallbackTime: editCallbackTime,
        }),
      });
      setEditingLead(null);
      await fetchLeads();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save changes', 'error');
    }
  }

  async function handleDelete() {
    if (!deletingLead) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/admin/leads/${deletingLead.id}`, {
        method: 'DELETE',
      });
      setDeletingLead(null);
      await fetchLeads();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete lead', 'error');
    }
    setDeleteLoading(false);
  }

  async function handleSendToLead(lead: Lead) {
    // Mark as CONTACTED
    try {
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONTACTED' }),
      });
      await fetchLeads();
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
    onSendEmail(lead.email, 'Inquiry Response');
  }

  return (
    <>
      {/* Waitlist panel (above sub-tabs when there are waitlisted students) */}
      {waitlistedCount > 0 && subTab === 'enrolled' && (
        <AdminWaitlistPanel sections={sections} scheduleMap={scheduleMap} onSendEmail={(email) => onSendEmail(email)} />
      )}

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
        <button
          className={`admin-email-subtab ${subTab === 'attendance' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setSubTab('attendance')}
        >
          Attendance
        </button>
        <button
          className={`admin-email-subtab ${subTab === 'progress' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setSubTab('progress')}
        >
          Progress
        </button>
      </div>

      {/* ── ENROLLED SUB-TAB ── */}
      {subTab === 'enrolled' && (
        <>
          <div className="admin-filters">
            <div className="admin-search-wrap">
              <input
                type="text"
                placeholder="Search by email\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="admin-search"
              />
              {search && (
                <button className="admin-search-clear" onClick={() => setSearch('')} type="button">
                  &times;
                </button>
              )}
            </div>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="admin-select">
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
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
            <button onClick={() => window.print()} className="admin-refresh-btn admin-print-btn">
              Print Roster
            </button>
          </div>

          {/* Result count */}
          {search && (
            <p className="admin-result-count">
              Showing {filtered.length} of {enrollments.length} students
            </p>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-sortable-th" onClick={() => handleSort('email')}>
                    Email{sortArrowFor('email')}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSort('schedule')}>
                    Schedule{sortArrowFor('schedule')}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSort('plan')}>
                    Plan{sortArrowFor('plan')}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSort('status')}>
                    Status{sortArrowFor('status')}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSort('date')}>
                    Date{sortArrowFor('date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      {enrollments.length === 0 ? (
                        <div className="admin-empty-state">
                          <p className="admin-empty-state-title">No students yet</p>
                          <p className="admin-empty-state-sub">
                            Students will appear here once they enroll in a course.
                          </p>
                        </div>
                      ) : (
                        'No students match your filters.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr
                      key={e.id}
                      className={`admin-student-row-clickable ${e.paymentStatus === 'WAITLISTED' ? 'admin-row-warning' : ''}`}
                      onClick={() => setSelectedStudent(e)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          setSelectedStudent(e);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${e.email || 'student'}`}
                    >
                      <td>
                        <span className="admin-email-cell">
                          {e.email || '\u2014'}
                          {e.email && <CopyButton text={e.email} label="Copy email" />}
                        </span>
                      </td>
                      <td>{scheduleMap[e.section.label] || e.section.label}</td>
                      <td>{e.plan === 'FULL' ? `Full (${formatPrice(PRICING.full)})` : `Deposit (${formatPrice(PRICING.deposit)} + ${formatPrice(PRICING.balance)} ${PRICING.balanceDueDate})`}</td>
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
            <div className="admin-search-wrap">
              <input
                type="text"
                placeholder="Search by email or name\u2026"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="admin-search"
              />
              {leadSearch && (
                <button className="admin-search-clear" onClick={() => setLeadSearch('')} type="button">
                  &times;
                </button>
              )}
            </div>
            <select
              value={leadFilterStatus}
              onChange={(e) => setLeadFilterStatus(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
            </select>
            <select
              value={leadFilterSubject}
              onChange={(e) => setLeadFilterSubject(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Types</option>
              <option value="Appointment Request">Appointments</option>
              <option value="Waitlist Request">Waitlist</option>
            </select>
            <button
              onClick={syncLeads}
              className="admin-refresh-btn"
              disabled={syncing}
            >
              {syncing ? <><span className="admin-btn-spinner admin-btn-spinner-dark" />Syncing&hellip;</> : 'Sync Inbox'}
            </button>
            <button
              onClick={() => {
                setShowAddLead(!showAddLead);
                setAddError('');
              }}
              className="admin-compose-btn"
            >
              {showAddLead ? 'Cancel' : '+ Add Lead'}
            </button>
          </div>

          {/* Result count */}
          {leadSearch && (
            <p className="admin-result-count">
              Showing {filteredLeads.length} of {leadsList.length} leads
            </p>
          )}

          {/* Add Lead form */}
          {showAddLead && (
            <div className="admin-compose admin-compose-animate" style={{ marginBottom: 16 }}>
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
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Callback Time</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="admin-empty">
                      {leadsList.length === 0 ? (
                        <div className="admin-empty-state">
                          <p className="admin-empty-state-title">No prospective students</p>
                          <p className="admin-empty-state-sub">Add a lead or sync from your inbox to get started.</p>
                          <button
                            className="admin-empty-state-cta"
                            onClick={() => {
                              setShowAddLead(true);
                              setAddError('');
                            }}
                          >
                            + Add Lead
                          </button>
                        </div>
                      ) : (
                        'No leads match your filters.'
                      )}
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
                          <input
                            type="text"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="admin-compose-input"
                            placeholder="Type..."
                            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="admin-compose-input"
                            placeholder="Phone..."
                            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editCallbackTime}
                            onChange={(e) => setEditCallbackTime(e.target.value)}
                            className="admin-compose-input"
                            placeholder="Callback time..."
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
                        <td>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="admin-compose-input"
                            placeholder="Add notes..."
                            rows={2}
                            style={{ fontSize: '0.85rem', padding: '4px 8px', resize: 'vertical' }}
                          />
                        </td>
                        <td title={fullDate(l.createdAt)}>{relativeTime(l.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-send-btn admin-action-btn-sm" onClick={() => saveEdit(l.id)}>
                              Save
                            </button>
                            <button
                              className="admin-refresh-btn admin-action-btn-sm"
                              onClick={() => setEditingLead(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={l.id}>
                        <td>
                          <span className="admin-email-cell">
                            {l.email}
                            <CopyButton text={l.email} label="Copy email" />
                          </span>
                        </td>
                        <td>{l.name || '\u2014'}</td>
                        <td>
                          {l.subject ? (
                            <span
                              className={`admin-status ${l.subject === 'Appointment Request' ? 'admin-status-new' : 'admin-status-contacted'}`}
                            >
                              {l.subject === 'Appointment Request'
                                ? 'Appointment'
                                : l.subject === 'Waitlist Request'
                                  ? 'Waitlist'
                                  : l.subject}
                            </span>
                          ) : (
                            '\u2014'
                          )}
                        </td>
                        <td>
                          {l.phone ? (
                            <a href={`tel:${l.phone}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                              {l.phone}
                            </a>
                          ) : (
                            '\u2014'
                          )}
                        </td>
                        <td
                          style={{
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={l.preferredCallbackTime || ''}
                        >
                          {l.preferredCallbackTime || '\u2014'}
                        </td>
                        <td>
                          <span className={`admin-status admin-status-${l.status.toLowerCase()}`}>{l.status}</span>
                        </td>
                        <td
                          className="admin-notes-cell"
                          title={l.notes || ''}
                          style={{ cursor: l.notes && l.notes.length > 40 ? 'pointer' : undefined }}
                          onClick={() =>
                            l.notes && l.notes.length > 40 && setExpandedNoteId(expandedNoteId === l.id ? null : l.id)
                          }
                        >
                          {l.notes
                            ? expandedNoteId === l.id
                              ? l.notes
                              : l.notes.length > 40
                                ? l.notes.slice(0, 40) + '\u2026'
                                : l.notes
                            : '\u2014'}
                        </td>
                        <td title={fullDate(l.createdAt)}>{relativeTime(l.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-send-btn admin-action-btn-sm" onClick={() => handleSendToLead(l)}>
                              Send Email
                            </button>
                            <button className="admin-refresh-btn admin-action-btn-sm" onClick={() => startEdit(l)}>
                              Edit
                            </button>
                            <button
                              className="admin-refund-confirm admin-action-btn-sm"
                              onClick={() => setDeletingLead(l)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
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

      {/* ── ATTENDANCE SUB-TAB ── */}
      {subTab === 'attendance' && (
        <AdminAttendanceTab sections={sections} enrollments={enrollments} scheduleMap={scheduleMap} />
      )}

      {/* ── PROGRESS SUB-TAB ── */}
      {subTab === 'progress' && (
        <AdminProgressTab sections={sections} enrollments={enrollments} scheduleMap={scheduleMap} />
      )}
    </>
  );
}
