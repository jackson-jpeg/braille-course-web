'use client';

import { useEffect, useRef, useState } from 'react';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import { LETTERS, getPunctuation, type Dots } from '@/lib/ueb';
import '@/styles/pages/forms.css';

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

/** Each delivery option is marked with a decorative cell: its first letter (or a question mark). */
const DELIVERY_OPTIONS: { value: string; label: string; subtitle: string; cell: Dots }[] = [
  { value: 'Remote', label: 'Remote', subtitle: 'Via video call — nationwide', cell: LETTERS.r },
  { value: 'In-Person', label: 'In-Person', subtitle: 'On-site at your school', cell: LETTERS.i },
  { value: 'Hybrid', label: 'Hybrid', subtitle: 'Combination of both', cell: LETTERS.h },
  {
    value: 'Not sure',
    label: 'Not Sure',
    subtitle: "Let's discuss options",
    cell: getPunctuation('question').cells[0],
  },
];

/** Same pattern the /api/school-contact route accepts. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldKey =
  | 'schoolName'
  | 'districtName'
  | 'contactName'
  | 'contactTitle'
  | 'email'
  | 'phone'
  | 'services'
  | 'additionalDetails';

/** Field key → id of the control that receives focus when the field is invalid. In form order. */
const FIELD_FOCUS_ID: Record<FieldKey, string> = {
  schoolName: 'school-name',
  districtName: 'district-name',
  contactName: 'contact-name',
  contactTitle: 'contact-title',
  email: 'contact-email',
  phone: 'contact-phone',
  services: 'service-0',
  additionalDetails: 'additional-details',
};

type FieldErrors = Partial<Record<FieldKey, string>>;

function Req() {
  return <span className="field-req"> (required)</span>;
}
function Opt() {
  return <span className="field-req"> (optional)</span>;
}

/** aria-describedby value from the ids that are present. */
function ids(...list: (string | false | undefined)[]) {
  const joined = list.filter(Boolean).join(' ');
  return joined || undefined;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLDivElement>(null);

  const otherOnly = selectedServices.length === 1 && selectedServices[0] === 'Other';

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]));
    clearFieldError('services');
    clearFieldError('additionalDetails');
  };

  /** Mirrors the form's constraints (required / minLength / email) so errors can be shown inline. */
  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    const minLen = (key: FieldKey, value: string, min: number, empty: string, short: string) => {
      const v = value.trim();
      if (!v) errs[key] = empty;
      else if (v.length < min) errs[key] = short;
    };
    minLen('schoolName', schoolName, 3, 'Enter your school’s name.', 'School name must be at least 3 characters.');
    minLen(
      'districtName',
      districtName,
      2,
      'Enter your district’s name.',
      'District name must be at least 2 characters.',
    );
    minLen('contactName', contactName, 2, 'Enter your name.', 'Your name must be at least 2 characters.');
    minLen(
      'contactTitle',
      contactTitle,
      2,
      'Enter your title or role.',
      'Title or role must be at least 2 characters.',
    );
    if (!email.trim()) errs.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) errs.email = 'Enter a valid email address, like name@school.org.';
    if (phone.trim() && phone.trim().length < 10) errs.phone = 'Phone number must be at least 10 characters.';
    if (selectedServices.length === 0) errs.services = 'Please select at least one service.';
    if (otherOnly && additionalDetails.trim().length < 10) {
      errs.additionalDetails = 'Please describe the services you need (at least 10 characters) when selecting "Other".';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (honeypot) {
      setError('Invalid submission');
      return;
    }

    const errs = validate();
    const invalid = (Object.keys(FIELD_FOCUS_ID) as FieldKey[]).filter((k) => errs[k]);
    setFieldErrors(errs);
    if (invalid.length > 0) {
      setError(
        invalid.length === 1
          ? 'Please fix 1 field marked below.'
          : `Please fix the ${invalid.length} fields marked below.`,
      );
      document.getElementById(FIELD_FOCUS_ID[invalid[0]])?.focus();
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
          contactTitle: contactTitle.trim() || undefined,
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

      setLoading(false);
      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rf-success" role="status" tabIndex={-1} ref={successRef}>
        <BrailleText text="thank you" size="sm" />
        <h3>Inquiry received</h3>
        <p>
          Thank you for your interest in TVI services for {schoolName}. Delaney will reach out within 2 business days to
          discuss your vision service needs and schedule a consultation.
        </p>
        <p className="rf-success-note">
          Check your email at <strong>{email}</strong> for confirmation.
        </p>
      </div>
    );
  }

  const err = (key: FieldKey) => fieldErrors[key];
  const errId = (key: FieldKey) => (fieldErrors[key] ? `${FIELD_FOCUS_ID[key]}-error` : undefined);
  const errorText = (k: FieldKey) =>
    fieldErrors[k] ? (
      <p id={`${FIELD_FOCUS_ID[k]}-error`} className="form-error">
        {fieldErrors[k]}
      </p>
    ) : null;

  return (
    <form className="rf-form" onSubmit={handleSubmit} noValidate aria-describedby="school-required-note">
      <p id="school-required-note" className="rf-required-note">
        Fields marked &ldquo;(required)&rdquo; must be filled in. Everything else is optional.
      </p>

      <div className="rf-alert" role="alert">
        {error && <p className="notice notice--error">{error}</p>}
      </div>

      {/* Section 1: School Information */}
      <fieldset className="rf-fieldset">
        <legend className="rf-legend">
          <Cell dots={LETTERS.s} size="sm" />
          School information
        </legend>
        <div className="rf-grid">
          <div className="field">
            <label htmlFor="school-name">
              School name
              <Req />
            </label>
            <input
              type="text"
              id="school-name"
              value={schoolName}
              onChange={(e) => {
                setSchoolName(e.target.value);
                clearFieldError('schoolName');
              }}
              className="input"
              placeholder="e.g., Lincoln Elementary School"
              required
              minLength={3}
              maxLength={200}
              autoComplete="organization"
              disabled={loading}
              aria-invalid={err('schoolName') ? true : undefined}
              aria-describedby={errId('schoolName')}
            />
            {errorText('schoolName')}
          </div>

          <div className="field">
            <label htmlFor="district-name">
              District name
              <Req />
            </label>
            <input
              type="text"
              id="district-name"
              value={districtName}
              onChange={(e) => {
                setDistrictName(e.target.value);
                clearFieldError('districtName');
              }}
              className="input"
              placeholder="e.g., Springfield School District"
              required
              minLength={2}
              maxLength={150}
              disabled={loading}
              aria-invalid={err('districtName') ? true : undefined}
              aria-describedby={errId('districtName')}
            />
            {errorText('districtName')}
          </div>

          <div className="field">
            <label htmlFor="state">
              State / region
              <Opt />
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="select"
              disabled={loading}
            >
              <option value="">Select state…</option>
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
      <fieldset className="rf-fieldset">
        <legend className="rf-legend">
          <Cell dots={LETTERS.y} size="sm" />
          Your information
        </legend>
        <div className="rf-grid">
          <div className="field">
            <label htmlFor="contact-name">
              Your name
              <Req />
            </label>
            <input
              type="text"
              id="contact-name"
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value);
                clearFieldError('contactName');
              }}
              className="input"
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              disabled={loading}
              aria-invalid={err('contactName') ? true : undefined}
              aria-describedby={errId('contactName')}
            />
            {errorText('contactName')}
          </div>

          <div className="field">
            <label htmlFor="contact-title">
              Your title or role
              <Req />
            </label>
            <input
              type="text"
              id="contact-title"
              value={contactTitle}
              onChange={(e) => {
                setContactTitle(e.target.value);
                clearFieldError('contactTitle');
              }}
              className="input"
              placeholder="e.g., Special Education Director"
              required
              minLength={2}
              maxLength={100}
              autoComplete="organization-title"
              disabled={loading}
              aria-invalid={err('contactTitle') ? true : undefined}
              aria-describedby={errId('contactTitle')}
            />
            {errorText('contactTitle')}
          </div>

          <div className="field">
            <label htmlFor="contact-email">
              Email
              <Req />
            </label>
            <input
              type="email"
              id="contact-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              className="input"
              placeholder="your@email.com"
              required
              autoComplete="email"
              disabled={loading}
              inputMode="email"
              aria-invalid={err('email') ? true : undefined}
              aria-describedby={errId('email')}
            />
            {errorText('email')}
          </div>

          <div className="field">
            <label htmlFor="contact-phone">
              Phone number
              <Opt />
            </label>
            <input
              type="tel"
              id="contact-phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError('phone');
              }}
              className="input"
              placeholder="(555) 123-4567"
              minLength={10}
              autoComplete="tel"
              disabled={loading}
              inputMode="tel"
              aria-invalid={err('phone') ? true : undefined}
              aria-describedby={errId('phone')}
            />
            {errorText('phone')}
          </div>
        </div>
      </fieldset>

      {/* Section 3: Service Details */}
      <fieldset className="rf-fieldset">
        <legend className="rf-legend">
          <Cell dots={LETTERS.s} size="sm" />
          Service details
        </legend>
        <div className="rf-grid">
          <fieldset className="rf-fieldset rf-full" aria-describedby={errId('services')}>
            <legend className="rf-group-label label">
              Services needed
              <Req />
            </legend>
            <div className="rf-choices" data-invalid={err('services') ? 'true' : undefined}>
              {SERVICE_OPTIONS.map((service, i) => {
                const checked = selectedServices.includes(service);
                return (
                  <label key={service} className={`rf-choice${checked ? ' is-checked' : ''}`}>
                    <input
                      type="checkbox"
                      id={`service-${i}`}
                      checked={checked}
                      onChange={() => toggleService(service)}
                      disabled={loading}
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>
            {errorText('services')}
          </fieldset>

          <div className="field rf-full">
            <label htmlFor="additional-details">
              Additional details about your needs
              {otherOnly ? <Req /> : <Opt />}
            </label>
            <textarea
              id="additional-details"
              value={additionalDetails}
              onChange={(e) => {
                setAdditionalDetails(e.target.value);
                clearFieldError('additionalDetails');
              }}
              className="textarea"
              placeholder="Describe student needs, IEP goals, schedule preferences..."
              rows={4}
              maxLength={2000}
              disabled={loading}
              required={otherOnly}
              minLength={otherOnly ? 10 : undefined}
              aria-invalid={err('additionalDetails') ? true : undefined}
              aria-describedby={ids('additional-details-hint', errId('additionalDetails'))}
            />
            <p id="additional-details-hint" className="hint">
              Be as specific as possible to help us prepare for our conversation
              {additionalDetails.length > 0 && ` (${additionalDetails.length}/2000)`}
            </p>
            {errorText('additionalDetails')}
          </div>

          {/* Student Count & Timeline */}
          <div className="field">
            <label htmlFor="student-count">
              Number of students
              <Opt />
            </label>
            <select
              id="student-count"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              className="select"
              disabled={loading}
            >
              <option value="">Select…</option>
              <option value="1">1</option>
              <option value="2-3">2-3</option>
              <option value="4-5">4-5</option>
              <option value="6-10">6-10</option>
              <option value="11+">11+</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="timeline">
              Desired start timeline
              <Opt />
            </label>
            <input
              type="text"
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="input"
              placeholder="e.g., Next school year, ASAP, Fall 2027"
              maxLength={300}
              disabled={loading}
            />
          </div>

          {/* Delivery Preference Cards */}
          <fieldset className="rf-fieldset rf-full">
            <legend className="rf-group-label label">
              Preferred service delivery
              <Opt />
            </legend>
            <div className="rf-choices rf-delivery">
              {DELIVERY_OPTIONS.map((opt) => {
                const checked = deliveryPreference === opt.value;
                return (
                  <label key={opt.value} className={`rf-choice${checked ? ' is-checked' : ''}`}>
                    <input
                      type="radio"
                      name="delivery-preference"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => setDeliveryPreference(e.target.value)}
                      disabled={loading}
                    />
                    <Cell dots={opt.cell} size="xs" className="rf-delivery-icon" />
                    <span className="rf-delivery-label">{opt.label}</span>
                    <span className="rf-delivery-sub">{opt.subtitle}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
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

      <div className="rf-actions">
        <button type="submit" className="btn btn--lg" disabled={loading}>
          <ButtonCell letter="s" />
          {loading ? 'Sending inquiry…' : 'Send inquiry'}
        </button>
        <p className="rf-note">Delaney typically responds within 2 business days.</p>
      </div>
    </form>
  );
}
