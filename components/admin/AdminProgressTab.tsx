'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useToast } from './AdminToast';
import AdminConfirmDialog from './AdminConfirmDialog';
import type { Section, Enrollment, Assignment, Grade } from './admin-types';

interface Props {
  sections: Section[];
  enrollments: Enrollment[];
  scheduleMap: Record<string, string>;
}

export default function AdminProgressTab({ sections, enrollments, scheduleMap }: Props) {
  const { showToast } = useToast();
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  // Add assignment form
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addMaxScore, setAddMaxScore] = useState(100);
  const [addDueDate, setAddDueDate] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Delete assignment
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pending saves (debounced)
  const pendingRef = useRef<Map<string, { assignmentId: string; enrollmentId: string; score: number | null }>>(
    new Map(),
  );
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const sectionEnrollments = useMemo(
    () => enrollments.filter((e) => e.section.label === selectedSection?.label && e.paymentStatus === 'COMPLETED'),
    [enrollments, selectedSection],
  );

  const fetchGrades = useCallback(async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/grades?sectionId=${selectedSectionId}`);
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments);
        setGrades(data.grades);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
    setLoading(false);
  }, [selectedSectionId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  function getGrade(assignmentId: string, enrollmentId: string): number | null {
    const g = grades.find((g) => g.assignmentId === assignmentId && g.enrollmentId === enrollmentId);
    return g?.score ?? null;
  }

  function handleScoreChange(assignmentId: string, enrollmentId: string, value: string) {
    const score = value === '' ? null : parseFloat(value);
    // Optimistic update
    setGrades((prev) => {
      const existing = prev.findIndex((g) => g.assignmentId === assignmentId && g.enrollmentId === enrollmentId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], score };
        return updated;
      }
      return [...prev, { id: `temp-${assignmentId}-${enrollmentId}`, assignmentId, enrollmentId, score, notes: null }];
    });

    // Queue for save
    const key = `${assignmentId}:${enrollmentId}`;
    pendingRef.current.set(key, { assignmentId, enrollmentId, score });

    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSaves, 800);
  }

  async function flushSaves() {
    const pending = Array.from(pendingRef.current.values());
    if (pending.length === 0) return;
    pendingRef.current.clear();

    try {
      const res = await fetch('/api/admin/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: pending }),
      });
      if (!res.ok) throw new Error('Failed to save grades');
    } catch (err) {
      showToast('Failed to save grades', 'error');
      console.error(err);
    }
  }

  async function handleAddAssignment(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          title: addTitle,
          maxScore: addMaxScore,
          dueDate: addDueDate || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create assignment');
      showToast('Assignment created');
      setShowAdd(false);
      setAddTitle('');
      setAddMaxScore(100);
      setAddDueDate('');
      await fetchGrades();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create', 'error');
    }
    setAddLoading(false);
  }

  async function handleDeleteAssignment() {
    if (!deletingAssignment) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/assignments/${deletingAssignment.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Assignment deleted');
      setDeletingAssignment(null);
      await fetchGrades();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
    setDeleteLoading(false);
  }

  function scoreColor(score: number | null, maxScore: number): string {
    if (score === null || score === undefined) return '';
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return 'admin-grade-green';
    if (pct >= 60) return 'admin-grade-gold';
    return 'admin-grade-red';
  }

  function studentAverage(enrollmentId: string): string {
    let total = 0;
    let count = 0;
    assignments.forEach((a) => {
      const score = getGrade(a.id, enrollmentId);
      if (score !== null) {
        total += (score / a.maxScore) * 100;
        count++;
      }
    });
    return count > 0 ? `${Math.round(total / count)}%` : '—';
  }

  function assignmentAverage(assignmentId: string): string {
    const a = assignments.find((x) => x.id === assignmentId);
    if (!a) return '—';
    let total = 0;
    let count = 0;
    sectionEnrollments.forEach((e) => {
      const score = getGrade(assignmentId, e.id);
      if (score !== null) {
        total += (score / a.maxScore) * 100;
        count++;
      }
    });
    return count > 0 ? `${Math.round(total / count)}%` : '—';
  }

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
        <button className="admin-compose-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add Assignment'}
        </button>
        {assignments.length > 0 && (
          <button className="admin-refresh-btn admin-print-btn" onClick={() => window.print()}>
            Print Grades
          </button>
        )}
      </div>

      {showAdd && (
        <div className="admin-compose" style={{ marginBottom: 16, marginTop: 12 }}>
          <form onSubmit={handleAddAssignment}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="admin-compose-field" style={{ flex: '2 1 200px' }}>
                <label>Title</label>
                <input
                  type="text"
                  className="admin-compose-input"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. Homework 1"
                  required
                />
              </div>
              <div className="admin-compose-field" style={{ flex: '1 1 100px' }}>
                <label>Max Score</label>
                <input
                  type="number"
                  className="admin-compose-input"
                  value={addMaxScore}
                  onChange={(e) => setAddMaxScore(parseInt(e.target.value) || 100)}
                  min={1}
                  required
                />
              </div>
              <div className="admin-compose-field" style={{ flex: '1 1 160px' }}>
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  className="admin-compose-input"
                  value={addDueDate}
                  onChange={(e) => setAddDueDate(e.target.value)}
                />
              </div>
              <button type="submit" className="admin-send-btn" disabled={addLoading} style={{ marginBottom: 4 }}>
                {addLoading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ padding: '12px 0', color: '#6b7280', fontSize: '0.9rem' }}>Loading grades&hellip;</p>
      ) : assignments.length === 0 ? (
        <div className="admin-empty-state" style={{ padding: '32px 0' }}>
          <p className="admin-empty-state-title">No assignments yet</p>
          <p className="admin-empty-state-sub">
            Click &quot;+ Add Assignment&quot; to create your first assignment for this section.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap admin-grade-grid-wrap" data-print="grades">
          <table className="admin-table admin-grade-table">
            <thead>
              <tr>
                <th className="admin-grade-student-col">Student</th>
                {assignments.map((a) => (
                  <th key={a.id} className="admin-grade-header">
                    <div className="admin-grade-header-inner">
                      <span className="admin-grade-header-title" title={a.title}>
                        {a.title}
                      </span>
                      <span className="admin-grade-header-max">/{a.maxScore}</span>
                      <button
                        className="admin-grade-header-delete"
                        onClick={() => setDeletingAssignment(a)}
                        title="Delete assignment"
                      >
                        &times;
                      </button>
                    </div>
                  </th>
                ))}
                <th className="admin-grade-avg-col">Avg</th>
              </tr>
            </thead>
            <tbody>
              {sectionEnrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="admin-grade-student-cell">{enrollment.email || 'Unknown'}</td>
                  {assignments.map((a) => {
                    const score = getGrade(a.id, enrollment.id);
                    return (
                      <td key={a.id} className={`admin-grade-cell ${scoreColor(score, a.maxScore)}`}>
                        <input
                          type="number"
                          className="admin-grade-input"
                          value={score ?? ''}
                          min={0}
                          max={a.maxScore}
                          step="any"
                          placeholder="—"
                          onChange={(e) => handleScoreChange(a.id, enrollment.id, e.target.value)}
                          onBlur={flushSaves}
                        />
                      </td>
                    );
                  })}
                  <td className="admin-grade-avg">{studentAverage(enrollment.id)}</td>
                </tr>
              ))}
              <tr className="admin-grade-summary-row">
                <td className="admin-grade-student-cell" style={{ fontWeight: 600 }}>
                  Class Average
                </td>
                {assignments.map((a) => (
                  <td key={a.id} className="admin-grade-avg">
                    {assignmentAverage(a.id)}
                  </td>
                ))}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {deletingAssignment && (
        <AdminConfirmDialog
          title="Delete Assignment"
          message={`Delete "${deletingAssignment.title}" and all its grades? This cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onConfirm={handleDeleteAssignment}
          onCancel={() => setDeletingAssignment(null)}
        />
      )}
    </>
  );
}
