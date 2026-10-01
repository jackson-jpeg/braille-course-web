import { test, expect, type Page } from '@playwright/test';
import { ALL_LESSONS, type LessonBlock } from '../lib/course-curriculum';
import { freshVisitor } from './helpers';

/**
 * Every lesson, end to end, using only the keyboard for the writing drill:
 * write each character by pressing its dot numbers, answer the quiz, mark the lesson done,
 * and follow the link to its practice game.
 */
async function writeCell(page: Page, drill: ReturnType<Page['locator']>, dots: readonly number[]) {
  // Focus the pad, then type dot numbers and press Enter (Perkins-style).
  await drill.locator('.dotpad-dot').first().focus();
  // Clear anything raised from a previous attempt.
  await page.keyboard.press('Backspace');
  for (const d of dots) await page.keyboard.press(String(d));
  await page.keyboard.press('Enter');
}

for (const lesson of ALL_LESSONS) {
  test(`lesson ${lesson.slug} can be completed with the keyboard`, async ({ page }) => {
    await freshVisitor(page);
    await page.goto(`/learn/${lesson.slug}`);
    await expect(page.locator('h1')).toHaveText(lesson.title);

    const writes = lesson.blocks.filter((b): b is Extract<LessonBlock, { type: 'write' }> => b.type === 'write');
    for (const [wi, w] of writes.entries()) {
      const drill = page
        .locator('.drill')
        .filter({ has: page.getByRole('heading', { name: w.title }) })
        .nth(0);
      await drill.scrollIntoViewIfNeeded();
      for (const item of w.items) for (const cell of item.cells) await writeCell(page, drill, cell);
      await expect(drill.locator('.drill-done-msg'), `write drill ${wi}`).toContainText(`You wrote ${w.items.length}`);
    }

    const reads = lesson.blocks.filter((b): b is Extract<LessonBlock, { type: 'read' }> => b.type === 'read');
    for (const r of reads) {
      const drill = page.locator('.drill').filter({ has: page.getByRole('heading', { name: r.title }) });
      for (const item of r.items) {
        await drill.getByRole('button', { name: item.print, exact: true }).click();
        await drill.getByRole('button', { name: /Next|Finish/ }).click();
      }
      await expect(drill.locator('.drill-done-msg')).toContainText(`${r.items.length} of ${r.items.length} right`);
    }

    const quizzes = lesson.blocks.filter((b): b is Extract<LessonBlock, { type: 'quiz' }> => b.type === 'quiz');
    for (const q of quizzes) {
      for (const question of q.questions) {
        const group = page.getByRole('group', { name: question.prompt });
        await group.getByRole('button', { name: question.options[question.answer], exact: true }).click();
      }
    }

    await page.getByRole('button', { name: /Mark lesson done/ }).click();
    await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeFocused();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('brailleGames_progress') ?? '{}'));
    expect(stored.course.completedLessons).toContain(lesson.slug);
    expect(stored.course.lessonScores[lesson.slug]).toBe(100);

    // The practice link goes to the matching game page, which loads its board.
    await page.getByRole('link', { name: lesson.practiceLabel }).click();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });
}

test('the lesson list reflects progress and offers to continue', async ({ page }) => {
  await freshVisitor(page);
  await page.goto('/learn');
  await expect(page.getByRole('link', { name: 'Start lesson 1' }).first()).toBeVisible();
  await page.goto('/learn/what-is-braille');
  await page.getByRole('button', { name: /Mark lesson done/ }).click();
  await page.goto('/learn');
  await expect(page.getByText('1 of 12 lessons done')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue: lesson 2' })).toBeVisible();
});

test('home "next step" follows progress', async ({ page }) => {
  await freshVisitor(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Lesson 1: What is braille\?/ })).toBeVisible();
});
