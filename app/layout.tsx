import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import ClientProviders from './client-providers';
import AppChrome from '../components/AppChrome';

const inter = Inter({ subsets: ['latin'] });
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'XYL STUDIO',
  description: 'Premium landscape design, estate care, workshops, and customer portal experiences for residences, estates, and enterprise properties.',
  keywords: [
    'landscape design',
    'garden maintenance',
    'estate care',
    'customer portal',
    'landscape services',
    'workshops',
  ],
  openGraph: {
    title: 'XYL STUDIO',
    description: 'Premium landscape services with customer reporting, multi-property management, and trusted service operations.',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'XYL STUDIO',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined') {
                  const CURRENT_VERSION = 'v11';
                  if (localStorage.getItem('app_version') !== CURRENT_VERSION) {
                    localStorage.setItem('app_version', CURRENT_VERSION);
                    if ('caches' in window) {
                      caches.keys().then(function(names) {
                        names.forEach(function(name) {
                          caches.delete(name);
                        });
                      });
                    }
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        registrations.forEach(function(registration) {
                          registration.unregister();
                        });
                      });
                    }
                    setTimeout(function() {
                      window.location.reload();
                    }, 500);
                  }
                  
                  // Diagnostic test fetches to see exactly why R2 fetches fail on this browser
                  const testUrl = 'https://pub-a6469596238f4a58a3a44fb4bbecd952.r2.dev/migrated-menus/2436f7cc-4d69-426f-aaa1-e8aa1de262a2-1783492523221.jpg';
                  fetch(testUrl, { mode: 'cors' })
                    .then(function(res) { console.log('DIAGNOSTIC CORS fetch SUCCESS:', res.status); })
                    .catch(function(err) { console.error('DIAGNOSTIC CORS fetch FAILED:', err.message || err); });
                  fetch(testUrl, { mode: 'no-cors' })
                    .then(function(res) { console.log('DIAGNOSTIC NO-CORS fetch SUCCESS:', res.status); })
                    .catch(function(err) { console.error('DIAGNOSTIC NO-CORS fetch FAILED:', err.message || err); });
                }
              } catch (e) {
                console.error(e);
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full overflow-x-hidden antialiased`}>
        <ClientProviders>
          <div className="xyl-shell min-h-screen w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] bg-white">
            <AppChrome>{children}</AppChrome>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
} 