import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { appointmentRequestAdminEmail, appointmentRequestConfirmationEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, questions, preferredCallbackTime } = body;

    // Validate required fields
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Please enter a valid name (2-100 characters)' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // Validate optional fields
    if (questions && (typeof questions !== 'string' || questions.trim().length > 1000)) {
      return NextResponse.json({ error: 'Questions must be less than 1000 characters' }, { status: 400 });
    }

    if (preferredCallbackTime && (typeof preferredCallbackTime !== 'string' || preferredCallbackTime.trim().length > 200)) {
      return NextResponse.json({ error: 'Preferred callback time must be less than 200 characters' }, { status: 400 });
    }

    // Upsert lead record
    await prisma.lead.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        name: name.trim(),
        phone: phone.trim(),
        subject: 'Appointment Request',
        notes: questions?.trim() || null,
        preferredCallbackTime: preferredCallbackTime?.trim() || null,
        status: 'NEW',
      },
      create: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone.trim(),
        subject: 'Appointment Request',
        notes: questions?.trim() || null,
        preferredCallbackTime: preferredCallbackTime?.trim() || null,
        status: 'NEW',
      },
    });

    // Send emails in parallel
    await Promise.all([
      // Admin notification
      resend.emails.send({
        from: 'TeachBraille.org <noreply@teachbraille.org>',
        to: 'delaney@teachbraille.org',
        subject: 'New Appointment Request',
        html: appointmentRequestAdminEmail({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          questions: questions?.trim(),
          preferredCallbackTime: preferredCallbackTime?.trim(),
        }),
      }),
      // User confirmation
      resend.emails.send({
        from: 'Delaney Costello <noreply@teachbraille.org>',
        to: email.trim(),
        subject: 'Appointment Request Received — TeachBraille.org',
        html: appointmentRequestConfirmationEmail({ name: name.trim() }),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Appointment request failed:', (err as Error).message);
    return NextResponse.json(
      { error: 'Unable to process your request. Please try again or email Delaney@TeachBraille.org directly.' },
      { status: 500 }
    );
  }
}
