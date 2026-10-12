/**
 * The wall between the AI model and every generated document.
 *
 * The model is told to write print only, to mark worksheet items that show braille with a `print`
 * field, and to ask for dot descriptions with tokens such as {dots:numeric} or {letter:b}. It is
 * never trusted to have done so. This module walks every string the model returned and:
 *
 *   1. removes any sentence containing a Unicode braille character (the PDF/PPTX fonts cannot show
 *      them, and the model must not supply cells);
 *   2. regenerates every dot claim it can tie to a sign ("the letter b is dots N N" becomes the
 *      canonical description from lib/braille), and removes the sentence when it cannot (an
 *      unlabelled or ambiguous claim, dot numbers in words, "dot-6", "positions 1 and 4", dots 7/8…);
 *   3. replaces superseded terms with their UEB names (lib/braille/terminology.ts), and removes
 *      sentences that name another braille code;
 *   4. checks every token against lib/braille/prose.ts; an unknown or malformed token removes its
 *      sentence. Stored drafts keep the tokens; the document builders render them (render: true);
 *   5. for worksheet braille sections, discards whatever the model wrote as prompt/answer and builds
 *      them from `print` with lib/worksheet-braille.ts for the worksheet's grade; an item whose print
 *      the site cannot write correctly in that grade is dropped.
 *
 * Every change is reported, so the admin review screen can show what was removed or regenerated.
 * The same function runs again when the admin builds the final documents (their edits are not
 * trusted either), and it is idempotent: sanitizing its own output changes nothing.
 */
import { describeCells, renderProse } from '@/lib/braille/prose';
import { findClaims, judgeClaim, parseDotSpec, dotSpecRegExp } from '@/lib/braille-validator';
import { type BrailleGrade, isBrailleGrade, worksheetBraille } from '@/lib/worksheet-braille';
import { BRAILLE_CHAR_RE, OTHER_CODE_RE, SUPERSEDED_TERMS } from '@/lib/braille/terminology';

export type IssueKind =
  | 'braille-character-removed'
  | 'dot-claim-regenerated'
  | 'dot-claim-removed'
  | 'term-replaced'
  | 'code-mention-removed'
  | 'token-removed'
  | 'item-removed'
  | 'question-removed';

export interface SanitizeIssue {
  kind: IssueKind;
  detail: string;
  /** The text as the model (or editor) wrote it. */
  original?: string;
}

/** Dot numbers the claim parser does not cover: words, hyphenated, 7/8-dot, positions, cell lists. */
const LOOSE_DOT_TALK =
  /\bdots?\b[^.!?\n]{0,14}?\b(?:[0-9]+|one|two|three|four|five|six|seven|eight)\b|\bdots?-[0-9]|\bpositions?\s+[0-9]|\b(?:raised|raise)\s+(?:dots?\s+)?[0-9]/i;
const TOKEN = /\{(\w+):([^}]*)\}/g;

function allowedToken(kind: string, arg: string, grade: BrailleGrade): boolean {
  // Contractions belong in contracted material only.
  if (arg.startsWith('contraction:') && grade !== 'contracted') return false;
  if (['dots', 'name', 'letter', 'digit', 'fact', 'lowered'].includes(kind)) return true;
  // {uebdots:TEXT} describes uncontracted braille only.
  return kind === 'uebdots' && grade === 'uncontracted';
}

/** Split into sentences, keeping each one's trailing punctuation and space. */
function sentences(text: string): string[] {
  return text.match(/[^.!?\n]+(?:[.!?]+["”’)]*)?\s*|\n|[.!?]+\s*/g) ?? [];
}

/** Sanitize one sentence of model text. Returns null when the sentence must go. */
function sanitizeSentence(s: string, grade: BrailleGrade, issues: SanitizeIssue[], render: boolean): string | null {
  if (BRAILLE_CHAR_RE.test(s)) {
    issues.push({
      kind: 'braille-character-removed',
      detail: 'Sentence contained braille characters',
      original: s.trim(),
    });
    return null;
  }
  if (OTHER_CODE_RE.test(s)) {
    issues.push({
      kind: 'code-mention-removed',
      detail: 'Sentence mentioned a braille code other than UEB',
      original: s.trim(),
    });
    return null;
  }
  let out = s;
  for (const { re, ueb } of SUPERSEDED_TERMS) {
    out = out.replace(re, (m) => {
      issues.push({ kind: 'term-replaced', detail: `“${m}” → “${ueb}”`, original: s.trim() });
      return ueb;
    });
  }

  // Dot claims: regenerate the ones tied to a sign; any other dot talk removes the sentence.
  // Tokens are checked after this, so text the tokens generate is never mistaken for a claim.
  const masked = out.replace(TOKEN, (m) => ' '.repeat(m.length));
  const claims = findClaims(masked);
  const claimed = new Set<number>();
  let rebuilt = '';
  let cursor = 0;
  for (const c of claims) {
    const cells = parseDotSpec(c.spec);
    // Dots 7 and 8 (8-dot braille) are not part of the parsed spec: a number right after it means
    // the claim was about a cell UEB does not have.
    const tooBig = /[0789]/.test(c.spec) || /^(?:[\s,;–-]|and\b|or\b|then\b)*[0-9]/i.test(out.slice(c.specEnd));
    const verdict = tooBig ? null : judgeClaim(c.target.accepted, cells);
    if (verdict === null) {
      issues.push({
        kind: 'dot-claim-removed',
        detail: `Could not confirm a dot claim about ${c.target.label}`,
        original: s.trim(),
      });
      return null;
    }
    const seq = verdict === 'ok' ? cells : verdict;
    const generated = describeCells(seq);
    issues.push({
      kind: 'dot-claim-regenerated',
      detail: `${c.target.label}: ${verdict === 'ok' ? 'regenerated' : 'corrected to'} “${generated}”`,
      original: c.spec,
    });
    rebuilt += out.slice(cursor, c.specStart) + generated;
    cursor = c.specEnd;
    for (let i = c.specStart; i < c.specEnd; i++) claimed.add(i);
  }
  rebuilt += out.slice(cursor);
  // Any dot phrase that was not part of a confirmed claim, or loose dot talk, removes the sentence.
  const re = dotSpecRegExp();
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked)) !== null) {
    if (!claimed.has(m.index)) {
      issues.push({ kind: 'dot-claim-removed', detail: 'Dot numbers not tied to a sign', original: s.trim() });
      return null;
    }
    if (m[0].length === 0) re.lastIndex++;
  }
  const maskedClaims = [...masked].map((ch, i) => (claimed.has(i) ? ' ' : ch)).join('');
  if (LOOSE_DOT_TALK.test(maskedClaims)) {
    issues.push({
      kind: 'dot-claim-removed',
      detail: 'Dot numbers written in a form the site cannot check',
      original: s.trim(),
    });
    return null;
  }

  // Tokens.
  let badToken = false;
  const rendered = rebuilt.replace(TOKEN, (tok, kind: string, arg: string) => {
    if (!allowedToken(kind, arg, grade)) {
      badToken = true;
      return tok;
    }
    try {
      return renderProse(tok);
    } catch {
      badToken = true;
      return tok;
    }
  });
  if (badToken) {
    issues.push({
      kind: 'token-removed',
      detail: 'Sentence used an unknown or unsupported braille token',
      original: s.trim(),
    });
    return null;
  }
  // Stored content keeps its tokens (so running the sanitizer again gives the same result);
  // they are rendered only when a document is built.
  return render ? rendered : rebuilt;
}

/** Options shared by every sanitize call of one document. */
interface Ctx {
  grade: BrailleGrade;
  issues: SanitizeIssue[];
  /** Render {dots:…} tokens into prose (document build) or keep them (stored drafts). */
  render: boolean;
}

/**
 * Sanitize a piece of model text (any length). With `render`, braille tokens are replaced by
 * their generated prose; without it they are kept, validated, for storage.
 */
export function sanitizeText(text: string, grade: BrailleGrade, issues: SanitizeIssue[] = [], render = true): string {
  if (typeof text !== 'string') return '';
  const kept = sentences(text)
    .map((s) => (s === '\n' ? s : sanitizeSentence(s, grade, issues, render)))
    .filter((s): s is string => s !== null);
  return kept
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/* ── Documents ───────────────────────────────────────────────────────────── */

export const BRAILLE_SECTION_TYPES = ['braille-to-print', 'print-to-braille', 'dot-identification', 'practice-drill'];

export interface SanitizedWorksheetItem {
  prompt: string;
  answer: string;
  /** For braille sections: the print the braille is generated from. */
  print?: string;
}

type Json = Record<string, unknown>;

function txt(text: string, ctx: Ctx, issues: SanitizeIssue[] = ctx.issues): string {
  return sanitizeText(text, ctx.grade, issues, ctx.render);
}

function str(x: unknown): string {
  return typeof x === 'string' ? x : '';
}

function sanitizeWorksheetSections(raw: unknown, ctx: Ctx): Json[] {
  const { issues } = ctx;
  if (!Array.isArray(raw)) return [];
  const out: Json[] = [];
  for (const sec of raw as Json[]) {
    const type = str(sec.type);
    const heading = txt(str(sec.heading), ctx);
    const instructions = txt(str(sec.instructions), ctx);
    const items: SanitizedWorksheetItem[] = [];
    for (const it of Array.isArray(sec.items) ? (sec.items as Json[]) : []) {
      if (BRAILLE_SECTION_TYPES.includes(type)) {
        const item = brailleItem(type, it, ctx);
        if (item) items.push(item);
      } else {
        const prompt = txt(str(it.prompt), ctx);
        const answer = txt(str(it.answer), ctx);
        if (prompt && answer) items.push({ prompt, answer });
        else
          issues.push({
            kind: 'item-removed',
            detail: 'Item lost its prompt or answer when braille claims were removed',
            original: `${str(it.prompt)} → ${str(it.answer)}`,
          });
      }
    }
    if (items.length > 0) out.push({ heading, type, instructions, items });
  }
  return out;
}

/** The print an item is about. Only an explicit `print` field (or a bare letter/word/number) counts. */
function itemPrint(type: string, it: Json): string | null {
  const explicit = str(it.print).trim();
  if (explicit) return explicit;
  // Older drafts: braille-to-print answers and print-to-braille prompts were the print itself.
  const candidate = type === 'print-to-braille' ? str(it.prompt) : type === 'braille-to-print' ? str(it.answer) : '';
  const t = candidate.trim().replace(/^["“'‘](.*)["”'’]$/, '$1');
  return /^[A-Za-z0-9.,’'-]{1,20}$/.test(t) ? t : null;
}

function brailleItem(type: string, it: Json, ctx: Ctx): SanitizedWorksheetItem | null {
  const { grade, issues } = ctx;
  const print = itemPrint(type, it);
  const cells = print ? worksheetBraille(print, grade) : null;
  if (!print || !cells) {
    issues.push({
      kind: 'item-removed',
      detail: print
        ? `“${print}” cannot be written by the site in ${grade} braille, so the item was dropped`
        : 'Braille item had no print to generate braille from',
      original: `${str(it.prompt)} → ${str(it.answer)}`,
    });
    return null;
  }
  const dots = describeCells(cells);
  switch (type) {
    case 'braille-to-print':
      return { print, prompt: 'Read the braille.', answer: print };
    case 'print-to-braille':
      return { print, prompt: `Write “${print}” in braille.`, answer: dots };
    case 'dot-identification':
      return { print, prompt: 'Which dots are raised?', answer: dots };
    default: {
      const prompt = txt(str(it.prompt), ctx) || `Write “${print}” in braille.`;
      return { print, prompt, answer: dots };
    }
  }
}

function sanitizeList(x: unknown, ctx: Ctx): string[] {
  if (!Array.isArray(x)) return [];
  return x.map((s) => txt(str(s), ctx)).filter((s) => s.length > 0);
}

function sanitizeSections(x: unknown, ctx: Ctx): Json[] {
  if (!Array.isArray(x)) return [];
  return (x as Json[]).map((sec) => ({
    heading: txt(str(sec.heading), ctx),
    content: txt(str(sec.content), ctx),
    ...(sec.bullets !== undefined && { bullets: sanitizeList(sec.bullets, ctx) }),
    ...(sec.keyTerms !== undefined && { keyTerms: sanitizeList(sec.keyTerms, ctx) }),
    ...(sec.practiceQuestions !== undefined && { practiceQuestions: sanitizeList(sec.practiceQuestions, ctx) }),
  }));
}

function sanitizeSlides(x: unknown, ctx: Ctx): Json[] {
  if (!Array.isArray(x)) return [];
  return (x as Json[]).map((sl) => ({
    title: txt(str(sl.title), ctx),
    bullets: sanitizeList(sl.bullets, ctx),
    ...(sl.speakerNotes !== undefined && { speakerNotes: txt(str(sl.speakerNotes), ctx) }),
  }));
}

function sanitizeQuiz(x: unknown, ctx: Ctx): Json[] {
  const { issues } = ctx;
  if (!Array.isArray(x)) return [];
  const out: Json[] = [];
  for (const q of x as Json[]) {
    const local: SanitizeIssue[] = [];
    const question = txt(str(q.question), ctx, local);
    const answer = txt(str(q.answer), ctx, local);
    const explanation = txt(str(q.explanation), ctx, local);
    const rawOptions = Array.isArray(q.options) ? (q.options as unknown[]).map(str) : undefined;
    const options = rawOptions?.map((o) => txt(o, ctx, local));
    issues.push(...local);
    // A question that lost its stem, its answer or any option can no longer be answered fairly.
    if (!question || !answer || (options && options.some((o) => !o))) {
      issues.push({
        kind: 'question-removed',
        detail: 'Question removed: part of it made a braille claim the site could not confirm',
        original: str(q.question),
      });
      continue;
    }
    out.push({ type: str(q.type), question, ...(options && { options }), answer, explanation });
  }
  return out;
}

/**
 * Sanitize a whole generated document (any format). Returns the content with `brailleGrade` set,
 * and every change made.
 */
export function sanitizeGeneratedContent(
  format: string,
  raw: unknown,
  gradeIn?: unknown,
  { render = false }: { render?: boolean } = {},
): { content: Json; issues: SanitizeIssue[] } {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Json;
  const grade: BrailleGrade = isBrailleGrade(gradeIn)
    ? gradeIn
    : isBrailleGrade(data.brailleGrade)
      ? data.brailleGrade
      : 'uncontracted';
  const issues: SanitizeIssue[] = [];
  const ctx: Ctx = { grade, issues, render };
  let content: Json;
  switch (format) {
    case 'pptx':
      content = { slides: sanitizeSlides(data.slides, ctx) };
      break;
    case 'pdf':
      content = { sections: sanitizeSections(data.sections, ctx) };
      break;
    case 'study-guide':
      content = {
        title: txt(str(data.title), ctx),
        objectives: sanitizeList(data.objectives, ctx),
        sections: sanitizeSections(data.sections, ctx),
      };
      break;
    case 'worksheet':
      content = { sections: sanitizeWorksheetSections(data.sections, ctx) };
      break;
    case 'quiz':
      content = { questions: sanitizeQuiz(data.questions, ctx) };
      break;
    case 'session-bundle':
      content = {
        slides: sanitizeSlides(data.slides, ctx),
        handoutSections: sanitizeSections(data.handoutSections, ctx),
        worksheetSections: sanitizeWorksheetSections(data.worksheetSections, ctx),
      };
      break;
    default:
      throw new Error(`sanitizer: unknown format "${format}"`);
  }
  return { content: { ...content, brailleGrade: grade }, issues };
}
