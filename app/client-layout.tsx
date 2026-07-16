'use client';

import SupabaseProvider from './supabase-provider';
import { AuthProvider } from '../lib/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <div className="min-h-screen w-full">
          {children}
        </div>
      </AuthProvider>
    </SupabaseProvider>
  );
}
