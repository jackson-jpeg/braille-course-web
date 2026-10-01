import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import { contractedCells } from '@/lib/contracted';
import { describeCells } from '@/lib/ueb';
import type { CharItem, LessonBlock } from '@/lib/course-curriculum';
import WriteDrill from './WriteDrill';
import ReadDrill from './ReadDrill';
import Quiz from './Quiz';

const CALLOUT: Record<string, { tone: string; mark: string }> = {
  tip: { tone: 'callout--pine', mark: 't' },
  parent: { tone: 'callout--tomato', mark: 'p' },
  fact: { tone: 'callout--sky', mark: 'f' },
  kid: { tone: '', mark: 'k' },
};

function CharTile({ item }: { item: CharItem }) {
  const label = `${item.print}: ${describeCells(item.cells)}`;
  return (
    <li className="char-tile">
      <span className="char-cells" role="img" aria-label={label}>
        {item.cells.map((c, i) => (
          <Cell key={i} dots={c} size="lg" />
        ))}
      </span>
      <span className="char-print" aria-hidden="true">
        {item.print}
      </span>
      {item.note && <span className="char-note">{item.note}</span>}
    </li>
  );
}

/** Renders a lesson's content blocks. Static blocks render on the server; drills and quizzes are interactive. */
export default function LessonBlocks({ slug, blocks }: { slug: string; blocks: LessonBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const id = `${slug}-${i}`;
        switch (b.type) {
          case 'p':
            return <p key={i}>{b.text}</p>;
          case 'h':
            return <h2 key={i}>{b.text}</h2>;
          case 'list':
            return (
              <ul key={i}>
                {b.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            );
          case 'cells':
            return (
              <figure key={i} className="char-figure">
                {b.title && <figcaption className="char-figure-title">{b.title}</figcaption>}
                <ul className="char-grid">
                  {b.items.map((item) => (
                    <CharTile key={item.key + item.print} item={item} />
                  ))}
                </ul>
              </figure>
            );
          case 'example': {
            const cells = b.contracted ? contractedCells(b.text) : undefined;
            return (
              <figure key={i} className="braille-example">
                <div className="braille-example-cells">
                  <BrailleText
                    text={b.contracted ? undefined : b.text}
                    cells={cells}
                    size="md"
                    label={`“${b.text}” in ${b.contracted ? 'contracted ' : ''}braille`}
                  />
                </div>
                <figcaption>{b.caption}</figcaption>
              </figure>
            );
          }
          case 'callout': {
            const c = CALLOUT[b.tone];
            return (
              <aside key={i} className={`callout ${c.tone}`} aria-label={b.title}>
                <BrailleText text={c.mark} size="sm" />
                <div>
                  <p className="callout-title">{b.title}</p>
                  <p>{b.text}</p>
                </div>
              </aside>
            );
          }
          case 'write':
            return <WriteDrill key={i} id={id} title={b.title} items={b.items} />;
          case 'read':
            return <ReadDrill key={i} id={id} title={b.title} items={b.items} pool={b.pool} />;
          case 'quiz':
            return <Quiz key={i} id={id} questions={b.questions} />;
        }
      })}
    </>
  );
}
