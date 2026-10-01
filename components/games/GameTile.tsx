import Link from 'next/link';
import BrailleText from '@/components/ui/BrailleText';
import { SKILL_LABELS, type GameInfo } from '@/lib/games/registry';
import MasteryMeter from './MasteryMeter';

export default function GameTile({ game, headingLevel = 3 }: { game: GameInfo; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Link href={`/games/${game.slug}`} className={`tile tile-link game-tile game-tile--${game.audience}`}>
      <span className="game-tile-art" aria-hidden="true">
        <BrailleText text={game.emblem} size="sm" />
      </span>
      <H className="game-tile-title">
        {game.title}
        {game.isNew && <span className="chip chip--tomato game-tile-new">New</span>}
      </H>
      <p className="game-tile-tagline">{game.tagline}</p>
      <span className="game-tile-meta">
        {game.skills
          .slice(0, 2)
          .map((s) => SKILL_LABELS[s])
          .join(' · ')}{' '}
        · {game.minutes} min
      </span>
      <MasteryMeter id={game.id} />
    </Link>
  );
}
