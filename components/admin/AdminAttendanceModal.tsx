'use client';

import { useState, useEffect } from 'react';
import { useToast } from './AdminToast';
import type { Enrollment, AttendanceRecord } from './admin-types';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: '#dcfce7', text: '#166534' },
  ABSENT: { bg: '#fee2e2', text: '#991b1b' },
  LATE: { bg: '#fef3c7', text: '#92400e' },
  EXCUSED: { bg: '#e0e7ff', text: '#3730a3' },
};

interface StudentRow {
  enrollmentId: string;
  email: string;
  status: string;
  note: string;
}

interface Props {
  sessionId: string;
  sectionEnrollments: Enrollment[];
  onClose: () => void;
}

export default function AdminAttendanceModal({ sessionId, sectionEnrollments, onClose }: Props) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');

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

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await fetch(`/api/admin/sessions/${sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSessionTitle(data.session.title);

        const existingMap = new Map<string, AttendanceRecord>();
        for (const a of data.attendances) {
          existingMap.set(a.enrollmentId, a);
        }

        // Build rows from section enrollments, pre-filling existing attendance
        const studentRows: StudentRow[] = sectionEnrollments.map((e) => {
          const existing = existingMap.get(e.id);
          return {
            enrollmentId: e.id,
            email: e.email || 'Unknown',
            status: existing?.status || 'PRESENT',
            note: existing?.note || '',
          };
        });

        setRows(studentRows);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to load attendance', 'error');
      }
      setLoading(false);
    }

    fetchAttendance();
  }, [sessionId, sectionEnrollments, showToast]);

  function updateRow(enrollmentId: string, field: 'status' | 'note', value: string) {
    setRows((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, [field]: value } : r)));
  }

  function markAll(status: string) {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function handleSave() {
    setSaving(true);
    const optimisticRows = [...rows];
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: optimisticRows.map((r) => ({
            enrollmentId: r.enrollmentId,
            status: r.status,
            note: r.note || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Attendance saved');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Take attendance">
      <div className="admin-student-modal admin-attendance-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>
          &times;
        </button>

        <div className="admin-student-modal-content" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 4 }}>Take Attendance</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 16 }}>{sessionTitle}</p>

          {loading ? (
            <p style={{ color: '#6b7280' }}>Loading&hellip;</p>
          ) : rows.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No enrolled students found for this section.</p>
          ) : (
            <>
              {/* Bulk actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: '28px' }}>Mark all:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="admin-attendance-bulk-btn"
                    style={{
                      background: STATUS_COLORS[s].bg,
                      color: STATUS_COLORS[s].text,
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => markAll(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="admin-attendance-list">
                {rows.map((row) => (
                  <div key={row.enrollmentId} className="admin-attendance-row">
                    <span className="admin-attendance-email">{row.email}</span>
                    <div className="admin-attendance-status-group">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`admin-attendance-status-btn ${row.status === s ? 'admin-attendance-status-active' : ''}`}
                          style={
                            row.status === s
                              ? {
                                  background: STATUS_COLORS[s].bg,
                                  color: STATUS_COLORS[s].text,
                                  borderColor: STATUS_COLORS[s].text,
                                }
                              : undefined
                          }
                          onClick={() => updateRow(row.enrollmentId, 'status', s)}
                        >
                          {s.charAt(0)}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="admin-attendance-note"
                      placeholder="Note (optional)"
                      value={row.note}
                      onChange={(e) => updateRow(row.enrollmentId, 'note', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                <button className="admin-refresh-btn" onClick={onClose}>
                  Cancel
                </button>
                <button className="admin-send-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving\u2026' : 'Save Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
