import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Trash2, RefreshCw, Printer, PencilLine, User, ChevronDown, ChevronUp, Filter, ShoppingBag, UtensilsCrossed, Truck, XCircle, Award } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import POSPinModal from './POSPinModal'
import { useI18n } from "@/lib/I18nContext";
import { printCustomerReceipt } from '@/lib/printerUtils'
import { printGraphicModeCustomerReceipt } from '@/lib/graphicPrinter'
import { fetchOrGenerateLoyaltyToken } from '@/lib/loyaltyUtils'
import POSHistoryPointsModal from './POSHistoryPointsModal'

export function getDeliveryPlatformBadge(platform?: string | null) {
  const p = (platform || '').toLowerCase().trim();

  if (p.includes('lineman') || p.includes('line_man') || p.includes('line man') || p === 'line') {
    return {
      label: 'LINE MAN',
      bgClass: 'bg-[#06C755]/10 text-[#06C755] border-[#06C755]/30',
      badgeClass: 'bg-[#06C755] text-white',
      dotClass: 'bg-[#06C755]',
      brandColor: '#06C755',
    }
  }

  if (p.includes('grab')) {
    return {
      label: 'GrabFood',
      bgClass: 'bg-[#00B14F]/10 text-[#00B14F] border-[#00B14F]/30',
      badgeClass: 'bg-[#00B14F] text-white',
      dotClass: 'bg-[#00B14F]',
      brandColor: '#00B14F',
    }
  }

  if (p.includes('shopee')) {
    return {
      label: 'ShopeeFood',
      bgClass: 'bg-[#EE4D2D]/10 text-[#EE4D2D] border-[#EE4D2D]/30',
      badgeClass: 'bg-[#EE4D2D] text-white',
      dotClass: 'bg-[#EE4D2D]',
      brandColor: '#EE4D2D',
    }
  }

  if (p.includes('robinhood') || p.includes('rbh')) {
    return {
      label: 'Robinhood',
      bgClass: 'bg-[#6C2278]/10 text-[#6C2278] border-[#6C2278]/30',
      badgeClass: 'bg-[#6C2278] text-white',
      dotClass: 'bg-[#6C2278]',
      brandColor: '#6C2278',
    }
  }

  if (p.includes('foodpanda') || p.includes('panda')) {
    return {
      label: 'Foodpanda',
      bgClass: 'bg-[#D70F64]/10 text-[#D70F64] border-[#D70F64]/30',
      badgeClass: 'bg-[#D70F64] text-white',
      dotClass: 'bg-[#D70F64]',
      brandColor: '#D70F64',
    }
  }

  return {
    label: platform ? platform.toUpperCase() : 'DELIVERY',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
    badgeClass: 'bg-amber-600 text-white',
    dotClass: 'bg-amber-500',
    brandColor: '#F59E0B',
  }
}

export default function POSHistory({ shopSettings, profile, activeShift, onSetView, fetchShiftStats, setViewExtraHeader }: any) {
    const { locale } = useI18n();
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinCallback, setPinCallback] = useState<(() => void) | null>(null)
  const [pinTitle, setPinTitle] = useState('')
  const [pinDesc, setPinDesc] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null)
  const [pointsOrderId, setPointsOrderId] = useState<any | null>(null)
  const [paymentEditOrder, setPaymentEditOrder] = useState<any | null>(null)
  const [paymentEditMethod, setPaymentEditMethod] = useState<string>('cash')
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('')
  const [paymentEditOpen, setPaymentEditOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterType, setFilterType] = useState<'all'|'store'|'delivery'|'cancelled'>('all')
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const fetchCompletedOrders = useCallback(async () => {
    setLoading(true)
    try {
      // Use local midnight as the start of today (handles timezone correctly)
      const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0)
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)
      
      const { data, error } = await supabase
        .from('pos_orders')
        .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status), customer:pos_members!customer_id(display_name, full_name, phone)')
        .in('status', ['paid', 'completed', 'cancelled'])
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return
      }

      if (data) {
        // Use shift branch_id first, fallback to shopSettings branch_id
        const branchId = activeShift?.branch_id || shopSettings?.branch_id
        const filtered = branchId
          ? data.filter(o => !o.branch_id || o.branch_id === branchId)
          : data
        setCompletedOrders(filtered)
      }
    } finally {
      setLoading(false)
    }
  }, [shopSettings?.branch_id, activeShift?.branch_id, selectedDate])

  // Always fetch when component mounts
  useEffect(() => {
    fetchCompletedOrders()
  }, [fetchCompletedOrders])

  // Realtime subscription for instant member & points updates
  useEffect(() => {
    const channel = supabase
      .channel('pos_history_realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_orders' }, () => {
        fetchCompletedOrders()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_qr_reward_tokens' }, () => {
        fetchCompletedOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCompletedOrders])

  // Inject header actions into global POS layout
  useEffect(() => {
    if (setViewExtraHeader) {
      setViewExtraHeader(
        <div className="flex items-center gap-2 sm:gap-3">
          <input 
            type="date" 
            value={selectedDate.toLocaleDateString('en-CA')}
            onChange={(e) => {
              if (e.target.value) {
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
              }
            }}
            className="appearance-none bg-transparent text-neutral-800 text-[10px] sm:text-[11px] font-black uppercase tracking-widest cursor-pointer focus:outline-none transition-all duration-200 border-none px-1 sm:px-3 w-[110px] sm:w-auto text-center"
          />
          <button
            onClick={fetchCompletedOrders}
            disabled={loading}
            className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 sm:px-4 text-[10px] font-black uppercase tracking-widest text-neutral-600 transition-all hover:bg-neutral-50 disabled:opacity-50 rounded-xl"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{locale === 'en' ? 'Refresh' : locale === 'zh' ? '刷新' : 'รีเฟรช'}</span>
          </button>
        </div>
      )
    }
    return () => {
      if (setViewExtraHeader) setViewExtraHeader(null)
    }
  }, [selectedDate, loading, locale, fetchCompletedOrders, setViewExtraHeader])

  const checkManagerPin = (
    onSuccessCallback: () => void,
    title = 'MANAGER AUTHORIZATION',
    desc = 'Please enter manager PIN to proceed'
  ) => {
    const requiredPin = shopSettings?.role_permissions?.manager_pin
    if (!requiredPin) {
      alert('ยังไม่ได้ตั้งรหัสผ่าน Manager PIN กรุณาไปตั้งค่าที่ Shop Settings')
      return
    }



    setPinTitle(title)
    setPinDesc(desc)
    setPinCallback(() => onSuccessCallback)
    setIsPinModalOpen(true)
  }

  const handleVoidCompletedOrder = async (order: any) => {
    checkManagerPin(async () => {
      const reason = window.prompt(locale === 'en' ? 'Please enter void reason (Required):' : locale === 'zh' ? '请输入取消原因（必填）：' : 'กรุณาระบุเหตุผลในการยกเลิกบิล (จำเป็นต้องระบุ):')
      if (!reason || reason.trim() === '') {
        alert(locale === 'en' ? 'Void reason is required' : locale === 'zh' ? '必须提供取消原因' : 'การยกเลิกบิลต้องระบุเหตุผลเสมอ')
        return
      }

      try {
        let { error } = await supabase
          .from('pos_orders')
          .update({ 
            status: 'cancelled', 
            updated_at: new Date().toISOString(),
            void_reason: reason.trim()
          })
          .eq('id', order.id)

        if (error && error.message.includes("Could not find the 'void_reason' column")) {
          const { error: fallbackError } = await supabase
            .from('pos_orders')
            .update({ 
              status: 'cancelled', 
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
            
          error = fallbackError
        }
        
        if (error) throw error

        const { data: movements } = await supabase
          .from('inventory_movements')
          .select('*')
          .eq('reference_id', order.id)
          .eq('reason', 'sale')
        
        if (movements && movements.length > 0) {
          const revertMovements = movements.map((m: any) => ({
            item_id: m.item_id,
            change_amount: Math.abs(m.change_amount),
            reason: 'void',
            reference_id: order.id,
          }))
          await supabase.from('inventory_movements').insert(revertMovements)
        }
        
        fetchCompletedOrders()
        alert('ยกเลิกบิลสำเร็จและคืนสต็อกเรียบร้อยแล้ว')
      } catch (e: any) {
        alert('ไม่สามารถยกเลิกบิลได้: ' + e.message)
      }
    }, 'ยกเลิกบิล (VOID ORDER)', 'จำเป็นต้องใช้รหัสผ่านผู้จัดการในการยกเลิกบิลที่ชำระเงินแล้ว')
  }

  const normalizePaymentMethod = (method?: string | null) => {
    const normalized = String(method || '').toLowerCase()
    if (normalized === 'cash' || normalized === 'cod') return 'cash'
    if (normalized === 'transfer' || normalized === 'bank_transfer') return 'transfer'
    if (normalized === 'card' || normalized === 'credit_card') return 'credit_card'
    if (normalized === 'promptpay' || normalized === 'qr') return 'promptpay'
    return normalized || 'cash'
  }

  const formatPaymentMethodLabel = (method?: string | null) => {
    const normalized = normalizePaymentMethod(method)
    if (normalized === 'cash') return 'เงินสด'
    if (normalized === 'transfer') return 'โอนเงิน'
    if (normalized === 'credit_card') return 'บัตรเครดิต'
    if (normalized === 'promptpay') return 'พร้อมเพย์'
    return method || 'ไม่ระบุ'
  }

  const getPaidAmount = (order: any) => {
    const paymentRows = Array.isArray(order.pos_order_payments) ? order.pos_order_payments : []
    const paidFromRows = paymentRows
      .filter((row: any) => String(row.status || '').toLowerCase() === 'paid')
      .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
    return paidFromRows > 0 ? paidFromRows : Number(order.net_total ?? order.total_amount ?? 0)
  }

  const getOrderPaymentMethod = (order: any) => {
    const paymentRows = Array.isArray(order.pos_order_payments) ? order.pos_order_payments : []
    const firstPaidMethod = paymentRows.find((row: any) => String(row.status || '').toLowerCase() === 'paid')?.payment_method
    return firstPaidMethod || order.payment_method || 'cash'
  }

  const buildPrintOrder = (order: any) => ({
    orderNumber: order.order_number,
    queueNumber: order.queue_number,
    date: new Date(order.created_at).toLocaleString('th-TH'),
    orderSource: order.order_source || 'pos',
    staffName: profile?.full_name || profile?.display_name || 'POS',
    customerName: order.customer_name || undefined,
    tableNumber: order.table_number || undefined,
    queueNumber: order.queue_number ? String(order.queue_number) : undefined,
    items: (order.pos_order_items || []).map((item: any) => ({
      name: item.item?.name || item.name || 'Unknown Item',
      quantity: Number(item.quantity || 0),
      subtotal: Number(item.subtotal || (Number(item.unit_price || 0) * Number(item.quantity || 0))),
      selected_modifiers: item.selected_modifiers || [],
    })),
    subtotal: Number(order.total_amount || 0),
    discount: Number(order.discount_amount || 0),
    tax: Number(order.tax_amount || 0),
    total: Number(order.net_total ?? order.total_amount ?? 0),
    paymentMethod: getOrderPaymentMethod(order),
    receivedAmount: getPaidAmount(order),
    changeAmount: Math.max(0, getPaidAmount(order) - Number(order.net_total ?? order.total_amount ?? 0)),
    orderType: order.order_type || 'dine_in',
    deliveryPlatform: order.delivery_platform || undefined,
    referenceName: order.reference_name || undefined,
    deliveryFee: Number(order.delivery_fee || 0),
    loyaltyClaimToken: order.loyalty_claim_token || undefined,
    pointsEarned: order.points_earned || undefined,
  })

  const handlePrintReceipt = async (order: any) => {
    const printers = Array.isArray(shopSettings?.printers) ? shopSettings.printers : []
    let receiptPrinters = printers.filter((p: any) => p?.type === 'receipt' || p?.type === 'both')
    if (receiptPrinters.length === 0) {
      receiptPrinters = printers.filter((p: any) => p?.type === 'kitchen' || p?.type === 'both')
    }
    if (receiptPrinters.length === 0) {
      const fallbackIp = typeof window !== 'undefined' ? localStorage.getItem('rushup_printer_ip') : ''
      if (!fallbackIp) {
        alert('ยังไม่พบเครื่องปริ้นใบเสร็จในระบบ')
        return
      }
      receiptPrinters.push({ ip: fallbackIp, model: 'xprinter-xp-n160ii', encoding: 'cp874' })
    }

    setPrintingOrderId(order.id)
    try {
      const orderData: any = buildPrintOrder(order)
      
      // Auto fetch/generate loyalty points claim token if non-member and points not earned yet
      if (order.id && !order.customer_id && !order.customer_name && (!order.points_earned || order.points_earned === 0)) {
        const netTotal = Number(order.net_total ?? order.total_amount ?? 0)
        const { token, points } = await fetchOrGenerateLoyaltyToken(order.id, netTotal, shopSettings)
        if (token) {
          orderData.loyaltyClaimToken = token
          orderData.pointsEarned = points
        }
      }

      const shopData = {
        name: shopSettings?.name || shopSettings?.branch_name || 'RUSH UP',
        branch: shopSettings?.branch_name || '',
        taxId: shopSettings?.tax_id || '',
        address: shopSettings?.address || '',
        phone: shopSettings?.phone || '',
        receiptHeader: shopSettings?.opening_hours?.receipt_header || shopSettings?.receipt_header || '',
        receiptFooter: shopSettings?.opening_hours?.receipt_footer || shopSettings?.receipt_footer || '',
        receiptFontSize: shopSettings?.receipt_font_size || 'normal',
        orderNumberFormat: shopSettings?.order_number_format || shopSettings?.opening_hours?.order_number_format,
        receipt_story_mode: shopSettings?.receipt_story_mode ?? shopSettings?.opening_hours?.receipt_story_mode ?? false,
        receipt_stories: (shopSettings?.receipt_stories && shopSettings.receipt_stories.length > 0)
          ? shopSettings.receipt_stories
          : (shopSettings?.opening_hours?.receipt_stories || []),
        receiptPaymentQrImage: shopSettings?.opening_hours?.receipt_payment_qr_image
          || shopSettings?.receipt_payment_qr_image
          || (shopSettings as any)?.receipt_payment_qr_image,
      }

      for (const printer of receiptPrinters) {
        if (!printer?.ip) continue
        if (printer.encoding === 'graphic') {
          await printGraphicModeCustomerReceipt(printer.ip, orderData, shopData, printer.model, printer.encoding)
        } else {
          await printCustomerReceipt(printer.ip, orderData, shopData, printer.model, printer.encoding)
        }
      }
    } catch (error: any) {
      console.error('Receipt reprint error:', error)
      alert(`ปริ้นใบเสร็จไม่สำเร็จ: ${error.message || 'unknown error'}`)
    } finally {
      setPrintingOrderId(null)
    }
  }

  const openPaymentEdit = (order: any) => {
    if (shopSettings?.opening_hours?.shift_settings?.edit_bill_only_in_open_shift !== false) {
      if (!activeShift?.id || order.shift_id !== activeShift.id) {
        alert(locale === 'en' ? 'Cannot edit payment for a closed shift. Please void the bill instead.' : 'ไม่สามารถแก้ไขบิลที่อยู่นอกเหนือจากกะปัจจุบันได้ (กะถูกปิดไปแล้ว) หากผิดพลาดกรุณาใช้วิธี Void (ยกเลิกบิล) แทน');
        return;
      }
    }
    setPaymentEditOrder(order)
    setPaymentEditMethod(normalizePaymentMethod(order.payment_method || getOrderPaymentMethod(order)))
    setCashReceivedInput('')
    setPaymentEditOpen(true)
  }

  const savePaymentEdit = async () => {
    if (!paymentEditOrder) return
    const paymentMethod = normalizePaymentMethod(paymentEditMethod)
    const orderTotal = paymentEditOrder.net_total || paymentEditOrder.total_amount || 0;
    const numCashReceived = Number(cashReceivedInput) || 0;
    const cashChange = Math.max(0, numCashReceived - orderTotal);

    if (paymentMethod === 'cash' && cashReceivedInput && numCashReceived < orderTotal) {
      alert('ยอดเงินรับมาน้อยกว่ายอดที่ต้องชำระ');
      return;
    }

    try {
      const { error: orderError } = await supabase
        .from('pos_orders')
        .update({
          payment_method: paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentEditOrder.id)
      if (orderError) throw orderError

      await supabase
        .from('pos_order_payments')
        .update({
          payment_method: paymentMethod,
          received_amount: paymentMethod === 'cash' && numCashReceived >= orderTotal ? numCashReceived : orderTotal,
          change_amount: paymentMethod === 'cash' && numCashReceived >= orderTotal ? cashChange : 0,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', paymentEditOrder.id)
      await fetchCompletedOrders()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kickPOSDrawer', { detail: { method: paymentMethod } }))
      }

      if (typeof window !== 'undefined' && activeShift?.id) {
        await supabase
          .from('pos_shifts')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeShift.id)

        window.dispatchEvent(new CustomEvent('rushup-pos-shift-refresh', {
          detail: { shiftId: activeShift.id },
        }))
        await new Promise(resolve => setTimeout(resolve, 300))
        if (typeof fetchShiftStats === 'function') {
          await fetchShiftStats(activeShift.id)
        }
      }
      setPaymentEditOpen(false)
      setPaymentEditOrder(null)
    } catch (error: any) {
      alert(`แก้ไขช่องทางชำระเงินไม่สำเร็จ: ${error.message}`)
    }
  }

  const validOrders = completedOrders.filter(o => o.status !== 'cancelled')
  const takeawayCount = validOrders.filter(o => o.order_type !== 'dine_in' && o.order_type !== 'delivery').length
  const dineInCount = validOrders.filter(o => o.order_type === 'dine_in').length
  const deliveryCount = validOrders.filter(o => o.order_type === 'delivery').length
  const cancelledCount = completedOrders.filter(o => o.status === 'cancelled').length

  return (
    <div className="flex h-full flex-col bg-white text-[#1A1A18] selection:bg-emerald-100 font-sans">

      <div className="flex-1 overflow-y-auto px-6 py-6">
        
        {!loading && (
          <div className="flex items-center gap-4 sm:gap-8 border-b border-neutral-200/70 mb-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                filterType === 'all'
                  ? 'border-[#D3202B] text-[#1A1A18]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span>{locale === 'en' ? 'All Orders' : 'ออเดอร์ทั้งหมด'}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${filterType === 'all' ? 'bg-[#D3202B] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {completedOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('takeaway')}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                filterType === 'takeaway'
                  ? 'border-[#D3202B] text-[#1A1A18]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span>{locale === 'en' ? 'Takeaway' : 'กลับบ้าน'}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${filterType === 'takeaway' ? 'bg-[#D3202B] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {takeawayCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('dine_in')}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                filterType === 'dine_in'
                  ? 'border-[#D3202B] text-[#1A1A18]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span>{locale === 'en' ? 'Dine-in' : 'ทานที่ร้าน'}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${filterType === 'dine_in' ? 'bg-[#D3202B] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {dineInCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('delivery')}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                filterType === 'delivery'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-neutral-400 hover:text-amber-700'
              }`}
            >
              <span>{locale === 'en' ? 'Delivery' : 'เดลิเวอรี'}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${filterType === 'delivery' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}>
                {deliveryCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('cancelled')}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                filterType === 'cancelled'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-neutral-400 hover:text-rose-700'
              }`}
            >
              <span>{locale === 'en' ? 'Cancelled' : 'ยกเลิก'}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${filterType === 'cancelled' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}>
                {cancelledCount}
              </span>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <RefreshCw size={32} className="mb-4 animate-spin opacity-50" />
            <p className="text-[12px] font-black uppercase tracking-widest">{locale === 'en' ? 'Loading...' : locale === 'zh' ? '加载中...' : 'กำลังโหลด...'}</p>
          </div>
        )}
        {!loading && completedOrders.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {completedOrders
              .filter(o => {
                if (filterType === 'cancelled') return o.status === 'cancelled'
                if (filterType === 'takeaway') return o.order_type !== 'dine_in' && o.order_type !== 'delivery' && o.status !== 'cancelled'
                if (filterType === 'dine_in') return o.order_type === 'dine_in' && o.status !== 'cancelled'
                if (filterType === 'delivery') return o.order_type === 'delivery' && o.status !== 'cancelled'
                return true
              })
              .map((order, idx) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <div key={order.id} className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'bg-white p-5 sm:p-7 rounded-[1.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] ring-1 ring-black/5 my-4 relative z-10' : 'py-5 border-b border-neutral-100 hover:bg-neutral-50/50'}`}>
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="flex justify-between items-start cursor-pointer select-none gap-3 w-full"
                  >
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[16px] sm:text-[18px] font-black uppercase tracking-tight text-black truncate">
                          {order.order_type === 'dine_in' && order.table_number ? `โต๊ะ ${order.table_number}` : `#${String(order.queue_number || 0).padStart(3, '0')}`}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                            order.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {order.status === 'cancelled' ? (locale === 'en' ? 'CANCELLED' : 'ยกเลิก') : (locale === 'en' ? 'COMPLETED' : 'สำเร็จ')}
                        </span>
                        {order.order_number ? (
                          <span className="text-[11px] font-bold text-neutral-400 whitespace-nowrap">
                            {order.order_number}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600">
                          {order.order_type === 'dine_in' ? 'ทานที่ร้าน' : order.order_type === 'delivery' ? 'จัดส่ง' : 'กลับบ้าน'}
                        </span>

                        {(order.customer || order.customer_name || (order.points_earned && order.points_earned > 0)) ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                            <User size={10} /> {order.customer?.full_name || order.customer?.display_name || order.customer?.phone || order.customer_name || 'สมาชิก'}
                            {order.points_earned ? ` (+${order.points_earned} PTS)` : ''}
                          </span>
                        ) : null}

                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600">
                          {formatPaymentMethodLabel(getOrderPaymentMethod(order))}
                        </span>

                        {order.order_type === 'delivery' && order.delivery_platform && (() => {
                          const badge = getDeliveryPlatformBadge(order.delivery_platform);
                          return (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${badge.bgClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                              {badge.label}
                            </span>
                          );
                        })()}
                        
                        {order.order_source === 'liff' && Number(order.delivery_fee || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                            ส่ง ฿{Number(order.delivery_fee).toLocaleString()}
                          </span>
                        )}
                        {order.reference_name && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
                            #{order.reference_name}
                          </span>
                        )}
                        {order.promo_code && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                            {order.promo_code}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[11px] font-bold text-neutral-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('th-TH', { 
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch shrink-0 min-h-[4rem]">
                      <div className="text-right">
                        <span className={`text-[16px] sm:text-[20px] font-black tracking-tight ${order.status === 'cancelled' ? 'text-neutral-300 line-through' : 'text-black'}`}>
                          {locale === 'en' ? '฿' : '฿'}{(Number(order.net_total ?? order.total_amount)).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-neutral-400 bg-neutral-50 p-1.5 sm:p-2 rounded-full hover:bg-neutral-100 transition-colors mt-auto">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                      {order.status === 'cancelled' && order.void_reason && (
                        <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-[13px] flex items-start gap-2">
                          <span className="font-bold whitespace-nowrap">{locale === 'en' ? 'Void Reason:' : 'เหตุผลที่ยกเลิก:'}</span>
                          <span>{order.void_reason}</span>
                        </div>
                      )}
                      <div className="space-y-3 mb-6">
                        {order.pos_order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start py-1 text-[14px]">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="text-[13px] font-black text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md">{item.quantity}x</span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-neutral-800 uppercase tracking-tight leading-tight">{item.item?.name || 'Unknown Item'}</h4>
                                {item.note && <p className="mt-1 text-[12px] font-semibold text-neutral-400 leading-snug">หมายเหตุ: {item.note}</p>}
                                {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                                  <p className="mt-1 text-[12px] font-semibold text-neutral-400 leading-snug">
                                    {item.selected_modifiers.map((m: any) => m?.is_note ? `หมายเหตุ: ${m?.value || m?.name || ''}` : (m?.value && m.value !== m.name ? `${m.name}: ${m.value}` : m?.name || '')).filter(Boolean).join(', ')}
                                  </p>
                                )}
                                {Number(item.discount_amount) > 0 && (
                                  <p className="mt-1 text-[12px] font-bold text-red-500 leading-snug flex items-center gap-1">
                                    ส่วนลด: -฿{Number(item.discount_amount).toLocaleString()}
                                    {item.discount_reason && (
                                      <span className="text-[10px] bg-red-100/50 text-red-600 px-1.5 py-0.5 rounded ml-1 uppercase tracking-widest">{item.discount_reason}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-black text-neutral-900 ml-4">
                              {locale === 'en' ? '฿' : '฿'}{(Number(item.subtotal) || (Number(item.unit_price) * Number(item.quantity)) || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2 font-bold text-[12px] text-neutral-500 max-w-sm ml-auto">
                        <div className="flex justify-between">
                          <span>{locale === 'en' ? 'Subtotal' : 'ยอดรวม'}</span>
                          <span>{locale === 'en' ? '฿' : '฿'}{(Number(order.total_amount)).toLocaleString()}</span>
                        </div>
                        {Number(order.discount_amount) > 0 && (
                          <div className="flex justify-between text-red-500">
                            <span className="flex items-center gap-1 flex-wrap">
                              {locale === 'en' ? 'Discount' : 'ส่วนลด'}
                              {order.promo_code ? (
                                <span className="text-[10px] bg-red-100/50 text-red-600 px-1.5 py-0.5 rounded ml-1 font-black uppercase tracking-widest">{order.promo_code}</span>
                              ) : (
                                <span className="text-[10px] bg-red-100/50 text-red-600 px-1.5 py-0.5 rounded ml-1 font-black uppercase tracking-widest">โปรโมชั่น/ส่วนลด</span>
                              )}
                            </span>
                            <span>{locale === 'en' ? '- ฿' : '- ฿'}{(Number(order.discount_amount)).toLocaleString()}</span>
                          </div>
                        )}
                        {Number(order.service_charge_amount) > 0 && (
                          <div className="flex justify-between">
                            <span>Service Charge</span>
                            <span>{locale === 'en' ? '฿' : '฿'}{(Number(order.service_charge_amount)).toLocaleString()}</span>
                          </div>
                        )}
                        {Number(order.tax_amount) > 0 && (
                          <div className="flex justify-between">
                            <span>VAT</span>
                            <span>{locale === 'en' ? '฿' : '฿'}{(Number(order.tax_amount)).toLocaleString()}</span>
                          </div>
                        )}
                        {order.order_source === 'liff' && Number(order.delivery_fee) > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>ค่าส่ง / Delivery Fee</span>
                            <span>{locale === 'en' ? '฿' : '฿'}{Number(order.delivery_fee).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-5 mt-5 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider leading-none mb-1">{locale === 'en' ? 'Net Total' : 'ยอดสุทธิ'}</span>
                          <span className="text-[24px] font-black tracking-tight text-black">{locale === 'en' ? '฿' : '฿'}{(Number(order.net_total ?? order.total_amount)).toLocaleString()}</span>
                          {Number(order.delivery_gp_amount) > 0 && order.status !== 'cancelled' && (() => {
                            const badge = getDeliveryPlatformBadge(order.delivery_platform);
                            return (
                              <div className="text-[12px] font-black text-red-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                <span>หัก GP <strong style={{ color: badge.brandColor }}>{badge.label}</strong>: -฿{Number(order.delivery_gp_amount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                <span className="text-emerald-600 font-extrabold ml-2">รับจริง: ฿{(Number(order.net_total ?? order.total_amount) - Number(order.delivery_gp_amount)).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintReceipt(order) }}
                            disabled={printingOrderId === order.id}
                            className="flex-1 sm:flex-none h-12 px-5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Printer size={16} className={printingOrderId === order.id ? 'animate-pulse' : ''} /> 
                            {locale === 'en' ? 'Print' : 'พิมพ์บิล'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              checkManagerPin(
                                () => {
                                  setPaymentEditOrder(order)
                                  setPaymentEditMethod(getPaymentMethodValue(order))
                                  setCashReceivedInput('')
                                  setPaymentEditOpen(true)
                                },
                                'แก้ไขช่องทางชำระเงิน',
                                'กรุณาใส่รหัสผู้จัดการเพื่อแก้ไขรูปแบบการชำระเงิน'
                              )
                            }}
                            className="flex-1 sm:flex-none h-12 px-5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <PencilLine size={16} />
                            {locale === 'en' ? 'Edit Pay' : 'แก้ชำระ'}
                          </button>

                          {!order.customer_id && !order.customer_name && (!order.points_earned || order.points_earned === 0) && order.status !== 'cancelled' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPointsOrderId(order); }}
                              className="flex-1 sm:flex-none h-12 px-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                              title="เลือกสะสมแต้มผ่าน QR Code หรือกรอกเบอร์โทร"
                            >
                              <Award size={16} />
                              สะสมแต้ม
                            </button>
                          )}
                          
                          {order.status !== 'cancelled' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVoidCompletedOrder(order) }}
                              className="flex-1 sm:flex-none h-12 px-5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[12px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 size={16} />
                              {locale === 'en' ? 'Void' : 'ยกเลิกบิล'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
        {!loading && completedOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <Receipt size={48} className="mb-4 opacity-50 text-neutral-300" />
            <p className="text-[12px] font-black uppercase tracking-widest text-neutral-400">
              {locale === 'en' ? 'No Order History' : 'ไม่พบประวัติการขายวันนี้'}
            </p>
            <button
              onClick={fetchCompletedOrders}
              className="mt-6 flex items-center gap-2 border border-neutral-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-all rounded-xl"
            >
              <RefreshCw size={12} /> {locale === 'en' ? 'Refresh' : 'โหลดใหม่อีกครั้ง'}
            </button>
          </div>
        )}
      </div>

      <POSPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false)
          setPinCallback(null)
        }}
        onSuccess={() => {
          if (pinCallback) pinCallback()
        }}
        correctPin={shopSettings?.role_permissions?.manager_pin || ''}
        title={pinTitle}
        description={pinDesc}
      />

      {paymentEditOpen && paymentEditOrder && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentEditOpen(false)} />
          <div className="relative w-full max-w-md rounded-none border border-black bg-[#fcfcf9] p-6 shadow-none">
            <div className="mb-5">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A18]">Payment Method</div>
              <h3 className="mt-2 text-2xl font-black text-[#1A1A18] uppercase tracking-tighter">แก้ไขช่องทางชำระเงิน</h3>
              <p className="mt-2 text-sm font-bold text-gray-500">
                {paymentEditOrder.order_number} · {paymentEditOrder.customer_name || paymentEditOrder.reference_name || 'Guest'}
              </p>
            </div>

            <div className="space-y-3">
              <select
                value={paymentEditMethod}
                onChange={(e) => setPaymentEditMethod(e.target.value)}
                className="h-14 w-full rounded-none border border-black bg-white px-4 text-base font-black text-[#1A1A18] outline-none focus:bg-white"
              >
                <option value="cash">เงินสด</option>
                <option value="transfer">โอนเงิน</option>
                <option value="credit_card">บัตรเครดิต</option>
                <option value="promptpay">พร้อมเพย์</option>
              </select>

              {paymentEditMethod === 'cash' && (
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">฿</span>
                    <input
                      type="number"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      placeholder="รับเงินมา (Received)"
                      className="h-14 w-full rounded-none border border-black bg-white pl-10 pr-4 text-xl font-black text-[#1A1A18] outline-none focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button type="button" onClick={() => setCashReceivedInput(String(Math.ceil(paymentEditOrder.net_total || paymentEditOrder.total_amount || 0)))} className="h-12 border border-black bg-white hover:bg-black hover:text-white transition-all text-xs font-black">พอดี</button>
                    <button type="button" onClick={() => setCashReceivedInput(prev => String(Number(prev || 0) + 100))} className="h-12 border border-black bg-white hover:bg-black hover:text-white transition-all text-xs font-black">+100</button>
                    <button type="button" onClick={() => setCashReceivedInput(prev => String(Number(prev || 0) + 500))} className="h-12 border border-black bg-white hover:bg-black hover:text-white transition-all text-xs font-black">+500</button>
                    <button type="button" onClick={() => setCashReceivedInput(prev => String(Number(prev || 0) + 1000))} className="h-12 border border-black bg-white hover:bg-black hover:text-white transition-all text-xs font-black">+1000</button>
                  </div>
                  {Number(cashReceivedInput) > 0 && Number(cashReceivedInput) >= (paymentEditOrder.net_total || paymentEditOrder.total_amount || 0) && (
                    <div className="flex justify-between items-center bg-emerald-50 text-emerald-700 p-4 border border-emerald-200 mt-2">
                      <span className="text-sm font-bold uppercase tracking-widest">เงินทอน</span>
                      <span className="text-2xl font-black">฿{(Number(cashReceivedInput) - (paymentEditOrder.net_total || paymentEditOrder.total_amount || 0)).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={savePaymentEdit}
                className="w-full rounded-none border border-black bg-[#D3202B] py-4 text-[12px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-black"
              >
                บันทึกการเปลี่ยนแปลง
              </button>

              <button
                type="button"
                onClick={() => setPaymentEditOpen(false)}
                className="w-full border border-black bg-white py-4 text-[12px] font-black uppercase tracking-[0.2em] text-[#1A1A18] hover:bg-gray-100"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {pointsOrderId && (
        <POSHistoryPointsModal
          order={pointsOrderId}
          shopSettings={shopSettings}
          onClose={() => setPointsOrderId(null)}
          onSuccess={() => {
            setPointsOrderId(null)
            fetchCompletedOrders()
          }}
        />
      )}

    </div>
  )
}
