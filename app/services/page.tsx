import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import BrailleHero from '@/components/BrailleHero';
import SchoolContactForm from '@/components/SchoolContactForm';

export const metadata: Metadata = {
  title: 'TVI Services — TeachBraille.org',
  description:
    'Contracted vision services for schools and districts. Delaney Costello is a certified Teacher of the Visually Impaired offering braille instruction, assistive technology training, and expanded core curriculum services.',
  openGraph: {
    title: 'TVI Services — TeachBraille.org',
    description:
      'Contracted vision services for schools, districts, and organizations from a certified TVI.',
  },
};

export default function ServicesPage() {
  return (
    <>
      {/* ========== HERO ========== */}
      <section className="services-hero" id="top">
        <div className="services-hero-content" id="main-content">
          <BrailleHero word="TVI SERVICES" />
          <div className="section-label">For Schools &amp; Districts</div>
          <h1>
            TVI <em>Services</em>
          </h1>
          <p className="services-hero-sub">
            Contracted Vision Services for Schools &amp; Districts
          </p>
        </div>
      </section>

      {/* ========== ABOUT / PROFESSIONAL BIO ========== */}
      <section className="services-about" aria-labelledby="services-about-heading">
        <div className="services-about-inner reveal">
          <div className="section-label">About Delaney</div>
          <h2 id="services-about-heading">Professional Background</h2>
          <p className="services-about-text">
            Delaney Costello is a <strong>certified Teacher of the Visually
            Impaired</strong> with <strong>9 years of teaching experience</strong>.
            She earned her degree in <strong>Blindness &amp; Low Vision
            Education from Florida State University in 2017</strong> and spent
            6 years traveling to schools across the state, providing in-person
            services to PK–12th grade students with a wide range of visual
            diagnoses — from totally blind to low vision.
          </p>
          <p className="services-about-text">
            In 2023, Delaney expanded to <strong>remote service delivery</strong>,
            obtaining teaching licenses beyond Florida. She is currently
            licensed in <strong>Florida, Georgia, Kansas, and Virginia</strong> —
            and is always willing to obtain licensure in additional states.
            Today she operates a <strong>hybrid model</strong> — offering remote
            services nationwide and in-person instruction in the Tampa, Florida
            area — giving schools and districts flexible access to a highly
            qualified vision specialist.
          </p>
          <p className="services-about-text">
            Collaboration with other teachers, service providers, and members
            of the student&apos;s educational team is guaranteed with every
            contract. This includes full participation in <strong>IEP meetings,
            504 meetings</strong>, and any other meetings related to the
            student&apos;s education.
          </p>
          <blockquote className="pullquote">
            <p>
              Every student with a visual impairment deserves access to a
              <em> certified vision specialist</em> who understands their unique
              learning needs.
            </p>
          </blockquote>
        </div>
      </section>

      {/* ========== CAREER TIMELINE ========== */}
      <section className="services-timeline" aria-labelledby="services-timeline-heading">
        <div className="services-timeline-inner reveal">
          <h2 id="services-timeline-heading">Career Timeline</h2>
          <div className="services-timeline-track">
            <div className="services-timeline-item">
              <div className="services-timeline-year">2017</div>
              <div className="services-timeline-content">
                <h3>FSU Graduation</h3>
                <p>Blindness &amp; Low Vision Education degree from Florida State University</p>
              </div>
            </div>
            <div className="services-timeline-item">
              <div className="services-timeline-year">2017–2023</div>
              <div className="services-timeline-content">
                <h3>6 Years In-Person</h3>
                <p>Traveling to schools serving PK–12th grade students across multiple districts</p>
              </div>
            </div>
            <div className="services-timeline-item">
              <div className="services-timeline-year">2023</div>
              <div className="services-timeline-content">
                <h3>Remote Expansion</h3>
                <p>Expanded beyond Florida with teaching licenses in Georgia, Kansas, and Virginia</p>
              </div>
            </div>
            <div className="services-timeline-item">
              <div className="services-timeline-year">Present</div>
              <div className="services-timeline-content">
                <h3>Hybrid Services</h3>
                <p>Remote services nationwide combined with in-person instruction in Tampa, FL</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SERVICES OFFERED ========== */}
      <section className="services-offered" aria-labelledby="services-offered-heading">
        <div className="services-offered-inner reveal">
          <div className="section-label">What We Offer</div>
          <h2 id="services-offered-heading">Services Offered</h2>
          <div className="services-offered-grid">
            <div className="services-card">
              <div className="services-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3>Braille Instruction</h3>
              <p>
                UEB (Unified English Braille) reading and writing instruction
                tailored to each student&apos;s level and learning goals.
              </p>
            </div>
            <div className="services-card">
              <div className="services-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3>Screen Reader Instruction</h3>
              <p>
                Training on JAWS, VoiceOver, NVDA, and ChromeVox to build
                digital independence and technology fluency.
              </p>
            </div>
            <div className="services-card">
              <div className="services-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <h3>Assistive Technology</h3>
              <p>
                Comprehensive AT assessment and instruction — helping students
                find and master the tools that work best for them.
              </p>
            </div>
            <div className="services-card">
              <div className="services-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <h3>Expanded Core Curriculum</h3>
              <p>
                Instruction across <a href="#ecc">8 of the 9 ECC areas</a> —
                building the essential skills that go beyond academics for
                students with visual impairments.
              </p>
            </div>
            <div className="services-card">
              <div className="services-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Team Collaboration</h3>
              <p>
                Full participation in IEP meetings, 504 meetings, and
                collaboration with teachers, service providers, and the
                student&apos;s entire educational team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ECC DETAIL SECTION ========== */}
      <section className="services-ecc" aria-labelledby="services-ecc-heading" id="ecc">
        <div className="services-ecc-inner reveal">
          <div className="section-label">Expanded Core Curriculum</div>
          <h2 id="services-ecc-heading">The Expanded Core Curriculum</h2>
          <p className="services-ecc-intro">
            The ECC encompasses 9 skill areas essential for students with visual
            impairments. Delaney provides direct instruction in the following 8
            areas:
          </p>
          <div className="services-ecc-grid">
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Self-Determination</h3>
              <p>Building confidence, self-advocacy, and independent decision-making skills.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Social Skills</h3>
              <p>Developing nonverbal communication, social cues, and relationship-building.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3>Compensatory Skills</h3>
              <p>Braille literacy, tactile learning strategies, and alternative communication methods.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Career Skills</h3>
              <p>Exploring career interests, workplace readiness, and vocational goal-setting.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" />
                </svg>
              </div>
              <h3>Recreation &amp; Leisure</h3>
              <p>Discovering hobbies, sports, and leisure activities adapted for visual impairments.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3>Sensory Efficiency</h3>
              <p>Maximizing use of residual vision, hearing, touch, and other senses for learning.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3>Assistive Technology</h3>
              <p>Screen readers, magnification software, braille displays, and other adaptive tools for learning and communication.</p>
            </div>
            <div className="services-ecc-item">
              <div className="services-ecc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <h3>Daily Living Skills</h3>
              <p>Cooking, personal care, money management, and other essential independent living skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BENEFIT CALLOUT ========== */}
      <section className="benefit-callout" aria-labelledby="services-benefit-heading">
        <div className="benefit-inner reveal">
          <div className="benefit-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          </div>
          <h2 id="services-benefit-heading">Why Choose a Certified TVI?</h2>
          <p>
            Students with visual impairments have unique educational needs that
            go far beyond what general education support can provide. A certified
            Teacher of the Visually Impaired brings specialized training in
            braille literacy, assistive technology, and the Expanded Core
            Curriculum — ensuring your students receive instruction from someone
            who truly understands how vision loss impacts learning and
            development.
          </p>
        </div>
      </section>

      {/* ========== HOW TO GET STARTED ========== */}
      <section className="services-start" aria-labelledby="services-start-heading">
        <div className="services-start-inner reveal">
          <h2 id="services-start-heading">How to Get Started</h2>
          <div className="services-steps">
            <div className="services-step">
              <div className="services-step-number" aria-hidden="true">1</div>
              <h3>Reach Out</h3>
              <p>
                Contact Delaney with your district or school&apos;s vision
                service needs.
              </p>
            </div>
            <div className="services-step">
              <div className="services-step-number" aria-hidden="true">2</div>
              <h3>Consultation</h3>
              <p>
                Discuss student needs, scheduling, and service delivery
                options — remote, in-person, or hybrid.
              </p>
            </div>
            <div className="services-step">
              <div className="services-step-number" aria-hidden="true">3</div>
              <h3>Begin Services</h3>
              <p>
                Start remote or in-person instruction tailored to each
                student&apos;s IEP and learning goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACT FORM ========== */}
      <section className="services-contact" aria-labelledby="services-contact-heading">
        <div className="services-contact-inner reveal">
          <h2 id="services-contact-heading">Get in Touch</h2>
          <p className="services-contact-intro">
            Fill out the form below and Delaney will reach out within 2 business days to
            discuss your vision service needs and schedule a consultation.
          </p>
          <SchoolContactForm />
          <p className="services-fallback-email">
            Prefer email? Contact{' '}
            <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>
          </p>
        </div>
      </section>

      {/* ========== CROSS-LINKS ========== */}
      <section className="services-crosslink">
        <div className="services-crosslink-inner reveal">
          <p>
            Looking for individual braille lessons?{' '}
            <Link href="/appointments">Book an Appointment &rarr;</Link>
          </p>
          <p>
            New to braille?{' '}
            <Link href="/intro">Start with Intro to Braille &rarr;</Link>
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
