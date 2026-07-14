'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class POSErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('POS Error Caught by Boundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#FAFAFA] p-8 border border-red-100 rounded-3xl min-h-[300px]">
          <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-2xl mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-widest text-center">เกิดข้อผิดพลาดในการแสดงผล</h2>
          <p className="text-[12px] text-gray-500 font-bold mb-8 text-center max-w-sm">
            ระบบพบปัญหาในการเรนเดอร์ข้อมูลส่วนนี้ แต่คุณยังสามารถใช้งานส่วนอื่นของระบบได้ตามปกติ
          </p>
          
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-[#111111] text-white px-8 py-4 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-colors"
          >
            <RefreshCcw size={16} /> โหลดหน้านี้ใหม่
          </button>

          {this.state.error && (
            <div className="mt-8 p-4 bg-gray-100 rounded-xl text-left w-full max-w-md overflow-auto">
              <p className="text-[10px] text-red-500 font-mono font-bold">{this.state.error.message}</p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
