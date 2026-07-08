'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { db } from '@/lib/offlineDatabase'

export default function POSOfflineSync({ isDark = false, className = '' }: { isDark?: boolean, className?: string }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Update online status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Count pending offline orders
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await db.offline_orders.where('syncStatus').equals('pending').count()
      setPendingCount(count)
    } catch (err) {
      console.error('Error counting pending orders', err)
    }
  }, [])

  useEffect(() => {
    updatePendingCount()
    // Setup interval to check pending count
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [updatePendingCount])

  // Sync menu down from Supabase
  const syncMenuDown = async () => {
    try {
      // Fetch all required data
      const [
        { data: categories },
        { data: items },
        { data: modifierGroups },
        { data: modifiers },
        { data: links }
      ] = await Promise.all([
        supabase.from('pos_menu_categories').select('*'),
        supabase.from('pos_menu_items').select('*').eq('is_active', true),
        supabase.from('pos_menu_modifier_groups').select('*'),
        supabase.from('pos_menu_modifiers').select('*').eq('is_active', true),
        supabase.from('pos_item_modifier_links').select('*')
      ])

      // Clear existing and rewrite
      await db.transaction('rw', db.menu_categories, db.menu_items, db.modifier_groups, db.modifiers, db.item_modifier_links, async () => {
        await db.menu_categories.clear()
        if (categories) await db.menu_categories.bulkAdd(categories)

        await db.menu_items.clear()
        if (items) await db.menu_items.bulkAdd(items)

        await db.modifier_groups.clear()
        if (modifierGroups) await db.modifier_groups.bulkAdd(modifierGroups)

        await db.modifiers.clear()
        if (modifiers) await db.modifiers.bulkAdd(modifiers)

        await db.item_modifier_links.clear()
        if (links) await db.item_modifier_links.bulkAdd(links.map(l => ({ item_id: l.item_id, group_id: l.group_id })))
      })
      
      console.log('Menu synced down to local DB successfully')
    } catch (error) {
      console.error('Failed to sync menu down', error)
      throw error
    }
  }

  // Sync orders up to Supabase
  const syncOrdersUp = async () => {
    const pendingOrders = await db.offline_orders.where('syncStatus').equals('pending').toArray()
    if (pendingOrders.length === 0) return

    for (const order of pendingOrders) {
      try {
        const payload = order.payload
        
        // This is a simplified insert. In reality, it should call an API endpoint or insert into multiple tables.
        // We will call the backend API /api/pos/checkout to handle the transaction securely if it exists,
        // or just insert directly via Supabase. For this example, assuming the POS component 
        // does multiple inserts. We should wrap that logic in a unified API route, but for now:
        const { order: orderData, items, payments } = payload
        
        // Insert Order
        const { error: orderError } = await supabase.from('pos_orders').insert(orderData)
        if (orderError) throw orderError

        // Insert Items
        if (items && items.length > 0) {
          const { error: itemsError } = await supabase.from('pos_order_items').insert(items)
          if (itemsError) throw itemsError
        }

        // Insert Payments
        if (payments && payments.length > 0) {
          const { error: paymentsError } = await supabase.from('pos_order_payments').insert(payments)
          if (paymentsError) throw paymentsError
        }
        
        // Mark as synced
        await db.offline_orders.update(order.id, { syncStatus: 'synced' })
      } catch (err: any) {
        console.error(`Failed to sync order ${order.id}:`, err)
        await db.offline_orders.update(order.id, { syncStatus: 'error', errorMessage: err.message })
      }
    }
    await updatePendingCount()
  }

  const handleSync = async () => {
    if (!isOnline) return
    setIsSyncing(true)
    setErrorMsg('')
    try {
      await syncMenuDown()
      await syncOrdersUp()
      setLastSync(new Date())
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync()
    }
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex items-center justify-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all ${isDark ? 'bg-white/5 border border-white/10' : 'bg-[#E5E5DF]/30 border border-[#E5E5DF]'} ${className}`}>
      {isOnline ? (
        <div className="text-green-500 flex items-center justify-center" title="Online">
          <Wifi className="w-3.5 h-3.5" />
        </div>
      ) : (
        <div className="text-red-500 flex items-center justify-center" title="Offline">
          <WifiOff className="w-3.5 h-3.5" />
        </div>
      )}
      
      <div className={`w-px h-3 ${isDark ? 'bg-white/20' : 'bg-black/10'}`} />

      {pendingCount > 0 ? (
        <div className="relative text-yellow-500 flex items-center justify-center" title={`${pendingCount} รอซิงค์`}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
          </span>
        </div>
      ) : (
        <div className="text-green-500 flex items-center justify-center" title={`ซิงค์ล่าสุด ${lastSync ? lastSync.toLocaleTimeString('th-TH') : 'เพิ่งซิงค์'}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      )}
      
      {isOnline && (
        <>
          <div className={`w-px h-3 ${isDark ? 'bg-white/20' : 'bg-black/10'}`} />
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-1 -m-1 rounded-sm transition-colors flex items-center justify-center ${isDark ? 'hover:bg-white/20 text-white/60 hover:text-white' : 'hover:bg-black/10 text-black/50 hover:text-black'} ${isSyncing ? 'animate-spin opacity-50' : ''}`}
            title="บังคับซิงค์ข้อมูล"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
