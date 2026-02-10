'use client';

import { useState } from 'react';

const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
  'Other',
];

const SERVICE_OPTIONS = [
  'Braille Instruction (UEB)',
  'Screen Reader Training',
  'Assistive Technology',
  'Expanded Core Curriculum (ECC)',
  'Team Collaboration / IEP Meetings',
  'Other',
];

const DELIVERY_OPTIONS = [
  {
    value: 'Remote',
    label: 'Remote',
    subtitle: 'Via video call — nationwide',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: 'In-Person',
    label: 'In-Person',
    subtitle: 'On-site at your school',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    value: 'Hybrid',
    label: 'Hybrid',
    subtitle: 'Combination of both',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    value: 'Not sure',
    label: 'Not Sure',
    subtitle: "Let's discuss options",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function SchoolContactForm() {
  const [schoolName, setSchoolName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [state, setState] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState('');
  const [timeline, setTimeline] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (service: string) => {
    setSelectedServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (honeypot) {
      setError('Invalid submission');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one service.');
      return;
    }

    if (selectedServices.length === 1 && selectedServices[0] === 'Other' && additionalDetails.trim().length < 10) {
      setError('Please describe the services you need (at least 10 characters) when selecting "Other".');
      return;
    }

    setLoading(true);

    // Compose servicesNeeded string from checkboxes + details
    let servicesNeeded = selectedServices.join(', ');
    if (additionalDetails.trim()) {
      servicesNeeded += `\n\nAdditional details: ${additionalDetails.trim()}`;
    }

    try {
      const res = await fetch('/api/school-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          districtName: districtName.trim() || undefined,
          state: state || undefined,
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          contactTitle: contactTitle.trim(),
          servicesNeeded,
          studentCount: studentCount || undefined,
          deliveryPreference: deliveryPreference || undefined,
          timeline: timeline.trim() || undefined,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="school-contact-success">
        <div className="school-contact-success-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="3" />
            <path
              d="M20 32L28 40L44 24"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="school-contact-success-title">Inquiry Received!</h3>
        <p className="school-contact-success-message">
          Thank you for your interest in TVI services for {schoolName}. Delaney will reach out within 2 business days to
          discuss your vision service needs and schedule a consultation.
        </p>
        <p className="school-contact-success-note">
          Check your email at <strong>{email}</strong> for confirmation.
        </p>
      </div>
    );
  }

  return (
    <form className="school-contact-form" onSubmit={handleSubmit}>
      {error && (
        <div className="school-contact-form-error" role="alert">
          {error}
        </div>
      )}

      {/* Section 1: School Information */}
      <fieldset className="school-contact-form-section">
        <legend className="school-contact-form-section-legend">School Information</legend>
        <div className="school-contact-form-section-grid">
          <div className="school-contact-form-field">
            <label htmlFor="school-name" className="school-contact-form-label">
              School Name <span className="school-contact-form-required">*</span>
            </label>
            <input
              type="text"
              id="school-name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="school-contact-form-input"
              placeholder="e.g., Lincoln Elementary School"
              required
              minLength={3}
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="school-contact-form-field">
            <label htmlFor="district-name" className="school-contact-form-label">
              District Name <span className="school-contact-form-required">*</span>
            </label>
            <input
              type="text"
              id="district-name"
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              className="school-contact-form-input"
              placeholder="e.g., Springfield School District"
              required
              minLength={2}
              maxLength={150}
              disabled={loading}
            />
          </div>

          <div className="school-contact-form-field">
            <label htmlFor="state" className="school-contact-form-label">
              State / Region
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="school-contact-form-select"
              disabled={loading}
            >
              <option value="">Select state...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Section 2: Your Information */}
      <fieldset className="school-contact-form-section school-contact-form-section-divider">
        <legend className="school-contact-form-section-legend">Your Information</legend>
        <div className="school-contact-form-section-grid">
          <div className="school-contact-form-field">
            <label htmlFor="contact-name" className="school-contact-form-label">
              Your Name <span className="school-contact-form-required">*</span>
            </label>
            <input
              type="text"
              id="contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="school-contact-form-input"
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="school-contact-form-field">
            <label htmlFor="contact-title" className="school-contact-form-label">
              Your Title/Role <span className="school-contact-form-required">*</span>
            </label>
            <input
              type="text"
              id="contact-title"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              className="school-contact-form-input"
              placeholder="e.g., Special Education Director"
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="school-contact-form-field">
            <label htmlFor="contact-email" className="school-contact-form-label">
              Email <span className="school-contact-form-required">*</span>
            </label>
            <input
              type="email"
              id="contact-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="school-contact-form-input"
              placeholder="your@email.com"
              required
              disabled={loading}
              inputMode="email"
            />
          </div>

          <div className="school-contact-form-field">
            <label htmlFor="contact-phone" className="school-contact-form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="contact-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="school-contact-form-input"
              placeholder="(555) 123-4567"
              minLength={10}
              disabled={loading}
              inputMode="tel"
            />
          </div>
        </div>
      </fieldset>

      {/* Section 3: Service Details */}
      <fieldset className="school-contact-form-section school-contact-form-section-divider">
        <legend className="school-contact-form-section-legend">Service Details</legend>
        <div className="school-contact-form-section-grid">
          {/* Service Checkboxes */}
          <div className="school-contact-form-field school-contact-form-field-full">
            <span className="school-contact-form-label">
              Services Needed <span className="school-contact-form-required">*</span>
            </span>
            <div className="school-contact-form-checkboxes" role="group" aria-label="Services needed">
              {SERVICE_OPTIONS.map((service) => {
                const checked = selectedServices.includes(service);
                return (
                  <label
                    key={service}
                    className={`school-contact-form-checkbox-item ${checked ? 'school-contact-form-checkbox-item--checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service)}
                      disabled={loading}
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Additional Details */}
          <div className="school-contact-form-field school-contact-form-field-full">
            <label htmlFor="additional-details" className="school-contact-form-label">
              Additional details about your needs
              {selectedServices.length === 1 && selectedServices[0] === 'Other' && (
                <span className="school-contact-form-required"> *</span>
              )}
            </label>
            <textarea
              id="additional-details"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="school-contact-form-textarea"
              placeholder="Describe student needs, IEP goals, schedule preferences..."
              rows={4}
              maxLength={2000}
              disabled={loading}
              required={selectedServices.length === 1 && selectedServices[0] === 'Other'}
              minLength={selectedServices.length === 1 && selectedServices[0] === 'Other' ? 10 : undefined}
            />
            <p className="school-contact-form-hint">
              Be as specific as possible to help us prepare for our conversation
              {additionalDetails.length > 0 && ` (${additionalDetails.length}/2000)`}
            </p>
          </div>

          {/* Student Count & Timeline */}
          <div className="school-contact-form-field">
            <label htmlFor="student-count" className="school-contact-form-label">
              Number of Students
            </label>
            <select
              id="student-count"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              className="school-contact-form-select"
              disabled={loading}
            >
              <option value="">Select...</option>
              <option value="1">1</option>
              <option value="2-3">2-3</option>
              <option value="4-5">4-5</option>
              <option value="6-10">6-10</option>
              <option value="11+">11+</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>

          <div className="school-contact-form-field">
            <label htmlFor="timeline" className="school-contact-form-label">
              Desired Start Timeline
            </label>
            <input
              type="text"
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="school-contact-form-input"
              placeholder="e.g., Next school year, ASAP, Fall 2026"
              maxLength={300}
              disabled={loading}
            />
          </div>

          {/* Delivery Preference Cards */}
          <div className="school-contact-form-field school-contact-form-field-full">
            <span className="school-contact-form-label">Preferred Service Delivery</span>
            <div className="school-contact-form-delivery-cards">
              {DELIVERY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`school-contact-form-delivery-card ${deliveryPreference === opt.value ? 'school-contact-form-delivery-card--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="delivery-preference"
                    value={opt.value}
                    checked={deliveryPreference === opt.value}
                    onChange={(e) => setDeliveryPreference(e.target.value)}
                    disabled={loading}
                  />
                  <span className="school-contact-form-delivery-icon" aria-hidden="true">
                    {opt.icon}
                  </span>
                  <span className="school-contact-form-delivery-label">{opt.label}</span>
                  <span className="school-contact-form-delivery-subtitle">{opt.subtitle}</span>
                  {deliveryPreference === opt.value && (
                    <span className="school-contact-form-delivery-check" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="currentColor" />
                        <path
                          d="M5 8l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Honeypot field for spam protection */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <button type="submit" className="school-contact-form-submit" disabled={loading}>
        {loading ? (
          <>
            <span className="school-contact-form-spinner" aria-hidden="true" />
            Sending Inquiry...
          </>
        ) : (
          <>
            Send Inquiry
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>

      <p className="school-contact-form-note">Delaney typically responds within 2 business days</p>
    </form>
  );
}
