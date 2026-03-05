'use client';

import { Suspense } from 'react';
import ProjectsPage from '@/app/profile/projects-page';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsPage />
    </Suspense>
  );
}