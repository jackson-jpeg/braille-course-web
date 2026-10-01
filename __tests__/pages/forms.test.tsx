import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SchoolContactForm from '@/components/SchoolContactForm';
import AppointmentRequestForm from '@/components/AppointmentRequestForm';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
});

/** Every visible form control (the hidden honeypot excluded) must have a label. */
function expectAllControlsLabelled(container: HTMLElement) {
  const controls = Array.from(container.querySelectorAll<HTMLInputElement>('input, select, textarea')).filter(
    (el) => el.getAttribute('name') !== 'website',
  );
  expect(controls.length).toBeGreaterThan(0);
  for (const el of controls) {
    expect(el.labels?.length ?? 0).toBeGreaterThan(0);
    expect(el.labels![0].textContent!.trim().length).toBeGreaterThan(0);
  }
}

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form')!);
}

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('SchoolContactForm', () => {
  it('labels every control and marks required fields in text', () => {
    const { container } = render(<SchoolContactForm />);
    expectAllControlsLabelled(container);
    expect(screen.getByLabelText(/school name \(required\)/i)).toBeRequired();
    expect(screen.getByLabelText(/^email \(required\)/i)).toBeRequired();
    expect(screen.getByLabelText(/phone number \(optional\)/i)).not.toBeRequired();
  });

  it('shows inline errors, focuses the first invalid field and does not call fetch when empty', () => {
    const { container } = render(<SchoolContactForm />);
    submit(container);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/fields marked below/i);

    const school = screen.getByLabelText(/school name/i);
    expect(school).toHaveAttribute('aria-invalid', 'true');
    expect(school).toHaveAccessibleDescription(/enter your school/i);
    expect(school).toHaveFocus();

    expect(screen.getByLabelText(/^email/i)).toHaveAccessibleDescription(/enter your email/i);
    expect(screen.getByText('Please select at least one service.')).toBeInTheDocument();
  });

  it('requires details when only "Other" is selected', () => {
    const { container } = render(<SchoolContactForm />);
    type(/school name/i, 'Lincoln Elementary');
    type(/district name/i, 'Springfield');
    type(/your name/i, 'Pat Lee');
    type(/title or role/i, 'Director');
    type(/^email/i, 'pat@school.org');
    fireEvent.click(screen.getByLabelText('Other'));
    submit(container);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/additional details/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('posts the same payload to /api/school-contact and announces success', async () => {
    const { container } = render(<SchoolContactForm />);
    type(/school name/i, ' Lincoln Elementary ');
    type(/district name/i, 'Springfield District');
    fireEvent.change(screen.getByLabelText(/state \/ region/i), { target: { value: 'Florida' } });
    type(/your name/i, 'Pat Lee');
    type(/title or role/i, 'Special Education Director');
    type(/^email/i, 'pat@school.org');
    type(/phone number/i, '(555) 123-4567');
    fireEvent.click(screen.getByLabelText('Braille Instruction (UEB)'));
    fireEvent.click(screen.getByLabelText('Assistive Technology'));
    type(/additional details/i, 'Two students, grades 3 and 5.');
    fireEvent.change(screen.getByLabelText(/number of students/i), { target: { value: '2-3' } });
    type(/start timeline/i, 'Next school year');
    fireEvent.click(screen.getByLabelText(/hybrid/i));
    submit(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/school-contact');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({
      schoolName: 'Lincoln Elementary',
      districtName: 'Springfield District',
      state: 'Florida',
      contactName: 'Pat Lee',
      email: 'pat@school.org',
      phone: '(555) 123-4567',
      contactTitle: 'Special Education Director',
      servicesNeeded:
        'Braille Instruction (UEB), Assistive Technology\n\nAdditional details: Two students, grades 3 and 5.',
      studentCount: '2-3',
      deliveryPreference: 'Hybrid',
      timeline: 'Next school year',
      website: '',
    });

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/inquiry received/i);
    expect(status).toHaveFocus();
  });

  it('shows the server error in an alert', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Too many requests.' }) });
    const { container } = render(<SchoolContactForm />);
    type(/school name/i, 'Lincoln Elementary');
    type(/district name/i, 'Springfield');
    type(/your name/i, 'Pat Lee');
    type(/title or role/i, 'Director');
    type(/^email/i, 'pat@school.org');
    fireEvent.click(screen.getByLabelText('Assistive Technology'));
    submit(container);
    expect(await screen.findByText('Too many requests.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Too many requests.');
  });
});

describe('AppointmentRequestForm', () => {
  it('labels every control and marks required fields in text', () => {
    const { container } = render(<AppointmentRequestForm />);
    expectAllControlsLabelled(container);
    expect(screen.getByLabelText(/^name \(required\)/i)).toBeRequired();
    expect(screen.getByLabelText(/phone number \(required\)/i)).toBeRequired();
    expect(screen.getByLabelText(/questions or goals \(optional\)/i)).not.toBeRequired();
  });

  it('shows inline errors, focuses the first invalid field and does not call fetch when empty', () => {
    const { container } = render(<AppointmentRequestForm />);
    submit(container);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/3 fields marked below/i);
    const nameInput = screen.getByLabelText(/^name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAccessibleDescription('Enter your name.');
    expect(nameInput).toHaveFocus();
    expect(screen.getByLabelText(/phone number/i)).toHaveAccessibleDescription('Enter your phone number.');
  });

  it('rejects an invalid email without calling fetch', () => {
    const { container } = render(<AppointmentRequestForm />);
    type(/^name/i, 'Sam Rivera');
    type(/^email/i, 'not-an-email');
    type(/phone number/i, '5551234567');
    submit(container);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^email/i)).toHaveFocus();
  });

  it('posts the same payload to /api/appointment-request and announces success', async () => {
    const { container } = render(<AppointmentRequestForm />);
    type(/^name/i, ' Sam Rivera ');
    type(/^email/i, 'sam@example.com');
    type(/phone number/i, '555-123-4567');
    type(/callback time/i, 'Weekday mornings');
    type(/questions or goals/i, 'I want to read with my daughter.');
    submit(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/appointment-request');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({
      name: 'Sam Rivera',
      email: 'sam@example.com',
      phone: '555-123-4567',
      questions: 'I want to read with my daughter.',
      preferredCallbackTime: 'Weekday mornings',
      website: '',
    });

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/request received/i);
    expect(status).toHaveFocus();
  });
});
