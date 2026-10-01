import type { Metadata } from 'next';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import AppointmentRequestForm from '@/components/AppointmentRequestForm';
import { LETTERS } from '@/lib/ueb';
import '@/styles/pages/appointments.css';

export const metadata: Metadata = {
  title: 'Book a Braille Lesson — 1-on-1 TVI Instruction',
  description:
    'Learn braille at your own pace with personalized 1-on-1 instruction from Delaney Costello, a certified Teacher of the Visually Impaired. Schedule a session today.',
  alternates: { canonical: 'https://teachbraille.org/appointments' },
  openGraph: {
    title: 'Book a Braille Lesson — 1-on-1 TVI Instruction | TeachBraille.org',
    description: 'Personalized braille instruction at your own pace from a certified Teacher of the Visually Impaired.',
    url: 'https://teachbraille.org/appointments',
  },
};

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

/** Each reason is marked with a decorative cell for its first letter. */
const REASONS = [
  {
    letter: 'l',
    title: 'Learn at your own pace',
    text: 'Every minute is focused on your progress — no need to keep up with a group or wait for others to catch up.',
  },
  {
    letter: 'c',
    title: 'Curriculum built around you',
    text: 'Lessons are tailored to your specific goals — whether that’s reading to your child, writing notes, or building professional skills.',
  },
  {
    letter: 'f',
    title: 'Flexible commitment',
    text: 'No 8-week commitment required. Book sessions as you need them, on a schedule that works for you.',
  },
];

const STEPS = [
  {
    title: 'Reach out',
    text: 'Send a request below (or an email) with your name, experience level, and goals.',
  },
  {
    title: 'Plan your sessions',
    text: 'Delaney will follow up to discuss scheduling and a plan tailored to you.',
  },
  {
    title: 'Start learning',
    text: 'Meet via video call and begin building your braille skills.',
  },
];

export default function AppointmentsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero lattice" aria-labelledby="appt-title">
        <div className="wrap page-hero-grid">
          <div>
            <Eyebrow>1-on-1 sessions</Eyebrow>
            <h1 id="appt-title">Book a private braille lesson</h1>
            <p className="lead">
              Personalized braille instruction tailored to your pace, your goals, and your schedule, with a certified
              Teacher of the Visually Impaired.
            </p>
            <div className="cluster mt-5">
              <a href="#book" className="btn btn--lg">
                <ButtonCell letter="b" />
                Request a session
              </a>
              <Link href="/learn" className="btn btn--paper">
                Try the free lessons first
              </Link>
            </div>
          </div>

          <div className="tile appt-meet">
            <BrailleText text="hello" size="md" pop />
            <h2 className="appt-meet-name">Meet Delaney Costello</h2>
            <p>
              Delaney is a <strong>Teacher of the Visually Impaired</strong> with{' '}
              <strong>9 years of teaching experience</strong> — 6 years in person and 3 years in a hybrid of in-person
              and remote services.
            </p>
            <p>
              Whether you&rsquo;re a parent wanting to connect with your child, a family member hoping to read alongside
              a loved one, or a professional building braille skills, Delaney tailors every session to meet you where
              you are.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why private sessions ── */}
      <section className="section" aria-labelledby="why-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Why 1-on-1</Eyebrow>
            <h2 id="why-heading">Why choose private sessions?</h2>
          </div>
          <ul className="appt-reasons" role="list">
            {REASONS.map((r) => (
              <li key={r.title} className="tile appt-reason">
                <Cell dots={LETTERS[r.letter]} size="md" framed className="appt-reason-cell" />
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>

          <div className="callout callout--sky appt-who">
            <Cell dots={LETTERS.w} size="sm" />
            <div>
              <h3 className="callout-title">Who are sessions for?</h3>
              <p>
                Parents, family members, educators, paraprofessionals, and anyone interested in learning Unified English
                Braille. No prior experience needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section-tight band-sunk lattice" aria-labelledby="how-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>How it works</Eyebrow>
            <h2 id="how-heading">Three simple steps</h2>
          </div>
          <ol className="appt-steps" role="list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="appt-step">
                <span className="appt-step-num" aria-hidden="true">
                  <BrailleText text={String(i + 1)} size="xs" />
                  <span>{i + 1}</span>
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Booking ── */}
      <section id="book" className="section appt-book" aria-labelledby="booking-heading">
        <div className="wrap appt-book-grid">
          <div className="appt-book-intro">
            <Eyebrow>Book</Eyebrow>
            <h2 id="booking-heading" className="mt-3">
              Schedule a session
            </h2>
            {CALENDLY_URL ? (
              <p className="mt-4">Pick a time that suits you in the calendar below.</p>
            ) : (
              <p className="mt-4">
                Tell Delaney a little about yourself and she&rsquo;ll be in touch to find a time that works.
              </p>
            )}
            <p className="mt-4">
              Prefer email? Contact <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>
            </p>
          </div>

          {CALENDLY_URL ? (
            <div className="tile appt-calendly">
              <iframe
                src={CALENDLY_URL}
                width="100%"
                height="700"
                style={{ border: 0 }}
                title="Schedule an appointment with Delaney Costello (Calendly)"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="tile appt-form-card">
              <AppointmentRequestForm />
            </div>
          )}
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="section-tight band-sunk" aria-labelledby="more-heading">
        <div className="wrap">
          <h2 id="more-heading" className="sr-only">
            Other ways to learn
          </h2>
          <ul className="appt-more" role="list">
            <li>
              <Link href="/courses" className="tile tile-link appt-more-card">
                <BrailleText text="class" size="sm" />
                <span className="appt-more-title">Looking for a group course?</span>
                <span className="link-arrow">See live braille courses</span>
              </Link>
            </li>
            <li>
              <Link href="/learn" className="tile tile-link appt-more-card">
                <BrailleText text="learn" size="sm" />
                <span className="appt-more-title">Just getting started?</span>
                <span className="link-arrow">Free beginner lessons</span>
              </Link>
            </li>
            <li>
              <Link href="/services#schools" className="tile tile-link appt-more-card">
                <BrailleText text="school" size="sm" />
                <span className="appt-more-title">Booking for a school or district?</span>
                <span className="link-arrow">TVI services for schools</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
