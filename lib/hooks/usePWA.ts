/**
 * PWA Service Worker Registration Hook
 * 
 * Register and manage service worker lifecycle.
 */

import { useEffect, useState } from 'react'

export function usePWA() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Unregister any lingering Service Workers to fix PWA caching issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Unregistered Service Worker to disable PWA:', registration.scope);
        }
      }).catch(error => console.error('Error unregistering service worker:', error));
    }

    // Handle update
    window.addEventListener('sw-update', (event: any) => {
      const worker = event.detail
      console.log('Service worker update available')
      worker.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    })

    return () => {
      window.removeEventListener('sw-update', () => {})
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
