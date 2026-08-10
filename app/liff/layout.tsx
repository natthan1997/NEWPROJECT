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
    const pathParam = searchParams.get('path');
    const claimTokenParam = searchParams.get('claimToken');
    const liffStateParam = searchParams.get('liff.state');

    let targetPath = pathParam;
    let token = claimTokenParam;

    // Decode path & claimToken from liff.state if present
    if (!targetPath && liffStateParam) {
      let cur = liffStateParam;
      for (let i = 0; i < 3; i++) {
        try {
          const decoded = decodeURIComponent(cur);
          const matchPath = decoded.match(/(?:[?&]|%3F|%26|^)path(?:=3D|=)([^&%]+)/i) || decoded.match(/path=([^&]+)/i);
          if (matchPath && matchPath[1]) {
            targetPath = decodeURIComponent(matchPath[1]);
          }
          const matchToken = decoded.match(/(?:[?&]|%3F|%26|^)claimToken(?:=3D|=)([^&%]+)/i) || decoded.match(/claimToken=([^&]+)/i);
          if (matchToken && matchToken[1]) {
            token = decodeURIComponent(matchToken[1]);
          }
          if (decoded === cur) break;
          cur = decoded;
        } catch {
          break;
        }
      }
    }

    // Decode path & claimToken from hash to prevent 400 Bad Request in LINE Login
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashContent = window.location.hash.substring(1); // remove '#'
      const hashParams = new URLSearchParams(hashContent.replace(/\?/g, '&'));
      const hashPath = hashParams.get('path');
      const hashToken = hashParams.get('claimToken');
      
      if (hashPath && !targetPath) targetPath = decodeURIComponent(hashPath);
      if (hashToken && !token) token = decodeURIComponent(hashToken);
    }

    if (targetPath && targetPath.startsWith('/')) {
      let target = targetPath;
      if (token && !target.includes('claimToken=')) {
        const sep = target.includes('?') ? '&' : '?';
        target += `${sep}claimToken=${token}`;
      }
      const targetCleanPath = target.split('?')[0];
      if (pathname !== targetCleanPath) {
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
