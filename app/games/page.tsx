import { Metadata } from 'next';
import BrailleWordGame from '@/components/BrailleWordGame';
import BrailleDotExplorer from '@/components/BrailleDotExplorer';
import BrailleHangman from '@/components/BrailleHangman';
import BrailleSpeedMatch from '@/components/BrailleSpeedMatch';
import BrailleMemoryMatch from '@/components/BrailleMemoryMatch';
import BrailleContractionSprint from '@/components/BrailleContractionSprint';
import BrailleNumberSense from '@/components/BrailleNumberSense';
import BrailleReflexDots from '@/components/BrailleReflexDots';
import BrailleSequence from '@/components/BrailleSequence';
import BrailleSentenceDecoder from '@/components/BrailleSentenceDecoder';
import BrailleHero from '@/components/BrailleHero';
import GamesNav from '@/components/GamesNav';
import Footer from '@/components/Footer';
import OnboardingModal from '@/components/OnboardingModal';
import ProgressDashboard from '@/components/ProgressDashboard';
import DailyChallengeBanner from '@/components/DailyChallenge';
import AchievementToast from '@/components/AchievementToast';
import QuickStartFAB from '@/components/QuickStartFAB';
import GameErrorBoundary from '@/components/GameErrorBoundary';

export const metadata: Metadata = {
  title: 'Interactive Braille Practice — TeachBraille.org',
  description:
    'Practice braille with 10 interactive activities. Word Game, Dot Explorer, Hangman, Speed Match, Memory Match, Contraction Sprint, Number Sense, Reflex Dots, Sequence, and Sentence Decoder.',
  openGraph: {
    title: 'Interactive Braille Practice — TeachBraille.org',
    description:
      'Interactive braille learning: 10 games from letter recognition to sentence reading.',
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
        <div className="games-hero-content" id="main-content">
          <BrailleHero word="INTERACTIVE" easterEggs />
          <div className="section-label">Interactive Learning</div>
          <h1>
            Braille <em>Interactive</em>
          </h1>
          <p className="games-hero-sub">
            Practice and build your braille skills with 10 interactive activities.
          </p>
        </div>
      </section>

      {/* ========== DAILY CHALLENGES ========== */}
      <DailyChallengeBanner />

      {/* ========== PROGRESS DASHBOARD ========== */}
      <ProgressDashboard />

      {/* ========== IN-PAGE NAV ========== */}
      <GamesNav />

      {/* ========== WORD GAME ========== */}
      <section className="wordgame-section" id="wordgame" aria-label="Braille Word Game">
        <GameErrorBoundary gameName="Word Game">
          <BrailleWordGame />
        </GameErrorBoundary>
      </section>

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
