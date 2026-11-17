import fs from 'fs';
import path from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import NameInBraille from '@/components/NameInBraille';
import WorldBrailleDayPage from '@/app/world-braille-day/page';
import { siteInventory } from '@/lib/braille/site-inventory';
import { transcribe } from '@/lib/braille/transcribe';
import { describeCells } from '@/lib/braille/prose';
import { INDICATORS, cellsKey } from '@/lib/braille/ueb';
import { ALL_LESSONS } from '@/lib/course-curriculum';
import {
  CLASSROOM_PATHS,
  EXAMPLE_NAME,
  NAME_MAX_LENGTH,
  PATH_GAMES,
  SAMPLE_NAMES,
  brailleInventory,
  dotRows,
  isWritable,
  nameToBraille,
  resolveStep,
} from '@/lib/world-braille-day';
import { checkAllCells, dotsKey, readCells } from '../helpers/cells';

const ROOT = path.resolve(__dirname, '..', '..');
const LETTERS = [...'abcdefghijklmnopqrstuvwxyz'];
const WRITABLE = [...LETTERS, ...LETTERS.map((l) => l.toUpperCase()), ' ', '-', "'", '’'];

function okTokens(raw: string) {
  const r = nameToBraille(raw);
  if (r.status !== 'ok') throw new Error(`expected "${raw}" to be writable, got ${r.status}`);
  return r;
}

describe('name box: what it writes', () => {
  test('exactly the letters, space, hyphen and apostrophes are writable (every BMP code point checked)', () => {
    const writable: string[] = [];
    for (let cp = 0; cp <= 0xffff; cp++) {
      const ch = String.fromCodePoint(cp);
      if (isWritable(ch)) writable.push(ch);
    }
    expect(writable.sort()).toEqual([...WRITABLE].sort());
  });

  test.each(WRITABLE.filter((c) => c !== ' '))('"%s" transcribes inside, before and after a word', (ch) => {
    for (const s of [`a${ch}b`, `${ch}ab`, `ab${ch}`, `AB${ch}CD`]) expect(okTokens(s).print).toBe(s);
  });

  test.each(SAMPLE_NAMES)('sample "%s": cells are exactly the transcriber’s uncontracted UEB', (name) => {
    const r = okTokens(name);
    expect(cellsKey(r.tokens.flatMap((t) => t.cells))).toBe(cellsKey(transcribe(name)));
  });

  test('a capital is written with the capital letter indicator, a capitalized word with the word indicator', () => {
    expect(okTokens('Louis').tokens[0].signId).toBe(INDICATORS.capitalLetter.id);
    expect(okTokens('JO').tokens[0].signId).toBe(INDICATORS.capitalWord.id);
  });

  test('straight and curly apostrophes are the same sign', () => {
    expect(cellsKey(transcribe("O'Brien"))).toBe(cellsKey(okTokens('O’Brien').tokens.flatMap((t) => t.cells)));
  });

  test('spaces are normalized, and an empty name is empty', () => {
    expect(okTokens('  Jo \t  Ann  ').print).toBe('Jo Ann');
    expect(nameToBraille('   ').status).toBe('empty');
    expect(nameToBraille('').status).toBe('empty');
  });

  test(`over ${NAME_MAX_LENGTH} characters is refused, not cut`, () => {
    expect(nameToBraille('a'.repeat(NAME_MAX_LENGTH)).status).toBe('ok');
    expect(nameToBraille('a'.repeat(NAME_MAX_LENGTH + 1)).status).toBe('too-long');
  });

  test.each([
    ['Zoë', ['ë']],
    ['José', ['é']],
    ['Room 3', ['3']],
    ['Ann & Bo', ['&']],
    ['Jo.', ['.']],
    ['<b>Jo</b>', ['<', '>', '/']],
    ['Zoë', ['ë']], // decomposed ë is normalized first, then refused
  ])('"%s" is refused and the unwritable characters named', (name, bad) => {
    const r = nameToBraille(name);
    expect(r.status).toBe('refused');
    if (r.status !== 'refused') return;
    expect(r.unsupported).toEqual(bad);
    expect(r.marks.filter((m) => !m.writable).map((m) => m.ch)).toEqual([...r.print].filter((c) => bad.includes(c)));
  });

  test('dot rows are generated from lib/braille, one per sign, spaces left out', () => {
    const r = okTokens('Jo Ann');
    const rows = dotRows(r.tokens);
    const signs = r.tokens.filter((t) => t.kind !== 'space');
    expect(rows).toEqual(signs.map((t) => ({ name: t.name, dots: describeCells(t.cells) })));
    expect(rows[0].name).toBe('capital letter indicator');
  });

  test('the page’s braille is registered with the site inventory (checked against liblouis)', () => {
    const mine = siteInventory().filter((i) => i.where === 'page:world-braille-day');
    expect(mine).toEqual(brailleInventory());
    expect(mine.map((i) => i.print)).toEqual([...SAMPLE_NAMES]);
  });
});

describe('name box: the component', () => {
  function typeName(value: string) {
    fireEvent.change(screen.getByLabelText('Your name, or a short word'), { target: { value } });
  }

  test('shows the example name in braille and on the card, drawn correctly', () => {
    const { container } = render(<NameInBraille />);
    const drawn = readCells(container).map((c) => c.dots);
    const expected = transcribe(EXAMPLE_NAME).map(dotsKey);
    expect(drawn).toEqual([...expected, ...expected]); // the name box, then the card
    expect(checkAllCells(container)).toEqual([]);
  });

  test('typing a name redraws it; an unwritable name shows no braille and marks the problem', () => {
    const { container } = render(<NameInBraille />);
    typeName('Mary-Jane');
    expect(readCells(container).map((c) => c.dots)).toEqual(
      [...transcribe('Mary-Jane'), ...transcribe('Mary-Jane')].map(dotsKey),
    );
    expect(screen.getByRole('button', { name: 'Print the name card' })).toBeTruthy();

    typeName('Zoë');
    expect(readCells(container)).toEqual([]);
    expect(container.querySelector('.wbd-name-unwritable')?.textContent).toContain('ë');
    expect(screen.getByText(/cannot write “ë” yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Print the name card' })).toBeNull();
  });

  test('nothing typed is sent, stored or put in the address', () => {
    const fetchSpy = jest.fn();
    const beaconSpy = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchSpy as unknown as typeof fetch;
    Object.defineProperty(navigator, 'sendBeacon', { value: beaconSpy, configurable: true });
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const href = window.location.href;
    try {
      render(<NameInBraille />);
      for (const v of ['A', 'Al', 'Alex', 'Alex Smith', 'Zoë']) act(() => typeName(v));
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(beaconSpy).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();
      expect(window.location.href).toBe(href);
    } finally {
      global.fetch = originalFetch;
      setItem.mockRestore();
    }
  });

  test('the component source has no network, storage or tracking calls', () => {
    const src = fs.readFileSync(path.join(ROOT, 'components', 'NameInBraille.tsx'), 'utf8');
    expect(src).not.toMatch(/fetch\(|sendBeacon|localStorage|sessionStorage|track\(|umami|history\.|router/i);
  });
});

describe('classroom paths', () => {
  const gamesPage = fs.readFileSync(path.join(ROOT, 'app', 'games', 'page.tsx'), 'utf8');

  test('every step links to a real lesson, a real game anchor, or the name box', () => {
    for (const p of CLASSROOM_PATHS)
      for (const s of p.steps) {
        const step = resolveStep(s);
        if (s.kind === 'lesson') expect(ALL_LESSONS.some((l) => `/learn/${l.slug}` === step.href)).toBe(true);
        if (s.kind === 'game') expect(gamesPage).toContain(`id="${s.id}"`);
        if (s.kind === 'name') expect(step.href).toBe('#write-your-name');
      }
  });

  test('the games named are the games on /games', () => {
    for (const name of Object.values(PATH_GAMES)) expect(gamesPage).toContain(`gameName="${name}"`);
    expect(Object.keys(PATH_GAMES).length).toBeGreaterThan(0);
  });

  test('ten minutes is the Braille Cell lesson and one game; thirty is letters a to j and two games', () => {
    const [ten, thirty] = CLASSROOM_PATHS;
    expect(ten.steps).toEqual([
      { kind: 'lesson', slug: 'the-braille-cell' },
      { kind: 'game', id: expect.any(String) },
    ]);
    expect(thirty.steps.filter((s) => s.kind === 'lesson')).toEqual([{ kind: 'lesson', slug: 'letters-a-j' }]);
    expect(thirty.steps.filter((s) => s.kind === 'game')).toHaveLength(2);
  });

  test('one week is the first four lessons of the course, in order', () => {
    const week = CLASSROOM_PATHS.find((p) => p.id === 'one-week')!;
    const lessons = week.steps.filter((s) => s.kind === 'lesson').map((s) => (s.kind === 'lesson' ? s.slug : ''));
    expect(lessons).toEqual(ALL_LESSONS.slice(0, 4).map((l) => l.slug));
  });
});

describe('the page', () => {
  test('renders every section, with the braille drawn correctly and no em dashes', () => {
    const { container } = render(<WorldBrailleDayPage />);
    for (const id of [
      'what-the-day-is',
      'write-your-name',
      'name-card',
      'classroom-paths',
      'for-teachers',
      'take-it-with-you',
    ])
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(checkAllCells(container)).toEqual([]);
    expect(container.textContent).not.toContain('—');
  });
});
