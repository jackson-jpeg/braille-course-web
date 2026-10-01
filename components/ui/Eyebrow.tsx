import BrailleText from './BrailleText';

/** Small uppercase label with its own braille spelling — the site's signature ornament. */
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
      <BrailleText text={(braille ?? children).toLowerCase()} size="xs" />
      <span>{children}</span>
    </p>
  );
}
