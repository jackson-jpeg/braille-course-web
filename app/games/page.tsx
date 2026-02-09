import { Metadata } from 'next';
import BrailleWordGame from '@/components/BrailleWordGame';
import BrailleDotExplorer from '@/components/BrailleDotExplorer';
import BrailleHangman from '@/components/BrailleHangman';
import BrailleSpeedMatch from '@/components/BrailleSpeedMatch';
import BrailleMemoryMatch from '@/components/BrailleMemoryMatch';
import GamesNav from '@/components/GamesNav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Interactive Braille Practice — TeachBraille.org',
  description:
    'Practice braille with interactive activities. Word Game, Dot Explorer, Hangman, Speed Match, and Memory Match.',
  openGraph: {
    title: 'Interactive Braille Practice — TeachBraille.org',
    description:
      'Interactive braille learning: Word Game, Dot Explorer, Hangman, Speed Match, and Memory Match.',
  },
};

export default function GamesPage() {
  return (
    <>
      {/* ========== HERO ========== */}
      <section className="games-hero" id="top">
        <div className="games-hero-content" id="main-content">
          <div className="section-label">Interactive Learning</div>
          <h1>
            Braille <em>Interactive</em>
          </h1>
          <p className="games-hero-sub">
            Practice and build your braille skills with interactive activities.
          </p>
        </div>
      </section>

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

      <Footer />
    </>
  );
}
