'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiffRootPage() {
  const router = useRouter();

  // Routing is handled entirely by LiffPathRedirector in app/liff/layout.tsx
  // This page just serves as a loading placeholder while the redirector calculates the correct path

  return (
    <div className="min-h-screen bg-[#fcfcf9] flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );
}
