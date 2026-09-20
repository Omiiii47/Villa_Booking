'use client'

import { Suspense } from 'react';
import ResetPassword from '../../../src/views/ResetPassword';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}