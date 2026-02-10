'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHintsRemaining, useHint } from '@/lib/hint-system';

interface HintButtonProps {
  onUseHint: () => void;
  disabled?: boolean;
}

export default function HintButton({ onUseHint, disabled = false }: HintButtonProps) {
  const [remaining, setRemaining] = useState(3);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRemaining(getHintsRemaining());
  }, []);

  const handleClick = useCallback(() => {
    if (remaining <= 0 || disabled) return;
    const success = useHint();
    if (success) {
      setRemaining((r) => r - 1);
      onUseHint();
    }
  }, [remaining, disabled, onUseHint]);

  if (!mounted) return null;

  return (
    <button
      className={`hint-button ${remaining === 0 ? 'exhausted' : ''}`}
      onClick={handleClick}
      disabled={remaining === 0 || disabled}
      aria-label={`Use hint (${remaining} remaining today)`}
      title={`${remaining} hints remaining today`}
    >
      <span className="hint-button-icon">💡</span>
      <span className="hint-button-count">{remaining}</span>
    </button>
  );
}
