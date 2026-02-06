import { Metadata } from 'next';
import BrailleWordle from '@/components/BrailleWordle';
import BrailleDotExplorer from '@/components/BrailleDotExplorer';
import BrailleHangman from '@/components/BrailleHangman';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Braille Games — TeachBraille.org',
  description:
    'Practice braille with interactive games. Play Braille Wordle, explore dot patterns with Dot Explorer, and test your skills with Braille Hangman.',
  openGraph: {
    title: 'Braille Games — TeachBraille.org',
    description:
      'Interactive braille learning games: Wordle, Dot Explorer, and Hangman.',
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
            Braille <em>Games</em>
          </h1>
          <p className="games-hero-sub">
            Practice and build your braille skills with fun, interactive games.
          </p>
        </div>
      </section>

      {/* ========== IN-PAGE NAV ========== */}
      <nav className="games-nav" aria-label="Game navigation">
        <a href="#wordle" className="games-nav-link">Wordle</a>
        <a href="#explorer" className="games-nav-link">Dot Explorer</a>
        <a href="#hangman" className="games-nav-link">Hangman</a>
      </nav>

      {/* ========== WORDLE ========== */}
      <div id="wordle">
        <BrailleWordle />
      </div>

      {/* ========== DOT EXPLORER ========== */}
      <section className="explorer-section" id="explorer">
        <BrailleDotExplorer />
      </section>

      {/* ========== HANGMAN ========== */}
      <section className="hangman-section" id="hangman">
        <BrailleHangman />
      </section>

      <Footer />
    </>
  );
}
