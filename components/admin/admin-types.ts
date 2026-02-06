/* ── Shared types for the admin dashboard ── */

export interface Section {
  id: string;
  label: string;
  maxCapacity: number;
  enrolledCount: number;
  status: string;
}

export interface Enrollment {
  id: string;
  email: string | null;
  plan: string;
  paymentStatus: string;
  stripeCustomerId: string | null;
  stripeSessionId: string;
  createdAt: string;
  section: { label: string };
}

export interface ResendEmail {
  id: string;
  to: string | string[];
  subject: string;
  created_at: string;
  last_event?: string;
}

export interface ReceivedEmail {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  created_at: string;
  attachments?: { filename: string; content_type: string; size?: number }[];
}

export interface EmailDetail {
  id: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  created_at: string;
  last_event?: string;
  from: string;
  attachments?: { filename: string; content_type: string; size?: number }[];
}

/* ── Stripe payment types (from /api/admin/payments) ── */
export interface PaymentSummary {
  totalCollected: number;
  pendingInvoices: number;
  stripeFees: number;
  netRevenue: number;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  receipt_url: string | null;
  customer: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
  refunded: boolean;
  amount_refunded: number;
}

export interface StripeInvoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  status_label: string;
  due_date: number | null;
  created: number;
  hosted_invoice_url: string | null;
  customer: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
}

export interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  charge: string;
  reason: string | null;
}

export interface PaymentsData {
  summary: PaymentSummary;
  charges: StripeCharge[];
  invoices: StripeInvoice[];
  refunds: StripeRefund[];
  balance: {
    available: number;
    pending: number;
  };
}

/* ── Student detail (from /api/admin/students/[customerId]) ── */
export interface StudentDetail {
  customer: {
    id: string;
    email: string | null;
    name: string | null;
    card: string | null;
  };
  charges: StripeCharge[];
  invoices: StripeInvoice[];
  emails: ResendEmail[];
}

/* ── Props ── */
export interface AdminProps {
  sections: Section[];
  enrollments: Enrollment[];
  scheduleMap: Record<string, string>;
  adminKey: string;
}
