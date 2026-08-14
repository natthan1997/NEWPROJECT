'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Navigation, Clock, CheckCircle2, 
  Search, Phone, RefreshCcw, Volume2, VolumeX, ExternalLink, MapPin, X,
  Package, ShoppingBag, ChevronDown
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import XYLLoader from '@/components/loaders/XYLLoader'
import { printOpenDrawer } from '@/lib/printerUtils'

export default function DeliveryManager({ unlockAudio, isAudioEnabled, variant = 'page', onClose, syncPulse, onStatusChange }: any) {
  const isDrawer = variant === 'drawer'
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const parseLegacyCoords = (comment?: string | null) => {
    if (!comment?.startsWith('COORD:')) return null

    const coordText = comment.replace('COORD:', '').trim()
    const [latText, lngText] = coordText.split(',')
    const latitude = Number(latText)
    const longitude = Number(lngText)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null
    }

    return { latitude, longitude }
  }

  const getNavigationTarget = (order: any) => {
    const structuredLatitude = Number(order.delivery_latitude)
    const structuredLongitude = Number(order.delivery_longitude)

    if (Number.isFinite(structuredLatitude) && Number.isFinite(structuredLongitude)) {
      return { latitude: structuredLatitude, longitude: structuredLongitude }
    }

    return parseLegacyCoords(order.comment)
  }

  const getDisplayComment = (comment?: string | null) => {
    if (!comment || comment.startsWith('COORD:')) return ''
    return comment
      .split('\n')
      .filter((line) => !/^\s*(เวลารับ|pickup\s*time)\s*:/i.test(line))
      .join('\n')
      .trim()
  }

  const getPickupTime = (comment?: string | null) => {
    if (!comment) return ''
    const pickupMatch = comment.match(/เวลารับ\s*:\s*([^\n]+)/i) || comment.match(/pickup\s*time\s*:\s*([^\n]+)/i)
    return pickupMatch?.[1]?.trim() || ''
  }

  const getStatusMeta = (status?: string) => {
    switch (status) {
      case 'shipping':
        return { label: 'กำลังส่ง', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      case 'preparing':
        return { label: 'กำลังเตรียม', className: 'bg-amber-100 text-amber-700 border-amber-200' }
      case 'accepted':
        return { label: 'รับออเดอร์', className: 'bg-sky-100 text-sky-700 border-sky-200' }
      case 'paid':
        return { label: 'จ่ายแล้ว', className: 'bg-violet-100 text-violet-700 border-violet-200' }
      case 'pending':
      default:
        return { label: 'รอรับออเดอร์', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
    }
  }
  
  // 🏢 Fetch Data (Force All Statuses except completed)
  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    const { data, error } = await supabase
      .from('pos_orders')
      .select('*, items:pos_order_items(*, item:pos_menu_items!item_id(*))')
      .in('order_type', ['delivery', 'takeaway'])
      .eq('order_source', 'liff')
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setOrders(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (syncPulse && syncPulse > 0) {
      fetchData(false)
    }
  }, [syncPulse])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('delivery-list-v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_orders' }, () => fetchData(false))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!orders.length) {
      setExpandedOrderId(null)
      return
    }

    if (expandedOrderId && !orders.some(order => order.id === expandedOrderId)) {
      setExpandedOrderId(null)
    }
  }, [expandedOrderId, orders])

  const [finishModalOrder, setFinishModalOrder] = useState<any | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash'|'transfer'|null>(null)
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('')
  const [isFinishing, setIsFinishing] = useState(false)

  const handleStatus = async (id: string, status: string) => {
    setIsLoading(true)
    await supabase.from('pos_orders').update({ status }).eq('id', id)
    const targetOrder = orders.find((order) => order.id === id)
    if (targetOrder?.line_user_id && targetOrder.order_source === 'liff') {
      fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetOrder.line_user_id,
          type: 'flex',
          orderData: {
            status,
            orderNumber: targetOrder.order_number,
            orderId: targetOrder.id,
            totalAmount: Number(targetOrder.net_total || targetOrder.total_amount || 0),
            deliveryFee: Number(targetOrder.delivery_fee || 0),
            items: (targetOrder.items || []).map((item: any) => {
              const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0;
              return {
                name: item.item?.name || item.name || 'Item',
                quantity: Number(item.quantity || 0),
                sale_price: Number(item.unit_price || 0) + modsPrice,
                selected_modifiers: item.selected_modifiers || [],
              }
            }),
          },
        }),
      }).catch((error) => console.error('Delivery LINE notify failed:', error))
    }
    fetchData()
    if (onStatusChange) {
      onStatusChange(id, status)
    }
  }

  const handleCompleteDelivery = async (method: 'cash' | 'transfer') => {
    if (!finishModalOrder || isFinishing) return
    setIsFinishing(true)
    
    const orderTotal = Number(finishModalOrder.net_total || finishModalOrder.total_amount || 0)
    const numCashReceived = Number(cashReceivedInput) || 0
    const cashChange = Math.max(0, numCashReceived - orderTotal)

    if (method === 'cash' && numCashReceived > 0 && numCashReceived < orderTotal) {
      alert('ยอดเงินรับมาน้อยกว่ายอดชำระ')
      setIsFinishing(false)
      return
    }

    try {
      const { data: existingPayments } = await supabase.from('pos_order_payments').select('id').eq('order_id', finishModalOrder.id)
      
      if (!existingPayments || existingPayments.length === 0) {
        await supabase.from('pos_order_payments').insert({
          order_id: finishModalOrder.id,
          payment_method: method,
          amount: orderTotal,
          received_amount: method === 'cash' && numCashReceived >= orderTotal ? numCashReceived : orderTotal,
          change_amount: method === 'cash' && numCashReceived >= orderTotal ? cashChange : 0,
          status: 'paid'
        })
        await supabase.from('pos_orders').update({ payment_method: method, paid_at: new Date().toISOString() }).eq('id', finishModalOrder.id)
        
        if (method === 'cash') {
          printOpenDrawer().catch(console.error)
        }
      }

      // 🎁 Award Loyalty Points
      try {
        const { data: shopSettingsData } = await supabase.from('pos_shop_settings').select('opening_hours').order('updated_at', { ascending: false }).limit(1).maybeSingle()
        const oh = shopSettingsData?.opening_hours || {}
        const earnThb = oh.loyalty_earn_thb !== undefined ? oh.loyalty_earn_thb : (oh.loyalty_earn_rate || 100)
        const earnPts = oh.loyalty_earn_pts !== undefined ? oh.loyalty_earn_pts : 1
        const deliveryFee = finishModalOrder.delivery_fee || 0
        const totalAmount = (finishModalOrder.net_total || finishModalOrder.total_amount || 0) - deliveryFee
        const pointsToEarn = earnThb > 0 ? Math.floor(totalAmount / earnThb) * earnPts : 0

        if (pointsToEarn > 0) {
          let memberId = finishModalOrder.customer_id
          
          if (!memberId && finishModalOrder.line_user_id) {
            const { data: memberData } = await supabase.from('pos_members').select('id').eq('line_user_id', finishModalOrder.line_user_id).maybeSingle()
            if (memberData?.id) memberId = memberData.id
          }
          
          if (!memberId && finishModalOrder.reference_name) {
            const { data: memberData } = await supabase.from('pos_members').select('id').eq('phone', finishModalOrder.reference_name).maybeSingle()
            if (memberData?.id) memberId = memberData.id
          }
          if (memberId) {
            const { error: rpcError } = await supabase.rpc('increment_member_points', {
              user_id: memberId,
              points_to_add: pointsToEarn,
            })
            
            if (rpcError) {
              await supabase.from('pos_orders').update({ 
                comment: `RPC Error: ${rpcError.message} (code: ${rpcError.code})` 
              }).eq('id', finishModalOrder.id)
            } else {
              const { error: insError } = await supabase.from('pos_points_history').insert({
                member_id: memberId,
                order_id: finishModalOrder.id,
                points: pointsToEarn,
                points_change: pointsToEarn,
                type: 'earn',
                description: `สะสมจากการสั่งซื้อ ${finishModalOrder.order_type === 'takeaway' ? 'Takeaway' : finishModalOrder.order_type === 'delivery' ? 'Delivery' : 'หน้าร้าน'} #${finishModalOrder.order_number}`,
              })
              
              if (insError) {
                await supabase.from('pos_orders').update({ 
                  comment: `Insert Error: ${insError.message} (code: ${insError.code})` 
                }).eq('id', finishModalOrder.id)
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to award points for delivery', err)
        await supabase.from('pos_orders').update({ 
          comment: `Catch Error: ${err.message || err}` 
        }).eq('id', finishModalOrder.id)
      }

      await handleStatus(finishModalOrder.id, 'completed')
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kickPOSDrawer', { detail: { method } }))
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setFinishModalOrder(null)
      setIsFinishing(false)
    }
  }

  // 🌍 Navigate Helper
  const openGoogleMaps = (order: any) => {
    const navigationTarget = getNavigationTarget(order)
    const url = navigationTarget
      ? `https://www.google.com/maps/dir/?api=1&destination=${navigationTarget.latitude},${navigationTarget.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`

    window.open(url, '_blank');
  }

  return (
    <div className={`flex flex-col overflow-hidden font-sans ${isDrawer ? 'h-full bg-[#F5F5F7]' : 'h-[calc(100vh-120px)] bg-[#F5F5F7]'}`}>
      
      {/* 🔝 PREMIUM HEADER */}
      <div className={`flex-none border-b border-gray-200/50 z-10 ${isDrawer ? 'px-6 pt-12 pb-6 bg-[#F5F5F7]' : 'px-8 py-6 bg-white shadow-sm'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`font-black text-[#1A1A18] flex items-center gap-4 ${isDrawer ? 'text-3xl' : 'text-2xl'}`}>
               <div className="w-14 h-14 bg-orange-50 text-orange-500 flex items-center justify-center rounded-2xl border border-orange-100 shadow-sm">
                 <Truck size={isDrawer ? 28 : 28} />
               </div>
               {isDrawer ? 'DELIVERY / TAKEAWAY' : 'DELIVERY MONITORING'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-4">
              {isDrawer ? 'จัดการออเดอร์เดลิเวอรี่และ Takeaway' : 'REAL-TIME ORDER STATUS'}
            </p>
          </div>
          <div className="flex gap-3">
              <button onClick={unlockAudio} className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all shadow-sm ${isAudioEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                  {isAudioEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
              <button onClick={fetchData} className={`flex items-center justify-center w-14 h-14 bg-white text-[#1A1A18] border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm`}>
                  <RefreshCcw size={22} className={isLoading ? 'animate-spin' : ''} />
              </button>
              {isDrawer && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-14 h-14 bg-[#1A1A18] text-white rounded-2xl hover:bg-black active:scale-95 transition-all shadow-xl shadow-black/20 ml-2"
                >
                  <X size={24} />
                </button>
              )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* 📋 LIST VIEW (NO MAP) */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isDrawer ? 'p-4 pb-24 flex flex-col gap-4' : 'p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
           {orders.length === 0 ? (
             <div className="col-span-full h-full flex flex-col items-center justify-center text-gray-300">
                <Package size={64} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">NO ACTIVE ORDERS</p>
             </div>
           ) : orders.map(order => {
            const statusMeta = getStatusMeta(order.status)
            const itemCount = (order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
            const isExpanded = expandedOrderId === order.id
            const note = getDisplayComment(order.comment)
            const pickupTime = getPickupTime(order.comment)
            const isTakeaway = order.order_type === 'takeaway'
            const orderTypeLabel = isTakeaway ? 'TAKEAWAY' : 'DELIVERY'

             if (isDrawer) {
               const canAcceptOrder = order.status === 'paid' || order.status === 'pending' || order.status === 'accepted'
               
               let displayStatus = 'PENDING'
               let statusClass = 'bg-gray-100 text-gray-500'
               if (order.status === 'preparing') { displayStatus = 'PREPARING'; statusClass = 'bg-amber-100 text-amber-700' }
               else if (order.status === 'shipping') { displayStatus = 'SHIPPING'; statusClass = 'bg-blue-100 text-blue-700' }
               else if (order.status === 'completed') { displayStatus = 'COMPLETED'; statusClass = 'bg-emerald-100 text-emerald-700' }

               return (
                  <div
                    key={order.id}
                    className="shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100 transition-all duration-300 flex flex-col mb-4"
                  >
                   {/* Header (Clickable) */}
                   <div
                     className="w-full p-5 sm:p-6 text-left transition-colors cursor-pointer active:bg-gray-50"
                     onClick={() => setExpandedOrderId(current => current === order.id ? null : order.id)}
                   >
                     <div className="flex items-start justify-between gap-3">
                       <div className="min-w-0 flex-1">
                         <div className="flex flex-wrap items-center gap-2 mb-3">
                           <span className="text-[11px] font-black tracking-widest text-[#1A1A18] uppercase">
                             #{order.order_number}
                           </span>
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isTakeaway ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                             {orderTypeLabel}
                           </span>
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusClass}`}>
                             {displayStatus}
                           </span>
                         </div>
                         <h3 className="truncate text-[22px] font-black text-[#1A1A18] uppercase tracking-tight leading-tight mb-1">
                           {order.customer_name || order.reference_name || 'GUEST'}
                         </h3>
                         {order.reference_name && (
                           <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                             <Phone size={14} />
                             <span className="text-[12px] font-bold">{order.reference_name}</span>
                           </div>
                         )}
                         <div className="mt-1 flex items-center gap-2">
                            <span className="text-[18px] font-black text-[#1A1A18]">฿{Number(order.net_total || order.total_amount || 0).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               • {itemCount} ITEM{itemCount > 1 ? 'S' : ''}
                            </span>
                         </div>
                       </div>
                       <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400">
                          <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                       </div>
                     </div>
                   </div>

                    {/* EXPANDED CONTENT */}
                    <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="border-t border-gray-100 overflow-hidden"
                      >
                         <div className="p-5 sm:p-6 space-y-4 bg-[#F9F9FB]">
                            {/* Delivery Address / Pickup info */}
                            {isTakeaway ? (
                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                 <div className="flex items-start gap-3">
                                   <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                     <Clock size={16} />
                                   </div>
                                   <div className="flex-1">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">PICKUP TIME</p>
                                     <p className="text-sm font-bold text-[#1A1A18]">
                                       {pickupTime || 'As soon as possible'}
                                     </p>
                                   </div>
                                 </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                 <div className="flex items-start gap-3">
                                   <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                     <MapPin size={16} />
                                   </div>
                                   <div className="flex-1">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">DELIVERY ADDRESS</p>
                                     <p className="text-sm font-bold text-[#1A1A18] leading-snug">
                                       {order.delivery_address || 'No address provided'}
                                     </p>
                                   </div>
                                 </div>
                              </div>
                            )}

                            {note && (
                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">CUSTOMER NOTE</p>
                                <p className="text-[13px] font-bold text-[#1A1A18] leading-snug">{note}</p>
                              </div>
                            )}
                            
                            {/* Items */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                               <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                 <ShoppingBag size={14} /> ORDER ITEMS
                               </div>
                               <div className="space-y-3">
                                 {(order.items || []).map((item: any, idx: number) => (
                                   <div key={idx} className="flex gap-3">
                                     <span className="text-[13px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg h-fit">
                                       {item.quantity}x
                                     </span>
                                     <div className="min-w-0 flex-1">
                                       <p className="text-[13px] font-bold leading-tight text-[#1A1A18]">
                                         {item.item?.name || item.name || 'Unknown Item'}
                                       </p>
                                       {item.selected_modifiers?.length > 0 && (
                                         <div className="mt-1.5 flex flex-col gap-1">
                                           {item.selected_modifiers.map((modifier: any, modifierIdx: number) => {
                                             const modifierLabel = modifier?.is_note
                                               ? `หมายเหตุ: ${modifier?.value || modifier?.name || ''}`
                                               : modifier?.value && modifier.value !== modifier.name
                                                 ? `${modifier.name}: ${modifier.value}`
                                                 : modifier?.name || ''
                                             if (!modifierLabel) return null
                                             return (
                                               <span key={modifierIdx} className="text-[11px] font-medium text-gray-500">
                                                 - {modifierLabel}
                                               </span>
                                             )
                                           })}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>

                         </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Action Buttons Always Visible */}
                    <div className="p-4 sm:p-5 bg-white border-t border-gray-100">
                       {(order.status === 'paid' || order.status === 'pending' || order.status === 'accepted') ? (
                         <button
                           onClick={() => handleStatus(order.id, 'preparing')}
                           className="w-full h-14 rounded-2xl bg-[#1A1A18] text-[12px] font-black uppercase tracking-[0.1em] text-white transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 hover:bg-black"
                         >
                           <CheckCircle2 size={18} /> ACCEPT & PREPARE
                         </button>
                       ) : order.status === 'preparing' ? (
                         <button
                           onClick={() => handleStatus(order.id, 'shipping')}
                           className="w-full h-14 rounded-2xl bg-blue-600 text-[12px] font-black uppercase tracking-[0.1em] text-white transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700"
                         >
                           <Truck size={18} /> DISPATCH ORDER
                         </button>
                       ) : (
                         <div className="grid grid-cols-2 gap-3">
                           <button
                             onClick={() => openGoogleMaps(order)}
                             className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gray-50 text-gray-700 text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.98] hover:bg-gray-100 border border-gray-200"
                           >
                             <Navigation size={16} /> MAPS
                           </button>
                           <button
                             onClick={() => setFinishModalOrder(order)}
                             className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.98] shadow-md shadow-emerald-500/20 hover:bg-emerald-600"
                           >
                             <CheckCircle2 size={16} /> FINISH
                           </button>
                         </div>
                       )}
                    </div>
                </div>
               )
             }

             // --- DESKTOP / PAGE VIEW ---
             return (
             <div 
               key={order.id}
               className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md"
             >
                <div className="flex justify-between items-start mb-5">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {orderTypeLabel}
                     </span>
                     <div className="bg-gray-100 text-gray-800 font-black rounded-xl uppercase px-3 py-1.5 text-[12px] w-fit">
                        #{order.order_number}
                     </div>
                   </div>
                   <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                     order.status === 'shipping' ? 'bg-blue-50 text-blue-600' : 
                     order.status === 'preparing' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                   }`}>
                      {order.status}
                   </div>
                </div>

                <div className="flex-1 mb-5">
                   <h2 className="text-[22px] font-black text-[#1A1A18] leading-tight mb-2 uppercase">{order.customer_name || 'Customer'}</h2>
                   {order.reference_name && (
                     <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                       <Phone size={14} />
                       <span className="text-[13px] font-bold">{order.reference_name}</span>
                     </div>
                   )}
                   <div className="flex items-start gap-2 text-gray-500 mb-4 bg-[#F5F5F7] p-3 rounded-2xl">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <div>
                        <p className="text-[13px] font-bold leading-snug">{order.delivery_address || 'No Address'}</p>
                        {getDisplayComment(order.comment) && (
                          <p className="mt-1.5 text-[11px] font-medium text-gray-500">
                            Note: {getDisplayComment(order.comment)}
                          </p>
                        )}
                        {getNavigationTarget(order) && (
                          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                            GPS READY
                          </p>
                        )}
                      </div>
                   </div>

                   {/* 📝 ORDER ITEMS */}
                   <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Items</div>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                           <span className="text-[13px] font-black text-[#1A1A18]">{item.quantity}x</span>
                           <div className="flex-1">
                              <p className="text-[13px] font-bold text-[#1A1A18] leading-tight">
                                {item.item?.name || item.name || 'Unknown Item'}
                              </p>
                              {item.selected_modifiers?.length > 0 && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  {item.selected_modifiers.map((m: any, mIdx: number) => (
                                    <span key={mIdx} className="text-[11px] font-medium text-gray-400 block">
                                       - {m.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* 🕹️ ACTIONS */}
                <div className="pt-4 border-t border-gray-100">
                   {order.status === 'paid' || order.status === 'pending' || order.status === 'accepted' ? (
                     <button 
                       onClick={() => handleStatus(order.id, 'preparing')}
                       className="w-full bg-[#1A1A18] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md h-14 text-[12px] hover:bg-black"
                     >
                        <CheckCircle2 size={18} /> ACCEPT & PREPARE
                     </button>
                   ) : order.status === 'preparing' ? (
                     <button 
                       onClick={() => handleStatus(order.id, 'shipping')}
                       className="w-full bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-500/20 h-14 text-[12px] hover:bg-blue-700"
                     >
                        <Truck size={18} /> START SHIPPING
                     </button>
                   ) : (
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => openGoogleMaps(order)}
                          className="bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:bg-gray-100 h-14"
                        >
                           <Navigation size={16} />
                           <span className="text-[9px]">G-MAPS</span>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPaymentMethod(null)
                            setCashReceivedInput('')
                            setFinishModalOrder(order)
                          }}
                          className="bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-emerald-500/20 hover:bg-emerald-600 h-14"
                        >
                           <CheckCircle2 size={16} />
                           <span className="text-[9px]">FINISH</span>
                        </button>
                     </div>
                   )}
                </div>
             </div>
             )
           })}
        </div>
      </div>

      <AnimatePresence>
        {finishModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center"
            >
              <ShoppingBag size={48} className="text-emerald-500 mb-6" />
              <h3 className="text-2xl font-black text-center mb-2 uppercase text-[#1A1A18]">
                รับชำระเงิน
              </h3>
              <p className="text-xs font-bold text-neutral-400 text-center mb-8 uppercase tracking-widest">
                เลือกรุปแบบการชำระเงินสำหรับออเดอร์นี้
              </p>
              
              <div className="w-full space-y-3">
                {!selectedPaymentMethod ? (
                  <>
                    <button
                      onClick={() => setSelectedPaymentMethod('cash')}
                      disabled={isFinishing}
                      className="w-full py-5 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      💵 เงินสด (CASH)
                    </button>
                    <button
                      onClick={() => handleCompleteDelivery('transfer')}
                      disabled={isFinishing}
                      className="w-full py-5 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      📱 โอนเงิน (TRANSFER)
                    </button>
                  </>
                ) : selectedPaymentMethod === 'cash' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-sm font-black text-emerald-700">ยอดที่ต้องชำระ</span>
                      <span className="text-2xl font-black text-emerald-700">฿{(finishModalOrder.net_total || finishModalOrder.total_amount || 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">฿</span>
                      <input
                        type="number"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                        placeholder="รับเงินมา (Received)"
                        className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-xl font-black text-[#1A1A18] outline-none focus:bg-white focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <button type="button" onClick={() => setCashReceivedInput(String(Math.ceil(finishModalOrder.net_total || finishModalOrder.total_amount || 0)))} className="h-12 border border-gray-200 bg-gray-50 hover:bg-[#1A1A18] hover:text-white rounded-xl transition-all text-xs font-black">พอดี</button>
                      <button type="button" onClick={() => setCashReceivedInput(prev => String(Number(prev || 0) + 100))} className="h-12 border border-gray-200 bg-gray-50 hover:bg-[#1A1A18] hover:text-white rounded-xl transition-all text-xs font-black">+100</button>
                      <button type="button" onClick={() => setCashReceivedInput(prev => String(Number(prev || 0) + 500))} className="h-12 border border-gray-200 bg-gray-50 hover:bg-[#1A1A18] hover:text-white rounded-xl transition-all text-xs font-black">+500</button>
                      <button type="button" onClick={() => setCashReceivedInput(prev => String(Number(prev || 0) + 1000))} className="h-12 border border-gray-200 bg-gray-50 hover:bg-[#1A1A18] hover:text-white rounded-xl transition-all text-xs font-black">+1000</button>
                    </div>

                    {Number(cashReceivedInput) > 0 && Number(cashReceivedInput) >= (finishModalOrder.net_total || finishModalOrder.total_amount || 0) && (
                      <div className="flex justify-between items-center bg-gray-100 p-4 border border-gray-200 rounded-2xl">
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-500">เงินทอน</span>
                        <span className="text-2xl font-black text-black">฿{(Number(cashReceivedInput) - (finishModalOrder.net_total || finishModalOrder.total_amount || 0)).toLocaleString()}</span>
                      </div>
                    )}

                    <button
                      disabled={isFinishing || !cashReceivedInput || Number(cashReceivedInput) < (finishModalOrder.net_total || finishModalOrder.total_amount || 0)}
                      onClick={() => handleCompleteDelivery('cash')}
                      className="w-full py-4 mt-2 bg-[#1A1A18] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFinishing ? 'กำลังบันทึก...' : 'ยืนยันรับชำระเงินสด'}
                    </button>
                    <button
                      onClick={() => setSelectedPaymentMethod(null)}
                      className="w-full py-3 text-xs font-black text-gray-400 hover:text-gray-600 transition-colors uppercase"
                    >
                      ย้อนกลับ
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => setFinishModalOrder(null)}
                disabled={isFinishing}
                className="mt-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-600 transition-colors"
              >
                ยกเลิก (CANCEL)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
