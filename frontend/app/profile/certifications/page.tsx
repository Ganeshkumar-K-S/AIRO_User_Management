'use client';

import { Suspense } from 'react';
import CertificationsPage from '@/app/profile/certifications-page';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CertificationsPage />
    </Suspense>
  );
}