import { prisma } from '@/lib/prisma';
import { SECTION_SCHEDULES } from '@/lib/schedule';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: 'Admin — Enrollments',
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  if (!process.env.ADMIN_PASSWORD || key !== process.env.ADMIN_PASSWORD) {
    return <AdminLogin />;
  }

  const [sections, enrollments] = await Promise.all([
    prisma.section.findMany({ orderBy: { label: 'asc' } }),
    prisma.enrollment.findMany({
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Serialize for the client component (dates → strings)
  const serializedEnrollments = enrollments.map((e) => ({
    id: e.id,
    email: e.email,
    plan: e.plan,
    paymentStatus: e.paymentStatus,
    stripeCustomerId: e.stripeCustomerId,
    createdAt: e.createdAt.toISOString(),
    section: { label: e.section.label },
  }));

  const serializedSections = sections.map((s) => ({
    id: s.id,
    label: s.label,
    maxCapacity: s.maxCapacity,
    enrolledCount: s.enrolledCount,
    status: s.status,
  }));

  return (
    <div className="admin-page">
      <AdminDashboard
        sections={serializedSections}
        enrollments={serializedEnrollments}
        scheduleMap={SECTION_SCHEDULES}
        adminKey={key}
      />
    </div>
  );
}
