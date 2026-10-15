/**
 * Finds JavaScript escapes (…, \n, ...) written where JSX does not process them: in a quoted
 * JSX attribute (placeholder="Search…") or in JSX text. They render as the literal backslash text.
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { COPY_ROOTS } from './copy-scan';

const ESCAPE = /\\(u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[nrt])/;

function tsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? tsxFiles(p) : e.name.endsWith('.tsx') ? [p] : [];
  });
}

export function findLiteralJsxEscapes(repoRoot: string): { file: string; line: number; text: string }[] {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const root of COPY_ROOTS) {
    for (const file of tsxFiles(path.join(repoRoot, root))) {
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes('\\')) continue;
      const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        const raw = ts.isJsxText(node)
          ? node.getText(sf)
          : ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)
            ? node.initializer.getText(sf)
            : null;
        if (raw && ESCAPE.test(raw)) {
          hits.push({
            file: path.relative(repoRoot, file),
            line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
            text: raw.trim().slice(0, 100),
          });
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
  }
  return hits;
}
