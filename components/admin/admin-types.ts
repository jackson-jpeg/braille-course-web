/* ── Shared types for the admin dashboard ── */

export type SectionStatus = 'OPEN' | 'FULL';
export type PaymentPlan = 'FULL' | 'DEPOSIT';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'WAITLISTED';
export type LeadStatus = 'NEW' | 'CONTACTED';
export type SchoolInquiryStatus =
  | 'NEW_INQUIRY'
  | 'CONTACTED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'CONTRACTED'
  | 'ON_HOLD'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface Section {
  id: string;
  label: string;
  maxCapacity: number;
  enrolledCount: number;
  status: SectionStatus;
}

export interface Enrollment {
  id: string;
  email: string | null;
  plan: PaymentPlan;
  paymentStatus: PaymentStatus;
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
  status: LeadStatus;
  notes: string | null;
  phone: string | null;
  preferredCallbackTime: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── School Inquiry ── */
export interface SchoolInquiry {
  id: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string | null;
  contactTitle: string | null;
  schoolName: string;
  districtName: string | null;
  state: string | null;
  servicesNeeded: string;
  studentCount: string | null;
  timeline: string | null;
  deliveryPreference: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  serviceHours: string | null;
  hourlyRate: string | null;
  status: SchoolInquiryStatus;
  sortOrder: number;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolActivity {
  id: string;
  schoolInquiryId: string;
  date: string;
  type: string;
  content: string;
  createdAt: string;
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

/* ── Todo ── */
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
}

/* ── Assignments & Grades ── */
export interface Assignment {
  id: string;
  sectionId: string;
  title: string;
  maxScore: number;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Grade {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  score: number | null;
  notes: string | null;
}

/* ── Course Settings ── */
export type CourseSettingsMap = Record<string, string>;

/* ── Content Templates ── */
export interface ContentTemplate {
  id: string;
  label: string;
  title: string;
  notes: string;
  format: string;
  difficulty: string;
  instructions: string | null;
  createdAt: string;
}

/* ── Material Drafts ── */
export interface MaterialDraft {
  id: string;
  title: string;
  notes: string;
  format: string;
  difficulty: string;
  instructions: string | null;
  contentJson: string;
  wasCorrected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectionEntry {
  original: string;
  corrected: string;
  context: string;
  letterOrContraction: string;
}

/* ── Props ── */
export interface AdminProps {
  sections: Section[];
  enrollments: Enrollment[];
  leads: Lead[];
  schoolInquiries: SchoolInquiry[];
  scheduleMap: Record<string, string>;
}
