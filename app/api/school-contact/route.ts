import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { schoolContactAdminEmail, schoolContactConfirmationEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      schoolName,
      districtName,
      contactName,
      email,
      phone,
      contactTitle,
      servicesNeeded,
      studentCount,
      deliveryPreference,
      timeline,
      website, // honeypot
    } = body;

    // Honeypot check - reject if bot filled the hidden field
    if (website) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // Validate required fields
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!contactName || typeof contactName !== 'string' || contactName.trim().length < 2 || contactName.trim().length > 100) {
      return NextResponse.json({ error: 'Please enter a valid contact name (2-100 characters)' }, { status: 400 });
    }

    if (!schoolName || typeof schoolName !== 'string' || schoolName.trim().length < 3 || schoolName.trim().length > 200) {
      return NextResponse.json({ error: 'Please enter a valid school name (3-200 characters)' }, { status: 400 });
    }

    if (!servicesNeeded || typeof servicesNeeded !== 'string' || servicesNeeded.trim().length < 10 || servicesNeeded.trim().length > 2000) {
      return NextResponse.json({ error: 'Please describe the services needed (10-2000 characters)' }, { status: 400 });
    }

    // Validate optional fields with constraints
    if (phone && (typeof phone !== 'string' || phone.trim().length < 10)) {
      return NextResponse.json({ error: 'Please enter a valid phone number (minimum 10 characters)' }, { status: 400 });
    }

    if (contactTitle && (typeof contactTitle !== 'string' || contactTitle.trim().length > 100)) {
      return NextResponse.json({ error: 'Contact title must be less than 100 characters' }, { status: 400 });
    }

    if (districtName && (typeof districtName !== 'string' || districtName.trim().length < 2 || districtName.trim().length > 150)) {
      return NextResponse.json({ error: 'District name must be between 2-150 characters' }, { status: 400 });
    }

    if (timeline && (typeof timeline !== 'string' || timeline.trim().length > 300)) {
      return NextResponse.json({ error: 'Timeline must be less than 300 characters' }, { status: 400 });
    }

    if (studentCount && typeof studentCount !== 'string') {
      return NextResponse.json({ error: 'Invalid student count' }, { status: 400 });
    }

    if (deliveryPreference && typeof deliveryPreference !== 'string') {
      return NextResponse.json({ error: 'Invalid delivery preference' }, { status: 400 });
    }

    // Save to database first (critical operation)
    const inquiry = await prisma.schoolInquiry.upsert({
      where: { contactEmail: email.toLowerCase().trim() },
      update: {
        contactName: contactName.trim(),
        contactPhone: phone?.trim() || null,
        contactTitle: contactTitle?.trim() || null,
        schoolName: schoolName.trim(),
        districtName: districtName?.trim() || null,
        servicesNeeded: servicesNeeded.trim(),
        studentCount: studentCount?.trim() || null,
        timeline: timeline?.trim() || null,
        deliveryPreference: deliveryPreference?.trim() || null,
        status: 'NEW_INQUIRY', // Reset status to NEW_INQUIRY on resubmission
      },
      create: {
        contactEmail: email.toLowerCase().trim(),
        contactName: contactName.trim(),
        contactPhone: phone?.trim() || null,
        contactTitle: contactTitle?.trim() || null,
        schoolName: schoolName.trim(),
        districtName: districtName?.trim() || null,
        servicesNeeded: servicesNeeded.trim(),
        studentCount: studentCount?.trim() || null,
        timeline: timeline?.trim() || null,
        deliveryPreference: deliveryPreference?.trim() || null,
      },
    });

    // Send emails with graceful failure handling
    const [adminEmailResult, confirmationEmailResult] = await Promise.allSettled([
      // Admin notification
      resend.emails.send({
        from: 'TeachBraille.org <noreply@teachbraille.org>',
        to: 'delaney@teachbraille.org',
        subject: `New School Inquiry: ${schoolName.trim()}`,
        html: schoolContactAdminEmail({
          schoolName: schoolName.trim(),
          districtName: districtName?.trim() || null,
          contactName: contactName.trim(),
          contactEmail: email.trim(),
          contactPhone: phone?.trim() || null,
          contactTitle: contactTitle?.trim() || null,
          servicesNeeded: servicesNeeded.trim(),
          studentCount: studentCount?.trim() || null,
          timeline: timeline?.trim() || null,
          deliveryPreference: deliveryPreference?.trim() || null,
        }),
      }),
      // User confirmation
      resend.emails.send({
        from: 'Delaney Costello <noreply@teachbraille.org>',
        to: email.trim(),
        subject: 'School Inquiry Received — TeachBraille.org',
        html: schoolContactConfirmationEmail({
          contactName: contactName.trim(),
          schoolName: schoolName.trim(),
        }),
      }),
    ]);

    // Log any email failures but don't fail the request
    if (adminEmailResult.status === 'rejected') {
      console.error('Admin email failed:', {
        inquiryId: inquiry.id,
        email: inquiry.contactEmail,
        error: adminEmailResult.reason,
      });
    }
    if (confirmationEmailResult.status === 'rejected') {
      console.error('User confirmation email failed:', {
        inquiryId: inquiry.id,
        email: inquiry.contactEmail,
        error: confirmationEmailResult.reason,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('School contact request failed:', {
      message: (err as Error).message,
      stack: (err as Error).stack,
      name: (err as Error).name,
      // For Prisma errors
      code: (err as any).code,
      meta: (err as any).meta,
    });
    return NextResponse.json(
      { error: 'Unable to process your request. Please try again or email Delaney@TeachBraille.org directly.' },
      { status: 500 }
    );
  }
}
