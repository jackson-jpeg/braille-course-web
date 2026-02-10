import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Revenue by month (last 6 months) from Enrollment records
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { plan: true, createdAt: true },
    });

    // Build monthly revenue
    const monthlyRevenue: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthEnrollments = enrollments.filter((e: { plan: string; createdAt: Date }) => {
        const created = new Date(e.createdAt);
        return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === key;
      });
      const amount = monthEnrollments.reduce(
        (sum: number, e: { plan: string }) => sum + (e.plan === 'FULL' ? 500 : 150),
        0,
      );
      monthlyRevenue.push({ month: label, amount });
    }

    // Enrollment funnel
    const [totalEnrollments, completedCount, leadCount] = await Promise.all([
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { paymentStatus: 'COMPLETED' } }),
      prisma.lead.count(),
    ]);

    const funnel = {
      signups: leadCount + totalEnrollments,
      enrolled: completedCount,
      completed: 0, // no completion tracking yet
    };

    // School pipeline by status
    const schoolInquiries = await prisma.schoolInquiry.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const pipeline = schoolInquiries.map((s: { status: string; _count: { status: number } }) => ({
      status: s.status,
      count: s._count.status,
    }));

    // Student progress: count by section
    const sections = await prisma.section.findMany({
      select: {
        label: true,
        enrolledCount: true,
        maxCapacity: true,
      },
    });

    // Game progress summary
    let gameProgressSummary: { totalStudents: number; withProgress: number } | null = null;
    try {
      const gpCount = await prisma.gameProgress.count();
      gameProgressSummary = {
        totalStudents: completedCount,
        withProgress: gpCount,
      };
    } catch {
      // GameProgress model not yet migrated
    }

    return NextResponse.json({
      monthlyRevenue,
      funnel,
      pipeline,
      sections,
      gameProgressSummary,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
