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
  waitlistPosition: number | null;
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
  pagination?: {
    hasMoreCharges: boolean;
    hasMoreInvoices: boolean;
    lastChargeId?: string;
    lastInvoiceId?: string;
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

/* ── Notes ── */
export interface Note {
  id: string;
  content: string;
  studentEmail: string;
  createdAt: string;
}

/* ── Prospective Lead ── */
export interface Lead {
  id: string;
  email: string;
  name: string | null;
  subject: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Stripe Payouts ── */
export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number;
  created: number;
}

export interface PayoutsData {
  payouts: StripePayout[];
  balance: {
    available: number;
    pending: number;
  };
}

/* ── Stripe Coupons / Promo Codes ── */
export interface StripeCoupon {
  id: string;
  name: string | null;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: string;
  max_redemptions: number | null;
  times_redeemed: number;
  valid: boolean;
  created: number;
  redeem_by: number | null;
  promotion_codes: StripePromotionCode[];
}

export interface StripePromotionCode {
  id: string;
  code: string;
  active: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: number | null;
}

/* ── Stripe Payment Links ── */
export interface StripePaymentLink {
  id: string;
  name: string | null;
  url: string;
  active: boolean;
  metadata: Record<string, string>;
  line_items: {
    description: string | null;
    amount_total: number;
  }[];
}

/* ── Materials ── */
export interface Material {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  blobUrl: string;
  category: string;
  createdAt: string;
}

/* ── Generate Preview ── */
export interface GeneratePreview {
  slideTitles?: string[];
  sectionHeadings?: string[];
  questionCounts?: { 'multiple-choice': number; 'true-false': number; 'short-answer': number };
  totalQuestions?: number;
  worksheetSections?: { heading: string; type: string; itemCount: number }[];
  totalItems?: number;
  objectives?: string[];
}

/* ── Scheduled Emails ── */
export interface ScheduledEmail {
  id: string;
  to: string[];
  subject: string;
  body: string;
  scheduledFor: string;
  status: string;
  sentAt: string | null;
  resendId: string | null;
  error: string | null;
  attachmentIds: string[];
  createdAt: string;
}

/* ── Attendance ── */
export interface ClassSession {
  id: string;
  sectionId: string;
  title: string;
  date: string;
  sessionNum: number;
  attendanceCount?: number;
  totalEnrolled?: number;
}

export interface AttendanceRecord {
  id: string;
  classSessionId: string;
  enrollmentId: string;
  status: string;
  note: string | null;
  enrollment?: {
    email: string | null;
  };
}

export interface StudentAttendanceStats {
  attended: number;
  total: number;
  rate: number;
  records: {
    sessionNum: number;
    date: string;
    status: string;
    note: string | null;
  }[];
}

/* ── Props ── */
export interface AdminProps {
  sections: Section[];
  enrollments: Enrollment[];
  leads: Lead[];
  scheduleMap: Record<string, string>;
}
