const steps = [
  {
    num: 1,
    title: 'Inquire',
    description: 'Fill out our contact form or send an email describing your school\u2019s vision service needs.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    num: 2,
    title: 'Plan',
    description:
      'We\u2019ll schedule a consultation to discuss student needs, service hours, and delivery preferences.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
  },
  {
    num: 3,
    title: 'Learn',
    description: 'Your students begin receiving expert braille and vision instruction — remote, in-person, or hybrid.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="services-how-it-works" aria-labelledby="how-it-works-heading">
      <div className="services-how-it-works-inner reveal">
        <div className="section-label">Getting Started</div>
        <h2 id="how-it-works-heading">How It Works</h2>
        <div className="how-it-works-steps">
          {steps.map((step, i) => (
            <div key={step.num} className="how-it-works-step">
              <div className="how-it-works-icon-wrap">
                <div className="how-it-works-icon" aria-hidden="true">
                  {step.icon}
                </div>
                {i < steps.length - 1 && <div className="how-it-works-connector" aria-hidden="true" />}
              </div>
              <div className="how-it-works-num" aria-hidden="true">
                {step.num}
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
