import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import CheckoutLayout from '@/app/summer/checkout/layout';
import SuccessLayout from '@/app/summer/success/layout';
import SupportPage from '@/app/support/page';
import Footer from '@/components/Footer';
import HubPage from '@/app/page';
import sitemap from '@/app/sitemap';
import { metadata as rootMetadata } from '@/app/layout';

describe('support page, privacy link and app banner', () => {
  test('the support page has contact, app, website, lessons and privacy sections, with no em dashes', () => {
    const { container } = render(<SupportPage />);
    for (const id of ['contact', 'app', 'website', 'lessons', 'privacy'])
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('a[href="mailto:Delaney@TeachBraille.org"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://apps.apple.com/app/id6833681749"]')).not.toBeNull();
    expect(container.querySelector('a[href="/policies#privacy"]')).not.toBeNull();
    expect(container.textContent).not.toContain('—');
  });

  test('the footer, and so the home page, shows Privacy and Support links', () => {
    const footer = render(<Footer />).container;
    const privacy = [...footer.querySelectorAll('a')].find((a) => a.textContent === 'Privacy');
    const support = [...footer.querySelectorAll('a')].find((a) => a.textContent === 'Support');
    expect(privacy?.getAttribute('href')).toBe('/policies#privacy');
    expect(support?.getAttribute('href')).toBe('/support');
    const home = render(<HubPage />).container;
    expect([...home.querySelectorAll('a')].some((a) => a.textContent === 'Privacy')).toBe(true);
  });

  test('every public page renders the footer (and so the Privacy link), itself or through a layout', () => {
    const appDir = path.join(__dirname, '..', '..', 'app');
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'page.tsx') pages.push(full);
      }
    };
    walk(appDir);
    const usesFooter = (file: string) => fs.existsSync(file) && /<Footer\b/.test(fs.readFileSync(file, 'utf8'));
    const missing = pages
      .filter((page) => !path.relative(appDir, page).startsWith('admin' + path.sep))
      .filter((page) => {
        if (usesFooter(page)) return false;
        for (let dir = path.dirname(page); dir.startsWith(appDir); dir = path.dirname(dir)) {
          if (usesFooter(path.join(dir, 'layout.tsx'))) return false;
        }
        return true;
      })
      .map((page) => path.relative(appDir, page));
    expect(pages.length).toBeGreaterThan(10);
    expect(missing).toEqual([]);
  });

  test('the summer checkout and success layouts render the footer Privacy link', () => {
    for (const Layout of [CheckoutLayout, SuccessLayout]) {
      const { container } = render(
        <Layout>
          <main />
        </Layout>,
      );
      const privacy = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Privacy');
      expect(privacy?.getAttribute('href')).toBe('/policies#privacy');
    }
  });

  test('the support page is in the sitemap', () => {
    expect(sitemap().map((e) => e.url)).toContain('https://teachbraille.org/support');
  });

  test('the Smart App Banner names the Teach Braille app', () => {
    expect(rootMetadata.itunes).toEqual({ appId: '6833681749' });
  });
});
