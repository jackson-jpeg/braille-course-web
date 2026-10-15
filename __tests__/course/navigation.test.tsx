/**
 * Course navigation: Previous / Next walk every lesson in order with nothing skipped, and the
 * course home's Resume button never sends a learner back into a lesson they have finished.
 */
import { render, screen } from '@testing-library/react';
import LessonNav from '@/components/course/LessonNav';
import LessonList from '@/components/course/LessonList';
import { ALL_LESSONS, getAdjacentLessons } from '@/lib/course-curriculum';
import { clearProgress, markLessonComplete, setLastLesson } from '@/lib/progress-storage';

function navHrefs(slug: string): [string, string] {
  const { prev, next } = getAdjacentLessons(slug);
  const { container, unmount } = render(<LessonNav prev={prev} next={next} />);
  const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');
  unmount();
  expect(hrefs).toHaveLength(2);
  return [hrefs[0], hrefs[1]];
}

describe('lesson Previous / Next', () => {
  test.each(ALL_LESSONS.map((l, i) => [l.slug, i] as const))('%s links to its neighbours', (slug, i) => {
    const [prev, next] = navHrefs(slug);
    expect(prev).toBe(i === 0 ? '/learn' : `/learn/${ALL_LESSONS[i - 1].slug}`);
    expect(next).toBe(i === ALL_LESSONS.length - 1 ? '/learn' : `/learn/${ALL_LESSONS[i + 1].slug}`);
  });

  test('following Next from the first lesson visits every lesson exactly once, in course order', () => {
    const visited: string[] = [];
    let href = `/learn/${ALL_LESSONS[0].slug}`;
    while (href !== '/learn') {
      const slug = href.replace('/learn/', '');
      expect(visited).not.toContain(slug);
      visited.push(slug);
      href = navHrefs(slug)[1];
    }
    expect(visited).toEqual(ALL_LESSONS.map((l) => l.slug));
  });
});

describe('course home Resume button', () => {
  beforeEach(() => clearProgress());

  const cta = () => screen.getByRole('link', { name: /^(Start the course|Resume:|Review from the start)/ });

  test('a new learner starts at lesson 1', () => {
    render(<LessonList />);
    expect(cta().getAttribute('href')).toBe(`/learn/${ALL_LESSONS[0].slug}`);
  });

  test('a lesson opened but not finished is resumed', () => {
    setLastLesson(ALL_LESSONS[2].slug);
    render(<LessonList />);
    expect(cta().getAttribute('href')).toBe(`/learn/${ALL_LESSONS[2].slug}`);
  });

  test('after finishing a lesson, Resume goes to the next one, not back to the finished lesson', () => {
    markLessonComplete(ALL_LESSONS[0].slug, 100);
    markLessonComplete(ALL_LESSONS[1].slug, 100);
    markLessonComplete(ALL_LESSONS[2].slug, 100);
    render(<LessonList />);
    expect(cta().getAttribute('href')).toBe(`/learn/${ALL_LESSONS[3].slug}`);
    expect(cta().textContent).toContain(ALL_LESSONS[3].title);
  });

  test('a finished last lesson with earlier gaps resumes at the first gap', () => {
    markLessonComplete(ALL_LESSONS[0].slug, 100);
    markLessonComplete(ALL_LESSONS[ALL_LESSONS.length - 1].slug, 100);
    render(<LessonList />);
    expect(cta().getAttribute('href')).toBe(`/learn/${ALL_LESSONS[1].slug}`);
  });
});
