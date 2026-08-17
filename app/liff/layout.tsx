'use client';

import { LiffProvider } from '@/components/liff/LiffProvider';
import RUSHUPLoader from '@/components/loaders/RUSHUPLoader';
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
    const rawState = typeof window !== 'undefined' ? sessionStorage.getItem('liff_raw_state') : null;
    const liffStateParam = rawState || searchParams.get('liff.state');

    // Immediately remove raw state from sessionStorage once read so it never hijacks subsequent page navigation
    if (typeof window !== 'undefined' && rawState) {
      sessionStorage.removeItem('liff_raw_state');
    }

    let targetPath = searchParams.get('path');
    let token = searchParams.get('claimToken');

    // Safely extract path & claimToken from liff.state if present
    if (liffStateParam) {
      let rawState = liffStateParam;
      try {
        // Repeatedly decode in case double-encoded
        for (let i = 0; i < 3; i++) {
          const dec = decodeURIComponent(rawState);
          if (dec === rawState) break;
          rawState = dec;
        }
      } catch {}

      if (rawState.includes('/member') || rawState.includes('member')) {
        targetPath = '/liff/member';
      } else if (rawState.startsWith('/')) {
        targetPath = rawState;
      } else if (rawState.includes('path=')) {
        const matchPath = rawState.match(/(?:[?&]|^)path=([^&]+)/i);
        if (matchPath && matchPath[1]) {
          targetPath = matchPath[1];
        }
      }

      if (!token) {
        const matchToken = rawState.match(/(?:[?&]|%3F|%26|^)claimToken(?:=3D|=)([^&%]+)/i) || rawState.match(/claimToken=([^&]+)/i);
        if (matchToken && matchToken[1]) {
          token = matchToken[1];
        }
      }
    }

    // Decode path & claimToken from hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashContent = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashContent.replace(/\?/g, '&'));
      const hashPath = hashParams.get('path');
      const hashToken = hashParams.get('claimToken');
      
      if (hashPath && !targetPath) targetPath = hashPath;
      if (hashToken && !token) token = hashToken;
    }

    // If claimToken is present, default target path to /liff/member for receiving points
    if (!targetPath && token) {
      targetPath = '/liff/member';
    } else if (!targetPath && typeof window !== 'undefined' && window.location.pathname === '/liff') {
      targetPath = '/liff/member';
    }

    if (targetPath && targetPath.startsWith('/')) {
      let target = targetPath;
      if (token && !target.includes('claimToken=')) {
        const sep = target.includes('?') ? '&' : '?';
        target += `${sep}claimToken=${token}`;
      }
      
      let targetCleanPath = target.split('?')[0].replace(/\/+$/, '');
      
      // Auto-prefix with /liff if missing (common mistake in Rich Menu setup)
      if (!targetCleanPath.startsWith('/liff')) {
        targetCleanPath = `/liff${targetCleanPath.startsWith('/') ? '' : '/'}${targetCleanPath}`;
        target = `/liff${target.startsWith('/') ? '' : '/'}${target}`;
      }
      
      // Prevent redirecting to invalid /liff root path which causes 404
      if (targetCleanPath === '/liff' || targetCleanPath === '') {
        targetCleanPath = '/liff/member';
        target = `/liff/member${target.includes('?') ? '?' + target.split('?')[1] : ''}`;
      }

      // Valid LIFF sub-routes in app/liff/
      const validLiffRoutes = ['/liff/member', '/liff/menu', '/liff/history', '/liff/rewards', '/liff/my-rewards', '/liff/point-history', '/liff/success', '/liff/track'];
      const isValidRoute = validLiffRoutes.some(r => targetCleanPath === r || targetCleanPath.startsWith(r + '/'));

      if (isValidRoute) {
        if (pathname !== targetCleanPath) {
          router.replace(target);
        }
      } else if (pathname === '/liff') {
        // Fallback for completely invalid routes to avoid getting stuck on the loader
        router.replace('/liff/member');
      }
    } else if (pathname === '/liff') {
      // Fallback if targetPath is missing but we're on the root liff page
      router.replace('/liff/member');
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
