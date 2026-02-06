'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminRefundDialog from './AdminRefundDialog';
import AdminInvoiceDialog from './AdminInvoiceDialog';
import type { PaymentsData, StripeCharge, StripeInvoice, Enrollment } from './admin-types';

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface Props {
  adminKey: string;
  enrollments: Enrollment[];
}

export default function AdminPaymentsTab({ adminKey, enrollments }: Props) {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refundCharge, setRefundCharge] = useState<StripeCharge | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/payments?key=${encodeURIComponent(adminKey)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (!data && !loading) fetchPayments();
  }, [data, loading, fetchPayments]);

  async function handleSendInvoice(inv: StripeInvoice) {
    if (!confirm(`Send this invoice to ${inv.customer?.email || 'the customer'}? It will be finalized and emailed.`)) return;
    try {
      const res = await fetch(`/api/admin/invoices/send?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: inv.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send invoice');
      fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice');
    }
  }

  async function handleVoidInvoice(inv: StripeInvoice) {
    if (!confirm(`Void this invoice for ${inv.customer?.email || 'the customer'}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/invoices/void?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: inv.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to void invoice');
      fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to void invoice');
    }
  }

  if (loading && !data) {
    return <div className="admin-payments-loading">Loading payment data from Stripe&hellip;</div>;
  }

  if (error && !data) {
    return (
      <div>
        <div className="admin-email-error">{error}</div>
        <button className="admin-refresh-btn" onClick={fetchPayments}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Summary Cards */}
      <div className="admin-payments-cards">
        <div className="admin-payments-card admin-payments-card-green">
          <div className="admin-payments-card-value">${data.summary.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="admin-payments-card-label">Revenue Collected</div>
        </div>
        <div className="admin-payments-card admin-payments-card-gold">
          <div className="admin-payments-card-value">${data.summary.pendingInvoices.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="admin-payments-card-label">Upcoming Charges</div>
        </div>
        <div className="admin-payments-card">
          <div className="admin-payments-card-value">${data.summary.stripeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="admin-payments-card-label">Processing Fees</div>
        </div>
        <div className="admin-payments-card admin-payments-card-navy">
          <div className="admin-payments-card-value">${data.summary.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="admin-payments-card-label">Take-Home Revenue</div>
        </div>
      </div>

      <div className="admin-payments-toolbar">
        <button className="admin-compose-btn" onClick={() => setShowInvoiceDialog(true)}>
          Create Invoice
        </button>
        <button className="admin-refresh-btn" onClick={fetchPayments} disabled={loading}>
          {loading ? 'Refreshing\u2026' : 'Refresh'}
        </button>
      </div>

      {/* Recent Payments */}
      <div className="admin-overview-section">
        <h3 className="admin-overview-section-title">Recent Payments</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.charges.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty">No payments found.</td></tr>
              ) : (
                data.charges.map((c) => (
                  <tr key={c.id}>
                    <td>{formatDate(c.created)}</td>
                    <td>{c.customer?.email || c.customer?.name || '\u2014'}</td>
                    <td>{formatCurrency(c.amount)}</td>
                    <td>
                      <span className={`admin-status admin-status-${c.status === 'succeeded' ? 'completed' : c.status === 'pending' ? 'pending' : 'waitlisted'}`}>
                        {c.status === 'succeeded' ? 'Successful' : c.status === 'pending' ? 'Processing' : 'Failed'}
                      </span>
                      {c.refunded && (
                        <span className="admin-status admin-status-waitlisted" style={{ marginLeft: 6 }}>
                          Refunded
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-payment-actions">
                        {c.receipt_url && (
                          <a
                            href={c.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-stripe-link"
                          >
                            Receipt
                          </a>
                        )}
                        {c.status === 'succeeded' && !c.refunded && (
                          <button
                            className="admin-refund-btn"
                            onClick={() => setRefundCharge(c)}
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      {data.invoices.length > 0 && (
        <div className="admin-overview-section">
          <h3 className="admin-overview-section-title">Invoices</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.customer?.email || inv.customer?.name || '\u2014'}</td>
                    <td>{formatCurrency(inv.amount_due)}</td>
                    <td>
                      <span className={`admin-invoice-badge admin-invoice-${inv.status}`}>
                        {inv.status_label}
                      </span>
                    </td>
                    <td>{formatDate(inv.created)}</td>
                    <td>
                      <div className="admin-payment-actions">
                        {inv.hosted_invoice_url && (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-stripe-link"
                          >
                            View
                          </a>
                        )}
                        {inv.status === 'draft' && (
                          <button
                            className="admin-send-btn"
                            onClick={() => handleSendInvoice(inv)}
                          >
                            Send
                          </button>
                        )}
                        {(inv.status === 'draft' || inv.status === 'open') && (
                          <button
                            className="admin-void-btn"
                            onClick={() => handleVoidInvoice(inv)}
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {refundCharge && (
        <AdminRefundDialog
          charge={refundCharge}
          adminKey={adminKey}
          onClose={() => setRefundCharge(null)}
          onSuccess={() => {
            setRefundCharge(null);
            fetchPayments();
          }}
        />
      )}

      {/* Invoice Dialog */}
      {showInvoiceDialog && (
        <AdminInvoiceDialog
          adminKey={adminKey}
          enrollments={enrollments}
          onClose={() => setShowInvoiceDialog(false)}
          onSuccess={() => {
            setShowInvoiceDialog(false);
            fetchPayments();
          }}
        />
      )}
    </>
  );
}
