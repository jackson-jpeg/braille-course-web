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
      <div id="wordgame">
        <BrailleWordGame />
      </div>

      {/* ========== DOT EXPLORER ========== */}
      <section className="explorer-section" id="explorer">
        <BrailleDotExplorer />
      </section>

      {/* ========== HANGMAN ========== */}
      <section className="hangman-section" id="hangman">
        <BrailleHangman />
      </section>

      {/* ========== SPEED MATCH ========== */}
      <section className="speedmatch-section" id="speedmatch">
        <BrailleSpeedMatch />
      </section>

      {/* ========== MEMORY MATCH ========== */}
      <section className="memorymatch-section" id="memorymatch">
        <BrailleMemoryMatch />
      </section>

      {/* ========== CONTRACTION SPRINT ========== */}
      <section className="csprint-section" id="contraction-sprint">
        <BrailleContractionSprint />
      </section>

      {/* ========== NUMBER SENSE ========== */}
      <section className="numsense-section" id="number-sense">
        <BrailleNumberSense />
      </section>

      {/* ========== REFLEX DOTS ========== */}
      <section className="reflex-section" id="reflex-dots">
        <BrailleReflexDots />
      </section>

      {/* ========== SEQUENCE ========== */}
      <section className="seq-section" id="sequence">
        <BrailleSequence />
      </section>

      {/* ========== SENTENCE DECODER ========== */}
      <section className="decoder-section" id="sentence-decoder">
        <BrailleSentenceDecoder />
      </section>

      {/* ========== FAB ========== */}
      <QuickStartFAB />

      <Footer />
    </>
  );
}
