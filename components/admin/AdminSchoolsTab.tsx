'use client';

import { useState, useMemo } from 'react';
import AdminSchoolPanel from './AdminSchoolPanel';
import type { SchoolInquiry, SchoolInquiryStatus } from './admin-types';
import { relativeTime } from './admin-utils';

interface Props {
  schoolInquiries: SchoolInquiry[];
  onSync: () => void;
  onNavigate: (tab: string) => void;
}

const STATUS_CONFIG: Record<
  SchoolInquiryStatus,
  { label: string; color: string; dotClass: string }
> = {
  NEW_INQUIRY: { label: 'New Inquiry', color: '#3B82F6', dotClass: 'admin-kanban-dot-blue' },
  CONTACTED: { label: 'Contacted', color: '#D4A853', dotClass: 'admin-kanban-dot-gold' },
  PROPOSAL_SENT: { label: 'Proposal Sent', color: '#7A9B6D', dotClass: 'admin-kanban-dot-sage' },
  NEGOTIATING: { label: 'Negotiating', color: '#F59E0B', dotClass: 'admin-kanban-dot-orange' },
  CONTRACTED: { label: 'Contracted', color: '#10B981', dotClass: 'admin-kanban-dot-green' },
  ON_HOLD: { label: 'On Hold', color: '#6B7280', dotClass: 'admin-kanban-dot-gray' },
  CLOSED_WON: { label: 'Closed Won', color: '#10B981', dotClass: 'admin-kanban-dot-green' },
  CLOSED_LOST: { label: 'Closed Lost', color: '#EF4444', dotClass: 'admin-kanban-dot-red' },
};

const VISIBLE_STATUSES: SchoolInquiryStatus[] = [
  'NEW_INQUIRY',
  'CONTACTED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CONTRACTED',
];

export default function AdminSchoolsTab({ schoolInquiries, onSync, onNavigate }: Props) {
  const [inquiries, setInquiries] = useState<SchoolInquiry[]>(schoolInquiries);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInquiry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<SchoolInquiryStatus | null>(null);

  // Filter inquiries by search query
  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) return inquiries;
    const q = searchQuery.toLowerCase();
    return inquiries.filter(
      (i) =>
        i.schoolName.toLowerCase().includes(q) ||
        i.districtName?.toLowerCase().includes(q) ||
        i.contactName.toLowerCase().includes(q) ||
        i.contactEmail.toLowerCase().includes(q)
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
    // Sort each column by createdAt desc
    Object.keys(result).forEach((key) => {
      result[key as SchoolInquiryStatus].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return result;
  }, [filteredInquiries]);

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
    const updated = inquiries.map((i) =>
      i.id === draggedId ? { ...i, status: newStatus } : i
    );
    setInquiries(updated);
    setDraggedId(null);
    setDragOverColumn(null);

    // Update selected school if it's the one being dragged
    if (selectedSchool?.id === draggedId) {
      setSelectedSchool({ ...selectedSchool, status: newStatus });
    }

    // Persist to server
    try {
      const res = await fetch(`/api/admin/school-inquiries/${draggedId}?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const data = await res.json();
      // Update with server response
      setInquiries((prev) =>
        prev.map((i) => (i.id === draggedId ? data.inquiry : i))
      );
      if (selectedSchool?.id === draggedId) {
        setSelectedSchool(data.inquiry);
      }
    } catch (err) {
      console.error('Failed to update school inquiry status:', err);
      // Revert on error
      setInquiries(inquiries);
      if (selectedSchool?.id === draggedId) {
        setSelectedSchool(inquiry);
      }
    }
  };

  const handleUpdateInquiry = async (id: string, updates: Partial<SchoolInquiry>) => {
    // Optimistic update
    const updated = inquiries.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    setInquiries(updated);
    if (selectedSchool?.id === id) {
      setSelectedSchool({ ...selectedSchool, ...updates });
    }

    // Persist to server
    try {
      const res = await fetch(`/api/admin/school-inquiries/${id}?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update inquiry');
      }

      const data = await res.json();
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? data.inquiry : i))
      );
      if (selectedSchool?.id === id) {
        setSelectedSchool(data.inquiry);
      }
    } catch (err) {
      console.error('Failed to update school inquiry:', err);
      // Revert on error
      const original = inquiries.find((i) => i.id === id);
      if (original) {
        setInquiries((prev) =>
          prev.map((i) => (i.id === id ? original : i))
        );
        if (selectedSchool?.id === id) {
          setSelectedSchool(original);
        }
      }
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this school inquiry?')) return;

    try {
      const res = await fetch(`/api/admin/school-inquiries/${id}?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete inquiry');
      }

      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (selectedSchool?.id === id) {
        setSelectedSchool(null);
      }
    } catch (err) {
      console.error('Failed to delete school inquiry:', err);
      alert('Failed to delete inquiry. Please try again.');
    }
  };

  return (
    <>
      <div className="admin-schools-header">
        <div>
          <h2 className="admin-section-heading">School Inquiries</h2>
          <p className="admin-section-subtext">
            Manage school and district partnerships through the sales pipeline
          </p>
        </div>
        <div className="admin-schools-actions">
          <input
            type="text"
            className="admin-schools-search"
            placeholder="Search schools, districts, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

      {/* Kanban Board */}
      <div className="admin-schools-kanban">
        {VISIBLE_STATUSES.map((status) => {
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
                      {inquiry.status === 'NEW_INQUIRY' && (
                        <span className="admin-school-badge-new">New</span>
                      )}
                    </div>
                    {inquiry.districtName && (
                      <p className="admin-school-district">{inquiry.districtName}</p>
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
                        {inquiry.contactTitle && ` · ${inquiry.contactTitle}`}
                      </span>
                    </div>
                    {inquiry.studentCount && (
                      <div className="admin-school-meta">
                        <span className="admin-school-meta-item">
                          👥 {inquiry.studentCount} students
                        </span>
                      </div>
                    )}
                    <p className="admin-school-services">
                      {inquiry.servicesNeeded.length > 100
                        ? inquiry.servicesNeeded.substring(0, 100) + '...'
                        : inquiry.servicesNeeded}
                    </p>
                    <div className="admin-school-card-footer">
                      <span className="admin-school-date">
                        {relativeTime(inquiry.createdAt)}
                      </span>
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
                            <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M1.5 5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                            <path d="M8 3c3.5 0 6.5 3.5 7 5-0.5 1.5-3.5 5-7 5s-6.5-3.5-7-5c0.5-1.5 3.5-5 7-5z" stroke="currentColor" strokeWidth="1.5" />
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

      {/* Detail Panel */}
      {selectedSchool && (
        <AdminSchoolPanel
          inquiry={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onUpdate={handleUpdateInquiry}
          onDelete={handleDeleteInquiry}
        />
      )}
    </>
  );
}
