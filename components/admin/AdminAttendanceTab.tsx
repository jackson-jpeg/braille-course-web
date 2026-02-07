'use client';

import { useState, useCallback, useEffect } from 'react';
import AdminAttendanceModal from './AdminAttendanceModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { useToast } from './AdminToast';
import type { Section, Enrollment, ClassSession } from './admin-types';
import { fullDate } from './admin-utils';

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  scheduleMap: Record<string, string>;
}

export default function AdminAttendanceTab({ sections, enrollments, scheduleMap }: Props) {
  const { showToast } = useToast();
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addSessionNum, setAddSessionNum] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [deletingSession, setDeletingSession] = useState<ClassSession | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions?sectionId=${selectedSectionId}`);
      const data = await res.json();
      if (res.ok) setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
    setLoading(false);
  }, [selectedSectionId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selectedSectionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.created === 0) {
        showToast(data.message || 'Sessions already exist');
      } else {
        showToast(`Generated ${data.created} sessions`);
      }
      await fetchSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate', 'error');
    }
    setGenerating(false);
  }

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          title: addTitle,
          date: new Date(addDate).toISOString(),
          sessionNum: addSessionNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Session created');
      setShowAddSession(false);
      setAddTitle('');
      setAddDate('');
      await fetchSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create session', 'error');
    }
    setAddLoading(false);
  }

  async function handleDeleteSession() {
    if (!deletingSession) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions/${deletingSession.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showToast('Session deleted');
      setDeletingSession(null);
      await fetchSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
    setDeleteLoading(false);
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const sectionEnrollments = enrollments.filter(
    (e) => e.section.label === selectedSection?.label && e.paymentStatus === 'COMPLETED'
  );

  // Auto-set next session number
  useEffect(() => {
    if (sessions.length > 0) {
      setAddSessionNum(Math.max(...sessions.map((s) => s.sessionNum)) + 1);
    }
  }, [sessions]);

  return (
    <>
      <div className="admin-attendance-controls">
        <select
          className="admin-select"
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {scheduleMap[s.label] || s.label}
            </option>
          ))}
        </select>
        <button
          className="admin-compose-btn"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating\u2026' : 'Generate Sessions'}
        </button>
        <button
          className="admin-refresh-btn"
          onClick={() => { setShowAddSession(!showAddSession); }}
        >
          {showAddSession ? 'Cancel' : '+ Add Session'}
        </button>
      </div>

      {showAddSession && (
        <div className="admin-compose" style={{ marginBottom: 16, marginTop: 12 }}>
          <form onSubmit={handleAddSession}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="admin-compose-field" style={{ flex: '1 1 120px' }}>
                <label>Session #</label>
                <input
                  type="number"
                  className="admin-compose-input"
                  value={addSessionNum}
                  onChange={(e) => setAddSessionNum(parseInt(e.target.value))}
                  min={1}
                  required
                />
              </div>
              <div className="admin-compose-field" style={{ flex: '2 1 200px' }}>
                <label>Title</label>
                <input
                  type="text"
                  className="admin-compose-input"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. Class 17"
                  required
                />
              </div>
              <div className="admin-compose-field" style={{ flex: '2 1 200px' }}>
                <label>Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className="admin-compose-input"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="admin-send-btn" disabled={addLoading} style={{ marginBottom: 4 }}>
                {addLoading ? 'Creating\u2026' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ padding: '12px 0', color: '#6b7280', fontSize: '0.9rem' }}>Loading sessions&hellip;</p>
      ) : sessions.length === 0 ? (
        <div className="admin-empty-state" style={{ padding: '32px 0' }}>
          <p className="admin-empty-state-title">No sessions yet</p>
          <p className="admin-empty-state-sub">
            Click &quot;Generate Sessions&quot; to create all 16 sessions for this section, or add individual sessions manually.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Date</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const isPast = new Date(session.date) < new Date();
                return (
                  <tr key={session.id}>
                    <td style={{ fontWeight: 600, width: 50 }}>{session.sessionNum}</td>
                    <td>{session.title}</td>
                    <td title={fullDate(session.date)}>
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      {session.attendanceCount != null && session.attendanceCount > 0 ? (
                        <span className="admin-attendance-ratio">
                          {session.attendanceCount}/{session.totalEnrolled || sectionEnrollments.length}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                          {isPast ? 'Not taken' : '\u2014'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-send-btn admin-action-btn-sm"
                          onClick={() => setAttendanceSessionId(session.id)}
                        >
                          Take Attendance
                        </button>
                        <button
                          className="admin-refund-confirm admin-action-btn-sm"
                          onClick={() => setDeletingSession(session)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Take Attendance Modal */}
      {attendanceSessionId && (
        <AdminAttendanceModal
          sessionId={attendanceSessionId}
          sectionEnrollments={sectionEnrollments}
          onClose={() => { setAttendanceSessionId(null); fetchSessions(); }}
        />
      )}

      {/* Delete session confirmation */}
      {deletingSession && (
        <AdminConfirmDialog
          title="Delete Session"
          message={`Delete "${deletingSession.title}" and all its attendance records? This cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onConfirm={handleDeleteSession}
          onCancel={() => setDeletingSession(null)}
        />
      )}
    </>
  );
}
