/**
 * The one app line at the end of the course (Jackson approved, Inbox 45cd71a2): once the last
 * lesson is finished, the learner is offered the free iPhone and iPad app, linked to the App
 * Store. Earlier lessons do not show it. The copy is exactly the approved sentence, with no em dash.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import LessonRunner from '@/components/course/LessonRunner';
import { ALL_LESSONS, getAdjacentLessons } from '@/lib/course-curriculum';
import { APP_STORE_URL } from '@/lib/app-store';
import { clearProgress, markLessonComplete } from '@/lib/progress-storage';

jest.mock('next/dynamic', () => () => {
  const Stub = () => null;
  return Stub;
});

const APPROVED = 'Or keep practicing on the go with Teach Braille, free for iPhone and iPad on the App Store.';

function renderLesson(index: number) {
  const lesson = ALL_LESSONS[index];
  const { prev, next } = getAdjacentLessons(lesson.slug);
  return render(<LessonRunner lesson={lesson} prev={prev} next={next} />);
}

beforeEach(() => clearProgress());

test('the App Store link is the Teach Braille app', () => {
  expect(APP_STORE_URL).toBe('https://apps.apple.com/app/id6833681749');
});

test('finishing the last lesson shows the approved app line, linked to the App Store', () => {
  const last = ALL_LESSONS.length - 1;
  expect(ALL_LESSONS[last].slug).toBe('wrap-up');
  const { container } = renderLesson(last);
  expect(container.querySelector('.lesson-app-line')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Mark this lesson complete' }));

  const line = container.querySelector('.lesson-app-line');
  expect(line).not.toBeNull();
  expect(line!.textContent!.replace(/\s+/g, ' ').trim()).toBe(APPROVED);
  expect(line!.textContent).not.toMatch(/—/);
  const link = screen.getByRole('link', { name: /Teach Braille, free for iPhone and iPad on the App Store/ });
  expect(link.getAttribute('href')).toBe(APP_STORE_URL);
  expect(link.getAttribute('rel')).toContain('noopener');
});

test('no earlier lesson shows the app line, even when finished', () => {
  for (let i = 0; i < ALL_LESSONS.length - 1; i++) {
    markLessonComplete(ALL_LESSONS[i].slug, 100);
    const { container, unmount } = renderLesson(i);
    expect(screen.getByText('Lesson complete.')).toBeTruthy();
    expect(container.querySelector('.lesson-app-line')).toBeNull();
    unmount();
  }
});
