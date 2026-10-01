import { test, expect, type Page } from '@playwright/test';
import { GAMES } from '../lib/games/registry';
import { expectNoAxeViolations, expectNoHorizontalScroll, freshVisitor, trackErrors } from './helpers';

/**
 * Keyboard-only smoke play for every game. Each script starts the game from the keyboard and
 * gives a few answers. Deep, full-round play-throughs live in the jsdom tests (__tests__/games).
 */
type Script = (page: Page) => Promise<void>;

const press = async (page: Page, ...keys: string[]) => {
  for (const k of keys) await page.keyboard.press(k);
};

/** Tab from the top of the board until a button whose name matches is focused, then press Enter. */
async function tabToAndPress(page: Page, name: RegExp) {
  const board = page.getByTestId('game-board');
  await board.evaluate((el) => {
    const marker = document.createElement('span');
    marker.tabIndex = -1;
    marker.id = '__e2e_marker';
    el.prepend(marker);
    marker.focus();
  });
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      return a ? (a.getAttribute('aria-label') ?? a.textContent ?? '').trim() : '';
    });
    if (name.test(focused)) {
      await page.keyboard.press('Enter');
      await page.evaluate(() => document.getElementById('__e2e_marker')?.remove());
      return;
    }
  }
  throw new Error(`Could not reach a button matching ${name} with Tab`);
}

const startThen =
  (startName: RegExp, play: Script): Script =>
  async (page) => {
    await tabToAndPress(page, startName);
    await play(page);
  };

const choices: Script = async (page) => {
  for (let i = 0; i < 3; i++) {
    await press(page, '1');
    await page.waitForTimeout(1800);
  }
};
const dots: Script = async (page) => {
  for (let i = 0; i < 3; i++) {
    await press(page, '1', 'Enter');
    await page.waitForTimeout(1600);
  }
};
/** Tab until a text box inside the board has focus (keyboard only), then answer twice. */
const typing: Script = async (page) => {
  for (let i = 0; i < 40; i++) {
    const inBox = await page.evaluate(() => {
      const a = document.activeElement;
      return !!a && a.tagName === 'INPUT' && !!a.closest('[data-testid="game-board"]');
    });
    if (inBox) break;
    await page.keyboard.press('Tab');
  }
  for (let i = 0; i < 2; i++) {
    await page.keyboard.type('cab');
    await press(page, 'Enter');
    await page.waitForTimeout(1200);
  }
};
const letters: Script = async (page) => {
  for (const k of ['a', 'e', 's', 't']) {
    await press(page, k);
    await page.waitForTimeout(400);
  }
};

const START = /^(Start|Play|Begin|New game|Go)/i;

const SCRIPTS: Record<string, Script> = {
  'dot-quest': startThen(/Stop 1/i, dots),
  'letter-race': startThen(START, choices),
  'dot-builder': startThen(START, dots),
  'word-decoder': startThen(START, typing),
  'contraction-trainer': startThen(START, choices),
  'dot-explorer': async (page) => {
    await page.getByTestId('game-board').locator('button').first().focus();
    await press(page, '1', '2', 'Escape');
  },
  'speed-match': startThen(START, choices),
  'memory-match': startThen(START, async (page) => press(page, 'Enter', 'ArrowRight', 'Enter')),
  'word-game': async (page) => {
    await page.getByTestId('game-board').locator('button').first().focus();
    await page.keyboard.type('bake');
    await press(page, 'Enter');
  },
  hangman: startThen(START, letters),
  bingo: startThen(START, async (page) => press(page, 'Enter', 'ArrowRight', 'Enter')),
  'braille-rain': startThen(START, letters),
  'reflex-dots': startThen(START, dots),
  sequence: startThen(START, async (page) => press(page, '1', '2', 'Enter')),
  'number-sense': startThen(START, async (page) => {
    for (let i = 0; i < 3; i++) {
      await press(page, '1');
      await page.waitForTimeout(500);
      await press(page, 'Enter');
      await page.waitForTimeout(500);
    }
  }),
  'contraction-sprint': startThen(START, choices),
  'sentence-decoder': startThen(START, typing),
};

test('every registered game has a keyboard script', () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(GAMES.map((g) => g.slug).sort());
});

for (const game of GAMES) {
  test(`game ${game.slug}: keyboard play + accessibility`, async ({ page }) => {
    await freshVisitor(page);
    const errors = trackErrors(page);
    await page.goto(`/games/${game.slug}`);
    const board = page.getByTestId('game-board');
    await expect(board).toBeVisible();
    await expect(page.locator('h1')).toHaveText(game.title);
    await expectNoAxeViolations(page, `${game.slug} (start)`);

    await SCRIPTS[game.slug](page);
    await expect(board).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page, `${game.slug} (playing)`);
    expect(errors).toEqual([]);
  });
}
