import BrailleText from './BrailleText';

/** Small uppercase label, led by its first word in braille — the site's signature ornament. */
export default function Eyebrow({
  children,
  braille,
  className,
}: {
  children: string;
  braille?: string;
  className?: string;
}) {
  return (
    <p className={['eyebrow', className].filter(Boolean).join(' ')}>
      <BrailleText text={(braille ?? children.split(' ')[0]).toLowerCase()} size="xs" />
      <span>{children}</span>
    </p>
  );
}
