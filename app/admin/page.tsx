import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { loadScheduleMap } from '@/lib/schedule';
import { verifySessionToken } from '@/lib/admin-auth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import type {
  PaymentPlan,
  PaymentStatus,
  SectionStatus,
  LeadStatus,
  SchoolInquiryStatus,
} from '@/components/admin/admin-types';

export const metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;

  if (!session || !verifySessionToken(session)) {
    return <AdminLogin />;
  }

  let sections, enrollments, leads, schoolInquiries, scheduleMap;
  try {
  [sections, enrollments, leads, schoolInquiries, scheduleMap] = await Promise.all([
    prisma.section.findMany({ orderBy: { label: 'asc' } }),
    prisma.enrollment.findMany({
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.schoolInquiry.findMany({ orderBy: { createdAt: 'desc' } }),
    loadScheduleMap(),
  ]);
  } catch (err) {
    console.error('Admin data load failed:', err);
    return <AdminLogin />;
  }

  // Serialize for the client component (dates → strings)
  const serializedEnrollments = enrollments.map((e) => ({
    id: e.id,
    email: e.email,
    plan: e.plan as PaymentPlan,
    paymentStatus: e.paymentStatus as PaymentStatus,
    stripeCustomerId: e.stripeCustomerId,
    stripeSessionId: e.stripeSessionId,
    createdAt: e.createdAt.toISOString(),
    section: { label: e.section.label },
    waitlistPosition: e.waitlistPosition,
  }));

  const serializedSections = sections.map((s) => ({
    id: s.id,
    label: s.label,
    maxCapacity: s.maxCapacity,
    enrolledCount: s.enrolledCount,
    status: s.status as SectionStatus,
  }));

  const serializedLeads = leads.map((l) => ({
    id: l.id,
    email: l.email,
    name: l.name,
    subject: l.subject,
    status: l.status as LeadStatus,
    notes: l.notes,
    phone: l.phone,
    preferredCallbackTime: l.preferredCallbackTime,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  const serializedSchoolInquiries = schoolInquiries.map((s) => ({
    id: s.id,
    contactEmail: s.contactEmail,
    contactName: s.contactName,
    contactPhone: s.contactPhone,
    contactTitle: s.contactTitle,
    schoolName: s.schoolName,
    districtName: s.districtName,
    state: s.state,
    servicesNeeded: s.servicesNeeded,
    studentCount: s.studentCount,
    timeline: s.timeline,
    deliveryPreference: s.deliveryPreference,
    contractStartDate: s.contractStartDate?.toISOString() ?? null,
    contractEndDate: s.contractEndDate?.toISOString() ?? null,
    serviceHours: s.serviceHours,
    hourlyRate: s.hourlyRate,
    status: s.status as SchoolInquiryStatus,
    sortOrder: s.sortOrder,
    adminNotes: s.adminNotes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="admin-page">
      <AdminDashboard
        sections={serializedSections}
        enrollments={serializedEnrollments}
        leads={serializedLeads}
        schoolInquiries={serializedSchoolInquiries}
        scheduleMap={scheduleMap}
      />
    </div>
  );
}
