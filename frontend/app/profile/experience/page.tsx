'use client';

import { Suspense } from 'react';
import { ExperiencePage } from '../other-pages';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExperiencePage />
    </Suspense>
  );
}