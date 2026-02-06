'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminOverviewTab from './AdminOverviewTab';
import AdminStudentsTab from './AdminStudentsTab';
import AdminPaymentsTab from './AdminPaymentsTab';
import AdminEmailsTab from './AdminEmailsTab';
import AdminMaterialsTab from './AdminMaterialsTab';
import type { AdminProps } from './admin-types';

type Tab = 'overview' | 'students' | 'payments' | 'emails' | 'materials';

export default function AdminDashboard({ sections, enrollments, leads, scheduleMap }: AdminProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [emailComposeTo, setEmailComposeTo] = useState('');
  const [emailInitialTemplate, setEmailInitialTemplate] = useState('');
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);
  const router = useRouter();

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
    <div className="admin-inner">
      <div className="admin-header-row">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button className="admin-logout-btn" onClick={handleLogout}>Sign Out</button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(['overview', 'students', 'payments', 'emails', 'materials'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
            onClick={() => { setTab(t); if (t !== 'emails') { setEmailComposeTo(''); setEmailInitialTemplate(''); setPendingAttachmentIds([]); } }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
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

      {tab === 'materials' && (
        <AdminMaterialsTab onEmailMaterial={handleEmailMaterial} />
      )}
    </div>
  );
}
