import type { Metadata } from 'next';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import SchoolContactForm from '@/components/SchoolContactForm';
import { LETTERS } from '@/lib/ueb';
import '@/styles/pages/services.css';

export const metadata: Metadata = {
  title: 'TVI Services for Schools & Districts — Braille Instruction & More',
  description:
    'Teach braille in your school or district. Contracted TVI services from Delaney Costello including braille instruction, assistive technology training, compensatory skills, and expanded core curriculum.',
  alternates: { canonical: 'https://teachbraille.org/services' },
  openGraph: {
    title: 'TVI Services for Schools & Districts | TeachBraille.org',
    description:
      'Contracted vision services from a certified TVI — braille instruction, assistive technology, and expanded core curriculum for schools and districts.',
    url: 'https://teachbraille.org/services',
  },
};

const CONTACT_EMAIL = 'Delaney@TeachBraille.org';

const STEPS = [
  {
    title: 'Inquire',
    text: 'Fill out the contact form below or send an email describing your school’s vision service needs.',
  },
  {
    title: 'Plan',
    text: 'We’ll schedule a consultation to discuss student needs, service hours, and delivery preferences.',
  },
  {
    title: 'Learn',
    text: 'Your students begin receiving expert braille and vision instruction — remote, in-person, or hybrid.',
  },
];

/** Each service is marked with a decorative cell for its first letter. */
const SERVICES = [
  {
    letter: 'b',
    title: 'Braille instruction',
    text: 'UEB (Unified English Braille) reading and writing instruction tailored to each student’s level and learning goals.',
  },
  {
    letter: 's',
    title: 'Screen reader instruction',
    text: 'Training on JAWS, VoiceOver, NVDA, and ChromeVox to build digital independence and technology fluency.',
  },
  {
    letter: 'a',
    title: 'Assistive technology',
    text: 'Comprehensive AT assessment and instruction — helping students find and master the tools that work best for them.',
  },
  {
    letter: 'e',
    title: 'Expanded Core Curriculum',
    text: 'Instruction across 8 of the 9 ECC areas — building the essential skills that go beyond academics for students with visual impairments.',
    link: { href: '#ecc', label: 'See the 8 ECC areas' },
  },
  {
    letter: 't',
    title: 'Team collaboration',
    text: 'Full participation in IEP meetings, 504 meetings, and collaboration with teachers, service providers, and the student’s entire educational team.',
  },
];

const ECC_AREAS = [
  { title: 'Self-determination', text: 'Building confidence, self-advocacy, and independent decision-making skills.' },
  { title: 'Social skills', text: 'Developing nonverbal communication, social cues, and relationship-building.' },
  {
    title: 'Compensatory skills',
    text: 'Braille literacy, tactile learning strategies, and alternative communication methods.',
  },
  { title: 'Career skills', text: 'Exploring career interests, workplace readiness, and vocational goal-setting.' },
  {
    title: 'Recreation & leisure',
    text: 'Discovering hobbies, sports, and leisure activities adapted for visual impairments.',
  },
  {
    title: 'Sensory efficiency',
    text: 'Maximizing use of residual vision, hearing, touch, and other senses for learning.',
  },
  {
    title: 'Assistive technology',
    text: 'Screen readers, magnification software, braille displays, and other adaptive tools for learning and communication.',
  },
  {
    title: 'Daily living skills',
    text: 'Cooking, personal care, money management, and other essential independent living skills.',
  },
];

const TIMELINE = [
  {
    when: '2017',
    title: 'FSU graduation',
    text: 'Blindness & Low Vision Education degree from Florida State University.',
  },
  {
    when: '2017–2023',
    title: '6 years in person',
    text: 'Traveling to schools serving PK–12th grade students across multiple districts.',
  },
  {
    when: '2023',
    title: 'Remote expansion',
    text: 'Expanded beyond Florida with teaching licenses in Georgia, Kansas, and Virginia.',
  },
  {
    when: 'Present',
    title: 'Hybrid services',
    text: 'Remote services nationwide combined with in-person instruction in Tampa, FL.',
  },
];

const FAQS = [
  {
    q: 'What qualifications does a TVI need?',
    a: 'A Teacher of the Visually Impaired (TVI) holds specialized certification in blindness and low vision education. Delaney earned her degree in Blindness & Low Vision Education from Florida State University and is licensed in multiple states including Florida, Georgia, Kansas, and Virginia.',
  },
  {
    q: 'How does remote service delivery work?',
    a: 'Remote sessions are conducted via video call using screen-sharing and tactile materials sent in advance. Students interact directly with the TVI in real-time, practicing braille reading and writing, assistive technology skills, and ECC areas. Many families and schools find remote delivery just as effective as in-person instruction.',
  },
  {
    q: 'What grade levels do you serve?',
    a: 'Delaney serves students from pre-K through 12th grade, as well as adult learners. Instruction is individually tailored to each student’s age, skill level, visual diagnosis, and IEP or learning goals.',
  },
  {
    q: 'How is pricing structured for school contracts?',
    a: 'Pricing depends on the number of students, service hours per week, and contract duration. After an initial consultation, Delaney provides a customized proposal with transparent pricing tailored to your district’s needs and budget.',
  },
  {
    q: 'Can you participate in IEP and 504 meetings?',
    a: 'Absolutely. Full participation in IEP meetings, 504 meetings, and collaboration with the student’s educational team is included with every contract. Delaney works closely with classroom teachers, related service providers, and administrators.',
  },
  {
    q: 'Do you provide services in states where you’re not currently licensed?',
    a: 'Delaney is always willing to obtain licensure in additional states. If your state isn’t currently listed, reach out and she’ll work with you to explore options and timelines for getting licensed in your area.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── Hero ── */}
      <section className="page-hero lattice" aria-labelledby="services-title">
        <div className="wrap page-hero-grid">
          <div>
            <Eyebrow>TVI services</Eyebrow>
            <h1 id="services-title">Vision services for schools and districts</h1>
            <p className="lead">
              Contracted TVI services from Delaney Costello, a certified Teacher of the Visually Impaired: braille,
              assistive technology and the Expanded Core Curriculum, remote nationwide or in person in Tampa, FL.
            </p>
            <div className="cluster mt-5">
              <a href="#schools" className="btn btn--lg">
                <ButtonCell letter="c" />
                Request a consultation
              </a>
              <Link href="/appointments" className="btn btn--paper">
                1-on-1 lessons for families
              </Link>
            </div>
          </div>

          <div className="tile svc-glance">
            <h2 id="glance-heading" className="svc-glance-title">
              At a glance
            </h2>
            <ul className="svc-glance-list" role="list">
              <li>
                <span className="svc-glance-num">9+</span>
                <span>years teaching experience</span>
              </li>
              <li>
                <span className="svc-glance-num">4</span>
                <span>state licenses: FL, GA, KS and VA</span>
              </li>
              <li>
                <span className="svc-glance-num">8 of 9</span>
                <span>ECC areas covered</span>
              </li>
              <li>
                <span className="svc-glance-num">PK–12</span>
                <span>grade levels served</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Two ways to work together ── */}
      <section className="section-tight band-sunk" aria-labelledby="paths-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Work with Delaney</Eyebrow>
            <h2 id="paths-heading">Two ways to work together</h2>
          </div>
          <ul className="svc-paths" role="list">
            <li>
              <a href="#schools" className="tile tile-link svc-path">
                <BrailleText text="school" size="sm" />
                <span className="svc-path-title">For schools and districts</span>
                <span className="svc-path-text">
                  Contracted TVI services for your students: direct instruction, assessments and full participation in
                  IEP and 504 meetings.
                </span>
                <span className="link-arrow svc-path-cta">Request a consultation</span>
              </a>
            </li>
            <li>
              <Link href="/appointments" className="tile tile-link svc-path svc-path--family">
                <BrailleText text="home" size="sm" />
                <span className="svc-path-title">For families and individuals</span>
                <span className="svc-path-text">
                  Private 1-on-1 braille sessions by video call for parents, family members and professionals, booked as
                  you need them.
                </span>
                <span className="link-arrow svc-path-cta">Book a session</span>
              </Link>
            </li>
            <li>
              <Link href="/courses" className="tile tile-link svc-path svc-path--course">
                <BrailleText text="class" size="sm" />
                <span className="svc-path-title">Live group courses</span>
                <span className="svc-path-text">
                  Delaney&rsquo;s live remote courses, with reading practice and personal feedback on your writing.
                </span>
                <span className="link-arrow svc-path-cta">See courses</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Services offered ── */}
      <section className="section" aria-labelledby="offered-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>For schools</Eyebrow>
            <h2 id="offered-heading">Services offered</h2>
          </div>
          <ul className="svc-cards" role="list">
            {SERVICES.map((s) => (
              <li key={s.title} className="tile svc-card">
                <Cell dots={LETTERS[s.letter]} size="md" framed className="svc-card-cell" />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                {s.link && (
                  <a href={s.link.href} className="link-arrow">
                    {s.link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section-tight band-sunk lattice" aria-labelledby="how-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Getting started</Eyebrow>
            <h2 id="how-heading">How it works</h2>
          </div>
          <ol className="svc-steps" role="list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="svc-step">
                <span className="svc-step-num" aria-hidden="true">
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

      {/* ── ECC ── */}
      <section id="ecc" className="section" aria-labelledby="ecc-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow braille="ecc">Expanded Core Curriculum</Eyebrow>
            <h2 id="ecc-heading">The Expanded Core Curriculum</h2>
            <p className="measure muted">
              The ECC encompasses 9 skill areas essential for students with visual impairments. Delaney provides direct
              instruction in the following 8 areas:
            </p>
          </div>
          <ul className="svc-ecc" role="list">
            {ECC_AREAS.map((area) => (
              <li key={area.title} className="svc-ecc-item">
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Background ── */}
      <section className="section-tight band-sunk" aria-labelledby="background-heading">
        <div className="wrap svc-background">
          <div>
            <Eyebrow>About Delaney</Eyebrow>
            <h2 id="background-heading" className="mt-3">
              Professional background
            </h2>
            <ol className="svc-timeline" role="list">
              {TIMELINE.map((t) => (
                <li key={t.when} className="svc-timeline-item">
                  <span className="svc-timeline-when">{t.when}</span>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="svc-why">
            <figure className="svc-quote">
              <blockquote>
                <p>
                  Every student with a visual impairment deserves access to a <em>certified vision specialist</em> who
                  understands their unique learning needs.
                </p>
              </blockquote>
            </figure>
            <div className="callout callout--pine">
              <Cell dots={LETTERS.w} size="sm" tone="pine" />
              <div>
                <h3 className="callout-title">Why choose a certified TVI?</h3>
                <p>
                  Students with visual impairments have unique educational needs that go far beyond what general
                  education support can provide. A certified Teacher of the Visually Impaired brings specialized
                  training in braille literacy, assistive technology, and the Expanded Core Curriculum — ensuring your
                  students receive instruction from someone who truly understands how vision loss impacts learning and
                  development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" aria-labelledby="faq-heading">
        <div className="wrap-narrow">
          <div className="section-head">
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-heading">Frequently asked questions</h2>
          </div>
          <div className="svc-faq">
            {FAQS.map((f) => (
              <details key={f.q} className="svc-faq-item">
                <summary>
                  <span>{f.q}</span>
                  <span className="svc-faq-mark" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Schools contact ── */}
      <section id="schools" className="section band-pine svc-contact" aria-labelledby="schools-heading">
        <div className="wrap svc-contact-grid">
          <div className="svc-contact-intro">
            <Eyebrow>For schools</Eyebrow>
            <h2 id="schools-heading" className="mt-3">
              Get in touch about your students
            </h2>
            <p className="mt-4">
              Fill out the form and Delaney will reach out within 2 business days to discuss your vision service needs
              and schedule a consultation.
            </p>
            <p className="mt-4">
              Prefer email? Contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <div className="svc-contact-art" aria-hidden="true">
              <BrailleText text="hello" size="md" />
            </div>
          </div>
          <div className="tile svc-form-card">
            <SchoolContactForm />
          </div>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="section-tight" aria-labelledby="more-heading">
        <div className="wrap">
          <h2 id="more-heading" className="sr-only">
            More ways to learn
          </h2>
          <ul className="svc-more" role="list">
            <li>
              Looking for individual braille lessons? <Link href="/appointments">Book an appointment</Link>
            </li>
            <li>
              Want to learn in a group? <Link href="/courses">See live braille courses</Link>
            </li>
            <li>
              New to braille? <Link href="/learn">Start the free lessons</Link> or browse the{' '}
              <Link href="/intro">braille alphabet chart</Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
