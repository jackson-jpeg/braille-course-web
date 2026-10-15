/**
 * Finds em dashes in text a person can read: string literals, template text and JSX text in the
 * site's source. Comments are not copy and are skipped.
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

export const COPY_ROOTS = ['app', 'components', 'lib', 'hooks'];
const EM_DASH = '—';
const EM_DASH_ENTITY = /&(mdash|#8212|#x2014);/i;

export interface CopyHit {
  file: string;
  line: number;
  text: string;
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts') ? [p] : [];
  });
}

export function findEmDashes(repoRoot: string): CopyHit[] {
  const hits: CopyHit[] = [];
  for (const root of COPY_ROOTS) {
    for (const file of sourceFiles(path.join(repoRoot, root))) {
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes(EM_DASH) && !/\\u2014|&(mdash|#8212|#x2014);/i.test(src)) continue;
      const sf = ts.createSourceFile(
        file,
        src,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node) ||
          ts.isJsxText(node)
        ) {
          // The decoded value catches '\u2014' escapes; entities count too (JSX text and HTML email strings).
          const value = ts.isJsxText(node) ? node.getText(sf) : (node as ts.LiteralLikeNode).text;
          const text = node.getText(sf);
          if (value.includes(EM_DASH) || EM_DASH_ENTITY.test(value)) {
            hits.push({
              file: path.relative(repoRoot, file),
              line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
              text: text.trim().slice(0, 120),
            });
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
  }
  return hits;
}
