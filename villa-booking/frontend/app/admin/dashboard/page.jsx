'use client'

import AdminGuard from '../../../src/components/guards/AdminGuard';
import AdminDashboard from '../../../src/views/AdminDashboard';

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
