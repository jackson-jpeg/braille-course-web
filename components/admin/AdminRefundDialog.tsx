'use client';

import { useState, useEffect } from 'react';
import type { StripeCharge } from './admin-types';

interface Props {
  charge: StripeCharge;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminRefundDialog({ charge, onClose, onSuccess }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const [reason, setReason] = useState('requested_by_customer');
  const [customAmount, setCustomAmount] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxRefund = (charge.amount - charge.amount_refunded) / 100;
  const refundAmount = isPartial && customAmount ? parseFloat(customAmount) : maxRefund;

  async function handleRefund() {
    setLoading(true);
    setError('');

    if (isPartial && (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > maxRefund)) {
      setError(`Amount must be between $0.01 and $${maxRefund.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const body: { chargeId: string; confirm: true; reason: string; amount?: number } = {
        chargeId: charge.id,
        confirm: true,
        reason,
      };
      if (isPartial && customAmount) {
        body.amount = refundAmount;
      }

      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund failed');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue refund');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-refund-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>
          &times;
        </button>

        <h3 className="admin-refund-title">Issue Refund</h3>

        <div className="admin-refund-warning">
          This action cannot be undone. The refund will be processed through Stripe and may take 5&ndash;10 business
          days to appear on the student&rsquo;s statement.
        </div>

        <div className="admin-refund-details">
          <div className="admin-refund-row">
            <span>Original charge</span>
            <strong>${(charge.amount / 100).toFixed(2)}</strong>
          </div>
          {charge.amount_refunded > 0 && (
            <div className="admin-refund-row">
              <span>Already refunded</span>
              <span>${(charge.amount_refunded / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="admin-refund-row">
            <span>Refundable</span>
            <strong>${maxRefund.toFixed(2)}</strong>
          </div>
          {charge.customer && (
            <div className="admin-refund-row">
              <span>Student</span>
              <span>{charge.customer.email || charge.customer.name || charge.customer.id}</span>
            </div>
          )}
        </div>

        <div className="admin-refund-field">
          <label>
            <input type="checkbox" checked={isPartial} onChange={(e) => setIsPartial(e.target.checked)} /> Partial
            refund
          </label>
          {isPartial && (
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxRefund}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`Up to $${maxRefund.toFixed(2)}`}
              className="admin-compose-input"
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div className="admin-refund-field">
          <label>Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="admin-select"
            style={{ width: '100%' }}
          >
            <option value="requested_by_customer">Requested by student</option>
            <option value="duplicate">Duplicate charge</option>
            <option value="fraudulent">Fraudulent</option>
          </select>
        </div>

        {error && <div className="admin-email-error">{error}</div>}

        <div className="admin-refund-actions">
          <button className="admin-refresh-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="admin-refund-confirm" onClick={handleRefund} disabled={loading}>
            {loading
              ? 'Processing\u2026'
              : `Refund $${(isPartial && customAmount ? refundAmount : maxRefund).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
