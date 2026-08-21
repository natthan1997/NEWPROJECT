'use client'

import React, { useState, useEffect } from 'react'
import { X, Delete, ShieldCheck } from 'lucide-react'

interface POSPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  correctPin: string
  title?: string
  description?: string
}

export default function POSPinModal({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
  title = 'MANAGER AUTHORIZATION',
  description = 'กรุณาใส่รหัสผ่านผู้จัดการเพื่อทำรายการนี้'
}: POSPinModalProps) {
  const [pin, setPin] = useState<string>('')
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const pinToCompare = String(correctPin || '').trim();

  const handleKeyPress = (num: string) => {
    if (error) setError(false)
    if (pin.length < 6) {
      const nextPin = pin + num
      setPin(nextPin)
      
      // Auto-validate if PIN reaches correct length
      if (nextPin.length === pinToCompare.length) {
        if (nextPin === pinToCompare) {
          onSuccess()
          onClose()
        } else {
          // Play error flash
          setError(true)
          setPin('')
        }
      }
    }
  }

  const handleDelete = () => {
    if (error) setError(false)
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
    setError(false)
  }
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white lg:rounded-[2rem]">

      {/* Modal Container */}
      <div className={`relative w-full h-full flex flex-col items-center justify-center text-black font-bold select-none bg-white ${error ? 'animate-shake' : ''}`}>
        
        {/* Title */}
        <div className="flex flex-col items-center text-center space-y-1 mb-8 w-full shrink-0">
          <h3 className="text-[17px] font-normal tracking-wide text-neutral-800">
            {title}
          </h3>
          {error && <p className="text-[13px] font-medium text-red-500">รหัสไม่ถูกต้อง</p>}
        </div>

        {/* PIN Display Bullets */}
        <div className="flex gap-4 mb-10 h-4 items-center justify-center shrink-0">
          {Array.from({ length: Math.max(pinToCompare.length, 4) }).map((_, idx) => {
            const isFilled = idx < pin.length
            return (
              <div 
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border-[1.5px] ${error ? 'border-red-500 bg-red-500' : isFilled ? 'border-[#D3202B] bg-[#D3202B]' : 'border-neutral-800 bg-transparent'}`}
              />
            )
          })}
        </div>

        {/* Numeric Numpad (Pure Apple Transparent Style with Red Active) */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px] shrink-0 mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="w-[72px] h-[72px] mx-auto rounded-full bg-neutral-100/60 hover:bg-neutral-200/60 active:bg-red-50 active:text-[#D3202B] transition-colors flex items-center justify-center text-neutral-900 border border-black/[0.03]"
            >
              <span className="text-[34px] font-light leading-none">{num}</span>
            </button>
          ))}
          
          {/* Empty bottom left */}
          <div className="w-[72px] h-[72px]"></div>
          
          {/* Zero */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-[72px] h-[72px] mx-auto rounded-full bg-neutral-100/60 hover:bg-neutral-200/60 active:bg-red-50 active:text-[#D3202B] transition-colors flex items-center justify-center text-neutral-900 border border-black/[0.03]"
          >
            <span className="text-[34px] font-light leading-none">0</span>
          </button>

          {/* Delete or Cancel Button */}
          <button
            type="button"
            onClick={() => {
                if (pin.length > 0) {
                    handleDelete()
                } else {
                    onClose()
                }
            }}
            className="w-[72px] h-[72px] mx-auto transition-colors text-[15px] font-normal flex items-center justify-center text-neutral-900 active:text-neutral-500"
          >
            {pin.length > 0 ? 'ลบ' : 'ยกเลิก'}
          </button>
        </div>

      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}
