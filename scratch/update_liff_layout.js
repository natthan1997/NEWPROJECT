import fs from 'fs';

const filePath = 'app/liff/layout.tsx';
const content = `'use client';

import { LiffProvider } from '@/components/liff/LiffProvider';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function LiffPathRedirector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const path = searchParams.get('path');
    if (path && path.startsWith('/') && pathname !== path) {
      router.replace(path);
    }
  }, [searchParams, router, pathname]);

  return null;
}

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center bg-[#fcfcf9]">
         <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
       </div>
    }>
      <LiffPathRedirector />
      <Elements stripe={stripePromise}>
        <LiffProvider>
          <div className="bg-[#fcfcf9] min-h-screen max-w-md mx-auto w-full shadow-2xl relative text-[#1A1A18] font-sans selection:bg-emerald-100 antialiased overflow-x-clip">
            {children}
          </div>
        </LiffProvider>
      </Elements>
    </Suspense>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('Updated app/liff/layout.tsx with LiffPathRedirector');
