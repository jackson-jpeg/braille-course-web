'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider } from './AdminToast';
import { downloadCsv } from './admin-utils';
import AdminOverviewTab from './AdminOverviewTab';
import AdminStudentsTab from './AdminStudentsTab';
import AdminPaymentsTab from './AdminPaymentsTab';
import AdminEmailsTab from './AdminEmailsTab';
import AdminCreateTab from './AdminCreateTab';
import AdminMaterialsTab from './AdminMaterialsTab';
import type { AdminProps } from './admin-types';

type Tab = 'overview' | 'students' | 'payments' | 'emails' | 'create' | 'materials';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, Delaney';
  if (h < 17) return 'Good afternoon, Delaney';
  return 'Good evening, Delaney';
}

const TAB_META: Record<Tab, { label: string; icon: JSX.Element }> = {
  overview: {
    label: 'Overview',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  students: {
    label: 'Students',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="11.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M14.5 14c0-2 -1.3-3.5-3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  payments: {
    label: 'Payments',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v14M5 4h4.5a2.5 2.5 0 010 5H5M5.5 9H11a2.5 2.5 0 010 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  emails: {
    label: 'Emails',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1.5 5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  create: {
    label: 'Create',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L6 6l-5 .7 3.6 3.5-.9 5L8 13l4.3 2.2-.9-5L15 6.7 10 6 8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
  materials: {
    label: 'Materials',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M14 8.87l-3.5 2.13L8 9.5 5.5 11 2 8.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 5.87l-3.5 2.13L8 6.5 5.5 8 2 5.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2.87l-3.5 2.13L8 3.5 5.5 5 2 2.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

export default function AdminDashboard({ sections, enrollments, leads, scheduleMap }: AdminProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [emailComposeTo, setEmailComposeTo] = useState('');
  const [emailInitialTemplate, setEmailInitialTemplate] = useState('');
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);
  const router = useRouter();

  // Badge counts
  const newInquiryCount = useMemo(() => leads.filter((l) => l.status === 'NEW').length, [leads]);
  const waitlistedCount = useMemo(() => enrollments.filter((e) => e.paymentStatus === 'WAITLISTED').length, [enrollments]);
  const [pendingInvoiceCount, setPendingInvoiceCount] = useState(0);
  const [hasUnsavedCompose, setHasUnsavedCompose] = useState(false);

  // Fetch pending invoice count for badge
  useEffect(() => {
    fetch('/api/admin/payments')
      .then((r) => r.json())
      .then((json) => {
        if (json.invoices) {
          const pending = json.invoices.filter((inv: { status: string }) => inv.status === 'draft' || inv.status === 'open').length;
          setPendingInvoiceCount(pending);
        }
      })
      .catch((err) => console.error('Failed to load invoice count:', err));
  }, []);

  const handleComposeDirty = useCallback((dirty: boolean) => {
    setHasUnsavedCompose(dirty);
  }, []);

  // ── Cmd+K Search Palette ──
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette((prev) => !prev);
        setPaletteQuery('');
        setPaletteIndex(0);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (showPalette) paletteInputRef.current?.focus();
  }, [showPalette]);

  interface PaletteResult {
    id: string;
    label: string;
    detail?: string;
    action: () => void;
  }

  const paletteResults = useMemo((): PaletteResult[] => {
    const q = paletteQuery.toLowerCase().trim();
    const results: PaletteResult[] = [];

    // Quick actions (always available)
    const actions: PaletteResult[] = [
      { id: 'act-compose', label: 'Compose Email', action: () => { handleNavigate('emails-compose'); setShowPalette(false); } },
      { id: 'act-invoice', label: 'Create Invoice', detail: 'Open invoice dialog', action: () => { setTab('payments'); setShowPalette(false); } },
      { id: 'act-export', label: 'Export Students', detail: 'Download CSV', action: () => { downloadCsv(enrollments, scheduleMap); setShowPalette(false); } },
      { id: 'act-attendance', label: 'Take Attendance', detail: 'Go to Attendance tab', action: () => { setTab('students'); setShowPalette(false); } },
      { id: 'act-waitlist', label: 'Manage Waitlist', detail: 'View waitlisted students', action: () => { setTab('students'); setShowPalette(false); } },
      { id: 'act-scheduled', label: 'View Scheduled Emails', detail: 'Upcoming emails', action: () => { setTab('emails'); setShowPalette(false); } },
    ];

    // Tab navigation
    const tabs: PaletteResult[] = [
      { id: 'tab-overview', label: 'Go to Overview', action: () => { setTab('overview'); setShowPalette(false); } },
      { id: 'tab-students', label: 'Go to Students', action: () => { setTab('students'); setShowPalette(false); } },
      { id: 'tab-payments', label: 'Go to Payments', action: () => { setTab('payments'); setShowPalette(false); } },
      { id: 'tab-emails', label: 'Go to Emails', action: () => { setTab('emails'); setShowPalette(false); } },
      { id: 'tab-create', label: 'Go to Create', action: () => { setTab('create'); setShowPalette(false); } },
      { id: 'tab-materials', label: 'Go to Materials', action: () => { setTab('materials'); setShowPalette(false); } },
    ];

    if (!q) {
      return [...actions, ...tabs].slice(0, 8);
    }

    // Search students by email
    const matchedStudents = enrollments
      .filter((e) => e.email && e.email.toLowerCase().includes(q))
      .slice(0, 4)
      .map((e) => ({
        id: `student-${e.id}`,
        label: e.email || 'Unknown',
        detail: `${e.section.label} \u2022 ${e.paymentStatus}`,
        action: () => { setTab('students'); setShowPalette(false); },
      }));

    // Search leads by email/name
    const matchedLeads = leads
      .filter((l) => l.email.toLowerCase().includes(q) || (l.name || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map((l) => ({
        id: `lead-${l.id}`,
        label: l.name || l.email,
        detail: `Lead \u2022 ${l.status}`,
        action: () => { setTab('students'); setShowPalette(false); },
      }));

    // Filter actions/tabs
    const matchedActions = [...actions, ...tabs].filter((a) => a.label.toLowerCase().includes(q));

    results.push(...matchedStudents, ...matchedLeads, ...matchedActions);

    return results.slice(0, 8);
  }, [paletteQuery, enrollments, leads, scheduleMap]);

  useEffect(() => {
    setPaletteIndex(0);
  }, [paletteQuery]);

  function handlePaletteKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPaletteIndex((i) => Math.min(i + 1, paletteResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPaletteIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && paletteResults[paletteIndex]) {
      e.preventDefault();
      paletteResults[paletteIndex].action();
    } else if (e.key === 'Escape') {
      setShowPalette(false);
    }
  }

  function handleNavigate(target: string) {
    if (target === 'emails-compose') {
      const allEmails = enrollments
        .map((e) => e.email)
        .filter((e): e is string => !!e);
      setEmailComposeTo([...new Set(allEmails)].join(', '));
      setTab('emails');
    } else {
      setTab(target as Tab);
    }
  }

  function handleSendEmail(email: string, template?: string) {
    setEmailComposeTo(email);
    setEmailInitialTemplate(template || '');
    setTab('emails');
  }

  function handleEmailMaterial(materialId: string) {
    setPendingAttachmentIds([materialId]);
    setTab('emails');
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  return (
    <ToastProvider>
      <div className="admin-inner">
        {/* Cmd+K Search Palette */}
        {showPalette && (
          <div className="admin-palette-overlay" onClick={() => setShowPalette(false)}>
            <div className="admin-palette" onClick={(e) => e.stopPropagation()}>
              <input
                ref={paletteInputRef}
                type="text"
                className="admin-palette-input"
                placeholder="Search students, actions, tabs\u2026"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                onKeyDown={handlePaletteKeyDown}
              />
              <div className="admin-palette-results">
                {paletteResults.length === 0 ? (
                  <div className="admin-palette-empty">No results</div>
                ) : (
                  paletteResults.map((r, i) => (
                    <button
                      key={r.id}
                      className={`admin-palette-item ${i === paletteIndex ? 'admin-palette-item-active' : ''}`}
                      onClick={() => r.action()}
                      onMouseEnter={() => setPaletteIndex(i)}
                    >
                      <span className="admin-palette-item-label">{r.label}</span>
                      {r.detail && <span className="admin-palette-item-detail">{r.detail}</span>}
                    </button>
                  ))
                )}
              </div>
              <div className="admin-palette-footer">
                <kbd>\u2191\u2193</kbd> navigate <kbd>\u21B5</kbd> select <kbd>esc</kbd> close
              </div>
            </div>
          </div>
        )}

        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">{getGreeting()}</h1>
            <p className="admin-subtitle">Here&apos;s what&apos;s happening with your braille courses</p>
          </div>
          <button className="admin-signout-link" onClick={handleLogout}>Sign out</button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {(['overview', 'students', 'payments', 'emails', 'create', 'materials'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
              onClick={() => {
                if (tab === 'emails' && t !== 'emails' && hasUnsavedCompose) {
                  if (!window.confirm('You have an unsaved email draft. Leave anyway?')) return;
                }
                setTab(t);
                if (t !== 'emails') { setEmailComposeTo(''); setEmailInitialTemplate(''); setPendingAttachmentIds([]); }
              }}
            >
              <span className="admin-tab-icon">{TAB_META[t].icon}</span>
              {TAB_META[t].label}
              {t === 'students' && (newInquiryCount > 0 || waitlistedCount > 0) && (
                <span className={`admin-tab-badge ${waitlistedCount > 0 ? 'admin-tab-badge-orange' : 'admin-tab-badge-red'}`} />
              )}
              {t === 'payments' && pendingInvoiceCount > 0 && (
                <span className="admin-tab-badge admin-tab-badge-gold" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content with fade transition */}
        <div className="admin-tab-content" key={tab}>
          {tab === 'overview' && (
            <AdminOverviewTab
              sections={sections}
              enrollments={enrollments}
              leads={leads}
              scheduleMap={scheduleMap}
              onNavigate={handleNavigate}
            />
          )}

          {tab === 'students' && (
            <AdminStudentsTab
              sections={sections}
              enrollments={enrollments}
              leads={leads}
              scheduleMap={scheduleMap}
              onSendEmail={handleSendEmail}
            />
          )}

          {tab === 'payments' && (
            <AdminPaymentsTab enrollments={enrollments} />
          )}

          {tab === 'emails' && (
            <AdminEmailsTab
              enrollments={enrollments}
              initialComposeTo={emailComposeTo}
              initialTemplate={emailInitialTemplate}
              pendingAttachmentIds={pendingAttachmentIds}
              onClearAttachments={() => setPendingAttachmentIds([])}
              onComposeDirty={handleComposeDirty}
            />
          )}

          {tab === 'create' && (
            <AdminCreateTab onEmailMaterial={handleEmailMaterial} />
          )}

          {tab === 'materials' && (
            <AdminMaterialsTab onEmailMaterial={handleEmailMaterial} />
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
