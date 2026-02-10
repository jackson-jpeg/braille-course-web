'use client';

import { useState } from 'react';

export default function SchoolContactForm() {
  const [schoolName, setSchoolName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [servicesNeeded, setServicesNeeded] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState('');
  const [timeline, setTimeline] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Honeypot check - reject if bot filled the hidden field
    if (honeypot) {
      setError('Invalid submission');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/school-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          districtName: districtName.trim() || undefined,
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          contactTitle: contactTitle.trim(),
          servicesNeeded: servicesNeeded.trim(),
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

      <div className="school-contact-form-grid">
        {/* School Information */}
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

        {/* Contact Information */}
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

        {/* Services & Needs */}
        <div className="school-contact-form-field school-contact-form-field-full">
          <label htmlFor="services-needed" className="school-contact-form-label">
            Services Needed <span className="school-contact-form-required">*</span>
          </label>
          <textarea
            id="services-needed"
            value={servicesNeeded}
            onChange={(e) => setServicesNeeded(e.target.value)}
            className="school-contact-form-textarea"
            placeholder="Please describe the vision services you're looking for, student needs, IEP goals, etc..."
            rows={4}
            required
            minLength={10}
            maxLength={2000}
            disabled={loading}
          />
          <p className="school-contact-form-hint">
            Be as specific as possible to help us prepare for our conversation{' '}
            {servicesNeeded.length > 0 && `(${servicesNeeded.length}/2000)`}
          </p>
        </div>

        {/* Additional Details */}
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

        {/* Delivery Preference */}
        <div className="school-contact-form-field school-contact-form-field-full">
          <fieldset className="school-contact-form-fieldset">
            <legend className="school-contact-form-label">Preferred Service Delivery</legend>
            <div className="school-contact-form-radios">
              <label className="school-contact-form-radio-item">
                <input
                  type="radio"
                  name="delivery-preference"
                  value="Remote"
                  checked={deliveryPreference === 'Remote'}
                  onChange={(e) => setDeliveryPreference(e.target.value)}
                  disabled={loading}
                />
                <span>Remote</span>
              </label>
              <label className="school-contact-form-radio-item">
                <input
                  type="radio"
                  name="delivery-preference"
                  value="In-Person"
                  checked={deliveryPreference === 'In-Person'}
                  onChange={(e) => setDeliveryPreference(e.target.value)}
                  disabled={loading}
                />
                <span>In-Person</span>
              </label>
              <label className="school-contact-form-radio-item">
                <input
                  type="radio"
                  name="delivery-preference"
                  value="Hybrid"
                  checked={deliveryPreference === 'Hybrid'}
                  onChange={(e) => setDeliveryPreference(e.target.value)}
                  disabled={loading}
                />
                <span>Hybrid</span>
              </label>
              <label className="school-contact-form-radio-item">
                <input
                  type="radio"
                  name="delivery-preference"
                  value="Not sure"
                  checked={deliveryPreference === 'Not sure'}
                  onChange={(e) => setDeliveryPreference(e.target.value)}
                  disabled={loading}
                />
                <span>Not sure</span>
              </label>
            </div>
          </fieldset>
        </div>

        {/* Honeypot field for spam protection - hidden from real users */}
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
      </div>

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
