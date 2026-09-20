'use client'

import { Suspense } from 'react';
import VerifyEmail from '../../../src/views/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmail />
    </Suspense>
  );
}