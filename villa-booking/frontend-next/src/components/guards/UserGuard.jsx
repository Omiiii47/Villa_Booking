'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '../../context/UserAuthContext';

const UserGuard = ({ children }) => {
  const { user, loading } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return children;
};

export default UserGuard;
