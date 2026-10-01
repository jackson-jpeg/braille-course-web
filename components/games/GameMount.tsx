'use client';

import { Suspense, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import CellLoader from '@/components/ui/CellLoader';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import AchievementToast from '@/components/AchievementToast';
import type { GameId } from '@/lib/progress-types';

const load = (fn: () => Promise<{ default: ComponentType }>) =>
  dynamic(fn, { ssr: false, loading: () => <CellLoader label="Loading the game" /> });

/** Every game component, loaded only when its page is opened. */
const GAMES: Record<GameId, ComponentType> = {
  'dot-quest': load(() => import('@/components/games/DotQuest')),
  'letter-race': load(() => import('@/components/games/LetterRace')),
  'dot-builder': load(() => import('@/components/games/DotBuilder')),
  'word-decoder': load(() => import('@/components/games/WordDecoder')),
  'contraction-trainer': load(() => import('@/components/games/ContractionTrainer')),
  explorer: load(() => import('@/components/BrailleDotExplorer')),
  speedmatch: load(() => import('@/components/BrailleSpeedMatch')),
  memorymatch: load(() => import('@/components/BrailleMemoryMatch')),
  wordgame: load(() => import('@/components/BrailleWordGame')),
  hangman: load(() => import('@/components/BrailleHangman')),
  bingo: load(() => import('@/components/BrailleBingo')),
  rain: load(() => import('@/components/BrailleRain')),
  'reflex-dots': load(() => import('@/components/BrailleReflexDots')),
  sequence: load(() => import('@/components/BrailleSequence')),
  'number-sense': load(() => import('@/components/BrailleNumberSense')),
  'contraction-sprint': load(() => import('@/components/BrailleContractionSprint')),
  'sentence-decoder': load(() => import('@/components/BrailleSentenceDecoder')),
};

export default function GameMount({ id, title }: { id: GameId; title: string }) {
  const Game = GAMES[id];
  return (
    <GameErrorBoundary gameName={title}>
      <Suspense fallback={<CellLoader label="Loading the game" />}>
        <Game />
      </Suspense>
      <AchievementToast />
    </GameErrorBoundary>
  );
}
