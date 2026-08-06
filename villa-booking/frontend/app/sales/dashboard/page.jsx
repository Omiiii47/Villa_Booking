'use client'

import { Suspense } from 'react';
import SalesGuard from '../../../src/components/guards/SalesGuard';
import SalesDashboard from '../../../src/views/SalesDashboard';

export default function SalesDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <SalesGuard>
        <SalesDashboard />
      </SalesGuard>
    </Suspense>
  );
}