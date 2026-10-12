/**
 * Built-in prompt presets in the admin "Create" tab (components/admin/AdminCreateTab.tsx).
 * They seed the AI's instructions, so they must be UEB only, use UEB terms, and every dot pattern
 * they state must be right (checked against liblouis output and the fidelity guard).
 */
import { BUILTIN_PRESETS } from '@/components/admin/AdminCreateTab';
import { validateBrailleText } from '@/lib/braille-validator';
import { describeCells } from '@/lib/braille/prose';
import { unicodeToCells } from '@/lib/braille/ueb';

const all = BUILTIN_PRESETS.map((p) => `${p.title}\n${p.notes}`).join('\n');

/* liblouis en-ueb-g1 / g2 (unicode.dis) */
const D = (u: string) => describeCells(unicodeToCells(u));

describe('admin presets', () => {
  test('no other braille codes or EBAE terminology', () => {
    expect(all).not.toMatch(/nemeth/i);
    expect(all).not.toMatch(
      /(?<!capital )letter indicator|letter sign|number indicator|double capital|termination indicator/i,
    );
    expect(all).not.toMatch(/[⠀-⣿]/);
  });

  test('no typeform dot numbers (they are not in lib/braille), and no EBAE italic/bold patterns', () => {
    expect(all).not.toMatch(/italic[^.]*\bdots?\s*[1-6]/i);
    expect(all).not.toMatch(/bold[^.]*\bdots?\s*[1-6]/i);
  });

  test('states the right dots for what it names (liblouis)', () => {
    expect(all).toContain(`numeric indicator (${D('⠼')})`);
    expect(all).toContain(`capital letter indicator (${D('⠠')})`);
    expect(all).toContain(`capitalized word indicator (${D('⠠⠠')})`);
    expect(all).toContain(`capitalized passage indicator (${D('⠠⠠⠠')})`);
    expect(all).toContain(`capitals terminator (${D('⠠⠄')})`);
    expect(all).toContain(`grade 1 indicator (${D('⠰')})`);
    expect(all).toContain(`"3b" (${D('⠼⠉⠰⠃')})`);
    expect(all).toContain(`plus sign (${D('⠐⠖')})`);
    expect(all).toContain(`minus sign (${D('⠐⠤')})`);
    expect(all).toContain(`multiplication sign (${D('⠐⠦')})`);
    expect(all).toContain(`division sign (${D('⠐⠌')})`);
    expect(all).toContain(`equals sign (${D('⠐⠶')})`);
    expect(all).toContain(`dollar sign is ${D('⠈⠎')}`);
    expect(all).toContain(`"it" is the letter x (${D('⠭')})`);
    expect(all).toContain(`"as" is the letter z (${D('⠵')})`);
  });

  test('states the uncontracted convention (ICEB 5.11.1)', () => {
    expect(all).toContain(
      'a letter standing alone is written as just the letter, with no grade 1 indicator (ICEB 5.11.1)',
    );
  });

  test('the fidelity guard finds nothing to correct', () => {
    expect(validateBrailleText(all).corrections).toEqual([]);
  });
});
