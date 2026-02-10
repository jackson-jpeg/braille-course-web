'use client';

import { useState } from 'react';

const faqs = [
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
    a: 'Delaney serves students from pre-K through 12th grade, as well as adult learners. Instruction is individually tailored to each student\u2019s age, skill level, visual diagnosis, and IEP or learning goals.',
  },
  {
    q: 'How is pricing structured for school contracts?',
    a: 'Pricing depends on the number of students, service hours per week, and contract duration. After an initial consultation, Delaney provides a customized proposal with transparent pricing tailored to your district\u2019s needs and budget.',
  },
  {
    q: 'Can you participate in IEP and 504 meetings?',
    a: 'Absolutely. Full participation in IEP meetings, 504 meetings, and collaboration with the student\u2019s educational team is included with every contract. Delaney works closely with classroom teachers, related service providers, and administrators.',
  },
  {
    q: 'Do you provide services in states where you\u2019re not currently licensed?',
    a: 'Delaney is always willing to obtain licensure in additional states. If your state isn\u2019t currently listed, reach out and she\u2019ll work with you to explore options and timelines for getting licensed in your area.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section className="services-faq" aria-labelledby="faq-heading">
      <div className="services-faq-inner reveal">
        <div className="section-label">Common Questions</div>
        <h2 id="faq-heading">Frequently Asked Questions</h2>
        <div className="faq-list" role="list">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className={`faq-item ${isOpen ? 'faq-item-open' : ''}`} role="listitem">
                <button
                  className="faq-question"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span>{faq.q}</span>
                  <span className="faq-icon" aria-hidden="true">
                    {isOpen ? '\u2212' : '+'}
                  </span>
                </button>
                <div id={`faq-answer-${i}`} className="faq-answer" role="region" hidden={!isOpen}>
                  <p>{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
