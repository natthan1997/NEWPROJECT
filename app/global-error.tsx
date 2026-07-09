'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '500px', width: '100%', borderLeft: '4px solid #ef4444' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '16px' }}>ระบบพบข้อผิดพลาดระดับ Global (Global Error)</h2>
            <div style={{ backgroundColor: '#fee2e2', padding: '16px', borderRadius: '4px', color: '#7f1d1d', fontFamily: 'monospace', fontSize: '14px', overflow: 'auto', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
              {error.message || 'Unknown Error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ width: '100%', backgroundColor: '#dc2626', color: 'white', padding: '12px 16px', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              รีโหลดหน้าจอใหม่
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
