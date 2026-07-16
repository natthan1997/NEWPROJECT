/**
 * PWA Service Worker Registration Hook
 * 
 * Register and manage service worker lifecycle.
 */

import { useEffect, useState } from 'react'

export function usePWA() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // POS is online-only; remove lingering PWA caches/service workers from older builds in one place.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[POS_PRINT_FLOW]', 'service_worker:unregistered', registration.scope);
        }
      }).catch(error => console.error('Error unregistering service worker:', error));
    }

    if ('caches' in window) {
      caches.keys()
        .then((cacheNames) => Promise.all(
          cacheNames
            .filter((name) => name.startsWith('xylem-') || name.startsWith('workbox-'))
            .map((name) => {
              console.log('[POS_PRINT_FLOW]', 'cache:deleted', name)
              return caches.delete(name)
            })
        ))
        .catch(error => console.error('Error clearing PWA caches:', error))
    }
  }, [])
}

/**
 * Install PWA as app
 */
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  return { installPrompt, isInstalled, installApp }
}
