'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LEGACY_GAME_ANCHORS } from '@/lib/games/registry';

/** The old /games page had every game on one page (/games#hangman). Send those links to the new pages. */
export default function LegacyAnchorRedirect() {
  const router = useRouter();
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const slug = LEGACY_GAME_ANCHORS[hash];
    if (slug) router.replace(`/games/${slug}`);
  }, [router]);
  return null;
}
