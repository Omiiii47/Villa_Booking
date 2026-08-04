'use client'

import UserGuard from '../../../src/components/guards/UserGuard';
import Dashboard from '../../../src/views/Dashboard';

export default function DashboardPage() {
  return (
    <UserGuard>
      <Dashboard />
    </UserGuard>
  );
}
