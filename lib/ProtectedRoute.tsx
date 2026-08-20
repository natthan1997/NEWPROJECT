'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import RUSHUPLoader from '@/components/loaders/RUSHUPLoader'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const queryString = typeof window !== 'undefined' ? window.location.search : ''
        const currentPath = pathname
          ? `${pathname}${queryString}`
          : ''
        const safeNext = (currentPath.startsWith('/dashboard') || currentPath.startsWith('/invite'))
          ? `?next=${encodeURIComponent(currentPath)}`
          : ''
        router.push(`/login${safeNext}`)
        return
      }

      if (profile) {
        // Admins can access everything for testing/support
        if (profile.role === 'admin' || profile.staff_level === 'admin') {
          return
        }

        const isStaffPath = pathname?.startsWith('/dashboard/staff')
        const isAdminPath = pathname?.startsWith('/dashboard/admin')
        const isCustomerPath = pathname?.startsWith('/dashboard/customer')
        const isPosPath = pathname?.startsWith('/dashboard/pos')
        const isMerchantPath = pathname?.startsWith('/dashboard/merchant')

        // Force POS accounts to the POS page (except if they are merchant owners going to merchant dashboard)
        if (profile.is_pos_account && !isPosPath && !isMerchantPath) {
          if (profile.staff_level === 'owner' || profile.staff_level === 'superadmin') {
            router.push('/dashboard/merchant')
          } else {
            router.push('/dashboard/pos')
          }
          return
        }

        if (profile.role === 'staff' && isAdminPath) {
          if (profile.staff_level === 'owner' || profile.staff_level === 'superadmin') {
            router.push('/dashboard/merchant')
          } else {
            router.push('/dashboard/staff')
          }
          return
        }
        if (profile.role === 'customer' && (isStaffPath || isAdminPath || isMerchantPath)) {
          router.push('/liff/member')
          return
        }

        // Standard Authorization Check
        if (allowedRoles && !allowedRoles.includes(profile.role)) {
          if (profile.role === 'customer') router.push('/liff/member')
          else if (profile.role === 'staff') {
            if (profile.staff_level === 'owner' || profile.staff_level === 'superadmin') router.push('/dashboard/merchant')
            else router.push('/dashboard/staff')
          }
          else if (profile.role === 'admin') router.push('/dashboard/admin')
          else router.push('/login')
        }
      }
    }
  }, [user, profile, loading, router, allowedRoles, pathname])

  // Show loading spinner while checking authentication
  if (loading) {
    return <RUSHUPLoader tagline="กำลังตรวจสอบสิทธิ์..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null
  }

  // Check role authorization
  if (allowedRoles && profile) {
    const hasRole = allowedRoles.includes(profile.role) || (allowedRoles.includes('admin') && profile.staff_level === 'admin')
    if (!hasRole) {
      return null
    }
    
    // Prevent flash of wrong dashboard for POS accounts (except merchant dashboard for owners)
    const isPosPath = pathname?.startsWith('/dashboard/pos')
    const isMerchantPath = pathname?.startsWith('/dashboard/merchant')
    if (profile.is_pos_account && !isPosPath && !isMerchantPath) {
      return null
    }
  }

  // Render children if authenticated and authorized
  return <>{children}</>
} 