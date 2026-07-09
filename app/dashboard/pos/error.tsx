'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("POS Dashboard Error Boundary caught:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 p-4 font-mono">
      <h2 className="text-xl font-bold mb-4">🚨 ระบบ POS เกิดข้อผิดพลาด</h2>
      <div className="bg-white p-4 rounded border border-red-200 text-sm max-w-2xl w-full overflow-auto mb-4">
        <p className="font-bold">{error.name}: {error.message}</p>
        <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">{error.stack}</pre>
      </div>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        ลองใหม่อีกครั้ง (Try again)
      </button>
      <button
        onClick={() => { window.location.href = '/login' }}
        className="mt-4 px-4 py-2 bg-white text-red-600 border border-red-200 rounded hover:bg-red-50"
      >
        กลับไปหน้าล็อกอิน
      </button>
    </div>
  )
}
