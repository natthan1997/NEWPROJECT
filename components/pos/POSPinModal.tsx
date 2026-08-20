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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Clean Dark Backdrop with Blur (Removes red glow/shadow) */}
      <div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container (Clean rounded-3xl, subtle border) */}
      <div className={`relative w-full max-w-sm bg-white border border-neutral-100 p-8 rounded-3xl shadow-2xl transition-all duration-300 transform scale-100 flex flex-col items-center justify-center text-black font-bold select-none ${error ? 'animate-shake' : ''}`}>
        
        {/* Close Button (Rounded-full, clean hover) */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 transition-colors flex items-center justify-center text-neutral-400 hover:text-neutral-900"
        >
          <X size={16} />
        </button>

        {/* Shield Icon / Title */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6 w-full">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-neutral-50 text-neutral-800 shrink-0">
            <ShieldCheck size={26} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] leading-tight text-neutral-800">{title}</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest max-w-[240px] leading-relaxed">
            {error ? 'รหัส PIN ไม่ถูกต้อง' : description}
          </p>
        </div>

        {/* PIN Display Bullets (Brand red when filled, clean animations) */}
        <div className="flex gap-3 mb-8 h-6 items-center justify-center">
          {Array.from({ length: Math.max(pinToCompare.length, 4) }).map((_, idx) => {
            const isFilled = idx < pin.length
            return (
              <div 
                key={idx}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${error ? 'bg-red-500 scale-110' : isFilled ? 'bg-[#C62229] scale-110' : 'bg-neutral-100 border border-neutral-200'}`}
              />
            )
          })}
        </div>

        {/* Numeric Numpad (Clean, rounded-2xl buttons, no harsh borders) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 bg-neutral-50 hover:bg-neutral-900 hover:text-white transition-all text-lg font-black rounded-2xl flex items-center justify-center active:scale-95 text-[#1A1A18]"
            >
              {num}
            </button>
          ))}
          
          {/* Clear button */}
          <button
            onClick={handleClear}
            className="h-14 bg-transparent hover:bg-neutral-50 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-2xl active:scale-95 text-neutral-400 hover:text-[#1A1A18]"
          >
            Clear
          </button>
          
          {/* Zero */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 bg-neutral-50 hover:bg-neutral-900 hover:text-white transition-all text-lg font-black rounded-2xl flex items-center justify-center active:scale-95 text-[#1A1A18]"
          >
            0
          </button>

          {/* Delete Backspace */}
          <button
            onClick={handleDelete}
            className="h-14 bg-transparent hover:bg-neutral-50 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-2xl active:scale-95 text-neutral-400 hover:text-[#1A1A18]"
          >
            <Delete size={16} />
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
