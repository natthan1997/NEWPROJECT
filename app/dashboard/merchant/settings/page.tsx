'use client';
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import POSShopSettings from '@/components/pos/POSShopSettings'
import RUSHUPLoader from '@/components/loaders/RUSHUPLoader'

export default function MerchantSettingsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [shopSettings, setShopSettings] = useState<any>(null)
  const [extraHeader, setExtraHeader] = useState<React.ReactNode>(null)

  useEffect(() => {
    if (profile?.merchant_id) {
      fetchShopSettings()
    }
  }, [profile])

  const fetchShopSettings = async () => {
    setLoading(true)
    try {
      // 1. Fetch the first branch of the merchant
      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('merchant_id', profile!.merchant_id)
        .order('branch_code', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (branch) {
        // 2. Fetch or create shop settings for this branch
        const { data: settings } = await supabase
          .from('pos_shop_settings')
          .select('*')
          .eq('branch_id', branch.id)
          .maybeSingle()

        if (settings) {
          setShopSettings(settings)
        } else {
          // Fallback creation
          const { data: newSettings } = await supabase
            .from('pos_shop_settings')
            .insert([{ branch_id: branch.id, name: 'สำนักงานใหญ่', is_open: true, status: 'open' }])
            .select()
            .single()
          setShopSettings(newSettings)
        }
      }
    } catch (err) {
      console.error('Error fetching merchant settings shop settings:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !shopSettings) {
    return <RUSHUPLoader tagline="กำลังเตรียมเครื่องมือตั้งค่าร้านค้า..." />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 block mb-1">
            Store Profile
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            ตั้งค่าข้อมูลร้านค้า & ข้อมูลสาขา
          </h1>
          <p className="text-[11px] text-zinc-400 font-bold mt-0.5">
            กำหนดหัว/ท้ายใบเสร็จรับเงิน, เลขผู้เสียภาษี, โลโก้ และตั้งค่าเชื่อมต่อเครื่องพิมพ์ Thermal Printers
          </p>
        </div>
        <div className="shrink-0">{extraHeader}</div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden p-6">
        <POSShopSettings
          profile={profile}
          activeView="settings"
          allowedNav={[]}
          onSetView={() => {}}
          setViewExtraHeader={setExtraHeader}
          shopSettings={shopSettings}
          onSettingsUpdate={fetchShopSettings}
        />
      </div>
    </div>
  )
}
