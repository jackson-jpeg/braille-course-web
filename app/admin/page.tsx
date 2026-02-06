import { prisma } from '@/lib/prisma';
import { getSchedule } from '@/lib/schedule';

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
    return (
      <div className="admin-page">
        <div className="admin-auth-error">
          <h1>Unauthorized</h1>
          <p>Invalid or missing access key.</p>
        </div>
      </div>
    );
  }

  const [sections, enrollments] = await Promise.all([
    prisma.section.findMany({ orderBy: { label: 'asc' } }),
    prisma.enrollment.findMany({
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalEnrollments = enrollments.length;
  const fullCount = enrollments.filter((e) => e.plan === 'FULL').length;
  const depositCount = enrollments.filter((e) => e.plan === 'DEPOSIT').length;
  const waitlistedCount = enrollments.filter(
    (e) => e.paymentStatus === 'WAITLISTED'
  ).length;

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <h1 className="admin-title">Enrollment Dashboard</h1>

        {/* Summary Cards */}
        <div className="admin-cards">
          <div className="admin-card">
            <div className="admin-card-value">{totalEnrollments}</div>
            <div className="admin-card-label">Total Enrollments</div>
          </div>
          {sections.map((s) => (
            <div key={s.id} className="admin-card">
              <div className="admin-card-value">
                {s.maxCapacity - s.enrolledCount}
              </div>
              <div className="admin-card-label">
                Spots Left — {getSchedule(s.label)}
              </div>
            </div>
          ))}
          <div className="admin-card">
            <div className="admin-card-value">{fullCount}</div>
            <div className="admin-card-label">Full Payments</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-value">{depositCount}</div>
            <div className="admin-card-label">Deposits</div>
          </div>
          {waitlistedCount > 0 && (
            <div className="admin-card admin-card-warning">
              <div className="admin-card-value">{waitlistedCount}</div>
              <div className="admin-card-label">Waitlisted (needs refund)</div>
            </div>
          )}
        </div>

        {/* Enrollments Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Schedule</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    No enrollments yet.
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => (
                  <tr
                    key={e.id}
                    className={
                      e.paymentStatus === 'WAITLISTED'
                        ? 'admin-row-warning'
                        : ''
                    }
                  >
                    <td>{e.email || '—'}</td>
                    <td>{getSchedule(e.section.label)}</td>
                    <td>{e.plan === 'FULL' ? 'Full ($500)' : 'Deposit ($150)'}</td>
                    <td>
                      <span
                        className={`admin-status admin-status-${e.paymentStatus.toLowerCase()}`}
                      >
                        {e.paymentStatus}
                      </span>
                    </td>
                    <td>
                      {new Date(e.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
