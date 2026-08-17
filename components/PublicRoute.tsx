'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import RUSHUPLoader from './loaders/RUSHUPLoader';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      const nextPath = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next') || ''
        : '';
      if (nextPath.startsWith('/dashboard') || nextPath.startsWith('/invite')) {
        router.push(nextPath);
        return;
      }

      // Redirect logged-in users to their dashboard
      if (profile.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (profile.role === 'staff') {
        if (profile.is_pos_account) { router.push('/dashboard/pos'); } else { router.push('/dashboard/staff'); }
      } else if (profile.role === 'customer') {
        router.push('/liff/member');
      }
    }
  }, [user, profile, loading, router]);

  // Show RUSHUPLoader while checking authentication or redirecting
  if (loading || (user && profile)) {
    return <RUSHUPLoader />;
  }

  // Render children for public access
  return <>{children}</>;
}