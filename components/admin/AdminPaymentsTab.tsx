'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminRefundDialog from './AdminRefundDialog';
import AdminInvoiceDialog from './AdminInvoiceDialog';
import AdminConfirmDialog from './AdminConfirmDialog';
import CopyButton from './CopyButton';
import { useToast } from './AdminToast';
import { SkeletonCards, SkeletonTable } from './AdminSkeleton';
import type {
  PaymentsData, StripeCharge, StripeInvoice, Enrollment,
  PayoutsData, StripeCoupon, StripePaymentLink,
} from './admin-types';
import { formatDate, formatCurrency, sortArrow, lastUpdatedText } from './admin-utils';

type PaymentSubTab = 'overview' | 'payouts' | 'coupons' | 'links';

interface ConfirmAction {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'primary';
  onConfirm: () => Promise<void>;
}

type ChargeSortKey = 'date' | 'student' | 'amount' | 'status';
type InvoiceSortKey = 'student' | 'amount' | 'status' | 'date';
type CouponSortKey = 'name' | 'discount' | 'redeemed' | 'status';
type LinkSortKey = 'name' | 'amount' | 'status';

interface Props {
  enrollments: Enrollment[];
}

export default function AdminPaymentsTab({ enrollments }: Props) {
  const { showToast } = useToast();
  const [paymentSubTab, setPaymentSubTab] = useState<PaymentSubTab>('overview');
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refundCharge, setRefundCharge] = useState<StripeCharge | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [loadingMoreCharges, setLoadingMoreCharges] = useState(false);
  const [loadingMoreInvoices, setLoadingMoreInvoices] = useState(false);

  // Payouts state
  const [payoutsData, setPayoutsData] = useState<PayoutsData | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // Coupons state
  const [coupons, setCoupons] = useState<StripeCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [couponName, setCouponName] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'amount'>('percent');
  const [couponValue, setCouponValue] = useState('');
  const [couponPromoCode, setCouponPromoCode] = useState('');
  const [couponCreating, setCouponCreating] = useState(false);

  // Payment Links state
  const [paymentLinks, setPaymentLinks] = useState<StripePaymentLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [linkAllowPromo, setLinkAllowPromo] = useState(false);
  const [linkCreating, setLinkCreating] = useState(false);

  // Coupon inline edit state
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [editingCouponName, setEditingCouponName] = useState('');

  // Search + sort for charges
  const [chargeSearch, setChargeSearch] = useState('');
  const [chargeSortKey, setChargeSortKey] = useState<ChargeSortKey>('date');
  const [chargeSortDir, setChargeSortDir] = useState<'asc' | 'desc'>('desc');

  // Sort for invoices
  const [invoiceSortKey, setInvoiceSortKey] = useState<InvoiceSortKey>('date');
  const [invoiceSortDir, setInvoiceSortDir] = useState<'asc' | 'desc'>('desc');

  // Sort for coupons
  const [couponSortKey, setCouponSortKey] = useState<CouponSortKey>('name');
  const [couponSortDir, setCouponSortDir] = useState<'asc' | 'desc'>('asc');

  // Sort for payment links
  const [linkSortKey, setLinkSortKey] = useState<LinkSortKey>('name');
  const [linkSortDir, setLinkSortDir] = useState<'asc' | 'desc'>('asc');

  // Last fetched timestamp
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payments');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData(json);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data && !loading) fetchPayments();
  }, [data, loading, fetchPayments]);

  // Fetch payouts when sub-tab opens
  useEffect(() => {
    if (paymentSubTab === 'payouts' && !payoutsData && !payoutsLoading) {
      setPayoutsLoading(true);
      fetch('/api/admin/payments/payouts')
        .then((r) => r.json())
        .then((json) => setPayoutsData(json))
        .catch((err) => console.error('Failed to fetch payouts:', err))
        .finally(() => setPayoutsLoading(false));
    }
  }, [paymentSubTab, payoutsData, payoutsLoading]);

  // Fetch coupons when sub-tab opens
  useEffect(() => {
    if (paymentSubTab === 'coupons' && coupons.length === 0 && !couponsLoading) {
      setCouponsLoading(true);
      fetch('/api/admin/payments/coupons')
        .then((r) => r.json())
        .then((json) => setCoupons(json.coupons || []))
        .catch((err) => console.error('Failed to fetch coupons:', err))
        .finally(() => setCouponsLoading(false));
    }
  }, [paymentSubTab, coupons.length, couponsLoading]);

  // Fetch links when sub-tab opens
  useEffect(() => {
    if (paymentSubTab === 'links' && paymentLinks.length === 0 && !linksLoading) {
      setLinksLoading(true);
      fetch('/api/admin/payments/links')
        .then((r) => r.json())
        .then((json) => setPaymentLinks(json.links || []))
        .catch((err) => console.error('Failed to fetch payment links:', err))
        .finally(() => setLinksLoading(false));
    }
  }, [paymentSubTab, paymentLinks.length, linksLoading]);

  async function loadMoreCharges() {
    if (!data || !data.pagination?.hasMoreCharges || !data.pagination.lastChargeId) return;
    setLoadingMoreCharges(true);
    try {
      const res = await fetch(
        `/api/admin/payments?charges_after=${data.pagination.lastChargeId}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData((prev) => prev ? {
        ...prev,
        charges: [...prev.charges, ...json.charges],
        pagination: json.pagination,
      } : json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more charges');
    } finally {
      setLoadingMoreCharges(false);
    }
  }

  async function loadMoreInvoices() {
    if (!data || !data.pagination?.hasMoreInvoices || !data.pagination.lastInvoiceId) return;
    setLoadingMoreInvoices(true);
    try {
      const res = await fetch(
        `/api/admin/payments?invoices_after=${data.pagination.lastInvoiceId}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData((prev) => prev ? {
        ...prev,
        invoices: [...prev.invoices, ...json.invoices],
        pagination: {
          ...prev.pagination,
          ...json.pagination,
          hasMoreCharges: prev.pagination?.hasMoreCharges ?? false,
          lastChargeId: prev.pagination?.lastChargeId,
        },
      } : json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more invoices');
    } finally {
      setLoadingMoreInvoices(false);
    }
  }

  function handleSendInvoice(inv: StripeInvoice) {
    setConfirmAction({
      title: 'Send Invoice',
      message: `Send this invoice to ${inv.customer?.email || 'the customer'}? It will be finalized and emailed.`,
      confirmLabel: 'Send Invoice',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/invoices/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: inv.id }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to send invoice');
          setConfirmAction(null);
          showToast('Invoice sent successfully');
          fetchPayments();
        } catch (err) {
          setConfirmAction(null);
          showToast(err instanceof Error ? err.message : 'Failed to send invoice', 'error');
        }
      },
    });
  }

  function handleVoidInvoice(inv: StripeInvoice) {
    setConfirmAction({
      title: 'Void Invoice',
      message: `Void this invoice for ${inv.customer?.email || 'the customer'}? This cannot be undone.`,
      confirmLabel: 'Void Invoice',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/invoices/void', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: inv.id }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to void invoice');
          setConfirmAction(null);
          showToast('Invoice voided');
          fetchPayments();
        } catch (err) {
          setConfirmAction(null);
          showToast(err instanceof Error ? err.message : 'Failed to void invoice', 'error');
        }
      },
    });
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: couponName || undefined,
        duration: 'once',
      };
      if (couponType === 'percent') body.percent_off = parseFloat(couponValue);
      else body.amount_off = parseFloat(couponValue);
      if (couponPromoCode) body.promoCode = couponPromoCode;

      const res = await fetch('/api/admin/payments/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create coupon');
      }
      setShowCreateCoupon(false);
      setCouponName('');
      setCouponValue('');
      setCouponPromoCode('');
      showToast('Coupon created');
      // Refresh coupons
      setCoupons([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create coupon', 'error');
    } finally {
      setCouponCreating(false);
    }
  }

  function handleExportCsv() {
    window.open('/api/admin/payments/export', '_blank');
  }

  async function handleUpdateCouponName(couponId: string) {
    if (!editingCouponName.trim()) return;
    try {
      const res = await fetch(`/api/admin/payments/coupons/${couponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCouponName.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update coupon');
      }
      setEditingCouponId(null);
      showToast('Coupon name updated');
      setCoupons([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update coupon', 'error');
    }
  }

  function handleDeleteCoupon(coupon: StripeCoupon) {
    setConfirmAction({
      title: 'Delete Coupon',
      message: `Delete coupon "${coupon.name || coupon.id}"? This cannot be undone.`,
      confirmLabel: 'Delete Coupon',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/payments/coupons/${coupon.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const json = await res.json();
            throw new Error(json.error || 'Failed to delete coupon');
          }
          setConfirmAction(null);
          showToast('Coupon deleted');
          setCoupons([]);
        } catch (err) {
          setConfirmAction(null);
          showToast(err instanceof Error ? err.message : 'Failed to delete coupon', 'error');
        }
      },
    });
  }

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkCreating(true);
    try {
      const res = await fetch('/api/admin/payments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: linkName,
          amount: linkAmount,
          allowPromotion: linkAllowPromo,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create payment link');
      }
      setShowCreateLink(false);
      setLinkName('');
      setLinkAmount('');
      setLinkAllowPromo(false);
      showToast('Payment link created');
      setPaymentLinks([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create payment link', 'error');
    } finally {
      setLinkCreating(false);
    }
  }

  async function handleToggleLink(link: StripePaymentLink) {
    try {
      const res = await fetch(`/api/admin/payments/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !link.active }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update payment link');
      }
      showToast(link.active ? 'Payment link deactivated' : 'Payment link activated');
      setPaymentLinks([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update payment link', 'error');
    }
  }

  // ── Sort helpers ──
  function handleChargeSort(key: ChargeSortKey) {
    if (chargeSortKey === key) setChargeSortDir(chargeSortDir === 'asc' ? 'desc' : 'asc');
    else { setChargeSortKey(key); setChargeSortDir(key === 'date' ? 'desc' : 'asc'); }
  }
  function handleInvoiceSort(key: InvoiceSortKey) {
    if (invoiceSortKey === key) setInvoiceSortDir(invoiceSortDir === 'asc' ? 'desc' : 'asc');
    else { setInvoiceSortKey(key); setInvoiceSortDir(key === 'date' ? 'desc' : 'asc'); }
  }
  function handleCouponSort(key: CouponSortKey) {
    if (couponSortKey === key) setCouponSortDir(couponSortDir === 'asc' ? 'desc' : 'asc');
    else { setCouponSortKey(key); setCouponSortDir('asc'); }
  }
  function handleLinkSort(key: LinkSortKey) {
    if (linkSortKey === key) setLinkSortDir(linkSortDir === 'asc' ? 'desc' : 'asc');
    else { setLinkSortKey(key); setLinkSortDir('asc'); }
  }
  // ── Filtered + sorted charges ──
  const filteredCharges = useMemo(() => {
    if (!data) return [];
    let list = [...data.charges];
    if (chargeSearch.trim()) {
      const q = chargeSearch.toLowerCase();
      list = list.filter((c) => {
        const email = c.customer?.email || '';
        const name = c.customer?.name || '';
        const amt = (c.amount / 100).toFixed(2);
        return email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || amt.includes(q) || c.status.toLowerCase().includes(q);
      });
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (chargeSortKey) {
        case 'date': cmp = a.created - b.created; break;
        case 'student': cmp = (a.customer?.email || '').localeCompare(b.customer?.email || ''); break;
        case 'amount': cmp = a.amount - b.amount; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return chargeSortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data, chargeSearch, chargeSortKey, chargeSortDir]);

  // ── Filtered + sorted invoices ──
  const filteredInvoices = useMemo(() => {
    if (!data) return [];
    let list = [...data.invoices];
    if (chargeSearch.trim()) {
      const q = chargeSearch.toLowerCase();
      list = list.filter((inv) => {
        const email = inv.customer?.email || '';
        const name = inv.customer?.name || '';
        const amt = (inv.amount_due / 100).toFixed(2);
        return email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || amt.includes(q) || inv.status.toLowerCase().includes(q);
      });
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (invoiceSortKey) {
        case 'student': cmp = (a.customer?.email || '').localeCompare(b.customer?.email || ''); break;
        case 'amount': cmp = a.amount_due - b.amount_due; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'date': cmp = a.created - b.created; break;
      }
      return invoiceSortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data, chargeSearch, invoiceSortKey, invoiceSortDir]);

  // ── Sorted coupons ──
  const sortedCoupons = useMemo(() => {
    const list = [...coupons];
    list.sort((a, b) => {
      let cmp = 0;
      switch (couponSortKey) {
        case 'name': cmp = (a.name || a.id).localeCompare(b.name || b.id); break;
        case 'discount': cmp = (a.percent_off || 0) - (b.percent_off || 0) || (a.amount_off || 0) - (b.amount_off || 0); break;
        case 'redeemed': cmp = a.times_redeemed - b.times_redeemed; break;
        case 'status': cmp = Number(b.valid) - Number(a.valid); break;
      }
      return couponSortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [coupons, couponSortKey, couponSortDir]);

  // ── Sorted payment links ──
  const sortedLinks = useMemo(() => {
    const list = [...paymentLinks];
    list.sort((a, b) => {
      let cmp = 0;
      switch (linkSortKey) {
        case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
        case 'amount': {
          const aAmt = a.line_items.reduce((s, li) => s + li.amount_total, 0);
          const bAmt = b.line_items.reduce((s, li) => s + li.amount_total, 0);
          cmp = aAmt - bAmt;
          break;
        }
        case 'status': cmp = Number(b.active) - Number(a.active); break;
      }
      return linkSortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [paymentLinks, linkSortKey, linkSortDir]);

  if (loading && !data) {
    return (
      <>
        <SkeletonCards count={4} />
        <SkeletonTable rows={5} cols={5} />
      </>
    );
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
      {/* Sub-tab navigation */}
      <div className="admin-email-subtabs">
        {(['overview', 'payouts', 'coupons', 'links'] as PaymentSubTab[]).map((t) => (
          <button
            key={t}
            className={`admin-email-subtab ${paymentSubTab === t ? 'admin-email-subtab-active' : ''}`}
            onClick={() => setPaymentSubTab(t)}
          >
            {t === 'overview' ? 'Overview' : t === 'payouts' ? 'Payouts' : t === 'coupons' ? 'Coupons' : 'Payment Links'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW SUB-TAB ── */}
      {paymentSubTab === 'overview' && (
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
            <button className="admin-export-btn" onClick={handleExportCsv}>
              Export CSV
            </button>
            <button className="admin-refresh-btn" onClick={fetchPayments} disabled={loading}>
              {loading ? 'Refreshing\u2026' : 'Refresh'}
            </button>
            {lastFetched && <span className="admin-last-updated">{lastUpdatedText(lastFetched)}</span>}
          </div>

          {/* Search */}
          <div className="admin-email-filter-bar">
            <input
              type="text"
              className="admin-email-search"
              placeholder="Search by email, name, amount, status\u2026"
              value={chargeSearch}
              onChange={(e) => setChargeSearch(e.target.value)}
            />
            {chargeSearch && (
              <span className="admin-result-count">
                {filteredCharges.length} payment{filteredCharges.length !== 1 ? 's' : ''}, {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {error && data && <div className="admin-email-error">{error}</div>}

          {/* Recent Payments */}
          <div className="admin-overview-section">
            <h3 className="admin-overview-section-title">Recent Payments</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-sortable-th" onClick={() => handleChargeSort('date')}>Date{sortArrow(chargeSortKey === 'date', chargeSortDir)}</th>
                    <th className="admin-sortable-th" onClick={() => handleChargeSort('student')}>Student{sortArrow(chargeSortKey === 'student', chargeSortDir)}</th>
                    <th className="admin-sortable-th" onClick={() => handleChargeSort('amount')}>Amount{sortArrow(chargeSortKey === 'amount', chargeSortDir)}</th>
                    <th className="admin-sortable-th" onClick={() => handleChargeSort('status')}>Status{sortArrow(chargeSortKey === 'status', chargeSortDir)}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCharges.length === 0 ? (
                    <tr><td colSpan={5} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">{chargeSearch ? 'No matching payments' : 'No payments yet'}</p><p className="admin-empty-state-sub">{chargeSearch ? 'Try adjusting your search.' : 'Payments will appear here once students complete checkout.'}</p></div></td></tr>
                  ) : (
                    filteredCharges.map((c) => (
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
                            <a
                              href={`https://dashboard.stripe.com/payments/${c.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-stripe-link"
                            >
                              Stripe
                            </a>
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
                {data.pagination?.hasMoreCharges && (
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center' }}>
                        <button
                          className="admin-refresh-btn"
                          onClick={loadMoreCharges}
                          disabled={loadingMoreCharges}
                        >
                          {loadingMoreCharges ? 'Loading\u2026' : 'Load More Payments'}
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div className="admin-overview-section">
              <h3 className="admin-overview-section-title">Invoices</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-sortable-th" onClick={() => handleInvoiceSort('student')}>Student{sortArrow(invoiceSortKey === 'student', invoiceSortDir)}</th>
                      <th className="admin-sortable-th" onClick={() => handleInvoiceSort('amount')}>Amount{sortArrow(invoiceSortKey === 'amount', invoiceSortDir)}</th>
                      <th className="admin-sortable-th" onClick={() => handleInvoiceSort('status')}>Status{sortArrow(invoiceSortKey === 'status', invoiceSortDir)}</th>
                      <th className="admin-sortable-th" onClick={() => handleInvoiceSort('date')}>Date{sortArrow(invoiceSortKey === 'date', invoiceSortDir)}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
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
                            <a
                              href={`https://dashboard.stripe.com/invoices/${inv.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-stripe-link"
                            >
                              Stripe
                            </a>
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
                                className="admin-send-invoice-btn"
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
                  {data.pagination?.hasMoreInvoices && (
                    <tfoot>
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }}>
                          <button
                            className="admin-refresh-btn"
                            onClick={loadMoreInvoices}
                            disabled={loadingMoreInvoices}
                          >
                            {loadingMoreInvoices ? 'Loading\u2026' : 'Load More Invoices'}
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PAYOUTS SUB-TAB ── */}
      {paymentSubTab === 'payouts' && (
        <div className="admin-overview-section">
          {payoutsLoading ? (
            <><SkeletonCards count={2} /><SkeletonTable rows={4} cols={4} /></>
          ) : payoutsData ? (
            <>
              <div className="admin-payments-cards" style={{ marginBottom: 16 }}>
                <div className="admin-payments-card admin-payments-card-green">
                  <div className="admin-payments-card-value">${payoutsData.balance.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div className="admin-payments-card-label">Available Balance</div>
                </div>
                <div className="admin-payments-card admin-payments-card-gold">
                  <div className="admin-payments-card-value">${payoutsData.balance.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div className="admin-payments-card-label">Pending Balance</div>
                </div>
              </div>
              <h3 className="admin-overview-section-title">Payout History</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Arrival</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutsData.payouts.length === 0 ? (
                      <tr><td colSpan={4} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">No payouts yet</p><p className="admin-empty-state-sub">Stripe will deposit funds to your bank account automatically.</p></div></td></tr>
                    ) : (
                      payoutsData.payouts.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.created)}</td>
                          <td>{formatCurrency(p.amount)}</td>
                          <td>
                            <span className={`admin-status admin-status-${p.status === 'paid' ? 'completed' : p.status === 'pending' || p.status === 'in_transit' ? 'pending' : 'waitlisted'}`}>
                              {p.status === 'paid' ? 'Paid' : p.status === 'in_transit' ? 'In Transit' : p.status === 'pending' ? 'Pending' : p.status}
                            </span>
                          </td>
                          <td>{formatDate(p.arrival_date)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="admin-empty">Failed to load payouts.</div>
          )}
        </div>
      )}

      {/* ── COUPONS SUB-TAB ── */}
      {paymentSubTab === 'coupons' && (
        <div className="admin-overview-section">
          <div className="admin-payments-toolbar">
            <button className="admin-compose-btn" onClick={() => setShowCreateCoupon(!showCreateCoupon)}>
              {showCreateCoupon ? 'Cancel' : 'Create Coupon'}
            </button>
          </div>

          {showCreateCoupon && (
            <div className="admin-compose" style={{ marginBottom: 16 }}>
              <form onSubmit={handleCreateCoupon}>
                <div className="admin-compose-field">
                  <label>Coupon Name</label>
                  <input
                    type="text"
                    value={couponName}
                    onChange={(e) => setCouponName(e.target.value)}
                    placeholder="e.g. Summer Discount"
                    className="admin-compose-input"
                  />
                </div>
                <div className="admin-compose-field">
                  <label>Discount Type</label>
                  <select value={couponType} onChange={(e) => setCouponType(e.target.value as 'percent' | 'amount')} className="admin-select">
                    <option value="percent">Percentage Off</option>
                    <option value="amount">Fixed Amount Off</option>
                  </select>
                </div>
                <div className="admin-compose-field">
                  <label>{couponType === 'percent' ? 'Percent Off' : 'Amount Off ($)'}</label>
                  <input
                    type="number"
                    step={couponType === 'percent' ? '1' : '0.01'}
                    min="0"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    placeholder={couponType === 'percent' ? '10' : '25.00'}
                    className="admin-compose-input"
                    required
                  />
                </div>
                <div className="admin-compose-field">
                  <label>Promo Code (optional)</label>
                  <input
                    type="text"
                    value={couponPromoCode}
                    onChange={(e) => setCouponPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER2026"
                    className="admin-compose-input"
                  />
                </div>
                <div className="admin-compose-actions">
                  <button type="submit" className="admin-send-btn" disabled={couponCreating}>
                    {couponCreating ? 'Creating\u2026' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {couponsLoading ? (
            <SkeletonTable rows={3} cols={5} />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-sortable-th" onClick={() => handleCouponSort('name')}>Name{sortArrow(couponSortKey === 'name', couponSortDir)}</th>
                    <th className="admin-sortable-th" onClick={() => handleCouponSort('discount')}>Discount{sortArrow(couponSortKey === 'discount', couponSortDir)}</th>
                    <th>Promo Code</th>
                    <th className="admin-sortable-th" onClick={() => handleCouponSort('redeemed')}>Redeemed{sortArrow(couponSortKey === 'redeemed', couponSortDir)}</th>
                    <th className="admin-sortable-th" onClick={() => handleCouponSort('status')}>Status{sortArrow(couponSortKey === 'status', couponSortDir)}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr><td colSpan={6} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">No coupons yet</p><p className="admin-empty-state-sub">Create a coupon to offer discounts on your courses.</p><button className="admin-empty-state-cta" onClick={() => setShowCreateCoupon(true)}>Create Coupon</button></div></td></tr>
                  ) : (
                    sortedCoupons.map((c) => (
                      <tr key={c.id}>
                        <td>
                          {editingCouponId === c.id ? (
                            <span className="admin-email-cell">
                              <input
                                type="text"
                                value={editingCouponName}
                                onChange={(e) => setEditingCouponName(e.target.value)}
                                className="admin-compose-input"
                                style={{ width: 160, padding: '2px 6px', fontSize: 13 }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCouponName(c.id);
                                  if (e.key === 'Escape') setEditingCouponId(null);
                                }}
                                autoFocus
                              />
                              <button className="admin-send-invoice-btn" onClick={() => handleUpdateCouponName(c.id)}>Save</button>
                              <button className="admin-stripe-link" onClick={() => setEditingCouponId(null)}>Cancel</button>
                            </span>
                          ) : (
                            c.name || c.id
                          )}
                        </td>
                        <td>
                          {c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `$${(c.amount_off / 100).toFixed(2)} off` : '\u2014'}
                        </td>
                        <td>
                          {c.promotion_codes.length > 0 ? (
                            <span className="admin-email-cell">
                              {c.promotion_codes.map((p) => p.code).join(', ')}
                              <CopyButton text={c.promotion_codes.map((p) => p.code).join(', ')} label="Copy code" />
                            </span>
                          ) : '\u2014'}
                        </td>
                        <td>{c.times_redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ''}</td>
                        <td>
                          <span className={`admin-status admin-status-${c.valid ? 'completed' : 'waitlisted'}`}>
                            {c.valid ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-payment-actions">
                            {editingCouponId !== c.id && (
                              <button
                                className="admin-stripe-link"
                                onClick={() => {
                                  setEditingCouponId(c.id);
                                  setEditingCouponName(c.name || '');
                                }}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              className="admin-void-btn"
                              onClick={() => handleDeleteCoupon(c)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT LINKS SUB-TAB ── */}
      {paymentSubTab === 'links' && (
        <div className="admin-overview-section">
          <div className="admin-payments-toolbar">
            <button className="admin-compose-btn" onClick={() => setShowCreateLink(!showCreateLink)}>
              {showCreateLink ? 'Cancel' : 'Create Payment Link'}
            </button>
          </div>

          {showCreateLink && (
            <div className="admin-compose" style={{ marginBottom: 16 }}>
              <form onSubmit={handleCreateLink}>
                <div className="admin-compose-field">
                  <label>Name</label>
                  <input
                    type="text"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="e.g. Summer Course Full Payment"
                    className="admin-compose-input"
                    required
                  />
                </div>
                <div className="admin-compose-field">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    value={linkAmount}
                    onChange={(e) => setLinkAmount(e.target.value)}
                    placeholder="500.00"
                    className="admin-compose-input"
                    required
                  />
                </div>
                <div className="admin-compose-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={linkAllowPromo}
                      onChange={(e) => setLinkAllowPromo(e.target.checked)}
                    />
                    Allow promotion codes
                  </label>
                </div>
                <div className="admin-compose-actions">
                  <button type="submit" className="admin-send-btn" disabled={linkCreating}>
                    {linkCreating ? 'Creating\u2026' : 'Create Payment Link'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {linksLoading ? (
            <SkeletonTable rows={3} cols={5} />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-sortable-th" onClick={() => handleLinkSort('name')}>Name{sortArrow(linkSortKey === 'name', linkSortDir)}</th>
                    <th>Link</th>
                    <th className="admin-sortable-th" onClick={() => handleLinkSort('amount')}>Items{sortArrow(linkSortKey === 'amount', linkSortDir)}</th>
                    <th className="admin-sortable-th" onClick={() => handleLinkSort('status')}>Status{sortArrow(linkSortKey === 'status', linkSortDir)}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentLinks.length === 0 ? (
                    <tr><td colSpan={5} className="admin-empty"><div className="admin-empty-state"><p className="admin-empty-state-title">No payment links</p><p className="admin-empty-state-sub">Create a payment link to share with students.</p><button className="admin-empty-state-cta" onClick={() => setShowCreateLink(true)}>Create Payment Link</button></div></td></tr>
                  ) : (
                    sortedLinks.map((link) => (
                      <tr key={link.id}>
                        <td>{link.name || '\u2014'}</td>
                        <td>
                          <span className="admin-email-cell">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="admin-stripe-link">
                              {link.url.length > 40 ? link.url.slice(0, 40) + '\u2026' : link.url}
                            </a>
                            <CopyButton text={link.url} label="Copy link" />
                          </span>
                        </td>
                        <td>
                          {link.line_items.length > 0
                            ? link.line_items.map((li) =>
                                `${li.description || 'Item'} (${formatCurrency(li.amount_total)})`
                              ).join(', ')
                            : '\u2014'}
                        </td>
                        <td>
                          <span className={`admin-status admin-status-${link.active ? 'completed' : 'waitlisted'}`}>
                            {link.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-payment-actions">
                            <button
                              className={link.active ? 'admin-void-btn' : 'admin-send-invoice-btn'}
                              onClick={() => handleToggleLink(link)}
                            >
                              {link.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refund Dialog */}
      {refundCharge && (
        <AdminRefundDialog
          charge={refundCharge}
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
          enrollments={enrollments}
          onClose={() => setShowInvoiceDialog(false)}
          onSuccess={() => {
            setShowInvoiceDialog(false);
            fetchPayments();
          }}
        />
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <AdminConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          confirmVariant={confirmAction.variant}
          loading={confirmLoading}
          onConfirm={async () => {
            setConfirmLoading(true);
            await confirmAction.onConfirm();
            setConfirmLoading(false);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
