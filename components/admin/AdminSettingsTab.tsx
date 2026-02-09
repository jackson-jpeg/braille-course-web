'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './AdminToast';
import { SkeletonCards } from './AdminSkeleton';
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
}

interface FieldGroup {
  label: string;
  fields: FieldDef[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: 'Course Info',
    fields: [
      { key: 'course.name', label: 'Course Name', type: 'text' },
      { key: 'course.startDate', label: 'Start Date', type: 'date' },
      { key: 'course.endDate', label: 'End Date', type: 'date' },
      { key: 'course.balanceDueDate', label: 'Balance Due Date', type: 'date' },
      { key: 'course.sessionCount', label: 'Sessions per Section', type: 'number', hint: 'Number of class sessions to generate' },
    ],
  },
  {
    label: 'Pricing',
    fields: [
      { key: 'pricing.full', label: 'Full Price ($)', type: 'number' },
      { key: 'pricing.deposit', label: 'Deposit ($)', type: 'number' },
      { key: 'pricing.balance', label: 'Balance ($)', type: 'number' },
      { key: 'pricing.currency', label: 'Currency', type: 'text', hint: 'e.g. USD, EUR' },
    ],
  },
  {
    label: 'Section A',
    fields: [
      { key: 'section.A.schedule', label: 'Schedule Label', type: 'text', hint: 'Displayed on enrollment page' },
      { key: 'section.A.days', label: 'Days', type: 'days', hint: 'Comma-separated day numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat' },
      { key: 'section.A.time', label: 'Time (ET)', type: 'time', hint: '24-hour format, e.g. 13:00' },
    ],
  },
  {
    label: 'Section B',
    fields: [
      { key: 'section.B.schedule', label: 'Schedule Label', type: 'text', hint: 'Displayed on enrollment page' },
      { key: 'section.B.days', label: 'Days', type: 'days', hint: 'Comma-separated day numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat' },
      { key: 'section.B.time', label: 'Time (ET)', type: 'time', hint: '24-hour format, e.g. 13:00' },
    ],
  },
  {
    label: 'Enrollment',
    fields: [
      { key: 'enrollment.enabled', label: 'Enrollment Open', type: 'boolean', hint: 'Whether new students can enroll' },
      { key: 'enrollment.waitlistEnabled', label: 'Waitlist Enabled', type: 'boolean', hint: 'Allow waitlist when sections are full' },
      { key: 'enrollment.maxWaitlist', label: 'Max Waitlist Size', type: 'number', hint: 'Maximum waitlist slots per section' },
    ],
  },
  {
    label: 'Email Templates',
    fields: [
      { key: 'email.depositSubject', label: 'Deposit Confirmation Subject', type: 'text', hint: 'Subject line for deposit confirmation emails' },
      { key: 'email.fullPaymentSubject', label: 'Full Payment Subject', type: 'text', hint: 'Subject line for full payment confirmation emails' },
      { key: 'email.balanceReminderSubject', label: 'Balance Reminder Subject', type: 'text', hint: 'Subject line for balance reminder emails' },
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

  if (loading) {
    return (
      <div className="admin-settings">
        <SkeletonCards count={6} />
      </div>
    );
  }

  return (
    <div className="admin-settings" ref={containerRef} tabIndex={-1}>
      {lastSaved && (
        <div className="admin-settings-lastsaved">
          {lastUpdatedText(lastSaved)}
        </div>
      )}

      {FIELD_GROUPS.map((group) => (
        <fieldset key={group.label} className="admin-settings-group">
          <legend className="admin-settings-legend">{group.label}</legend>
          <div className="admin-settings-fields">
            {group.fields.map((field) => (
              <div key={field.key} className="admin-settings-field">
                <label className="admin-settings-label">{field.label}</label>
                {field.type === 'boolean' ? (
                  <select
                    className="admin-compose-input"
                    value={settings[field.key] || 'true'}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type={field.type === 'days' || field.type === 'time' ? 'text' : field.type}
                    className={`admin-compose-input ${errors[field.key] ? 'admin-settings-input-error' : ''}`}
                    value={settings[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                )}
                {field.hint && (
                  <span className="admin-settings-hint">{field.hint}</span>
                )}
                {errors[field.key] && (
                  <span className="admin-settings-error">{errors[field.key]}</span>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="admin-settings-actions">
        <button
          className="admin-send-btn"
          onClick={handleSave}
          disabled={!isDirty || saving || hasErrors}
        >
          {saving ? 'Saving\u2026' : 'Save Changes'}
        </button>
        {isDirty && (
          <button
            className="admin-refresh-btn"
            onClick={() => setSettings({ ...original })}
          >
            Reset
          </button>
        )}
        {hasErrors && (
          <span className="admin-settings-error" style={{ marginLeft: 8 }}>
            Fix validation errors before saving
          </span>
        )}
      </div>

      {/* Danger Zone */}
      <div className="admin-danger-zone">
        <h4>Danger Zone</h4>
        <p>Resetting will delete all saved settings and restore defaults. This cannot be undone.</p>
        <button
          className="admin-danger-btn"
          onClick={() => setShowResetConfirm(true)}
        >
          Reset All Settings
        </button>
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
