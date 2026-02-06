'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider } from './AdminToast';
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
              onClick={() => { setTab(t); if (t !== 'emails') { setEmailComposeTo(''); setEmailInitialTemplate(''); setPendingAttachmentIds([]); } }}
            >
              <span className="admin-tab-icon">{TAB_META[t].icon}</span>
              {TAB_META[t].label}
              {t === 'students' && newInquiryCount > 0 && (
                <span className="admin-tab-badge admin-tab-badge-red" />
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
