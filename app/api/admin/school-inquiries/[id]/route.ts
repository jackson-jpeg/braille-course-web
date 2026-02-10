import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/school-inquiries/[id]?key=... — get a single school inquiry ── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const inquiry = await prisma.schoolInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'School inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch school inquiry' }, { status: 500 });
  }
}

/* ── PATCH /api/admin/school-inquiries/[id]?key=... — update a school inquiry ── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      status,
      contactEmail,
      contactName,
      contactPhone,
      contactTitle,
      schoolName,
      districtName,
      servicesNeeded,
      studentCount,
      timeline,
      deliveryPreference,
      adminNotes,
      sortOrder,
    } = body as {
      status?: string;
      contactEmail?: string;
      contactName?: string;
      contactPhone?: string | null;
      contactTitle?: string | null;
      schoolName?: string;
      districtName?: string | null;
      servicesNeeded?: string;
      studentCount?: string | null;
      timeline?: string | null;
      deliveryPreference?: string | null;
      adminNotes?: string | null;
      sortOrder?: number;
    };

    // Validate status if provided
    const validStatuses = [
      'NEW_INQUIRY',
      'CONTACTED',
      'PROPOSAL_SENT',
      'NEGOTIATING',
      'CONTRACTED',
      'ON_HOLD',
      'CLOSED_WON',
      'CLOSED_LOST',
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const data: Record<string, string | number | null | undefined> = {};
    if (status !== undefined) data.status = status;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (contactName !== undefined) data.contactName = contactName;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (contactTitle !== undefined) data.contactTitle = contactTitle;
    if (schoolName !== undefined) data.schoolName = schoolName;
    if (districtName !== undefined) data.districtName = districtName;
    if (servicesNeeded !== undefined) data.servicesNeeded = servicesNeeded;
    if (studentCount !== undefined) data.studentCount = studentCount;
    if (timeline !== undefined) data.timeline = timeline;
    if (deliveryPreference !== undefined) data.deliveryPreference = deliveryPreference;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const inquiry = await prisma.schoolInquiry.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update school inquiry' }, { status: 500 });
  }
}

/* ── DELETE /api/admin/school-inquiries/[id]?key=... — delete a school inquiry ── */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.schoolInquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete school inquiry' }, { status: 500 });
  }
}
