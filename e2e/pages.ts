import { GAMES } from '../lib/games/registry';
import { LESSON_SLUGS } from '../lib/course-curriculum';

/** Every public page on the site. */
export const STATIC_PAGES = ['/', '/learn', '/games', '/intro', '/courses', '/services', '/appointments', '/policies'];
export const LESSON_PAGES = LESSON_SLUGS.map((s) => `/learn/${s}`);
export const GAME_PAGES = GAMES.map((g) => `/games/${g.slug}`);
export const SYSTEM_PAGES = ['/this-page-does-not-exist', '/summer/checkout', '/summer/success'];
export const ALL_PAGES = [...STATIC_PAGES, ...LESSON_PAGES, ...GAME_PAGES, ...SYSTEM_PAGES];
