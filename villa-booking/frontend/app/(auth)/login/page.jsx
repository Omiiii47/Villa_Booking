'use client'

import { Suspense } from 'react';
import Login from '../../../src/views/Login';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
