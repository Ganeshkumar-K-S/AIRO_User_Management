'use client';

import { Suspense } from 'react';
import EducationPage from '@/app/profile/education-page';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EducationPage />
    </Suspense>
  );
}