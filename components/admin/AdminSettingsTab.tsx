'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './AdminToast';
import AdminConfirmDialog from './AdminConfirmDialog';
import { lastUpdatedText } from './admin-utils';
import type { CourseSettingsMap } from './admin-types';

const DEFAULT_SETTINGS: CourseSettingsMap = {
  'course.name': 'Summer Braille Course',
  'course.startDate': '2026-06-08',
  'course.endDate': '2026-07-31',
  'course.balanceDueDate': '2026-05-01',
  'course.sessionCount': '16',
  'pricing.full': '500',
  'pricing.deposit': '150',
  'pricing.balance': '350',
  'pricing.currency': 'USD',
  'section.A.schedule': 'Mon & Wed, 1–2 PM ET',
  'section.A.days': '1,3',
  'section.A.time': '13:00',
  'section.B.schedule': 'Tue & Thu, 4–5 PM ET',
  'section.B.days': '2,4',
  'section.B.time': '16:00',
  'enrollment.enabled': 'true',
  'enrollment.waitlistEnabled': 'true',
  'enrollment.maxWaitlist': '10',
  'email.depositSubject': 'Your $150 Deposit Is Confirmed — Summer Braille Course',
  'email.fullPaymentSubject': "You're Enrolled — Summer Braille Course",
  'email.balanceReminderSubject': 'Balance Reminder — Summer Braille Course',
};

type FieldType = 'text' | 'date' | 'number' | 'days' | 'time' | 'boolean';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  width?: 'short' | 'medium' | 'full';
  prefix?: string;
}

interface FieldGroup {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof GROUP_ICONS;
  layout?: 'grid' | 'stack' | 'sections';
  fields: FieldDef[];
}

const GROUP_ICONS = {
  'book-open': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  dollar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
} as const;

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'course',
    label: 'Course Info',
    description: 'Basic course details, dates, and session configuration.',
    icon: 'book-open',
    fields: [
      { key: 'course.name', label: 'Course Name', type: 'text', width: 'full' },
      { key: 'course.startDate', label: 'Start Date', type: 'date', width: 'medium' },
      { key: 'course.endDate', label: 'End Date', type: 'date', width: 'medium' },
      { key: 'course.balanceDueDate', label: 'Balance Due Date', type: 'date', width: 'medium' },
      { key: 'course.sessionCount', label: 'Sessions per Section', type: 'number', hint: 'Number of class sessions to generate', width: 'short' },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    description: 'Tuition amounts and currency for enrollment checkout.',
    icon: 'dollar',
    fields: [
      { key: 'pricing.full', label: 'Full Price', type: 'number', prefix: '$', width: 'short' },
      { key: 'pricing.deposit', label: 'Deposit', type: 'number', prefix: '$', width: 'short' },
      { key: 'pricing.balance', label: 'Balance', type: 'number', prefix: '$', width: 'short' },
      { key: 'pricing.currency', label: 'Currency', type: 'text', hint: 'e.g. USD, EUR', width: 'short' },
    ],
  },
  {
    id: 'sections',
    label: 'Class Sections',
    description: 'Schedule and day configuration for each section.',
    icon: 'calendar',
    layout: 'sections',
    fields: [
      { key: 'section.A.schedule', label: 'Schedule Label', type: 'text', hint: 'Displayed on enrollment page' },
      { key: 'section.A.days', label: 'Days', type: 'days', hint: 'Select which days this section meets' },
      { key: 'section.A.time', label: 'Time (ET)', type: 'time', hint: '24-hour format, e.g. 13:00', width: 'short' },
      { key: 'section.B.schedule', label: 'Schedule Label', type: 'text', hint: 'Displayed on enrollment page' },
      { key: 'section.B.days', label: 'Days', type: 'days', hint: 'Select which days this section meets' },
      { key: 'section.B.time', label: 'Time (ET)', type: 'time', hint: '24-hour format, e.g. 13:00', width: 'short' },
    ],
  },
  {
    id: 'enrollment',
    label: 'Enrollment',
    description: 'Control enrollment availability and waitlist limits.',
    icon: 'users',
    fields: [
      { key: 'enrollment.enabled', label: 'Enrollment Open', type: 'boolean', hint: 'Whether new students can enroll' },
      { key: 'enrollment.waitlistEnabled', label: 'Waitlist Enabled', type: 'boolean', hint: 'Allow waitlist when sections are full' },
      { key: 'enrollment.maxWaitlist', label: 'Max Waitlist Size', type: 'number', hint: 'Maximum waitlist slots per section', width: 'short' },
    ],
  },
  {
    id: 'email',
    label: 'Email Templates',
    description: 'Subject lines for automated enrollment emails.',
    icon: 'mail',
    layout: 'stack',
    fields: [
      { key: 'email.depositSubject', label: 'Deposit Confirmation Subject', type: 'text', hint: 'Subject line for deposit confirmation emails', width: 'full' },
      { key: 'email.fullPaymentSubject', label: 'Full Payment Subject', type: 'text', hint: 'Subject line for full payment confirmation emails', width: 'full' },
      { key: 'email.balanceReminderSubject', label: 'Balance Reminder Subject', type: 'text', hint: 'Subject line for balance reminder emails', width: 'full' },
    ],
  },
];

function validateField(type: FieldType, value: string): string | null {
  if (!value.trim()) return null; // Allow empty (will use default)

  switch (type) {
    case 'date': {
      const d = new Date(value);
      if (isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'Must be a valid date (YYYY-MM-DD)';
      }
      return null;
    }
    case 'number': {
      const n = Number(value);
      if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
        return 'Must be a positive integer';
      }
      return null;
    }
    case 'days': {
      const parts = value.split(',').map((s) => s.trim());
      for (const p of parts) {
        const n = Number(p);
        if (isNaN(n) || n < 0 || n > 6 || !Number.isInteger(n)) {
          return 'Must be comma-separated digits 0-6';
        }
      }
      return null;
    }
    case 'time': {
      if (!/^\d{1,2}:\d{2}$/.test(value)) {
        return 'Must match HH:MM format';
      }
      const [h, m] = value.split(':').map(Number);
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        return 'Invalid time value';
      }
      return null;
    }
    default:
      return null;
  }
}

/* ── Render helpers ── */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="admin-settings-toggle-row">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`admin-settings-toggle ${checked ? 'admin-settings-toggle-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="admin-settings-toggle-thumb" />
      </button>
      <span className="admin-settings-toggle-label">{checked ? 'Yes' : 'No'}</span>
    </div>
  );
}

function DayPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const activeDays = new Set(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n))
  );

  function toggleDay(day: number) {
    const next = new Set(activeDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(
      Array.from(next)
        .sort((a, b) => a - b)
        .join(',')
    );
  }

  return (
    <div className="admin-settings-daypicker">
      {DAY_LABELS.map((label, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={activeDays.has(i)}
          aria-label={DAY_NAMES[i]}
          className={`admin-settings-day ${activeDays.has(i) ? 'admin-settings-day-active' : ''}`}
          onClick={() => toggleDay(i)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── Skeleton ── */

function SettingsSkeleton() {
  return (
    <div className="admin-settings" style={{ animation: 'adminFadeIn 0.3s var(--ease-out) both' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div className="admin-skeleton-line" style={{ width: 200, height: 22, marginBottom: 8 }} />
        <div className="admin-skeleton-line" style={{ width: 380, height: 14 }} />
      </div>
      {/* Card skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            background: 'white',
            border: '1px solid rgba(212,168,83,0.12)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 28px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="admin-skeleton-line" style={{ width: 34, height: 34, borderRadius: 10 }} />
            <div>
              <div className="admin-skeleton-line" style={{ width: 120, height: 16, marginBottom: 6 }} />
              <div className="admin-skeleton-line" style={{ width: 240, height: 12 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {Array.from({ length: i === 3 ? 4 : i === 5 ? 3 : 2 }).map((_, j) => (
              <div key={j}>
                <div className="admin-skeleton-line" style={{ width: 80, height: 12, marginBottom: 6 }} />
                <div className="admin-skeleton-line" style={{ width: '100%', height: 38 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */

export default function AdminSettingsTab() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CourseSettingsMap>({ ...DEFAULT_SETTINGS });
  const [original, setOriginal] = useState<CourseSettingsMap>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tick for lastUpdatedText
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        const merged = { ...DEFAULT_SETTINGS, ...data.settings };
        setSettings(merged);
        setOriginal(merged);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Validate all fields when settings change
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        if (field.type === 'boolean') continue;
        const err = validateField(field.type, settings[field.key] || '');
        if (err) newErrors[field.key] = err;
      }
    }
    setErrors(newErrors);
  }, [settings]);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);
  const hasErrors = Object.keys(errors).length > 0;

  // Cmd+S keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        // Only capture if we're focused inside the settings tab
        if (containerRef.current?.contains(document.activeElement) || containerRef.current === document.activeElement) {
          e.preventDefault();
          if (isDirty && !hasErrors && !saving) {
            handleSave();
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, hasErrors, saving, settings]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      const merged = { ...DEFAULT_SETTINGS, ...data.settings };
      setSettings(merged);
      setOriginal(merged);
      setLastSaved(new Date());
      showToast('Settings saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    }
    setSaving(false);
  }

  async function handleResetAll() {
    setResetting(true);
    try {
      const res = await fetch('/api/admin/settings', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset');
      }
      setSettings({ ...DEFAULT_SETTINGS });
      setOriginal({ ...DEFAULT_SETTINGS });
      setLastSaved(new Date());
      setShowResetConfirm(false);
      showToast('Settings reset to defaults');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset settings', 'error');
    }
    setResetting(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  /* ── Input rendering ── */

  function renderInput(field: FieldDef) {
    if (field.type === 'boolean') {
      return (
        <ToggleSwitch
          checked={settings[field.key] === 'true'}
          onChange={(v) => handleChange(field.key, v ? 'true' : 'false')}
        />
      );
    }

    if (field.type === 'days') {
      return (
        <DayPicker
          value={settings[field.key] || ''}
          onChange={(v) => handleChange(field.key, v)}
        />
      );
    }

    const inputEl = (
      <input
        type={field.type === 'time' ? 'text' : field.type}
        className={`admin-compose-input ${errors[field.key] ? 'admin-settings-input-error' : ''} ${field.prefix ? 'admin-settings-input-prefixed' : ''}`}
        value={settings[field.key] || ''}
        onChange={(e) => handleChange(field.key, e.target.value)}
      />
    );

    if (field.prefix) {
      return (
        <div className="admin-settings-prefix-wrap">
          <span className="admin-settings-prefix">{field.prefix}</span>
          {inputEl}
        </div>
      );
    }

    return inputEl;
  }

  function renderField(field: FieldDef) {
    const widthClass =
      field.width === 'short' ? 'admin-settings-field-short' :
      field.width === 'full' ? 'admin-settings-field-full' :
      '';

    return (
      <div key={field.key} className={`admin-settings-field ${widthClass}`}>
        <label className="admin-settings-label">{field.label}</label>
        {renderInput(field)}
        {field.hint && field.type !== 'days' && (
          <span className="admin-settings-hint">{field.hint}</span>
        )}
        {errors[field.key] && (
          <span className="admin-settings-error">{errors[field.key]}</span>
        )}
      </div>
    );
  }

  function renderSectionsGroup(group: FieldGroup) {
    const sectionAFields = group.fields.filter((f) => f.key.includes('.A.'));
    const sectionBFields = group.fields.filter((f) => f.key.includes('.B.'));

    return (
      <div className="admin-settings-sections-grid">
        {[
          { label: 'Section A', fields: sectionAFields },
          { label: 'Section B', fields: sectionBFields },
        ].map((section) => (
          <div key={section.label} className="admin-settings-section-panel">
            <div className="admin-settings-section-badge">
              <span className="admin-settings-section-dot" />
              {section.label}
            </div>
            <div className="admin-settings-fields-stack">
              {section.fields.map((field) => renderField(field))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderGroupContent(group: FieldGroup) {
    if (group.layout === 'sections') {
      return renderSectionsGroup(group);
    }

    const fieldsClass = group.layout === 'stack' ? 'admin-settings-fields-stack' : 'admin-settings-fields';

    return (
      <div className={fieldsClass}>
        {group.fields.map((field) => renderField(field))}
      </div>
    );
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="admin-settings" ref={containerRef} tabIndex={-1}>
      {/* Page header */}
      <div className="admin-settings-header">
        <div>
          <h2 className="admin-settings-title">Course Settings</h2>
          <p className="admin-settings-subtitle">
            Configure your course details, pricing, scheduling, and enrollment options.
          </p>
        </div>
        {lastSaved && (
          <div className="admin-settings-lastsaved">
            {lastUpdatedText(lastSaved)}
          </div>
        )}
      </div>

      {/* Group cards */}
      {FIELD_GROUPS.map((group) => (
        <div key={group.id} className="admin-settings-group">
          <div className="admin-settings-group-header">
            <div className="admin-settings-group-icon">
              {GROUP_ICONS[group.icon]}
            </div>
            <div>
              <h3 className="admin-settings-group-title">{group.label}</h3>
              <p className="admin-settings-group-desc">{group.description}</p>
            </div>
          </div>
          <div className="admin-settings-group-divider" />
          {renderGroupContent(group)}
        </div>
      ))}

      {/* Danger zone toggle */}
      <button
        type="button"
        className="admin-settings-danger-trigger"
        onClick={() => setDangerOpen((o) => !o)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>Danger Zone</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`admin-settings-danger-chevron ${dangerOpen ? 'admin-settings-danger-chevron-open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {dangerOpen && (
        <div className="admin-danger-zone" style={{ animation: 'adminSlideOpen 0.25s var(--ease-out)' }}>
          <h4>Danger Zone</h4>
          <p>Resetting will delete all saved settings and restore defaults. This cannot be undone.</p>
          <button
            className="admin-danger-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            Reset All Settings
          </button>
        </div>
      )}

      {/* Sticky save bar */}
      <div className={`admin-settings-savebar ${isDirty ? 'admin-settings-savebar-visible' : ''}`}>
        <div className="admin-settings-savebar-inner">
          <div>
            <span className={`admin-settings-savebar-text ${hasErrors ? 'admin-settings-savebar-error' : ''}`}>
              {hasErrors ? 'Fix validation errors before saving' : 'You have unsaved changes'}
            </span>
            {!hasErrors && (
              <div className="admin-settings-savebar-kbd">
                <kbd>{typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl+'}S</kbd> to save
              </div>
            )}
          </div>
          <div className="admin-settings-savebar-actions">
            <button
              className="admin-refresh-btn"
              onClick={() => setSettings({ ...original })}
            >
              Discard
            </button>
            <button
              className="admin-send-btn"
              onClick={handleSave}
              disabled={saving || hasErrors}
            >
              {saving ? 'Saving\u2026' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <AdminConfirmDialog
          title="Reset All Settings?"
          message="This will delete all saved settings and restore factory defaults. This action cannot be undone."
          confirmLabel="Reset Everything"
          confirmVariant="danger"
          onConfirm={handleResetAll}
          onCancel={() => setShowResetConfirm(false)}
          loading={resetting}
        />
      )}
    </div>
  );
}
