'use client'

import { useI18n } from '@/lib/I18nContext'
import { Store, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/supabaseClient'

export default function PosSettingsPage() {
  const { locale } = useI18n()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const p = await getUserProfile()
      setProfile(p)
    }
    init()
  }, [])

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100"
      >
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-black mb-4">
          {locale === 'en' ? 'Settings Moved' : locale === 'zh' ? 'Settings Moved' : 'ย้ายการตั้งค่าแล้ว'}
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {locale === 'en' 
            ? 'The POS & Operational Settings have been consolidated into the POS system to prevent redundancy and keep all settings in one place.' 
            : locale === 'zh' 
            ? 'The POS & Operational Settings have been consolidated into the POS system to prevent redundancy and keep all settings in one place.' 
            : 'การตั้งค่าร้านและเดลิเวอรี่ทั้งหมด ได้ถูกย้ายไปรวมไว้ในหน้าต่าง "ตั้งค่า" ของระบบ POS แล้ว เพื่อลดความซ้ำซ้อนและให้พนักงานจัดการจบได้ในที่เดียว'}
        </p>

        <Link 
          href="/dashboard/pos"
          className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full"
        >
          {locale === 'en' ? 'Open POS System' : locale === 'zh' ? 'Open POS System' : 'เข้าสู่ระบบ POS'}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  )
}
