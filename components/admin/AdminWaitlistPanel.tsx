'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminConfirmDialog from './AdminConfirmDialog';
import { useToast } from './AdminToast';
import type { Enrollment, Section } from './admin-types';

interface Props {
  sections: Section[];
  scheduleMap: Record<string, string>;
  onSendEmail: (email: string) => void;
  onPromoted?: () => void;
}

interface WaitlistEntry extends Enrollment {
  waitlistPosition: number | null;
}

export default function AdminWaitlistPanel({ sections, scheduleMap, onSendEmail, onPromoted }: Props) {
  const { showToast } = useToast();
  const [waitlisted, setWaitlisted] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [removingEntry, setRemovingEntry] = useState<WaitlistEntry | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchWaitlist = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/waitlist');
      const data = await res.json();
      if (res.ok) setWaitlisted(data.waitlisted);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWaitlist(); }, [fetchWaitlist]);

  async function handlePromote(enrollmentId: string) {
    setPromotingId(enrollmentId);
    try {
      const res = await fetch('/api/admin/waitlist/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Promoted ${data.promoted || 'student'} to enrolled`);
      await fetchWaitlist();
      onPromoted?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to promote', 'error');
    }
    setPromotingId(null);
  }

  async function handleRemove() {
    if (!removingEntry) return;
    setRemoveLoading(true);
    try {
      const res = await fetch('/api/admin/waitlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: removingEntry.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.warning) showToast(data.warning, 'error');
      else showToast('Removed from waitlist');
      setRemovingEntry(null);
      await fetchWaitlist();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove', 'error');
    }
    setRemoveLoading(false);
  }

  async function handleMoveUp(entry: WaitlistEntry, sectionEntries: WaitlistEntry[]) {
    const idx = sectionEntries.findIndex((e) => e.id === entry.id);
    if (idx <= 0) return;
    const newOrder = [...sectionEntries];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    try {
      await fetch('/api/admin/waitlist/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newOrder.map((e) => e.id) }),
      });
      await fetchWaitlist();
    } catch { /* silent */ }
  }

  async function handleMoveDown(entry: WaitlistEntry, sectionEntries: WaitlistEntry[]) {
    const idx = sectionEntries.findIndex((e) => e.id === entry.id);
    if (idx >= sectionEntries.length - 1) return;
    const newOrder = [...sectionEntries];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    try {
      await fetch('/api/admin/waitlist/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newOrder.map((e) => e.id) }),
      });
      await fetchWaitlist();
    } catch { /* silent */ }
  }

  if (loading) return null;
  if (waitlisted.length === 0) return null;

  // Group by section
  const grouped: Record<string, WaitlistEntry[]> = {};
  for (const e of waitlisted) {
    const label = e.section.label;
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(e);
  }

  return (
    <div className="admin-waitlist-panel">
      <button
        className="admin-waitlist-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="admin-waitlist-title">
          Waitlist
          <span className="admin-waitlist-badge">{waitlisted.length}</span>
        </span>
        <span className="admin-waitlist-chevron">{collapsed ? '\u25B6' : '\u25BC'}</span>
      </button>

      {!collapsed && (
        <div className="admin-waitlist-content">
          {Object.entries(grouped).map(([sectionLabel, entries]) => {
            const section = sections.find((s) => s.label === sectionLabel);
            const isFull = section ? section.enrolledCount >= section.maxCapacity : true;

            return (
              <div key={sectionLabel} className="admin-waitlist-section">
                <div className="admin-waitlist-section-header">
                  <strong>{scheduleMap[sectionLabel] || sectionLabel}</strong>
                  <span className={`admin-capacity-badge ${isFull ? 'admin-capacity-full' : 'admin-capacity-open'}`}>
                    {section ? `${section.enrolledCount}/${section.maxCapacity}` : ''}
                  </span>
                </div>
                <div className="admin-waitlist-list">
                  {entries.map((entry, idx) => (
                    <div key={entry.id} className="admin-waitlist-item">
                      <span className="admin-waitlist-position">{entry.waitlistPosition || idx + 1}</span>
                      <span className="admin-waitlist-email">{entry.email || 'Unknown'}</span>
                      <span className="admin-waitlist-plan">{entry.plan}</span>
                      <div className="admin-waitlist-actions">
                        {idx > 0 && (
                          <button
                            className="admin-waitlist-arrow"
                            onClick={() => handleMoveUp(entry, entries)}
                            title="Move up"
                          >
                            &uarr;
                          </button>
                        )}
                        {idx < entries.length - 1 && (
                          <button
                            className="admin-waitlist-arrow"
                            onClick={() => handleMoveDown(entry, entries)}
                            title="Move down"
                          >
                            &darr;
                          </button>
                        )}
                        <button
                          className="admin-send-btn"
                          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                          onClick={() => handlePromote(entry.id)}
                          disabled={promotingId === entry.id || isFull}
                          title={isFull ? 'Section is full' : 'Promote to enrolled'}
                        >
                          {promotingId === entry.id ? 'Promoting\u2026' : 'Promote'}
                        </button>
                        {entry.email && (
                          <button
                            className="admin-refresh-btn"
                            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                            onClick={() => onSendEmail(entry.email!)}
                          >
                            Email
                          </button>
                        )}
                        <button
                          className="admin-refund-confirm"
                          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                          onClick={() => setRemovingEntry(entry)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {removingEntry && (
        <AdminConfirmDialog
          title="Remove from Waitlist"
          message={`Remove ${removingEntry.email || 'this student'} from the waitlist? This student already paid — you may need to issue a refund via Stripe.`}
          confirmLabel="Remove"
          confirmVariant="danger"
          loading={removeLoading}
          onConfirm={handleRemove}
          onCancel={() => setRemovingEntry(null)}
        />
      )}
    </div>
  );
}
