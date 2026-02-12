'use client';

import { useState, useRef, useEffect } from 'react';
import type { Enrollment } from './admin-types';

interface Props {
  enrollments: Enrollment[];
  onClose: () => void;
  onSuccess: () => void;
}

const TERMS_OPTIONS = [
  { label: 'Due on receipt', days: 0 },
  { label: 'Net 7', days: 7 },
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 60', days: 60 },
];

export default function AdminInvoiceDialog({ enrollments, onClose, onSuccess }: Props) {
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

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueInDays, setDueInDays] = useState(30);
  const [memo, setMemo] = useState('');
  const [sendNow, setSendNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Deduplicate enrolled emails for autocomplete
  const uniqueStudents = Array.from(new Map(enrollments.filter((e) => e.email).map((e) => [e.email!, e])).values());

  const filtered =
    email.length > 0 ? uniqueStudents.filter((e) => e.email!.toLowerCase().includes(email.toLowerCase())) : [];

  // Close autocomplete when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelectStudent(student: Enrollment) {
    setEmail(student.email!);
    setName(''); // enrolled students already have Stripe customers
    setShowAutocomplete(false);
  }

  async function handleCreate() {
    setError('');

    if (!email || !description || !amount) {
      setError('Please fill in email, description, and amount.');
      return;
    }

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount greater than $0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          description,
          amount: parsed,
          dueInDays,
          memo: memo || undefined,
          sendNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Send invoice">
      <div className="admin-invoice-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>
          &times;
        </button>

        <h3 className="admin-invoice-title">Create Invoice</h3>

        {/* Client Email with Autocomplete */}
        <div className="admin-refund-field">
          <label>Client Email *</label>
          <div className="admin-invoice-autocomplete" ref={autocompleteRef}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              placeholder="client@example.com"
              className="admin-compose-input"
              autoFocus
            />
            {showAutocomplete && filtered.length > 0 && (
              <ul className="admin-invoice-autocomplete-list">
                {filtered.slice(0, 6).map((s) => (
                  <li key={s.id} className="admin-invoice-autocomplete-item" onClick={() => handleSelectStudent(s)}>
                    <span>{s.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Client Name */}
        <div className="admin-refund-field">
          <label>Client Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="For new clients not in the system"
            className="admin-compose-input"
          />
        </div>

        {/* Description */}
        <div className="admin-refund-field">
          <label>Description *</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="1-on-1 Braille Session"
            className="admin-compose-input"
          />
        </div>

        {/* Amount */}
        <div className="admin-refund-field">
          <label>Amount *</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: '0.88rem',
              }}
            >
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="admin-compose-input"
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Payment Terms */}
        <div className="admin-refund-field">
          <label>Payment Terms</label>
          <select
            value={dueInDays}
            onChange={(e) => setDueInDays(Number(e.target.value))}
            className="admin-select"
            style={{ width: '100%' }}
          >
            {TERMS_OPTIONS.map((opt) => (
              <option key={opt.days} value={opt.days}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Memo */}
        <div className="admin-refund-field">
          <label>Memo</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Additional notes for the invoice..."
            className="admin-compose-input"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Send Now */}
        <div className="admin-refund-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
            Send immediately
          </label>
          {!sendNow && (
            <div className="admin-invoice-draft-hint">
              Invoice will be saved as draft. You can send it later from the invoices table.
            </div>
          )}
        </div>

        {error && <div className="admin-email-error">{error}</div>}

        <div className="admin-refund-actions">
          <button className="admin-refresh-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="admin-invoice-create-btn" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating\u2026' : sendNow ? 'Create & Send Invoice' : 'Create Draft Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
