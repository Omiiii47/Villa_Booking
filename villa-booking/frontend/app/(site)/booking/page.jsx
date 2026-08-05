'use client'

import { Suspense } from 'react';
import UserGuard from '../../../src/components/guards/UserGuard';
import Booking from '../../../src/views/Booking';

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UserGuard>
        <Booking />
      </UserGuard>
    </Suspense>
  );
}
