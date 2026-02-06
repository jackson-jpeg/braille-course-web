'use client';

import { useState } from 'react';
import AdminOverviewTab from './AdminOverviewTab';
import AdminStudentsTab from './AdminStudentsTab';
import AdminPaymentsTab from './AdminPaymentsTab';
import AdminEmailsTab from './AdminEmailsTab';
import type { AdminProps } from './admin-types';

type Tab = 'overview' | 'students' | 'payments' | 'emails';

export default function AdminDashboard({ sections, enrollments, scheduleMap, adminKey }: AdminProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [emailComposeTo, setEmailComposeTo] = useState('');

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

  function handleSendEmail(email: string) {
    setEmailComposeTo(email);
    setTab('emails');
  }

  return (
    <div className="admin-inner">
      <h1 className="admin-title">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="admin-tabs">
        {(['overview', 'students', 'payments', 'emails'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
            onClick={() => { setTab(t); if (t !== 'emails') setEmailComposeTo(''); }}
          >
            {t === 'overview' ? 'Overview' : t === 'students' ? 'Students' : t === 'payments' ? 'Payments' : 'Emails'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <AdminOverviewTab
          sections={sections}
          enrollments={enrollments}
          scheduleMap={scheduleMap}
          adminKey={adminKey}
          onNavigate={handleNavigate}
        />
      )}

      {tab === 'students' && (
        <AdminStudentsTab
          sections={sections}
          enrollments={enrollments}
          scheduleMap={scheduleMap}
          adminKey={adminKey}
          onSendEmail={handleSendEmail}
        />
      )}

      {tab === 'payments' && (
        <AdminPaymentsTab adminKey={adminKey} enrollments={enrollments} />
      )}

      {tab === 'emails' && (
        <AdminEmailsTab
          adminKey={adminKey}
          enrollments={enrollments}
          initialComposeTo={emailComposeTo}
        />
      )}
    </div>
  );
}
