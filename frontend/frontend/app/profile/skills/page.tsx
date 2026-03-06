'use client';

import { Suspense } from 'react';
import { SkillsPage } from '../other-pages';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SkillsPage />
    </Suspense>
  );
}