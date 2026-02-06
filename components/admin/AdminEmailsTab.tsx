'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AdminEmailModal from './AdminEmailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { useToast } from './AdminToast';
import { SkeletonTable } from './AdminSkeleton';
import type { ResendEmail, ReceivedEmail, EmailDetail, Enrollment, Material } from './admin-types';
import { relativeTime, fullDate } from './admin-utils';

const EMAIL_TEMPLATES = [
  {
    label: 'Class Reminder',
    subject: 'Reminder: Upcoming Braille Class',
    body: `Hi there!\n\nThis is a friendly reminder that your braille class is coming up soon. Please make sure you have your materials ready.\n\nIf you have any questions, feel free to reply to this email.\n\nSee you in class!\nDelaney`,
  },
  {
    label: 'Payment Follow-up',
    subject: 'Reminder: Remaining Balance Due',
    body: `Hi there!\n\nThis is a friendly reminder that your remaining balance is due. Please check your email for the invoice, or reach out if you have any questions about your payment.\n\nThank you!\nDelaney`,
  },
  {
    label: 'Course Update',
    subject: 'Course Update',
    body: `Hi everyone!\n\nI wanted to share a quick update about our braille course.\n\n[Your update here]\n\nLooking forward to our next class!\nDelaney`,
  },
  {
    label: 'Welcome',
    subject: 'Welcome to the Braille Course!',
    body: `Welcome!\n\nThank you for enrolling in the summer braille course. I'm excited to have you in class!\n\nHere are a few things to know before we get started:\n\n- [Detail 1]\n- [Detail 2]\n- [Detail 3]\n\nFeel free to reply if you have any questions.\n\nBest,\nDelaney`,
  },
  {
    label: 'Inquiry Response',
    subject: 'Re: Braille Session Inquiry',
    body: `Hi there!\n\nThank you for reaching out about 1-on-1 braille sessions! I'd love to help.\n\nHere's what I offer:\n- [Session details]\n- [Pricing]\n- [Availability]\n\nWould you like to schedule a time to chat? Feel free to reply with any questions.\n\nBest,\nDelaney`,
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SentSortKey = 'date' | 'to' | 'subject' | 'status';
type ReceivedSortKey = 'date' | 'from' | 'subject';
type SortDir = 'asc' | 'desc';

interface Props {
  enrollments: Enrollment[];
  initialComposeTo?: string;
  initialTemplate?: string;
  pendingAttachmentIds?: string[];
  onClearAttachments?: () => void;
  onComposeDirty?: (dirty: boolean) => void;
}

export default function AdminEmailsTab({ enrollments, initialComposeTo, initialTemplate, pendingAttachmentIds, onClearAttachments, onComposeDirty }: Props) {
  const { showToast } = useToast();
  const [emailSubTab, setEmailSubTab] = useState<'sent' | 'received'>('sent');
  const [emails, setEmails] = useState<ResendEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(!!initialComposeTo);
  const [composeTo, setComposeTo] = useState(initialComposeTo || '');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeResult, setComposeResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedError, setReceivedError] = useState('');

  // Attachment state
  const [attachments, setAttachments] = useState<Material[]>([]);

  // Material picker state
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Last fetched
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // AI draft state
  const [showDraftInput, setShowDraftInput] = useState(false);
  const [draftBrief, setDraftBrief] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  // Sort/filter state for sent emails
  const [sentSearch, setSentSearch] = useState('');
  const [sentSortKey, setSentSortKey] = useState<SentSortKey>('date');
  const [sentSortDir, setSentSortDir] = useState<SortDir>('desc');
  const [sentStatusFilter, setSentStatusFilter] = useState<string>('all');

  // Sort/filter state for received emails
  const [receivedSearch, setReceivedSearch] = useState('');
  const [receivedSortKey, setReceivedSortKey] = useState<ReceivedSortKey>('date');
  const [receivedSortDir, setReceivedSortDir] = useState<SortDir>('desc');

  // Track compose dirty state
  useEffect(() => {
    const isDirty = showCompose && (composeTo.trim() !== '' || composeSubject.trim() !== '' || composeBody.trim() !== '');
    onComposeDirty?.(isDirty);
  }, [showCompose, composeTo, composeSubject, composeBody, onComposeDirty]);

  // Update composeTo when initialComposeTo changes (from student modal)
  useEffect(() => {
    if (initialComposeTo) {
      setComposeTo(initialComposeTo);
      setShowCompose(true);
    }
  }, [initialComposeTo]);

  // Fetch material metadata when pendingAttachmentIds arrives
  useEffect(() => {
    if (pendingAttachmentIds && pendingAttachmentIds.length > 0) {
      setShowCompose(true);
      setEmailSubTab('sent');
      Promise.all(
        pendingAttachmentIds.map((id) =>
          fetch('/api/admin/materials')
            .then((r) => r.json())
            .then((json) => (json.materials as Material[]).find((m) => m.id === id))
        )
      ).then((results) => {
        setAttachments(results.filter((m): m is Material => !!m));
      });
    }
  }, [pendingAttachmentIds]);

  // Auto-select template when initialTemplate is passed (from prospective leads)
  useEffect(() => {
    if (initialTemplate) {
      const template = EMAIL_TEMPLATES.find((t) => t.label === initialTemplate);
      if (template) {
        setSelectedTemplate(template.label);
        setComposeSubject(template.subject);
        setComposeBody(template.body);
        setShowCompose(true);
        setEmailSubTab('sent');
      }
    }
  }, [initialTemplate]);

  // Close material picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMaterialPicker(false);
      }
    }
    if (showMaterialPicker) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showMaterialPicker]);

  async function fetchMaterials() {
    setMaterialsLoading(true);
    try {
      const res = await fetch('/api/admin/materials');
      const json = await res.json();
      if (res.ok) setAllMaterials(json.materials);
    } catch { /* ignore */ }
    finally { setMaterialsLoading(false); }
  }

  function handleTogglePicker() {
    if (!showMaterialPicker && allMaterials.length === 0) {
      fetchMaterials();
    }
    setShowMaterialPicker(!showMaterialPicker);
  }

  function handleAttachMaterial(material: Material) {
    if (!attachments.find((a) => a.id === material.id)) {
      setAttachments((prev) => [...prev, material]);
    }
  }

  async function handleDraftWithAI() {
    if (!draftBrief.trim()) return;
    setDraftLoading(true);
    try {
      const res = await fetch('/api/admin/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: draftBrief }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to draft');
      setComposeSubject(json.subject);
      setComposeBody(json.body);
      setShowDraftInput(false);
      setDraftBrief('');
      showToast('AI draft ready — edit as needed');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to draft email', 'error');
    } finally {
      setDraftLoading(false);
    }
  }

  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true);
    setEmailsError('');
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setEmails(data.emails);
      setLastFetched(new Date());
    } catch (err: unknown) {
      setEmailsError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setEmailsLoading(false);
    }
  }, []);

  const fetchReceivedEmails = useCallback(async () => {
    setReceivedLoading(true);
    setReceivedError('');
    try {
      const res = await fetch('/api/admin/emails/received');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setReceivedEmails(data.emails);
    } catch (err: unknown) {
      setReceivedError(err instanceof Error ? err.message : 'Failed to load received emails');
    } finally {
      setReceivedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (emailSubTab === 'sent' && emails.length === 0 && !emailsLoading) {
      fetchEmails();
    }
  }, [emailSubTab, emails.length, emailsLoading, fetchEmails]);

  useEffect(() => {
    if (emailSubTab === 'received' && receivedEmails.length === 0 && !receivedLoading && !receivedError) {
      fetchReceivedEmails();
    }
  }, [emailSubTab, receivedEmails.length, receivedLoading, receivedError, fetchReceivedEmails]);

  async function openEmailDetail(id: string) {
    setEmailDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/admin/emails/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSelectedEmail(data.email);
    } catch {
      /* modal won't open */
    } finally {
      setEmailDetailLoading(false);
    }
  }

  async function openReceivedEmailDetail(id: string) {
    setEmailDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/admin/emails/received/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSelectedEmail(data.email);
    } catch {
      /* modal won't open */
    } finally {
      setEmailDetailLoading(false);
    }
  }

  async function doSendEmail() {
    setComposeSending(true);
    setComposeResult(null);
    try {
      const recipients = composeTo.split(',').map((s) => s.trim()).filter(Boolean);
      const payload: Record<string, unknown> = { to: recipients, subject: composeSubject, body: composeBody };
      if (attachments.length > 0) {
        payload.attachmentIds = attachments.map((a) => a.id);
      }
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      showToast('Email sent successfully');
      setComposeResult(null);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setSelectedTemplate('');
      setAttachments([]);
      setShowMaterialPicker(false);
      setShowDraftInput(false);
      setDraftBrief('');
      onClearAttachments?.();
      setShowCompose(false);
      fetchEmails();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send', 'error');
      setComposeResult(null);
    } finally {
      setComposeSending(false);
    }
  }

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const recipients = composeTo.split(',').map((s) => s.trim()).filter(Boolean);
    if (recipients.length >= 3) {
      setShowSendConfirm(true);
    } else {
      doSendEmail();
    }
  }

  function handleTemplateChange(value: string) {
    setSelectedTemplate(value);
    if (value) {
      const template = EMAIL_TEMPLATES.find((t) => t.label === value);
      if (template) {
        setComposeSubject(template.subject);
        setComposeBody(template.body);
      }
    }
  }

  function handleReply(email: EmailDetail) {
    const sender = email.from;
    setComposeTo(sender);
    setComposeSubject(email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`);
    const quotedText = email.text || '';
    setComposeBody(`\n\n---\nOn ${fullDate(email.created_at)}, ${sender} wrote:\n\n${quotedText}`);
    setShowCompose(true);
    setEmailSubTab('sent');
    setSelectedTemplate('');
  }

  function handleForward(email: EmailDetail) {
    setComposeTo('');
    setComposeSubject(email.subject.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`);
    const quotedText = email.text || '';
    setComposeBody(`\n\n---\nForwarded message:\nFrom: ${email.from}\nDate: ${fullDate(email.created_at)}\nSubject: ${email.subject}\n\n${quotedText}`);
    setShowCompose(true);
    setEmailSubTab('sent');
    setSelectedTemplate('');
  }

  // Only course students (from enrollment DB), not 1-1 invoice-only customers
  const courseStudentEmails = enrollments.map((e) => e.email).filter((e): e is string => !!e);
  const uniqueEmails = [...new Set(courseStudentEmails)];

  // Delivery stats
  const sentCount = emails.length;
  const deliveredCount = emails.filter((e) => e.last_event === 'delivered' || e.last_event === 'opened' || e.last_event === 'clicked').length;
  const openedCount = emails.filter((e) => e.last_event === 'opened' || e.last_event === 'clicked').length;
  const bouncedCount = emails.filter((e) => e.last_event === 'bounced' || e.last_event === 'complained').length;

  // Sort helpers
  function handleSentSort(key: SentSortKey) {
    if (sentSortKey === key) {
      setSentSortDir(sentSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSentSortKey(key);
      setSentSortDir(key === 'date' ? 'desc' : 'asc');
    }
  }

  function handleReceivedSort(key: ReceivedSortKey) {
    if (receivedSortKey === key) {
      setReceivedSortDir(receivedSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setReceivedSortKey(key);
      setReceivedSortDir(key === 'date' ? 'desc' : 'asc');
    }
  }

  function sortArrow(active: boolean, dir: SortDir) {
    if (!active) return '';
    return dir === 'asc' ? ' \u2191' : ' \u2193';
  }

  // Unique statuses for filter
  const sentStatuses = useMemo(() => {
    const s = new Set(emails.map((e) => e.last_event || 'queued'));
    return ['all', ...Array.from(s)];
  }, [emails]);

  // Filtered + sorted sent emails
  const filteredSentEmails = useMemo(() => {
    let list = [...emails];

    // Status filter
    if (sentStatusFilter !== 'all') {
      list = list.filter((e) => (e.last_event || 'queued') === sentStatusFilter);
    }

    // Search
    if (sentSearch.trim()) {
      const q = sentSearch.toLowerCase();
      list = list.filter((e) => {
        const to = Array.isArray(e.to) ? e.to.join(', ') : e.to;
        return (
          to.toLowerCase().includes(q) ||
          (e.subject || '').toLowerCase().includes(q) ||
          (e.last_event || 'queued').toLowerCase().includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sentSortKey) {
        case 'date':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'to': {
          const aTo = Array.isArray(a.to) ? a.to.join(', ') : a.to;
          const bTo = Array.isArray(b.to) ? b.to.join(', ') : b.to;
          cmp = aTo.localeCompare(bTo);
          break;
        }
        case 'subject':
          cmp = (a.subject || '').localeCompare(b.subject || '');
          break;
        case 'status':
          cmp = (a.last_event || 'queued').localeCompare(b.last_event || 'queued');
          break;
      }
      return sentSortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [emails, sentSearch, sentSortKey, sentSortDir, sentStatusFilter]);

  // Filtered + sorted received emails
  const filteredReceivedEmails = useMemo(() => {
    let list = [...receivedEmails];

    if (receivedSearch.trim()) {
      const q = receivedSearch.toLowerCase();
      list = list.filter((e) =>
        e.from.toLowerCase().includes(q) ||
        (e.subject || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (receivedSortKey) {
        case 'date':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'from':
          cmp = a.from.localeCompare(b.from);
          break;
        case 'subject':
          cmp = (a.subject || '').localeCompare(b.subject || '');
          break;
      }
      return receivedSortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [receivedEmails, receivedSearch, receivedSortKey, receivedSortDir]);

  // Unattached materials for picker
  const attachedIds = new Set(attachments.map((a) => a.id));
  const unattachedMaterials = allMaterials.filter((m) => !attachedIds.has(m.id));

  return (
    <>
      {/* Delivery Stats Bar */}
      {emails.length > 0 && (
        <div className="admin-delivery-stats">
          <span className="admin-delivery-pill">{sentCount} Sent</span>
          <span className="admin-delivery-pill admin-delivery-delivered">{deliveredCount} Delivered</span>
          <span className="admin-delivery-pill admin-delivery-opened">{openedCount} Opened</span>
          {bouncedCount > 0 && (
            <span className="admin-delivery-pill admin-delivery-bounced">{bouncedCount} Bounced</span>
          )}
        </div>
      )}

      {/* Sub-toggle: Sent / Received */}
      <div className="admin-email-subtabs">
        <button
          className={`admin-email-subtab ${emailSubTab === 'sent' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setEmailSubTab('sent')}
        >
          Sent
        </button>
        <button
          className={`admin-email-subtab ${emailSubTab === 'received' ? 'admin-email-subtab-active' : ''}`}
          onClick={() => setEmailSubTab('received')}
        >
          Received
        </button>
      </div>

      {/* SENT sub-tab */}
      {emailSubTab === 'sent' && (
        <>
          <div className="admin-email-actions">
            <button
              onClick={() => { setShowCompose(!showCompose); setComposeResult(null); }}
              className="admin-compose-btn"
            >
              {showCompose ? 'Cancel' : 'Compose Email'}
            </button>
            <button onClick={fetchEmails} className="admin-refresh-btn" disabled={emailsLoading}>
              {emailsLoading ? 'Loading\u2026' : 'Refresh'}
            </button>
            {lastFetched && (
              <span className="admin-last-updated">
                {(() => {
                  const secs = Math.floor((Date.now() - lastFetched.getTime()) / 1000);
                  if (secs < 60) return 'Updated just now';
                  return `Updated ${Math.floor(secs / 60)}m ago`;
                })()}
              </span>
            )}
          </div>

          {showCompose && (
            <div className="admin-compose">
              <form onSubmit={handleSendEmail}>
                {/* Template + AI Draft row */}
                <div className="admin-compose-field">
                  <label>Template</label>
                  <div className="admin-compose-template-row">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="admin-select"
                      style={{ flex: 1 }}
                    >
                      <option value="">Start from scratch</option>
                      {EMAIL_TEMPLATES.map((t) => (
                        <option key={t.label} value={t.label}>{t.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="admin-ai-draft-btn"
                      onClick={() => setShowDraftInput(!showDraftInput)}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1L6 6l-5 .7 3.6 3.5-.9 5L8 13l4.3 2.2-.9-5L15 6.7 10 6 8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                      </svg>
                      Draft with AI
                    </button>
                  </div>
                </div>

                {/* AI Draft input */}
                {showDraftInput && (
                  <div className="admin-compose-field admin-ai-draft-field">
                    <label>Describe what this email should say&hellip;</label>
                    <div className="admin-ai-draft-row">
                      <input
                        type="text"
                        value={draftBrief}
                        onChange={(e) => setDraftBrief(e.target.value)}
                        placeholder="e.g. Remind students about next week's class and what to bring"
                        className="admin-compose-input"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDraftWithAI(); } }}
                      />
                      <button
                        type="button"
                        className="admin-send-btn"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={handleDraftWithAI}
                        disabled={draftLoading || !draftBrief.trim()}
                      >
                        {draftLoading ? 'Drafting\u2026' : 'Generate'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-compose-field">
                  <label>To</label>
                  <div className="admin-compose-to-row">
                    <input
                      type="text"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="email@example.com, email2@example.com"
                      className="admin-compose-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setComposeTo(uniqueEmails.join(', '))}
                      className="admin-fill-all-btn"
                    >
                      All Course Students ({uniqueEmails.length})
                    </button>
                  </div>
                </div>
                <div className="admin-compose-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject line"
                    className="admin-compose-input"
                    required
                  />
                </div>
                <div className="admin-compose-field">
                  <label>Body (plain text &mdash; wrapped in branded template)</label>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your email here\u2026"
                    className="admin-compose-textarea"
                    rows={8}
                    required
                  />
                </div>

                {/* Attachments section — always visible */}
                <div className="admin-compose-field">
                  <label>Attachments</label>
                  <div className="admin-material-picker" ref={pickerRef}>
                    {/* Existing attachment tags */}
                    {attachments.length > 0 && (
                      <div className="admin-material-picker-tags">
                        {attachments.map((a) => (
                          <span key={a.id} className="admin-material-picker-tag">
                            {a.filename}
                            <button
                              type="button"
                              onClick={() => setAttachments((prev) => prev.filter((m) => m.id !== a.id))}
                              className="admin-material-picker-tag-remove"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className="admin-compose-btn"
                      style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                      onClick={handleTogglePicker}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Attach Material
                    </button>

                    {/* Dropdown */}
                    {showMaterialPicker && (
                      <div className="admin-material-picker-dropdown">
                        {materialsLoading ? (
                          <div className="admin-material-picker-empty">Loading materials&hellip;</div>
                        ) : unattachedMaterials.length === 0 ? (
                          <div className="admin-material-picker-empty">
                            {allMaterials.length === 0 ? 'No materials uploaded yet' : 'All materials attached'}
                          </div>
                        ) : (
                          unattachedMaterials.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              className="admin-material-picker-item"
                              onClick={() => handleAttachMaterial(m)}
                            >
                              <span className="admin-material-picker-item-name">{m.filename}</span>
                              <span className="admin-material-picker-item-meta">
                                <span className="admin-category-badge" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{m.category}</span>
                                {formatFileSize(m.size)}
                              </span>
                            </button>
                          ))
                        )}
                        <button
                          type="button"
                          className="admin-material-picker-refresh"
                          onClick={fetchMaterials}
                        >
                          Refresh list
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-compose-actions">
                  <button type="submit" className="admin-send-btn" disabled={composeSending}>
                    {composeSending ? 'Sending\u2026' : attachments.length > 0 ? `Send Email (${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : 'Send Email'}
                  </button>
                  {composeResult && (
                    <span className={`admin-compose-result ${composeResult.ok ? 'admin-compose-success' : 'admin-compose-error'}`}>
                      {composeResult.msg}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {emailsError && <div className="admin-email-error">{emailsError}</div>}

          {/* Search and filter bar for sent emails */}
          {emails.length > 0 && (
            <div className="admin-email-filter-bar">
              <input
                type="text"
                className="admin-email-search"
                placeholder="Search by recipient, subject&hellip;"
                value={sentSearch}
                onChange={(e) => setSentSearch(e.target.value)}
              />
              <select
                className="admin-select admin-email-status-filter"
                value={sentStatusFilter}
                onChange={(e) => setSentStatusFilter(e.target.value)}
              >
                {sentStatuses.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <span className="admin-result-count">
                {filteredSentEmails.length} of {emails.length}
              </span>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-sortable-th" onClick={() => handleSentSort('to')}>
                    To{sortArrow(sentSortKey === 'to', sentSortDir)}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSentSort('subject')}>
                    Subject{sortArrow(sentSortKey === 'subject', sentSortDir)}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSentSort('status')}>
                    Status{sortArrow(sentSortKey === 'status', sentSortDir)}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleSentSort('date')}>
                    Date{sortArrow(sentSortKey === 'date', sentSortDir)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {emailsLoading && emails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty"><SkeletonTable rows={4} cols={4} /></td></tr>
                ) : filteredSentEmails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">{sentSearch || sentStatusFilter !== 'all' ? 'No matching emails' : 'No emails sent yet'}</p><p className="admin-empty-state-sub">{sentSearch || sentStatusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Compose your first email to get started.'}</p>{!sentSearch && sentStatusFilter === 'all' && <button className="admin-empty-state-cta" onClick={() => { setShowCompose(true); setComposeResult(null); }}>Compose Email</button>}</div></td></tr>
                ) : (
                  filteredSentEmails.map((em) => (
                    <tr key={em.id} className="admin-email-row" onClick={() => openEmailDetail(em.id)}>
                      <td>{Array.isArray(em.to) ? em.to.join(', ') : em.to}</td>
                      <td>{em.subject || '(no subject)'}</td>
                      <td>
                        <span className={`admin-email-status admin-email-status-${(em.last_event || 'queued').toLowerCase()}`}>
                          {em.last_event || 'queued'}
                        </span>
                      </td>
                      <td title={fullDate(em.created_at)}>{relativeTime(em.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* RECEIVED sub-tab */}
      {emailSubTab === 'received' && (
        <>
          <div className="admin-email-actions">
            <button onClick={fetchReceivedEmails} className="admin-refresh-btn" disabled={receivedLoading}>
              {receivedLoading ? 'Loading\u2026' : 'Refresh'}
            </button>
          </div>

          {receivedError && <div className="admin-email-error">{receivedError}</div>}

          {/* Search bar for received emails */}
          {receivedEmails.length > 0 && (
            <div className="admin-email-filter-bar">
              <input
                type="text"
                className="admin-email-search"
                placeholder="Search by sender, subject&hellip;"
                value={receivedSearch}
                onChange={(e) => setReceivedSearch(e.target.value)}
              />
              <span className="admin-result-count">
                {filteredReceivedEmails.length} of {receivedEmails.length}
              </span>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-sortable-th" onClick={() => handleReceivedSort('from')}>
                    From{sortArrow(receivedSortKey === 'from', receivedSortDir)}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleReceivedSort('subject')}>
                    Subject{sortArrow(receivedSortKey === 'subject', receivedSortDir)}
                  </th>
                  <th className="admin-sortable-th" onClick={() => handleReceivedSort('date')}>
                    Date{sortArrow(receivedSortKey === 'date', receivedSortDir)}
                  </th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {receivedLoading && receivedEmails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty"><SkeletonTable rows={4} cols={4} /></td></tr>
                ) : filteredReceivedEmails.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">{receivedSearch ? 'No matching emails' : 'No received emails'}</p><p className="admin-empty-state-sub">{receivedSearch ? 'Try adjusting your search.' : 'Emails sent to your course address will appear here.'}</p></div></td></tr>
                ) : (
                  filteredReceivedEmails.map((em) => (
                    <tr key={em.id} className="admin-email-row" onClick={() => openReceivedEmailDetail(em.id)}>
                      <td>{em.from}</td>
                      <td>{em.subject || '(no subject)'}</td>
                      <td title={fullDate(em.created_at)}>{relativeTime(em.created_at)}</td>
                      <td>
                        {em.attachments && em.attachments.length > 0 ? (
                          <span className="admin-attachment-badge">{em.attachments.length}</span>
                        ) : '\u2014'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Email detail modal */}
      <AdminEmailModal
        email={selectedEmail}
        loading={emailDetailLoading}
        onClose={() => { setSelectedEmail(null); setEmailDetailLoading(false); }}
        onReply={handleReply}
        onForward={handleForward}
      />

      {/* Mass send confirmation dialog */}
      {showSendConfirm && (
        <AdminConfirmDialog
          title="Send to Multiple Recipients"
          message={`You're about to send this email to ${composeTo.split(',').map((s) => s.trim()).filter(Boolean).length} recipients. Continue?`}
          confirmLabel="Send Email"
          confirmVariant="primary"
          loading={composeSending}
          onConfirm={() => {
            setShowSendConfirm(false);
            doSendEmail();
          }}
          onCancel={() => setShowSendConfirm(false)}
        />
      )}
    </>
  );
}
