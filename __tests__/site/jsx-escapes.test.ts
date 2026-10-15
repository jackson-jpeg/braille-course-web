/** No "…"-style escapes in quoted JSX attributes or JSX text, where they render as literal text. */
import path from 'path';
import { findLiteralJsxEscapes } from '../helpers/jsx-escapes';

test('no literal escape sequences in JSX attributes or text', () => {
  expect(findLiteralJsxEscapes(path.join(__dirname, '../..')).map((h) => `${h.file}:${h.line} ${h.text}`)).toEqual([]);
});
