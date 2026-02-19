import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import BrailleHero from '@/components/BrailleHero';

function GameSkeleton() {
  return <div className="game-skeleton" aria-label="Loading game…" role="status"><div className="game-skeleton-shimmer" /></div>;
}

const BrailleWordGame = dynamic(() => import('@/components/BrailleWordGame'), { loading: GameSkeleton });
const BrailleDotExplorer = dynamic(() => import('@/components/BrailleDotExplorer'), { loading: GameSkeleton });
const BrailleHangman = dynamic(() => import('@/components/BrailleHangman'), { loading: GameSkeleton });
const BrailleSpeedMatch = dynamic(() => import('@/components/BrailleSpeedMatch'), { loading: GameSkeleton });
const BrailleMemoryMatch = dynamic(() => import('@/components/BrailleMemoryMatch'), { loading: GameSkeleton });
const BrailleContractionSprint = dynamic(() => import('@/components/BrailleContractionSprint'), { loading: GameSkeleton });
const BrailleNumberSense = dynamic(() => import('@/components/BrailleNumberSense'), { loading: GameSkeleton });
const BrailleReflexDots = dynamic(() => import('@/components/BrailleReflexDots'), { loading: GameSkeleton });
const BrailleSequence = dynamic(() => import('@/components/BrailleSequence'), { loading: GameSkeleton });
const BrailleSentenceDecoder = dynamic(() => import('@/components/BrailleSentenceDecoder'), { loading: GameSkeleton });
import GamesNav from '@/components/GamesNav';
import Footer from '@/components/Footer';
import OnboardingModal from '@/components/OnboardingModal';
import ProgressDashboard from '@/components/ProgressDashboard';
import DailyChallengeBanner from '@/components/DailyChallenge';
import AchievementToast from '@/components/AchievementToast';
import QuickStartFAB from '@/components/QuickStartFAB';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import StreakBadge from '@/components/StreakBadge';

export const metadata: Metadata = {
  title: 'Free Braille Practice Games — 10 Interactive Activities',
  description:
    'Teach and learn braille with 10 free interactive games. Practice letters, numbers, contractions, and sentences with Word Game, Dot Explorer, Hangman, Speed Match, Memory Match, and more.',
  alternates: { canonical: 'https://teachbraille.org/games' },
  openGraph: {
    title: 'Free Braille Practice Games — 10 Interactive Activities | TeachBraille.org',
    description:
      'Learn braille with 10 free interactive games — from letter recognition to full sentence decoding. No account needed.',
  },
};

export default function GamesPage() {
  return (
    <>
      {/* ========== MODALS ========== */}
      <OnboardingModal />
      <AchievementToast />

      {/* ========== HERO ========== */}
      <section className="games-hero" id="top">
        <div className="games-hero-content">
          <BrailleHero word="INTERACTIVE" easterEggs />
          <div className="section-label">Interactive Learning</div>
          <h1>
            Braille <em>Interactive</em>
          </h1>
          <p className="games-hero-sub">Practice and build your braille skills with 10 interactive activities.</p>
          <StreakBadge />
        </div>
      </section>

      {/* ========== DAILY CHALLENGES ========== */}
      <DailyChallengeBanner />

      {/* ========== IN-PAGE NAV ========== */}
      <GamesNav />

      {/* ========== WORD GAME ========== */}
      <section className="wordgame-section" id="wordgame" aria-label="Braille Word Game">
        <GameErrorBoundary gameName="Word Game">
          <BrailleWordGame />
        </GameErrorBoundary>
      </section>

      {/* ========== PROGRESS DASHBOARD ========== */}
      <ProgressDashboard />

      {/* ========== DOT EXPLORER ========== */}
      <section className="explorer-section" id="explorer" aria-label="Dot Explorer">
        <GameErrorBoundary gameName="Dot Explorer">
          <BrailleDotExplorer />
        </GameErrorBoundary>
      </section>

      {/* ========== HANGMAN ========== */}
      <section className="hangman-section" id="hangman" aria-label="Braille Hangman">
        <GameErrorBoundary gameName="Hangman">
          <BrailleHangman />
        </GameErrorBoundary>
      </section>

      {/* ========== SPEED MATCH ========== */}
      <section className="speedmatch-section" id="speedmatch" aria-label="Speed Match">
        <GameErrorBoundary gameName="Speed Match">
          <BrailleSpeedMatch />
        </GameErrorBoundary>
      </section>

      {/* ========== MEMORY MATCH ========== */}
      <section className="memorymatch-section" id="memorymatch" aria-label="Memory Match">
        <GameErrorBoundary gameName="Memory Match">
          <BrailleMemoryMatch />
        </GameErrorBoundary>
      </section>

      {/* ========== CONTRACTION SPRINT ========== */}
      <section className="csprint-section" id="contraction-sprint" aria-label="Contraction Sprint">
        <GameErrorBoundary gameName="Contraction Sprint">
          <BrailleContractionSprint />
        </GameErrorBoundary>
      </section>

      {/* ========== NUMBER SENSE ========== */}
      <section className="numsense-section" id="number-sense" aria-label="Number Sense">
        <GameErrorBoundary gameName="Number Sense">
          <BrailleNumberSense />
        </GameErrorBoundary>
      </section>

      {/* ========== REFLEX DOTS ========== */}
      <section className="reflex-section" id="reflex-dots" aria-label="Reflex Dots">
        <GameErrorBoundary gameName="Reflex Dots">
          <BrailleReflexDots />
        </GameErrorBoundary>
      </section>

      {/* ========== SEQUENCE ========== */}
      <section className="seq-section" id="sequence" aria-label="Braille Sequence">
        <GameErrorBoundary gameName="Sequence">
          <BrailleSequence />
        </GameErrorBoundary>
      </section>

      {/* ========== SENTENCE DECODER ========== */}
      <section className="decoder-section" id="sentence-decoder" aria-label="Sentence Decoder">
        <GameErrorBoundary gameName="Sentence Decoder">
          <BrailleSentenceDecoder />
        </GameErrorBoundary>
      </section>

      {/* ========== FAB ========== */}
      <QuickStartFAB />

      <Footer />
    </>
  );
}
