'use client';

import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const AchievementsPage = nextDynamic(
  () => import('../other-pages').then(mod => mod.AchievementsPage),
  { ssr: false }
);

export default AchievementsPage;