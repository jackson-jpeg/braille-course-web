/**
 * Built-in prompt presets in the admin "Create" tab (components/admin/AdminCreateTab.tsx).
 * They seed the AI's instructions, so they must be UEB only and use UEB terms. They give the model
 * no dot numbers, only the tokens it is told to use; rendered, every token must give the dots
 * liblouis gives.
 */
import { BUILTIN_PRESETS } from '@/components/admin/AdminCreateTab';
import { validateBrailleText } from '@/lib/braille-validator';
import { describeCells, renderProse } from '@/lib/braille/prose';
import { unicodeToCells } from '@/lib/braille/ueb';

const all = BUILTIN_PRESETS.map((p) => `${p.title}\n${p.notes}`).join('\n');
const rendered = renderProse(all);

/* liblouis en-ueb-g1 / g2 (unicode.dis) */
const D = (u: string) => describeCells(unicodeToCells(u));

describe('admin presets', () => {
  test('no other braille codes or EBAE terminology', () => {
    expect(all).not.toMatch(/nemeth/i);
    expect(all).not.toMatch(
      /(?<!capital )letter indicator|letter sign|number indicator|number sign|double capital|termination indicator/i,
    );
    expect(all).not.toMatch(/[⠀-⣿]/);
  });

  test('the model is given no dot numbers, only tokens', () => {
    expect(all).not.toMatch(/\bdots?\s*[0-9]/i);
    expect(all).toContain('{dots:numeric}');
    expect(BUILTIN_PRESETS.map((p) => p.label)).not.toContain('Number Signs');
  });

  test('no typeform dot numbers (they are not in lib/braille), and no EBAE italic/bold patterns', () => {
    expect(rendered).not.toMatch(/italic[^.]*\bdots?\s*[1-6]/i);
    expect(rendered).not.toMatch(/bold[^.]*\bdots?\s*[1-6]/i);
  });

  test('its tokens render to the right dots for what it names (liblouis)', () => {
    expect(rendered).toContain(`numeric indicator (${D('⠼')})`);
    expect(rendered).toContain(`capital letter indicator (${D('⠠')})`);
    expect(rendered).toContain(`capitalized word indicator (${D('⠠⠠')})`);
    expect(rendered).toContain(`capitalized passage indicator (${D('⠠⠠⠠')})`);
    expect(rendered).toContain(`capitals terminator (${D('⠠⠄')})`);
    expect(rendered).toContain(`grade 1 indicator (${D('⠰')})`);
    expect(rendered).toContain(`plus sign (${D('⠐⠖')})`);
    expect(rendered).toContain(`minus sign (${D('⠐⠤')})`);
    expect(rendered).toContain(`multiplication sign (${D('⠐⠦')})`);
    expect(rendered).toContain(`division sign (${D('⠐⠌')})`);
    expect(rendered).toContain(`equals sign (${D('⠐⠶')})`);
    expect(rendered).toContain(`dollar sign is ${D('⠈⠎')}`);
    expect(rendered).toContain(`"it" is the letter x (${D('⠭')})`);
    expect(rendered).toContain(`"as" is the letter z (${D('⠵')})`);
  });

  test('states the uncontracted convention (ICEB 5.11.1)', () => {
    expect(all).toContain(
      'a letter standing alone is written as just the letter, with no grade 1 indicator (ICEB 5.11.1)',
    );
  });

  test('the fidelity guard finds nothing to correct', () => {
    expect(validateBrailleText(rendered).corrections).toEqual([]);
  });
});
