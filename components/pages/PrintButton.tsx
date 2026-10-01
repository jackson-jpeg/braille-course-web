'use client';

import ButtonCell from '@/components/ui/ButtonCell';

interface PrintButtonProps {
  children?: React.ReactNode;
  className?: string;
}

/** Opens the browser's print dialog. Used by reference pages with a print stylesheet. */
export default function PrintButton({ children = 'Print the chart', className = 'btn btn--paper' }: PrintButtonProps) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <ButtonCell letter="p" />
      {children}
    </button>
  );
}
