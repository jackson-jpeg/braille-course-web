#!/usr/bin/env node
/**
 * Word Game fit check: on each phone viewport, the whole board (six rows) and the whole keyboard
 * must be on screen together, so a learner can type and see every guess without scrolling.
 * Scrolls the board's top to the top of the viewport and measures the keyboard's bottom.
 * Usage: node scripts/a11y/check-wordgame-fit.mjs http://localhost:3000
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
const VIEWPORTS = [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
];

const browser = await chromium.launch({ headless: true });
let failures = 0;
for (const [width, height] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true });
  const page = await context.newPage();
  await page.goto(base + '/games', { waitUntil: 'networkidle' });
  const close = page.locator('.onboarding-close');
  if (await close.count()) await close.first().click();
  const board = page.locator('.wordgame-board').first();
  await board.scrollIntoViewIfNeeded();
  await board.waitFor({ state: 'visible' });
  // Scroll the board just under whatever stays pinned at the top (site header, games tab bar).
  // Pinned bars only settle after a scroll, so measure them twice.
  const m = await page.evaluate(async () => {
    const pinnedBottom = () =>
      Math.max(
        0,
        ...[...document.querySelectorAll('body *')]
          .filter((e) => {
            const s = getComputedStyle(e);
            if (s.position !== 'fixed' && s.position !== 'sticky') return false;
            if (s.visibility === 'hidden' || s.display === 'none') return false;
            const r = e.getBoundingClientRect();
            return r.height > 0 && r.top <= 1 + 0 && r.bottom < innerHeight / 2;
          })
          .concat(
            [...document.querySelectorAll('body *')].filter((e) => {
              const s = getComputedStyle(e);
              const r = e.getBoundingClientRect();
              return s.position === 'sticky' && r.height > 0 && r.top > 1 && r.bottom < innerHeight / 2;
            }),
          )
          .map((e) => e.getBoundingClientRect().bottom),
      );
    const b = document.querySelector('.wordgame-board');
    const k = document.querySelector('.wordgame-keyboard');
    for (let i = 0; i < 3; i++) {
      window.scrollBy(0, b.getBoundingClientRect().top - pinnedBottom());
      await new Promise((r) => setTimeout(r, 300));
    }
    const top = pinnedBottom();
    // Bars pinned to the bottom edge (wider than half the screen; small floating buttons do not count).
    const bottomBars = [...document.querySelectorAll('body *')]
      .filter((e) => {
        const s = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        return s.position === 'fixed' && r.height > 0 && r.top > innerHeight / 2 && r.width > innerWidth / 2;
      })
      .map((e) => e.getBoundingClientRect().top);
    const bottom = Math.min(innerHeight, ...bottomBars);
    const bt = b.getBoundingClientRect().top;
    const kb = k.getBoundingClientRect().bottom;
    const widest = Math.max(
      ...[...document.querySelectorAll('.wordgame-kb-row, .wordgame-row')].map((r) => r.scrollWidth),
    );
    await new Promise((r) => setTimeout(r, 300));
    // Nothing pinned (the quick-start button, a toast) may sit on a key or a tile.
    const pinned = [...document.querySelectorAll('body *')].filter((e) => {
      const s = getComputedStyle(e);
      return (
        s.position === 'fixed' &&
        s.pointerEvents !== 'none' &&
        e.getBoundingClientRect().width < innerWidth &&
        e.getBoundingClientRect().height > 0
      );
    });
    const targets = [...document.querySelectorAll('.wordgame-key, .wordgame-tile')];
    const covered = targets.filter((t) => {
      const a = t.getBoundingClientRect();
      return pinned.some((p) => {
        const r = p.getBoundingClientRect();
        return r.left < a.right && r.right > a.left && r.top < a.bottom && r.bottom > a.top;
      });
    }).length;
    return {
      covered,
      span: Math.round(kb - bt),
      room: Math.round(bottom - top),
      pinned: Math.round(top),
      widest,
      viewW: document.documentElement.clientWidth,
    };
  });
  const fits = m.span <= m.room && m.widest <= m.viewW && m.covered === 0;
  if (!fits) failures++;
  console.log(
    `${width}x${height}: board+keyboard ${m.span}px in ${m.room}px under ${m.pinned}px of pinned bars (${m.room - m.span >= 0 ? 'spare ' + (m.room - m.span) : 'over ' + (m.span - m.room)}px), widest row ${m.widest}px of ${m.viewW}px, ${m.covered} keys or tiles covered ${fits ? 'OK' : 'FAIL'}`,
  );
  await context.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
