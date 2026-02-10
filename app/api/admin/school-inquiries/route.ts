import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/school-inquiries?key=... — list all school inquiries ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inquiries = await prisma.schoolInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      inquiries: inquiries.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch school inquiries' }, { status: 500 });
  }
}

/* ── POST /api/admin/school-inquiries?key=... — manually add a school inquiry ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      contactEmail,
      contactName,
      schoolName,
      servicesNeeded,
      contactPhone,
      contactTitle,
      districtName,
      studentCount,
      timeline,
      deliveryPreference,
    } = body as {
      contactEmail?: string;
      contactName?: string;
      schoolName?: string;
      servicesNeeded?: string;
      contactPhone?: string;
      contactTitle?: string;
      districtName?: string;
      studentCount?: string;
      timeline?: string;
      deliveryPreference?: string;
    };

    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json({ error: 'Contact email is required' }, { status: 400 });
    }

    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }

    if (!schoolName || !schoolName.trim()) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    if (!servicesNeeded || !servicesNeeded.trim()) {
      return NextResponse.json({ error: 'Services needed is required' }, { status: 400 });
    }

    const inquiry = await prisma.schoolInquiry.create({
      data: {
        contactEmail: contactEmail.trim(),
        contactName: contactName.trim(),
        schoolName: schoolName.trim(),
        servicesNeeded: servicesNeeded.trim(),
        contactPhone: contactPhone?.trim() || null,
        contactTitle: contactTitle?.trim() || null,
        districtName: districtName?.trim() || null,
        studentCount: studentCount?.trim() || null,
        timeline: timeline?.trim() || null,
        deliveryPreference: deliveryPreference?.trim() || null,
      },
    });

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    // Unique constraint violation
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A school inquiry with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create school inquiry' }, { status: 500 });
  }
}
