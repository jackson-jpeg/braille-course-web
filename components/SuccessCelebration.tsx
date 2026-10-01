'use client';

import { useState, useEffect } from 'react';
import { getRandomTip } from '@/lib/learning-tips';

interface SuccessCelebrationProps {
  show: boolean;
  message: string;
  onDismiss?: () => void;
  showConfetti?: boolean;
}

export default function SuccessCelebration({
  show,
  message,
  onDismiss,
  showConfetti = false,
}: SuccessCelebrationProps) {
  const [tip, setTip] = useState('');
  const [confettiPieces, setConfettiPieces] = useState<{ x: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    if (show) {
      setTip(getRandomTip().fact);
      if (showConfetti) {
        const colors = ['#D4A853', '#A8BFA0', '#1B2A4A', '#F0DEB4', '#7A9B6D'];
        setConfettiPieces(
          Array.from({ length: 24 }, () => ({
            x: Math.random() * 100,
            delay: Math.random() * 0.6,
            color: colors[Math.floor(Math.random() * colors.length)],
          })),
        );
      }
    }
  }, [show, showConfetti]);

  if (!show) return null;

  return (
    <div className="celebration-overlay" onClick={onDismiss}>
      {showConfetti && (
        <div className="celebration-confetti" aria-hidden="true">
          {confettiPieces.map((piece, i) => (
            <span
              key={i}
              className="celebration-confetti-piece"
              style={{
                left: `${piece.x}%`,
                animationDelay: `${piece.delay}s`,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      )}
      <div className="celebration-card" role="alert">
        <div className="celebration-message">{message}</div>
        {tip && <p className="celebration-tip">{tip}</p>}
        {onDismiss && (
          <button className="celebration-dismiss" onClick={onDismiss}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
