/**
 * Regression: games used to add the last correct answer twice when recording the final score
 * (the score ref had already been updated by a re-render). Play Number Sense to the end with all
 * answers right, and with all wrong, and check the recorded score exactly.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';

const recordResult = jest.fn(() => []);
jest.mock('@/hooks/useGameProgress', () => ({
  useGameProgress: () => ({ difficulty: 'beginner', setDifficulty: jest.fn(), recordResult }),
}));
jest.mock('@/components/AchievementToast', () => ({ pushAchievements: jest.fn() }));

import BrailleNumberSense from '@/components/BrailleNumberSense';

jest.useFakeTimers();

/** Decode "numeric indicator + a–j" numbers and the beginner plus sign from drawn cells. */
function solveFromCells(cells: string[]): number {
  const letterDigit: Record<string, string> = {
    '1': '1',
    '12': '2',
    '14': '3',
    '145': '4',
    '15': '5',
    '124': '6',
    '1245': '7',
    '125': '8',
    '24': '9',
    '245': '0',
  };
  const nums: number[] = [];
  let cur = '';
  for (const c of cells) {
    if (c === '3456') cur = '';
    else if (letterDigit[c] !== undefined && cur !== null) cur += letterDigit[c];
    else if (cur) {
      nums.push(Number(cur));
      cur = '';
    }
  }
  if (cur) nums.push(Number(cur));
  return nums[0] + nums[1]; // beginner level: addition only
}

function play(pickRight: boolean) {
  recordResult.mockClear();
  render(<BrailleNumberSense />);
  for (let round = 0; round < 10; round++) {
    const group = screen.getByRole('group', { name: 'Answer choices' });
    // Read the problem back from the braille actually drawn (independent of the game's answer).
    const cells = [...document.querySelectorAll('.numsense-problem [data-braille-cell]')].map((c) =>
      c.getAttribute('data-dots'),
    );
    const answer = solveFromCells(cells as string[]);
    const buttons = within(group).getAllByRole('button');
    const target = buttons.find((btn) => (btn.getAttribute('data-value') === String(answer)) === pickRight)!;
    fireEvent.click(target);
    act(() => jest.advanceTimersByTime(1500));
  }
}

test('ten right answers record exactly 10 and a win', () => {
  play(true);
  expect(recordResult).toHaveBeenCalledTimes(1);
  expect(recordResult).toHaveBeenCalledWith(true, 10);
});

test('ten wrong answers record exactly 0 and a loss', () => {
  play(false);
  expect(recordResult).toHaveBeenCalledWith(false, 0);
});
