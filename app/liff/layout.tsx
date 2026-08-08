'use client';

import { LiffProvider } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function LiffPathRedirector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const path = searchParams.get('path');
    const claimToken = searchParams.get('claimToken');
    if (path && path.startsWith('/')) {
      let target = path;
      if (claimToken && !target.includes('claimToken=')) {
        const sep = target.includes('?') ? '&' : '?';
        target += `${sep}claimToken=${claimToken}`;
      }
      const targetPath = target.split('?')[0];
      if (pathname !== targetPath) {
        router.replace(target);
      }
    }
  }, [searchParams, router, pathname]);

  return null;
}

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://static.line-scdn.net/liff/edge/2/sdk.js" strategy="afterInteractive" />
      <Suspense fallback={<div className="bg-[#fcfcf9] min-h-screen fixed inset-0 z-50"></div>}>
        <LiffPathRedirector />
        <Elements stripe={stripePromise}>
          <LiffProvider>
            <div className="bg-[#fcfcf9] min-h-screen max-w-md mx-auto w-full shadow-2xl relative text-[#1A1A18] font-sans selection:bg-emerald-100 antialiased overflow-x-clip">
              {children}
            </div>
          </LiffProvider>
        </Elements>
      </Suspense>
    </>
  );
}
