'use client';

import { Suspense } from 'react';
import { AchievementsPage } from '../other-pages';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AchievementsPage />
    </Suspense>
  );
}