'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesAuth } from '../../context/SalesAuthContext';

const SalesGuard = ({ children }) => {
  const { sales, loading } = useSalesAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !sales) router.replace('/sales');
  }, [loading, sales, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sales) return null;

  return children;
};

export default SalesGuard;