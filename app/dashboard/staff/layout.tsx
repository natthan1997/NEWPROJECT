'use client'

import React from 'react'
import ProtectedRoute from '../../../lib/ProtectedRoute'
import { ToastProvider } from '@/components/Toast'
import StaffBottomNav from '../../../components/StaffBottomNav'

// SidebarContext is provided from a shared module; no named exports from layout.
const StyleTag = () => (
  <style>{`
    @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Pridi:wght@300;400;500;600&display=swap");
    body {
       font-family: 'Plus Jakarta Sans', sans-serif;
       -webkit-font-smoothing: antialiased;
    }
    .font-serif-thai { font-family: 'Pridi', serif; }
  `}</style>
)

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['staff', 'admin']}>
      <ToastProvider>
        <div className="flex min-h-screen w-full flex-col bg-white overflow-x-hidden">
          <StyleTag />
          <main className="flex-1 w-full overflow-x-hidden pb-24">
            {children}
          </main>
          <StaffBottomNav />
        </div>
      </ToastProvider>
    </ProtectedRoute>
  )
}