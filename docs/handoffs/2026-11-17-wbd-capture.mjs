// Captures /world-braille-day for review: desktop, phone, a refused name, and the print PDF.
// Run it from inside the worktree (copy it there first) so `playwright` resolves; it failed from the scratchpad.
// Usage (from the worktree): node <this file> <base url> <out dir>
import { chromium } from 'playwright';

const [base, out] = process.argv.slice(2);
const url = `${base}/world-braille-day`;
const browser = await chromium.launch({ headless: true });
try {
  const desk = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desk.goto(url, { waitUntil: 'networkidle' });
  await desk.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}' });
  await desk.screenshot({ path: `${out}/desktop.jpg`, fullPage: true, type: 'jpeg', quality: 80 });

  await desk.fill('.wbd-name-input', 'Mary-Jane');
  await desk.waitForTimeout(100);
  await desk.locator('#write-your-name').screenshot({ path: `${out}/name-mary-jane.jpg`, type: 'jpeg', quality: 85 });
  await desk.emulateMedia({ media: 'print' });
  await desk.pdf({ path: `${out}/name-card-mary-jane.pdf`, format: 'Letter', printBackground: true });
  await desk.screenshot({ path: `${out}/print-view.jpg`, fullPage: true, type: 'jpeg', quality: 80 });
  await desk.emulateMedia({ media: 'screen' });

  await desk.fill('.wbd-name-input', 'Zoë 3');
  await desk.locator('#write-your-name').screenshot({ path: `${out}/name-refused.jpg`, type: 'jpeg', quality: 85 });

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await phone.goto(url, { waitUntil: 'networkidle' });
  await phone.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}' });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`phone horizontal overflow px: ${overflow}`);
  await phone.screenshot({ path: `${out}/phone.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
  for (const name of ['Mary-Jane', 'MacKenzie-Rose', 'Christopher Alexander']) {
    await phone.fill('.wbd-name-input', name);
    const o = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const scrolls = await phone.evaluate(() =>
      [...document.querySelectorAll('.wbd-braille-scroll')].map((e) => e.scrollWidth - e.clientWidth),
    );
    console.log(`phone "${name}": page overflow ${o}px, braille rows overflow ${scrolls.join('/')}px`);
  }
  await phone.fill('.wbd-name-input', 'Mary-Jane');
  await phone.locator('#write-your-name').screenshot({ path: `${out}/phone-name.jpg`, type: 'jpeg', quality: 80 });
  await phone.emulateMedia({ media: 'print' });
  await phone.pdf({ path: `${out}/name-card-long.pdf`, format: 'Letter', printBackground: true });
} finally {
  await browser.close();
}
