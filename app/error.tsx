'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('ROOT ERROR CAUGHT:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-red-700 mb-4">ระบบพบข้อผิดพลาดร้ายแรง (Root Error)</h2>
        <div className="bg-red-100 p-4 rounded text-red-900 font-mono text-sm overflow-auto mb-4 whitespace-pre-wrap max-h-64">
          {error.message || 'Unknown Error'}
        </div>
        <p className="text-sm text-gray-600 mb-6">
          โปรดแคปหน้าจอนี้ส่งให้ผู้ดูแลระบบ
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-red-600 text-white px-4 py-3 rounded font-medium hover:bg-red-700 transition-colors"
        >
          รีโหลดหน้าจอใหม่
        </button>
      </div>
    </div>
  )
}
