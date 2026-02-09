'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './AdminToast';
import type { CourseSettingsMap } from './admin-types';

const DEFAULT_SETTINGS: CourseSettingsMap = {
  'course.name': 'Summer Braille Course',
  'course.startDate': '2026-06-08',
  'course.endDate': '2026-07-31',
  'course.balanceDueDate': '2026-05-01',
  'pricing.full': '500',
  'pricing.deposit': '150',
  'pricing.balance': '350',
  'section.A.schedule': 'Mon & Wed, 1–2 PM ET',
  'section.A.days': '1,3',
  'section.A.time': '13:00',
  'section.B.schedule': 'Tue & Thu, 4–5 PM ET',
  'section.B.days': '2,4',
  'section.B.time': '16:00',
};

interface FieldGroup {
  label: string;
  fields: { key: string; label: string; type: 'text' | 'date' | 'number' }[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: 'Course Info',
    fields: [
      { key: 'course.name', label: 'Course Name', type: 'text' },
      { key: 'course.startDate', label: 'Start Date', type: 'date' },
      { key: 'course.endDate', label: 'End Date', type: 'date' },
      { key: 'course.balanceDueDate', label: 'Balance Due Date', type: 'date' },
    ],
  },
  {
    label: 'Pricing',
    fields: [
      { key: 'pricing.full', label: 'Full Price ($)', type: 'number' },
      { key: 'pricing.deposit', label: 'Deposit ($)', type: 'number' },
      { key: 'pricing.balance', label: 'Balance ($)', type: 'number' },
    ],
  },
  {
    label: 'Section A',
    fields: [
      { key: 'section.A.schedule', label: 'Schedule Label', type: 'text' },
      { key: 'section.A.days', label: 'Days (0=Sun, 1=Mon, …)', type: 'text' },
      { key: 'section.A.time', label: 'Time (HH:MM)', type: 'text' },
    ],
  },
  {
    label: 'Section B',
    fields: [
      { key: 'section.B.schedule', label: 'Schedule Label', type: 'text' },
      { key: 'section.B.days', label: 'Days (0=Sun, 1=Mon, …)', type: 'text' },
      { key: 'section.B.time', label: 'Time (HH:MM)', type: 'text' },
    ],
  },
];

export default function AdminSettingsTab() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CourseSettingsMap>({ ...DEFAULT_SETTINGS });
  const [original, setOriginal] = useState<CourseSettingsMap>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

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
      showToast('Settings saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    }
    setSaving(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return <p style={{ padding: '12px 0', color: '#6b7280', fontSize: '0.9rem' }}>Loading settings&hellip;</p>;
  }

  return (
    <div className="admin-settings">
      {FIELD_GROUPS.map((group) => (
        <fieldset key={group.label} className="admin-settings-group">
          <legend className="admin-settings-legend">{group.label}</legend>
          <div className="admin-settings-fields">
            {group.fields.map((field) => (
              <div key={field.key} className="admin-settings-field">
                <label className="admin-settings-label">{field.label}</label>
                <input
                  type={field.type}
                  className="admin-compose-input"
                  value={settings[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="admin-settings-actions">
        <button
          className="admin-send-btn"
          onClick={handleSave}
          disabled={!isDirty || saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {isDirty && (
          <button
            className="admin-refresh-btn"
            onClick={() => setSettings({ ...original })}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
