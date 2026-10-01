import { brailleMap } from '@/lib/braille-map';

interface BrailleCellProps {
  /** Provide either a letter (looked up via brailleMap) or a raw pattern */
  letter?: string;
  pattern?: number[];
  /** CSS class for the container div */
  className?: string;
  /** CSS class for each dot span */
  dotClassName?: string;
}

export default function BrailleCell({ letter, pattern, className, dotClassName }: BrailleCellProps) {
  const dots = pattern ?? brailleMap[letter?.toUpperCase() ?? ''] ?? [0, 0, 0, 0, 0, 0];
  const dotCls = dotClassName ?? 'dot';
  return (
    <div className={className} aria-hidden="true">
      {dots.map((v, i) => (
        <span key={i} className={`${dotCls} ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}
