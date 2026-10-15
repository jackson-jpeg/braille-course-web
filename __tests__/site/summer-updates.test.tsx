/**
 * /summer "Not ready to enroll yet?" email capture: posts to the waitlist route as the
 * summer-updates list, hides itself when the course is full, and its copy has no em dash.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import path from 'path';
import SummerUpdatesForm from '@/components/SummerUpdatesForm';
import { SpotsProvider } from '@/lib/spots-context';

const open = [{ id: 'a', label: 'Section A', maxCapacity: 5, enrolledCount: 0, status: 'OPEN' }];
const full = [{ id: 'a', label: 'Section A', maxCapacity: 5, enrolledCount: 5, status: 'FULL' }];

function renderWith(sections: typeof open) {
  return render(
    <SpotsProvider initialSections={sections}>
      <SummerUpdatesForm />
    </SpotsProvider>,
  );
}

describe('SummerUpdatesForm', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  test('saves the email to the summer-updates list and confirms', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url === '/api/waitlist-signup'
          ? { ok: true, json: async () => ({ success: true }) }
          : { ok: true, json: async () => open },
      ),
    );
    renderWith(open);
    fireEvent.change(screen.getByLabelText(/summer course updates/i), { target: { value: ' Pat@Example.com ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email Me Updates' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/on the list/));
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/waitlist-signup');
    expect(JSON.parse(call[1].body)).toEqual({ email: 'Pat@Example.com', list: 'summer-updates' });
  });

  test('shows the server error', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Please enter a valid email address' }) });
    renderWith(open);
    fireEvent.change(screen.getByLabelText(/summer course updates/i), { target: { value: 'x@y.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Email Me Updates' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Please enter a valid email address');
  });

  test('is hidden when the course is full (the waitlist takes over)', () => {
    const { container } = renderWith(full);
    expect(container.innerHTML).toBe('');
  });
});

/** User-facing text in a source file, with comments removed. */
function copyOf(file: string): string {
  return readFileSync(path.join(__dirname, '../..', file), 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('no em dashes on /summer and /learn', () => {
  test.each([
    'app/summer/page.tsx',
    'components/SummerUpdatesForm.tsx',
    'components/EnrollmentForm.tsx',
    'app/learn/page.tsx',
    'components/course/LessonList.tsx',
  ])('%s', (file) => {
    expect(copyOf(file)).not.toContain('—');
  });
});
