'use client';

import { useState, useEffect } from 'react';
import { useToast } from './AdminToast';
import type { SchoolInquiry } from './admin-types';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'Other',
];

interface Props {
  onClose: () => void;
  onAdded: (inquiry: SchoolInquiry) => void;
}

export default function AdminAddSchoolModal({ onClose, onAdded }: Props) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [state, setState] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [servicesNeeded, setServicesNeeded] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!schoolName.trim() || !contactName.trim() || !contactEmail.trim() || !servicesNeeded.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/admin/school-inquiries?key=${encodeURIComponent(localStorage.getItem('adminKey') || '')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolName: schoolName.trim(),
            districtName: districtName.trim() || undefined,
            state: state || undefined,
            contactName: contactName.trim(),
            contactEmail: contactEmail.trim(),
            contactPhone: contactPhone.trim() || undefined,
            contactTitle: contactTitle.trim() || undefined,
            servicesNeeded: servicesNeeded.trim(),
            studentCount: studentCount || undefined,
            timeline: timeline.trim() || undefined,
            deliveryPreference: deliveryPreference || undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError('A school inquiry with this email already exists.');
        } else {
          setError(data.error || 'Failed to add school.');
        }
        setSubmitting(false);
        return;
      }

      onAdded(data.inquiry);
      showToast(`${schoolName.trim()} added to pipeline`);
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add school">
      <div className="admin-modal admin-add-school-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>
          &times;
        </button>

        <h3 className="admin-modal-title">Add School</h3>

        {error && <div className="admin-add-school-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-add-school-form">
          {/* School Info */}
          <div className="admin-add-school-section">
            <h4 className="admin-add-school-section-title">School Info</h4>
            <div className="admin-add-school-grid">
              <div className="admin-add-school-field">
                <label>School Name *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., Lincoln Elementary"
                  required
                />
              </div>
              <div className="admin-add-school-field">
                <label>District Name</label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="e.g., Springfield School District"
                />
              </div>
              <div className="admin-add-school-field">
                <label>State</label>
                <select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Select state...</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="admin-add-school-section">
            <h4 className="admin-add-school-section-title">Contact Info</h4>
            <div className="admin-add-school-grid">
              <div className="admin-add-school-field">
                <label>Contact Name *</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="admin-add-school-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@school.edu"
                  required
                />
              </div>
              <div className="admin-add-school-field">
                <label>Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="admin-add-school-field">
                <label>Title / Role</label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  placeholder="e.g., Special Ed Director"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="admin-add-school-section">
            <h4 className="admin-add-school-section-title">Service Details</h4>
            <div className="admin-add-school-grid">
              <div className="admin-add-school-field admin-add-school-field-full">
                <label>Services Needed *</label>
                <textarea
                  value={servicesNeeded}
                  onChange={(e) => setServicesNeeded(e.target.value)}
                  placeholder="e.g., Braille instruction (UEB), assistive technology training..."
                  rows={3}
                  required
                />
              </div>
              <div className="admin-add-school-field">
                <label>Number of Students</label>
                <select value={studentCount} onChange={(e) => setStudentCount(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="1">1</option>
                  <option value="2-3">2-3</option>
                  <option value="4-5">4-5</option>
                  <option value="6-10">6-10</option>
                  <option value="11+">11+</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
              <div className="admin-add-school-field">
                <label>Timeline</label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g., ASAP, Fall 2026"
                />
              </div>
              <div className="admin-add-school-field">
                <label>Delivery Preference</label>
                <select value={deliveryPreference} onChange={(e) => setDeliveryPreference(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Remote">Remote</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
            </div>
          </div>

          <div className="admin-add-school-actions">
            <button type="button" className="admin-add-school-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-add-school-submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
