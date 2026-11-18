import { render } from '@testing-library/react';
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

  test('the support page is in the sitemap', () => {
    expect(sitemap().map((e) => e.url)).toContain('https://teachbraille.org/support');
  });

  test('the Smart App Banner names the Teach Braille app', () => {
    expect(rootMetadata.itunes).toEqual({ appId: '6833681749' });
  });
});
