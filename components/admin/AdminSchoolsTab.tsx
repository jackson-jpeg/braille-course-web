'use client';

import { useState, useMemo } from 'react';
import AdminSchoolPanel from './AdminSchoolPanel';
import AdminAddSchoolModal from './AdminAddSchoolModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import type { SchoolInquiry, SchoolInquiryStatus } from './admin-types';
import { relativeTime } from './admin-utils';

interface Props {
  schoolInquiries: SchoolInquiry[];
  onSync: () => void;
  onNavigate: (tab: string) => void;
}

type SchoolSubTab = 'pipeline' | 'contracts';

const STATUS_CONFIG: Record<SchoolInquiryStatus, { label: string; color: string; dotClass: string }> = {
  NEW_INQUIRY: { label: 'New Inquiry', color: '#3B82F6', dotClass: 'admin-kanban-dot-blue' },
  CONTACTED: { label: 'Contacted', color: '#D4A853', dotClass: 'admin-kanban-dot-gold' },
  PROPOSAL_SENT: { label: 'Proposal Sent', color: '#7A9B6D', dotClass: 'admin-kanban-dot-sage' },
  NEGOTIATING: { label: 'Negotiating', color: '#F59E0B', dotClass: 'admin-kanban-dot-orange' },
  CONTRACTED: { label: 'Contracted', color: '#10B981', dotClass: 'admin-kanban-dot-green' },
  ON_HOLD: { label: 'On Hold', color: '#6B7280', dotClass: 'admin-kanban-dot-gray' },
  CLOSED_WON: { label: 'Closed Won', color: '#10B981', dotClass: 'admin-kanban-dot-green' },
  CLOSED_LOST: { label: 'Closed Lost', color: '#EF4444', dotClass: 'admin-kanban-dot-red' },
};

const PIPELINE_STATUSES: SchoolInquiryStatus[] = ['NEW_INQUIRY', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING'];

const ARCHIVED_STATUSES: SchoolInquiryStatus[] = ['ON_HOLD', 'CLOSED_WON', 'CLOSED_LOST'];

export default function AdminSchoolsTab({ schoolInquiries, onSync, onNavigate: _onNavigate }: Props) {
  const [inquiries, setInquiries] = useState<SchoolInquiry[]>(schoolInquiries);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInquiry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<SchoolInquiryStatus | null>(null);
  const [schoolSubTab, setSchoolSubTab] = useState<SchoolSubTab>('pipeline');
  const [showArchived, setShowArchived] = useState(false);
  const [contractSearch, setContractSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter inquiries by search query
  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) return inquiries;
    const q = searchQuery.toLowerCase();
    return inquiries.filter(
      (i) =>
        i.schoolName.toLowerCase().includes(q) ||
        i.districtName?.toLowerCase().includes(q) ||
        i.contactName.toLowerCase().includes(q) ||
        i.contactEmail.toLowerCase().includes(q),
    );
  }, [inquiries, searchQuery]);

  // Group by status
  const grouped = useMemo(() => {
    const result: Record<SchoolInquiryStatus, SchoolInquiry[]> = {
      NEW_INQUIRY: [],
      CONTACTED: [],
      PROPOSAL_SENT: [],
      NEGOTIATING: [],
      CONTRACTED: [],
      ON_HOLD: [],
      CLOSED_WON: [],
      CLOSED_LOST: [],
    };
    filteredInquiries.forEach((i) => {
      result[i.status].push(i);
    });
    Object.keys(result).forEach((key) => {
      result[key as SchoolInquiryStatus].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });
    return result;
  }, [filteredInquiries]);

  // Archived count
  const archivedCount = useMemo(() => ARCHIVED_STATUSES.reduce((sum, s) => sum + grouped[s].length, 0), [grouped]);

  // Contracted schools (for Active Contracts table)
  const contractedSchools = useMemo(() => {
    let schools = inquiries.filter((i) => i.status === 'CONTRACTED');
    if (contractSearch.trim()) {
      const q = contractSearch.toLowerCase();
      schools = schools.filter(
        (i) =>
          i.schoolName.toLowerCase().includes(q) ||
          i.districtName?.toLowerCase().includes(q) ||
          i.contactName.toLowerCase().includes(q),
      );
    }
    // Sort
    schools.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortColumn) {
        case 'schoolName':
          aVal = a.schoolName.toLowerCase();
          bVal = b.schoolName.toLowerCase();
          break;
        case 'districtName':
          aVal = (a.districtName || '').toLowerCase();
          bVal = (b.districtName || '').toLowerCase();
          break;
        case 'contactName':
          aVal = a.contactName.toLowerCase();
          bVal = b.contactName.toLowerCase();
          break;
        case 'state':
          aVal = (a.state || '').toLowerCase();
          bVal = (b.state || '').toLowerCase();
          break;
        case 'contractStartDate':
          aVal = a.contractStartDate || '';
          bVal = b.contractStartDate || '';
          break;
        case 'contractEndDate':
          aVal = a.contractEndDate || '';
          bVal = b.contractEndDate || '';
          break;
        case 'updatedAt':
        default:
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return schools;
  }, [inquiries, contractSearch, sortColumn, sortDir]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: SchoolInquiryStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: SchoolInquiryStatus) => {
    e.preventDefault();
    if (!draggedId) return;

    const inquiry = inquiries.find((i) => i.id === draggedId);
    if (!inquiry || inquiry.status === newStatus) {
      setDraggedId(null);
      setDragOverColumn(null);
      return;
    }

    // Optimistic update
    const updated = inquiries.map((i) => (i.id === draggedId ? { ...i, status: newStatus } : i));
    setInquiries(updated);
    setDraggedId(null);
    setDragOverColumn(null);

    if (selectedSchool?.id === draggedId) {
      setSelectedSchool({ ...selectedSchool, status: newStatus });
    }

    // Persist to server
    try {
      const res = await fetch(
        `/api/admin/school-inquiries/${draggedId}?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const data = await res.json();
      setInquiries((prev) => prev.map((i) => (i.id === draggedId ? data.inquiry : i)));
      if (selectedSchool?.id === draggedId) {
        setSelectedSchool(data.inquiry);
      }
    } catch (err) {
      console.error('Failed to update school inquiry status:', err);
      setInquiries(inquiries);
      if (selectedSchool?.id === draggedId) {
        setSelectedSchool(inquiry);
      }
    }
  };

  const handleUpdateInquiry = async (id: string, updates: Partial<SchoolInquiry>) => {
    const prev = inquiries;
    const updated = inquiries.map((i) => (i.id === id ? { ...i, ...updates } : i));
    setInquiries(updated);
    if (selectedSchool?.id === id) {
      setSelectedSchool({ ...selectedSchool, ...updates });
    }

    try {
      const res = await fetch(
        `/api/admin/school-inquiries/${id}?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to update inquiry');
      }

      const data = await res.json();
      setInquiries((p) => p.map((i) => (i.id === id ? data.inquiry : i)));
      if (selectedSchool?.id === id) {
        setSelectedSchool(data.inquiry);
      }

      // Toast when moved to CONTRACTED
      if (updates.status === 'CONTRACTED') {
        setSchoolSubTab('contracts');
      }
    } catch (err) {
      console.error('Failed to update school inquiry:', err);
      const original = prev.find((i) => i.id === id);
      if (original) {
        setInquiries((p) => p.map((i) => (i.id === id ? original : i)));
        if (selectedSchool?.id === id) {
          setSelectedSchool(original);
        }
      }
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    setDeletingSchoolId(id);
  };

  const confirmDeleteInquiry = async () => {
    if (!deletingSchoolId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/school-inquiries/${deletingSchoolId}?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
        {
          method: 'DELETE',
        },
      );

      if (!res.ok) {
        throw new Error('Failed to delete inquiry');
      }

      setInquiries((prev) => prev.filter((i) => i.id !== deletingSchoolId));
      if (selectedSchool?.id === deletingSchoolId) {
        setSelectedSchool(null);
      }
    } catch (err) {
      console.error('Failed to delete school inquiry:', err);
    } finally {
      setDeleteLoading(false);
      setDeletingSchoolId(null);
    }
  };

  const sortIndicator = (col: string) => {
    if (sortColumn !== col) return null;
    return <span className="admin-contracts-sort-arrow">{sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>;
  };

  return (
    <>
      <div className="admin-schools-header">
        <div>
          <h2 className="admin-section-heading">Schools</h2>
          <p className="admin-section-subtext">Manage school and district partnerships</p>
        </div>
        <div className="admin-schools-actions">
          <button className="admin-add-school-btn" onClick={() => setShowAddModal(true)}>
            + Add School
          </button>
          <button className="admin-schools-sync" onClick={onSync} title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 10c0-4.97-4.03-9-9-9s-9 4.03-9 9h2c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l2.44-2.44H3v6.5l2.09-2.09C6.53 19.35 9.12 20.5 12 20.5c4.97 0 9-4.03 9-9z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="admin-email-subtabs">
        <button
          className={`admin-email-subtab ${schoolSubTab === 'pipeline' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setSchoolSubTab('pipeline')}
        >
          Pipeline
        </button>
        <button
          className={`admin-email-subtab ${schoolSubTab === 'contracts' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setSchoolSubTab('contracts')}
        >
          Active Contracts ({contractedSchools.length})
        </button>
      </div>

      {schoolSubTab === 'pipeline' && (
        <>
          {/* Search */}
          <div className="admin-pipeline-search">
            <input
              type="text"
              className="admin-schools-search"
              placeholder="Search schools, districts, contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Kanban Board */}
          <div className="admin-schools-kanban">
            {PIPELINE_STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              const cards = grouped[status];
              const isOver = dragOverColumn === status;

              return (
                <div
                  key={status}
                  className={`admin-kanban-column ${isOver ? 'admin-kanban-column-dragover' : ''}`}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="admin-kanban-header">
                    <div className="admin-kanban-title">
                      <span className={`admin-kanban-dot ${config.dotClass}`} />
                      {config.label}
                    </div>
                    <span className="admin-kanban-count">{cards.length}</span>
                  </div>

                  <div className="admin-kanban-cards">
                    {cards.length === 0 && (
                      <div className="admin-kanban-empty">No schools in this stage</div>
                    )}
                    {cards.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className={`admin-school-card ${draggedId === inquiry.id ? 'admin-school-card-dragging' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(inquiry.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedSchool(inquiry)}
                      >
                        <div className="admin-school-card-header">
                          <h3 className="admin-school-name">{inquiry.schoolName}</h3>
                          {inquiry.status === 'NEW_INQUIRY' && <span className="admin-school-badge-new">New</span>}
                        </div>
                        {(inquiry.districtName || inquiry.state) && (
                          <p className="admin-school-district">
                            {[inquiry.districtName, inquiry.state].filter(Boolean).join(' \u2014 ')}
                          </p>
                        )}
                        <div className="admin-school-contact">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                            <path
                              d="M2 14c0-3.5 2.7-6 6-6s6 2.5 6 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span>
                            {inquiry.contactName}
                            {inquiry.contactTitle && ` \u00B7 ${inquiry.contactTitle}`}
                          </span>
                        </div>
                        {inquiry.studentCount && (
                          <div className="admin-school-meta">
                            <span className="admin-school-meta-item">{inquiry.studentCount} students</span>
                          </div>
                        )}
                        <p className="admin-school-services">
                          {inquiry.servicesNeeded.length > 100
                            ? inquiry.servicesNeeded.substring(0, 100) + '...'
                            : inquiry.servicesNeeded}
                        </p>
                        <div className="admin-school-card-footer">
                          <span className="admin-school-date">{relativeTime(inquiry.createdAt)}</span>
                          <div className="admin-school-quick-actions">
                            <button
                              className="admin-school-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${inquiry.contactEmail}`;
                              }}
                              title="Email contact"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect
                                  x="1.5"
                                  y="3"
                                  width="13"
                                  height="10"
                                  rx="1.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                                <path
                                  d="M1.5 5l6.5 4 6.5-4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              className="admin-school-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSchool(inquiry);
                              }}
                              title="View details"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M8 3c3.5 0 6.5 3.5 7 5-0.5 1.5-3.5 5-7 5s-6.5-3.5-7-5c0.5-1.5 3.5-5 7-5z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Archived Section */}
          {archivedCount > 0 && (
            <div className="admin-archived-section">
              <button className="admin-archived-toggle" onClick={() => setShowArchived(!showArchived)}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={showArchived ? 'admin-archived-chevron-open' : ''}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Archived &amp; On Hold
                <span className="admin-archived-count">{archivedCount}</span>
              </button>

              {showArchived && (
                <div className="admin-archived-content">
                  {ARCHIVED_STATUSES.map((status) => {
                    const items = grouped[status];
                    if (items.length === 0) return null;
                    const config = STATUS_CONFIG[status];
                    return (
                      <div key={status} className="admin-archived-group">
                        <div className="admin-archived-group-header">
                          <span className={`admin-kanban-dot ${config.dotClass}`} />
                          <span>{config.label}</span>
                          <span className="admin-archived-group-count">{items.length}</span>
                        </div>
                        {items.map((inquiry) => (
                          <div
                            key={inquiry.id}
                            className="admin-archived-row"
                            onClick={() => setSelectedSchool(inquiry)}
                          >
                            <span className="admin-archived-row-school">{inquiry.schoolName}</span>
                            {(inquiry.districtName || inquiry.state) && (
                              <span className="admin-archived-row-district">
                                {[inquiry.districtName, inquiry.state].filter(Boolean).join(' \u2014 ')}
                              </span>
                            )}
                            <span className="admin-archived-row-contact">{inquiry.contactName}</span>
                            <span className="admin-archived-row-date">{relativeTime(inquiry.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {schoolSubTab === 'contracts' && (
        <>
          <div className="admin-contracts-actions">
            <input
              type="text"
              className="admin-schools-search"
              placeholder="Search contracted schools..."
              value={contractSearch}
              onChange={(e) => setContractSearch(e.target.value)}
            />
          </div>

          {contractedSchools.length === 0 ? (
            <div className="admin-contracts-empty">
              <p>No active contracts yet.</p>
              <p className="admin-contracts-empty-hint">
                Move a school to &ldquo;Contracted&rdquo; status in the Pipeline to see it here.
              </p>
            </div>
          ) : (
            <div className="admin-contracts-table-wrap">
              <table className="admin-contracts-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('schoolName')}>School Name{sortIndicator('schoolName')}</th>
                    <th onClick={() => handleSort('districtName')}>District{sortIndicator('districtName')}</th>
                    <th onClick={() => handleSort('contactName')}>Contact{sortIndicator('contactName')}</th>
                    <th onClick={() => handleSort('state')}>State{sortIndicator('state')}</th>
                    <th>Students</th>
                    <th onClick={() => handleSort('contractStartDate')}>Start{sortIndicator('contractStartDate')}</th>
                    <th onClick={() => handleSort('contractEndDate')}>End{sortIndicator('contractEndDate')}</th>
                    <th>Hours</th>
                    <th onClick={() => handleSort('updatedAt')}>Updated{sortIndicator('updatedAt')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contractedSchools.map((inquiry) => (
                    <tr key={inquiry.id} className="admin-contracts-row" onClick={() => setSelectedSchool(inquiry)}>
                      <td className="admin-contracts-cell-school">{inquiry.schoolName}</td>
                      <td>{inquiry.districtName || '\u2014'}</td>
                      <td>{inquiry.contactName}</td>
                      <td>{inquiry.state || '\u2014'}</td>
                      <td>{inquiry.studentCount || '\u2014'}</td>
                      <td>
                        {inquiry.contractStartDate
                          ? new Date(inquiry.contractStartDate).toLocaleDateString()
                          : '\u2014'}
                      </td>
                      <td>
                        {inquiry.contractEndDate ? new Date(inquiry.contractEndDate).toLocaleDateString() : '\u2014'}
                      </td>
                      <td>{inquiry.serviceHours || '\u2014'}</td>
                      <td className="admin-contracts-cell-date">{relativeTime(inquiry.updatedAt)}</td>
                      <td>
                        <button
                          className="admin-school-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${inquiry.contactEmail}`;
                          }}
                          title="Email contact"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect
                              x="1.5"
                              y="3"
                              width="13"
                              height="10"
                              rx="1.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M1.5 5l6.5 4 6.5-4"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detail Panel */}
      {selectedSchool && (
        <AdminSchoolPanel
          inquiry={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onUpdate={handleUpdateInquiry}
          onDelete={handleDeleteInquiry}
        />
      )}

      {/* Add School Modal */}
      {showAddModal && (
        <AdminAddSchoolModal
          onClose={() => setShowAddModal(false)}
          onAdded={(inquiry) => setInquiries((prev) => [inquiry, ...prev])}
        />
      )}

      {/* Delete Confirmation */}
      {deletingSchoolId && (
        <AdminConfirmDialog
          title="Delete School Inquiry"
          message="Are you sure you want to delete this school inquiry? This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onConfirm={confirmDeleteInquiry}
          onCancel={() => setDeletingSchoolId(null)}
        />
      )}
    </>
  );
}
