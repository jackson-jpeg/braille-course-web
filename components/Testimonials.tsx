const testimonials = [
  {
    quote:
      'Delaney transformed our braille program. Her ability to connect with students remotely is remarkable — our students look forward to every session.',
    name: 'Sarah Mitchell',
    role: 'Special Education Director',
    org: 'Hillsborough County Schools',
  },
  {
    quote:
      "Within just a few months, my daughter went from struggling with basic letters to reading full sentences in braille. Delaney's patience and expertise made all the difference.",
    name: 'James & Maria Torres',
    role: 'Parents',
    org: 'Tampa, FL',
  },
  {
    quote:
      'Having a certified TVI who understands IEP goals and collaborates so closely with our team has been invaluable. Delaney is a true partner in our students\u2019 success.',
    name: 'Dr. Karen Williams',
    role: 'District Vision Coordinator',
    org: 'Fairfax County Public Schools',
  },
  {
    quote:
      'The remote delivery model works beautifully. Our rural district finally has consistent access to a qualified vision specialist without the travel barriers.',
    name: 'Tom Nguyen',
    role: 'Principal',
    org: 'Wichita Unified School District',
  },
];

export default function Testimonials() {
  return (
    <section className="services-testimonials" aria-labelledby="testimonials-heading">
      <div className="services-testimonials-inner reveal">
        <div className="section-label">What People Are Saying</div>
        <h2 id="testimonials-heading">Trusted by Schools &amp; Families</h2>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <blockquote key={t.name} className="testimonial-card">
              <p className="testimonial-quote">{t.quote}</p>
              <footer className="testimonial-attribution">
                <cite className="testimonial-name">{t.name}</cite>
                <span className="testimonial-role">{t.role}</span>
                <span className="testimonial-org">{t.org}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
