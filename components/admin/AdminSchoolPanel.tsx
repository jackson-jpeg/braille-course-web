'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SchoolInquiry, SchoolInquiryStatus, SchoolActivity } from './admin-types';
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

const ACTIVITY_TYPES = [
  { value: 'SESSION_NOTE', label: 'Session Note' },
  { value: 'PHONE_CALL', label: 'Phone Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'OTHER', label: 'Other' },
];

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  SESSION_NOTE: '#7A9B6D',
  PHONE_CALL: '#3B82F6',
  EMAIL: '#D4A853',
  MEETING: '#F59E0B',
  OTHER: '#6B7280',
};

function formatDateForInput(iso: string | null): string {
  if (!iso) return '';
  return iso.substring(0, 10);
}

export default function AdminSchoolPanel({ inquiry, onClose, onUpdate, onDelete }: Props) {
  const [adminNotes, setAdminNotes] = useState(inquiry.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Contract fields
  const [contractStart, setContractStart] = useState(formatDateForInput(inquiry.contractStartDate));
  const [contractEnd, setContractEnd] = useState(formatDateForInput(inquiry.contractEndDate));
  const [serviceHours, setServiceHours] = useState(inquiry.serviceHours || '');
  const [hourlyRate, setHourlyRate] = useState(inquiry.hourlyRate || '');

  // Activity log
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivityType, setNewActivityType] = useState('SESSION_NOTE');
  const [newActivityDate, setNewActivityDate] = useState(new Date().toISOString().substring(0, 10));
  const [newActivityContent, setNewActivityContent] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  const showContractSection = inquiry.status === 'CONTRACTED' || inquiry.status === 'CLOSED_WON';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!showContractSection) return;
    setLoadingActivities(true);
    try {
      const res = await fetch(
        `/api/admin/school-activities?schoolInquiryId=${inquiry.id}&key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
      );
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
    setLoadingActivities(false);
  }, [inquiry.id, showContractSection]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Sync state when inquiry prop changes
  useEffect(() => {
    setAdminNotes(inquiry.adminNotes || '');
    setContractStart(formatDateForInput(inquiry.contractStartDate));
    setContractEnd(formatDateForInput(inquiry.contractEndDate));
    setServiceHours(inquiry.serviceHours || '');
    setHourlyRate(inquiry.hourlyRate || '');
  }, [inquiry]);

  const handleStatusChange = async (newStatus: SchoolInquiryStatus) => {
    await onUpdate(inquiry.id, { status: newStatus });
  };

  const handleSaveNotes = async () => {
    if (adminNotes === (inquiry.adminNotes || '')) return;
    setIsSavingNotes(true);
    await onUpdate(inquiry.id, { adminNotes: adminNotes || null });
    setIsSavingNotes(false);
  };

  const handleSaveContractField = async (
    field: 'contractStartDate' | 'contractEndDate' | 'serviceHours' | 'hourlyRate',
    value: string,
  ) => {
    const currentMap = {
      contractStartDate: formatDateForInput(inquiry.contractStartDate),
      contractEndDate: formatDateForInput(inquiry.contractEndDate),
      serviceHours: inquiry.serviceHours || '',
      hourlyRate: inquiry.hourlyRate || '',
    };
    if (value === currentMap[field]) return;
    await onUpdate(inquiry.id, { [field]: value || null });
  };

  const handleAddActivity = async () => {
    if (!newActivityContent.trim()) return;
    setSavingActivity(true);
    try {
      const res = await fetch(
        `/api/admin/school-activities?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolInquiryId: inquiry.id,
            date: newActivityDate,
            type: newActivityType,
            content: newActivityContent.trim(),
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setActivities((prev) => [data.activity, ...prev]);
        setNewActivityContent('');
        setNewActivityDate(new Date().toISOString().substring(0, 10));
      }
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
    setSavingActivity(false);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Delete this activity?')) return;
    try {
      const res = await fetch(
        `/api/admin/school-activities?id=${activityId}&key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== activityId));
      }
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Re: TVI Services for ${inquiry.schoolName}`);
    const body = encodeURIComponent(
      `Hi ${inquiry.contactName},\n\nThank you for your interest in TVI services for ${inquiry.schoolName}.\n\n`,
    );
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
            {(inquiry.districtName || inquiry.state) && (
              <p className="admin-school-panel-subtitle">
                {[inquiry.districtName, inquiry.state].filter(Boolean).join(' \u2014 ')}
              </p>
            )}
          </div>
          <div className="admin-school-panel-actions">
            <button className="admin-school-panel-action" onClick={handleEmailContact} title="Email contact">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M1.5 5l6.5 4 6.5-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="admin-school-panel-close" onClick={onClose} title="Close">
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
                <span> &middot; Updated {relativeTime(inquiry.updatedAt)}</span>
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

          {/* Contract Details — visible for CONTRACTED or CLOSED_WON */}
          {showContractSection && (
            <div className="admin-school-panel-section">
              <h3 className="admin-school-panel-section-title">Contract Details</h3>
              <div className="admin-school-panel-grid">
                <div className="admin-school-panel-field">
                  <label htmlFor="contract-start">Contract Start</label>
                  <input
                    type="date"
                    id="contract-start"
                    className="admin-school-panel-input"
                    value={contractStart}
                    onChange={(e) => setContractStart(e.target.value)}
                    onBlur={() => handleSaveContractField('contractStartDate', contractStart)}
                  />
                </div>
                <div className="admin-school-panel-field">
                  <label htmlFor="contract-end">Contract End</label>
                  <input
                    type="date"
                    id="contract-end"
                    className="admin-school-panel-input"
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                    onBlur={() => handleSaveContractField('contractEndDate', contractEnd)}
                  />
                </div>
                <div className="admin-school-panel-field">
                  <label htmlFor="service-hours">Service Hours</label>
                  <input
                    type="text"
                    id="service-hours"
                    className="admin-school-panel-input"
                    placeholder="e.g., 10 hours/week"
                    value={serviceHours}
                    onChange={(e) => setServiceHours(e.target.value)}
                    onBlur={() => handleSaveContractField('serviceHours', serviceHours)}
                  />
                </div>
                <div className="admin-school-panel-field">
                  <label htmlFor="hourly-rate">Hourly Rate</label>
                  <input
                    type="text"
                    id="hourly-rate"
                    className="admin-school-panel-input"
                    placeholder="e.g., $75/hour"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    onBlur={() => handleSaveContractField('hourlyRate', hourlyRate)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity Log — visible for CONTRACTED or CLOSED_WON */}
          {showContractSection && (
            <div className="admin-school-panel-section">
              <h3 className="admin-school-panel-section-title">Activity Log</h3>

              {/* Add Activity Form */}
              <div className="admin-activity-form">
                <div className="admin-activity-form-row">
                  <select
                    className="admin-activity-form-select"
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value)}
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="admin-activity-form-date"
                    value={newActivityDate}
                    onChange={(e) => setNewActivityDate(e.target.value)}
                  />
                </div>
                <textarea
                  className="admin-activity-form-textarea"
                  placeholder="Add a note about this interaction..."
                  value={newActivityContent}
                  onChange={(e) => setNewActivityContent(e.target.value)}
                  rows={3}
                />
                <button
                  className="admin-activity-form-submit"
                  onClick={handleAddActivity}
                  disabled={savingActivity || !newActivityContent.trim()}
                >
                  {savingActivity ? 'Saving...' : 'Add Activity'}
                </button>
              </div>

              {/* Activity Timeline */}
              {loadingActivities ? (
                <p className="admin-activity-loading">Loading activities...</p>
              ) : activities.length === 0 ? (
                <p className="admin-activity-empty">No activities recorded yet.</p>
              ) : (
                <div className="admin-activity-timeline">
                  {activities.map((activity) => {
                    const typeLabel = ACTIVITY_TYPES.find((t) => t.value === activity.type)?.label || activity.type;
                    const typeColor = ACTIVITY_TYPE_COLORS[activity.type] || '#6B7280';
                    return (
                      <div key={activity.id} className="admin-activity-item">
                        <div className="admin-activity-item-dot" style={{ background: typeColor }} />
                        <div className="admin-activity-item-content">
                          <div className="admin-activity-item-header">
                            <span
                              className="admin-activity-type-badge"
                              style={{ background: `${typeColor}18`, color: typeColor }}
                            >
                              {typeLabel}
                            </span>
                            <span className="admin-activity-item-date">
                              {new Date(activity.date).toLocaleDateString()}
                            </span>
                            <button
                              className="admin-activity-delete"
                              onClick={() => handleDeleteActivity(activity.id)}
                              title="Delete activity"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                              </svg>
                            </button>
                          </div>
                          <p className="admin-activity-item-text">{activity.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
            {isSavingNotes && <div className="admin-school-panel-saving">Saving...</div>}
          </div>

          {/* Danger Zone */}
          <div className="admin-school-panel-section admin-school-panel-danger">
            <h3 className="admin-school-panel-section-title">Danger Zone</h3>
            <button className="admin-school-panel-delete" onClick={() => onDelete(inquiry.id)}>
              Delete Inquiry
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
