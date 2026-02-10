'use client';

import { useState } from 'react';
import type { SchoolInquiry, SchoolInquiryStatus } from './admin-types';
import { relativeTime } from './admin-utils';

interface Props {
  inquiry: SchoolInquiry;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<SchoolInquiry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_OPTIONS: { value: SchoolInquiryStatus; label: string }[] = [
  { value: 'NEW_INQUIRY', label: 'New Inquiry' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'CONTRACTED', label: 'Contracted' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
];

export default function AdminSchoolPanel({ inquiry, onClose, onUpdate, onDelete }: Props) {
  const [adminNotes, setAdminNotes] = useState(inquiry.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleStatusChange = async (newStatus: SchoolInquiryStatus) => {
    await onUpdate(inquiry.id, { status: newStatus });
  };

  const handleSaveNotes = async () => {
    if (adminNotes === (inquiry.adminNotes || '')) return;
    setIsSavingNotes(true);
    await onUpdate(inquiry.id, { adminNotes: adminNotes || null });
    setIsSavingNotes(false);
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Re: TVI Services for ${inquiry.schoolName}`);
    const body = encodeURIComponent(`Hi ${inquiry.contactName},\n\nThank you for your interest in TVI services for ${inquiry.schoolName}.\n\n`);
    window.location.href = `mailto:${inquiry.contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="admin-school-panel-overlay" onClick={onClose} />
      <div className="admin-school-panel">
        {/* Header */}
        <div className="admin-school-panel-header">
          <div>
            <h2 className="admin-school-panel-title">{inquiry.schoolName}</h2>
            {inquiry.districtName && (
              <p className="admin-school-panel-subtitle">{inquiry.districtName}</p>
            )}
          </div>
          <div className="admin-school-panel-actions">
            <button
              className="admin-school-panel-action"
              onClick={handleEmailContact}
              title="Email contact"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M1.5 5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="admin-school-panel-close"
              onClick={onClose}
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="admin-school-panel-content">
          {/* Status & Timeline */}
          <div className="admin-school-panel-section">
            <h3 className="admin-school-panel-section-title">Status</h3>
            <select
              className="admin-school-panel-status-select"
              value={inquiry.status}
              onChange={(e) => handleStatusChange(e.target.value as SchoolInquiryStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="admin-school-panel-meta">
              <span>Created {relativeTime(inquiry.createdAt)}</span>
              {inquiry.updatedAt !== inquiry.createdAt && (
                <span> · Updated {relativeTime(inquiry.updatedAt)}</span>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="admin-school-panel-section">
            <h3 className="admin-school-panel-section-title">Contact Information</h3>
            <div className="admin-school-panel-grid">
              <div className="admin-school-panel-field">
                <label>Name</label>
                <div>{inquiry.contactName}</div>
              </div>
              {inquiry.contactTitle && (
                <div className="admin-school-panel-field">
                  <label>Title</label>
                  <div>{inquiry.contactTitle}</div>
                </div>
              )}
              <div className="admin-school-panel-field">
                <label>Email</label>
                <a href={`mailto:${inquiry.contactEmail}`} className="admin-school-panel-link">
                  {inquiry.contactEmail}
                </a>
              </div>
              {inquiry.contactPhone && (
                <div className="admin-school-panel-field">
                  <label>Phone</label>
                  <a href={`tel:${inquiry.contactPhone}`} className="admin-school-panel-link">
                    {inquiry.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Opportunity Details */}
          <div className="admin-school-panel-section">
            <h3 className="admin-school-panel-section-title">Opportunity Details</h3>
            <div className="admin-school-panel-grid">
              {inquiry.studentCount && (
                <div className="admin-school-panel-field">
                  <label>Student Count</label>
                  <div>{inquiry.studentCount}</div>
                </div>
              )}
              {inquiry.deliveryPreference && (
                <div className="admin-school-panel-field">
                  <label>Delivery Preference</label>
                  <div>{inquiry.deliveryPreference}</div>
                </div>
              )}
              {inquiry.timeline && (
                <div className="admin-school-panel-field admin-school-panel-field-full">
                  <label>Timeline</label>
                  <div>{inquiry.timeline}</div>
                </div>
              )}
            </div>
          </div>

          {/* Services Needed */}
          <div className="admin-school-panel-section">
            <h3 className="admin-school-panel-section-title">Services Needed</h3>
            <div className="admin-school-panel-services">{inquiry.servicesNeeded}</div>
          </div>

          {/* Admin Notes */}
          <div className="admin-school-panel-section">
            <h3 className="admin-school-panel-section-title">Admin Notes (Private)</h3>
            <textarea
              className="admin-school-panel-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add private notes about this inquiry..."
              rows={5}
            />
            {isSavingNotes && (
              <div className="admin-school-panel-saving">Saving...</div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="admin-school-panel-section admin-school-panel-danger">
            <h3 className="admin-school-panel-section-title">Danger Zone</h3>
            <button
              className="admin-school-panel-delete"
              onClick={() => onDelete(inquiry.id)}
            >
              Delete Inquiry
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
