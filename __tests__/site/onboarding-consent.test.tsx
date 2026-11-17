/**
 * The welcome box on the games page asks about anonymous activity, and the answer is opt-in:
 * only "Get Started" on the last step is a yes. Escape, the close button and "Skip tracking" are a no.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import OnboardingModal from '@/components/OnboardingModal';
import { track } from '@/lib/analytics-track';
import { clearProgress, hasActivityConsent, loadProgress, VISITOR_ID_KEY } from '@/lib/progress-storage';

const beacon = jest.fn((_url: string, _body: Blob) => true);

beforeEach(() => {
  clearProgress();
  localStorage.clear();
  beacon.mockClear();
  Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
});

function open() {
  render(<OnboardingModal />);
  expect(screen.getByRole('dialog')).toBeTruthy();
}

function expectNo() {
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(loadProgress().settings.hasSeenOnboarding).toBe(true);
  expect(hasActivityConsent()).toBe(false);
  track('game_play', 'wordgame');
  expect(beacon).not.toHaveBeenCalled();
  expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
}

test('Escape means no', () => {
  open();
  act(() => {
    fireEvent.keyDown(window, { key: 'Escape' });
  });
  expectNo();
});

test('Escape on the last step still means no', () => {
  open();
  fireEvent.click(screen.getByText('Next'));
  fireEvent.click(screen.getByText('Next'));
  act(() => {
    fireEvent.keyDown(window, { key: 'Escape' });
  });
  expectNo();
});

test('the close button means no', () => {
  open();
  fireEvent.click(screen.getByLabelText('Close'));
  expectNo();
});

test('"Skip tracking" means no', () => {
  open();
  fireEvent.click(screen.getByText('Next'));
  fireEvent.click(screen.getByText('Next'));
  fireEvent.click(screen.getByText('Skip tracking'));
  expectNo();
});

test('"Get Started" on the last step is the only yes, and only then is an id kept', () => {
  open();
  fireEvent.click(screen.getByText('Next'));
  fireEvent.click(screen.getByText('Next'));
  expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
  // The last step says what Get Started turns on.
  expect(screen.getByText(/If you choose Get Started, we also count anonymous lesson and game/)).toBeTruthy();
  fireEvent.click(screen.getByText('Get Started'));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(hasActivityConsent()).toBe(true);
  track('game_play', 'wordgame');
  expect(beacon).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(VISITOR_ID_KEY)).toBeTruthy();
});

test('a no keeps progress on the device', () => {
  open();
  act(() => {
    fireEvent.keyDown(window, { key: 'Escape' });
  });
  expect(loadProgress().settings.trackingEnabled).toBe(true);
});
