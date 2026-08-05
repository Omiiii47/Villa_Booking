'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminGuard = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) router.replace('/admin');
  }, [loading, admin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) return null;

  return children;
};

export default AdminGuard;
