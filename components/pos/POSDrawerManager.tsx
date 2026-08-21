'use client';
import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, Search, Edit3, Trash2, Loader2, 
  ChevronRight, Save, LayoutGrid, X,
  Menu as MenuIcon, LogOut, Settings, Wallet,
  ArrowDownLeft, ArrowUpRight, History, Banknote,
  Receipt, Landmark, Printer, ShieldCheck, RefreshCcw,
  AlertTriangle, ArrowRight, Users, Calendar, ChevronDown, ChevronsRight, Delete
} from 'lucide-react'
import { useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Capacitor } from '@capacitor/core'
import { printOpenDrawer } from '@/lib/printerUtils'
import { printGraphicModeZReport } from '@/lib/graphicPrinter'
import { playAppSound } from '@/lib/audioUtils';
import { useI18n } from "@/lib/I18nContext";

interface POSDrawerManagerProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onShiftModalOpen?: () => void
  activeShift: any
  shiftStats: any
  onOpenShift: (cash: number) => Promise<void> | void
  onCloseShift: (cash: number) => Promise<void> | void
  fetchShiftStats: (id: string) => void
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings: any
  setEditingOrderId?: (id: string | null) => void
  setEditingOrderNumber?: (no: string | null) => void
  setSelectedTable?: (table: any | null) => void
  renderPart?: 'left' | 'right'
}

export default function POSDrawerManager({ 
  profile, activeView, allowedNav, onSetView, onShiftModalOpen, 
  activeShift, shiftStats, onOpenShift, onCloseShift, fetchShiftStats, setViewExtraHeader,
  shopSettings, setEditingOrderId, setEditingOrderNumber, setSelectedTable,
  renderPart
}: POSDrawerManagerProps) {
    const { locale } = useI18n();
  const [openingCash, setOpeningCash] = useState(0)
  const [closingCash, setClosingCash] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [isClosingShift, setIsClosingShift] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isOpeningDrawerForShift, setIsOpeningDrawerForShift] = useState(false)
  const [transactionModal, setTransactionModal] = useState<{
    open: boolean
    type: 'pay_in' | 'pay_out' | null
    amount: string
    reason: string
  }>({
    open: false,
    type: null,
    amount: '',
    reason: '',
  })
  
  const [shiftBlocker, setShiftBlocker] = useState<{
    open: boolean;
    type: 'unpaid' | 'ghost' | null;
    orders: any[];
  }>({
    open: false,
    type: null,
    orders: []
  })
  
  // Sync shift blocker between left and right instances
  useEffect(() => {
    const handleSync = (e: any) => setShiftBlocker(e.detail)
    window.addEventListener('sync-shift-blocker', handleSync)
    return () => window.removeEventListener('sync-shift-blocker', handleSync)
  }, [])

  const handleSetShiftBlocker = (data: any) => {
    setShiftBlocker(data)
    window.dispatchEvent(new CustomEvent('sync-shift-blocker', { detail: data }))
  }
  
  // History Mode State
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current')
  const [historyDate, setHistoryDate] = useState<Date>(new Date())
  const [historyShifts, setHistoryShifts] = useState<any[]>([])
  const [selectedHistoryShiftId, setSelectedHistoryShiftId] = useState<string | null>(null)
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([])
  const [historyStats, setHistoryStats] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const getLocalDayBounds = () => {
    const now = new Date()
    const businessDay = now.getHours() < 4 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now
    const start = new Date(businessDay.getFullYear(), businessDay.getMonth(), businessDay.getDate(), 4, 0, 0, 0)
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    return { start, end }
  }

  // Attendance Summary State
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null)
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false)

  const fetchAttendanceSummary = async () => {
    setIsFetchingAttendance(true)
    try {
      const branchId = shopSettings?.branch_id || activeShift?.branch_id || ''
      const branchParam = branchId ? `?branch_id=${branchId}` : ''
      const res = await fetch(`/api/pos/shifts/check-eligibility${branchParam}`, { method: 'GET' })
      const data = await res.json()
      if (data && data.success) {
        setAttendanceSummary(data)
      }
    } catch (e) {
      console.error('Fetch attendance summary error:', e)
    } finally {
      setIsFetchingAttendance(false)
    }
  }

  useEffect(() => {
    fetchAttendanceSummary()
    if (activeShift) {
        fetchTransactions()
        fetchShiftStats(activeShift.id)
    } else {
        const defaultCash = shopSettings?.opening_hours?.shift_settings?.default_start_cash || 0;
        setOpeningCash(defaultCash);
    }
  }, [activeShift, shopSettings?.branch_id, shopSettings?.opening_hours?.shift_settings?.default_start_cash])

  useEffect(() => {
    if (!activeShift?.id) {
      setTransactions([])
      return
    }

    const channel = supabase
      .channel(`drawer-transactions-${activeShift.id}-${renderPart || 'full'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_shift_transactions' },
        () => {
          fetchTransactions()
          fetchShiftStats(activeShift.id)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_orders' },
        () => {
          fetchShiftStats(activeShift.id)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_order_payments' },
        () => {
          fetchShiftStats(activeShift.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeShift?.id, renderPart])

  useEffect(() => {
    if (!activeShift?.id) return

    const handleShiftRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ shiftId?: string }>
      const shiftId = customEvent.detail?.shiftId
      if (shiftId && shiftId !== activeShift.id) return
      fetchTransactions()
      fetchShiftStats(activeShift.id)
    }

    window.addEventListener('rushup-pos-shift-refresh', handleShiftRefresh as EventListener)
    return () => {
      window.removeEventListener('rushup-pos-shift-refresh', handleShiftRefresh as EventListener)
    }
  }, [activeShift?.id, fetchShiftStats])



  const fetchHistoryShifts = async () => {
    if (viewMode !== 'history') return
    
    setHistoryLoading(true)
    try {
      const startOfDay = new Date(historyDate.getFullYear(), historyDate.getMonth(), historyDate.getDate(), 0, 0, 0, 0)
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)
      
      let query = supabase
        .from('pos_shifts')
        .select('*')
        .lt('opened_at', endOfDay.toISOString())
        .or(`closed_at.gte.${startOfDay.toISOString()},closed_at.is.null`)
        .order('opened_at', { ascending: false })
        
      if (shopSettings?.branch_id) {
         query = query.eq('branch_id', shopSettings.branch_id)
      }
      
      const { data } = await query
      setHistoryShifts(data || [])
      
      if (!selectedHistoryShiftId && data && data.length > 0) {
        setSelectedHistoryShiftId(data[0].id)
      } else if (data && data.length === 0) {
        setSelectedHistoryShiftId(null)
        setHistoryTransactions([])
        setHistoryStats(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistoryShifts()
  }, [viewMode, historyDate, shopSettings?.branch_id])

  const loadHistoryShiftData = async () => {
    if (!selectedHistoryShiftId) return
    const shift = historyShifts.find(s => s.id === selectedHistoryShiftId)
    if (!shift) return
    
    setHistoryLoading(true)
    try {
      const { data: txs } = await supabase
        .from('pos_shift_transactions')
        .select('*')
        .eq('shift_id', selectedHistoryShiftId)
        .order('created_at', { ascending: false })
      setHistoryTransactions(txs || [])
      
      const payIns = (txs || []).filter((t: any) => t.type === 'pay_in').reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
      const payOuts = (txs || []).filter((t: any) => t.type === 'pay_out').reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
      
      let orderQuery = supabase
        .from('pos_orders')
        .select('status, order_type, payment_method, discount_amount, paid_at, branch_id, pos_order_payments(amount, payment_method, status)')
        .gte('created_at', shift.opened_at)
        .lte('created_at', shift.closed_at || new Date().toISOString())
        
      if (shift.branch_id) {
        orderQuery = orderQuery.or(`branch_id.eq.${shift.branch_id},branch_id.is.null`)
      }
      
      const { data: orderRows } = await orderQuery
      const validOrders = orderRows || []
      
      let cashSales = 0
      validOrders.forEach((order: any) => {
        const status = String(order.status || '').toLowerCase()
        if (['cancelled', 'void', 'refunded'].includes(status)) return
        const hasPaymentRows = Array.isArray(order.pos_order_payments) && order.pos_order_payments.length > 0
        const isSoldOrder = ['paid', 'completed', 'delivered'].includes(status) || Boolean(order.paid_at) || hasPaymentRows
        if (!isSoldOrder) return

        const payments = order.pos_order_payments ? order.pos_order_payments.filter((p: any) => p.status === 'paid') : []
        payments.forEach((payment: any) => {
          const method = String(payment.payment_method || '').toLowerCase()
          if (method === 'cash' || method === 'cod') {
            cashSales += Number(payment.amount || 0)
          }
        })

        if (payments.length === 0) {
          const method = String(order.payment_method || '').toLowerCase()
          if (method === 'cash' || method === 'cod') {
            cashSales += Number(order.net_total ?? order.total_amount ?? 0)
          }
        }
      })
      
      const expected = Number(shift.start_cash || 0) + payIns - payOuts + cashSales
      
      setHistoryStats({
        cashSales,
        payIns,
        payOuts,
        expected,
        orderRows: validOrders
      })
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistoryShiftData()
  }, [selectedHistoryShiftId])

  const fetchTransactions = async () => {
      if (!activeShift?.id) {
          setTransactions([])
          return
      }
      const { data } = await supabase
        .from('pos_shift_transactions')
        .select('*')
        .eq('shift_id', activeShift.id)
        .order('created_at', { ascending: false })
      if (data) setTransactions(data)
  }
  const openTransactionModal = (type: 'pay_in' | 'pay_out') => {
    setTransactionModal({
      open: true,
      type,
      amount: '',
      reason: ''
    })
  }

  const closeTransactionModal = () => {
    setTransactionModal({
      open: false,
      type: null,
      amount: '',
      reason: ''
    })
  }

  const submitTransaction = async () => {
    if (!activeShift?.id || !transactionModal.amount || !transactionModal.reason.trim()) return
    setLoading(true)
    try {
      const amt = Number(transactionModal.amount)
      if (isNaN(amt) || amt <= 0) {
        alert('กรุณากรอกจำนวนเงินให้ถูกต้อง')
        return
      }

      const { error } = await supabase
        .from('pos_shift_transactions')
        .insert({
          shift_id: activeShift.id,
          type: transactionModal.type,
          amount: amt,
          reason: transactionModal.reason.trim()
        })

      if (error) throw error

      playAppSound('success')
      closeTransactionModal()
      fetchTransactions()
      fetchShiftStats(activeShift.id)
    } catch (e: any) {
      console.error('Error submitting transaction:', e)
      alert('เกิดข้อผิดพลาดในการบันทึกรายการ: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenShift = async () => {
      if (loading) return
      setLoading(true)
      try {
        await onOpenShift(openingCash)
      } finally {
        setLoading(false)
      }
  }

  const handleOpenDrawerBeforeShift = async () => {
    if (isOpeningDrawerForShift) return
    setIsOpeningDrawerForShift(true)
    try {
      let printers = shopSettings?.printers || []
      let receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')

      if (receiptPrinters.length === 0 && typeof window !== 'undefined') {
        const ip = localStorage.getItem('rushup_printer_ip')
        if (ip) {
          receiptPrinters = [{ ip, type: 'receipt', model: 'xprinter-xp-n160ii' }]
        }
      }

      if (receiptPrinters.length === 0) {
        alert('ยังไม่พบเครื่องปริ้นสำหรับเปิดลิ้นชัก')
        return
      }

      for (const rp of receiptPrinters) {
        if (!rp.ip) continue
        await printOpenDrawer(rp.ip, rp.model)
      }
    } catch (e) {
      console.error('Open drawer before shift failed:', e)
      alert('เปิดลิ้นชักไม่สำเร็จ กรุณาตรวจสอบเครื่องปริ้น')
    } finally {
      setIsOpeningDrawerForShift(false)
    }
  }

  const handleCloseShift = async () => {
      if (isClosingShift) return
      setIsClosingShift(true)
      try {
          // 1. Check for pending orders & ghost tables for this specific branch
          const { data, error } = await supabase
              .from('pos_orders')
              .select('id, order_number, table_id, table_number, total_amount, status, pos_order_items(id, quantity, subtotal, item:pos_menu_items!item_id(name)), order_type')
              .eq('shift_id', activeShift?.id)
              .eq('status', 'pending');

          if (error) {
              throw new Error(`เกิดข้อผิดพลาดในการตรวจสอบออเดอร์: ${error.message}`);
          }

          if (data && data.length > 0) {
              // Unpaid orders: pending status and has items or total > 0
              const validPendingOrders = data.filter((order: any) => {
                  const hasItems = order.pos_order_items && order.pos_order_items.length > 0;
                  const total = Number(order.total_amount || 0);
                  const isGhost = (!hasItems || total === 0) && order.status === 'pending';
                  return !isGhost;
              });

              if (validPendingOrders.length > 0) {
                  handleSetShiftBlocker({ open: true, type: 'unpaid', orders: validPendingOrders });
                  setIsClosingShift(false);
                  return;
              }
              
              // Ghost tables: pending status, 0 items, total 0, and MUST be dine-in
              const ghostOrders = data.filter((order: any) => {
                  const hasItems = order.pos_order_items && order.pos_order_items.length > 0;
                  const total = Number(order.total_amount || 0);
                  const isGhost = (!hasItems || total === 0) && order.status === 'pending';
                  return isGhost && (order.table_id || order.order_type === 'dine_in');
              });

              if (ghostOrders.length > 0) {
                  // AUTO-CLEANUP GHOST ORDERS INSTEAD OF BLOCKING
                  const ghostIds = ghostOrders.map((o: any) => o.id);
                  const { error: voidError } = await supabase
                      .from('pos_orders')
                      .update({ status: 'void', note: 'Auto-voided ghost table on shift close' })
                      .in('id', ghostIds);
                  
                  if (voidError) {
                      console.error('Failed to auto-void ghost orders:', voidError);
                  } else {
                      console.log('Successfully auto-voided ghost orders:', ghostIds.length);
                  }
                  
                  // Also asynchronously clean up ANY old pending zero-amount bills across the branch
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const branchId = activeShift?.branch_id || shopSettings?.branch_id;
                  if (branchId) {
                      supabase.from('pos_orders')
                          .update({ status: 'void', note: 'Auto-voided abandoned bill' })
                          .eq('status', 'pending')
                          .eq('branch_id', branchId)
                          .lt('created_at', yesterday.toISOString())
                          .or('total_amount.eq.0,total_amount.is.null')
                          .then(({error}) => { if (error) console.error('Failed old ghost cleanup', error) });
                  }
              }
          }

          // 2. Check staff attendance check-out eligibility for this specific branch
          const branchParam = activeShift?.branch_id ? `?branch_id=${activeShift.branch_id}` : ''
          const elRes = await fetch(`/api/pos/shifts/check-eligibility${branchParam}`, { method: 'GET' })
          if (!elRes.ok) {
              throw new Error(`ไม่สามารถติดต่อระบบตอกบัตรพนักงานได้ (Status: ${elRes.status})`);
          }
          const elData = await elRes.json()
          if (elData && elData.success && !elData.canCloseShift) {
              handleSetShiftBlocker({
                  open: true,
                  type: 'checkout',
                  orders: elData.missingCheckOutStaff.map((s: any) => ({
                      id: s.id,
                      order_number: s.email || 'No email',
                      table_number: s.full_name || s.display_name || 'พนักงาน'
                  }))
              })
              setIsClosingShift(false);
              return;
          }

          // 3. Prepare Z-Report & trigger background tasks
          const { start, end } = getLocalDayBounds()
          const branchId = activeShift?.branch_id || shopSettings?.branch_id || null

          const triggerBackgroundClosureTasks = async () => {
              try {
                  let orderQuery = supabase
                      .from('pos_orders')
                      .select('status, order_type, payment_method, discount_amount, paid_at, branch_id, pos_order_payments(amount, payment_method, status)')
                      .gte('created_at', start.toISOString())
                      .lt('created_at', end.toISOString())

                  if (branchId) {
                      orderQuery = orderQuery.or(`branch_id.eq.${branchId},branch_id.is.null`)
                  }

                  const { data: orderRows } = await orderQuery
                  const validOrders = orderRows || []

                  let printers = shopSettings?.printers || []
                  let receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
                  
                  if (receiptPrinters.length === 0) {
                      let ip = localStorage.getItem('rushup_printer_ip')
                      if (ip) {
                          receiptPrinters = [{ ip, type: 'receipt', model: 'xprinter-xp-n160ii' }]
                      }
                  }

                  const orderTypeGroups = new Map<string, { label: string; count: number }>()
                  const txGroups = new Map<string, { label: string; amount: number }>()
                  const paymentSummary = { cash: 0, transfer: 0, card: 0, other: 0 }
                  const paymentCounts = { cash: 0, transfer: 0, card: 0, other: 0 }
                  let discountTotal = 0

                  const normalizePaymentBucket = (method?: string | null) => {
                      const normalized = String(method || '').toLowerCase()
                      if (normalized === 'cash' || normalized === 'cod') return 'cash'
                      if (normalized === 'card' || normalized === 'credit_card') return 'card'
                      if (normalized === 'bank_transfer' || normalized === 'transfer' || normalized === 'promptpay' || normalized === 'qr') return 'transfer'
                      return 'other'
                  }

                  const orderTypeLabel = (type?: string | null) => {
                      switch ((type || '').replace(/_/g, '-').toLowerCase()) {
                          case 'dine-in': return 'ทานที่ร้าน'
                          case 'takeaway': return 'สั่งกลับบ้าน'
                          case 'delivery': return 'เดลิเวอรี่'
                          default: return type ? type.toUpperCase() : 'ไม่ระบุ'
                      }
                  }

                  validOrders.forEach((order: any) => {
                      const status = String(order.status || '').toLowerCase()
                      if (['cancelled', 'void', 'refunded'].includes(status)) return
                      const hasPaymentRows = Array.isArray(order.pos_order_payments) && order.pos_order_payments.length > 0
                      const isSoldOrder = ['paid', 'completed', 'delivered'].includes(status) || Boolean(order.paid_at) || hasPaymentRows
                      if (!isSoldOrder) return

                      discountTotal += Number(order.discount_amount || 0)

                      const orderTypeKey = order.order_type || 'unknown'
                      const existingOrderType = orderTypeGroups.get(orderTypeKey) || {
                          label: orderTypeLabel(order.order_type),
                          count: 0,
                      }
                      existingOrderType.count += 1
                      orderTypeGroups.set(orderTypeKey, existingOrderType)

                      const payments = order.pos_order_payments ? order.pos_order_payments.filter((p: any) => p.status === 'paid') : []
                      payments.forEach((payment: any) => {
                          const bucket = normalizePaymentBucket(payment.payment_method)
                          paymentSummary[bucket] += Number(payment.amount || 0)
                          paymentCounts[bucket] += 1
                      })

                      if (payments.length === 0) {
                          const bucket = normalizePaymentBucket(order.payment_method)
                          const amount = Number(order.net_total ?? order.total_amount ?? 0)
                          paymentSummary[bucket] += amount
                          paymentCounts[bucket] += 1
                      }
                  })

                  const payInTotal = transactions.filter((t: any) => t.type === 'pay_in').reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
                  const payOutTotal = transactions.filter((t: any) => t.type === 'pay_out').reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
                  txGroups.set('pay_in', { label: `รับเงินเข้าระหว่างกะ (${transactions.filter((t: any) => t.type === 'pay_in').length} ครั้ง)`, amount: payInTotal })
                  txGroups.set('pay_out', { label: `จ่ายเงินออกระหว่างกะ (${transactions.filter((t: any) => t.type === 'pay_out').length} ครั้ง)`, amount: payOutTotal })

                  const paymentBreakdown = [
                      { label: 'เงินสด', amount: paymentSummary.cash, count: paymentCounts.cash },
                      { label: 'โอนเงิน / QR', amount: paymentSummary.transfer, count: paymentCounts.transfer },
                      { label: 'บัตรเครดิต / เดบิต', amount: paymentSummary.card, count: paymentCounts.card },
                  ]
                  if (paymentSummary.other > 0) paymentBreakdown.push({ label: 'อื่น ๆ', amount: paymentSummary.other, count: paymentCounts.other })

                  const reportData = {
                      shiftId: activeShift.id,
                      openedAt: new Date(activeShift.opened_at).toLocaleString(),
                      closedAt: new Date().toLocaleString(),
                      staffName: profile?.full_name || 'Staff',
                      startCash: activeShift?.start_cash || 0,
                      orderCount: orderRows?.length || 0,
                      cashOrderCount: paymentCounts.cash,
                      nonCashOrderCount: paymentCounts.transfer + paymentCounts.card + paymentCounts.other,
                      expectedCash: shiftStats?.expected || 0,
                      actualCash: closingCash,
                      difference: closingCash - (shiftStats?.expected || 0),
                      cashSales: paymentSummary.cash,
                      transferSales: paymentSummary.transfer,
                      cardSales: paymentSummary.card,
                      otherSales: paymentSummary.other,
                      discountTotal,
                      payInTotal,
                      payOutTotal,
                      paymentBreakdown,
                      orderTypeBreakdown: Array.from(orderTypeGroups.values()).sort((a, b) => b.count - a.count),
                      transactionBreakdown: Array.from(txGroups.values()),
                      transactionsList: transactions,
                      notes: closingCash === (shiftStats?.expected || 0)
                          ? 'ยอดตรงตามระบบ'
                          : closingCash < (shiftStats?.expected || 0)
                              ? 'เงินนับจริงน้อยกว่ายอดคาดหวัง'
                              : 'เงินนับจริงมากกว่ายอดคาดหวัง'
                  }
                  const printShopData = {
                      name: shopSettings?.name || 'RUSH UP',
                      branch: shopSettings?.branch_name
                  }

                  // Print Z-Report
                  try {
                      if (receiptPrinters.length > 0) {
                          for (const rp of receiptPrinters) {
                              if (!rp.ip) continue;
                              await printGraphicModeZReport(rp.ip, reportData, printShopData, rp.model, rp.encoding)
                          }
                      }
                  } catch (e) { console.error('Print Z-Report failed:', e) }

                  // LINE Notify
                  try {
                      await fetch('/api/line/notify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'z_report', reportData })
                      })
                  } catch (e) { console.error('LINE Z-Report notification failed:', e) }

                  // Email
                  if (shopSettings?.opening_hours?.shift_settings?.auto_email_zreport) {
                      try {
                          await fetch('/api/email/zreport', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ reportData, shopName: printShopData.name })
                          })
                      } catch (e) { console.error('Email Z-Report notification failed:', e) }
                  }
              } catch (bgError) {
                  console.error('Background closure tasks failed:', bgError)
              }
          }

          // Trigger background Z-Report printing & notifications
          triggerBackgroundClosureTasks()

          // 4. Close the shift in the database via the API
          await onCloseShift(closingCash)

      } catch (err) {
          console.error("Close shift process failed:", err)
          const message = err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'
          alert(`ไม่สามารถปิดกะได้: ${message}`)
      } finally {
          setIsClosingShift(false)
      }
  }

  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const pinActionRef = useRef<(() => void) | null>(null)
  
  useEffect(() => {
    if (renderPart !== 'right') return;
    
    const handleOpenPin = (e: any) => {
      const { action } = e.detail;
      pinActionRef.current = action;
      setIsPinModalOpen(true);
    };

    window.addEventListener('OPEN_DRAWER_PIN', handleOpenPin);
    return () => window.removeEventListener('OPEN_DRAWER_PIN', handleOpenPin);
  }, [renderPart]);

  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const correctPin = String(shopSettings?.role_permissions?.manager_pin || '').trim()

  const handlePinKeyPress = (num: string) => {
    if (pinError) setPinError(false)
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + num
      setEnteredPin(nextPin)
      
      if (nextPin.length === correctPin.length) {
        if (nextPin === correctPin) {
          if (pinActionRef.current) {
            pinActionRef.current()
            pinActionRef.current = null
          } else {
            performOpenDrawer()
          }
          setEnteredPin('')
          setIsPinModalOpen(false)
        } else {
          setPinError(true)
          setEnteredPin('')
        }
      }
    }
  }

  const handlePinDelete = () => {
    if (pinError) setPinError(false)
    setEnteredPin(prev => prev.slice(0, -1))
  }

  const handlePinClear = () => {
    setEnteredPin('')
    setPinError(false)
  }

  const handleOpenDrawerClick = () => {
    const correctPin = shopSettings?.role_permissions?.manager_pin
    if (correctPin) {
      setIsPinModalOpen(true)
    } else {
      performOpenDrawer()
    }
  }

  const performOpenDrawer = async () => {
    playAppSound('pay');
    setIsDrawerOpen(true)
    setTimeout(() => setIsDrawerOpen(false), 3000)

    let printers = shopSettings?.printers || []
    let receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
    
    if (receiptPrinters.length === 0) {
      let ip = localStorage.getItem('rushup_printer_ip')
      if (ip) {
        receiptPrinters = [{ ip, type: 'receipt', model: 'xprinter-xp-n160ii' }]
      }
    }
    
    if (receiptPrinters.length > 0) {
      try {
        for (const rp of receiptPrinters) {
           if (!rp.ip) continue;
           await printOpenDrawer(rp.ip, rp.model)
        }
      } catch (e) { console.error(e) }
    }
  }

  const handlePrintHistoryZReport = async () => {
    if (!selectedHistoryShiftId || !historyStats) return
    const shift = historyShifts.find(s => s.id === selectedHistoryShiftId)
    if (!shift) return

    let printers = shopSettings?.printers || []
    let receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
    
    if (receiptPrinters.length === 0) {
      let ip = localStorage.getItem('rushup_printer_ip')
      if (ip) {
        receiptPrinters = [{ ip, type: 'receipt', model: 'xprinter-xp-n160ii' }]
      }
    }
    
    if (receiptPrinters.length > 0) {
      const orderTypeGroups = new Map<string, { label: string; count: number }>()
      const txGroups = new Map<string, { label: string; amount: number }>()
      const paymentSummary = { cash: 0, transfer: 0, card: 0, other: 0 }
      const paymentCounts = { cash: 0, transfer: 0, card: 0, other: 0 }
      let discountTotal = 0

      const normalizePaymentBucket = (method?: string | null) => {
        const normalized = String(method || '').toLowerCase()
        if (normalized === 'cash' || normalized === 'cod') return 'cash'
        if (normalized === 'card' || normalized === 'credit_card') return 'card'
        if (normalized === 'bank_transfer' || normalized === 'transfer' || normalized === 'promptpay' || normalized === 'qr') return 'transfer'
        return 'other'
      }

      const orderTypeLabel = (type?: string | null) => {
        switch ((type || '').replace(/_/g, '-').toLowerCase()) {
          case 'dine-in': return 'ทานที่ร้าน'
          case 'takeaway': return 'สั่งกลับบ้าน'
          case 'delivery': return 'เดลิเวอรี่'
          default: return type ? type.toUpperCase() : 'ไม่ระบุ'
        }
      }

      const validOrders = historyStats.orderRows || []
      validOrders.forEach((order: any) => {
        const status = String(order.status || '').toLowerCase()
        if (['cancelled', 'void', 'refunded'].includes(status)) return
        const hasPaymentRows = Array.isArray(order.pos_order_payments) && order.pos_order_payments.length > 0
        const isSoldOrder = ['paid', 'completed', 'delivered'].includes(status) || Boolean(order.paid_at) || hasPaymentRows
        if (!isSoldOrder) return

        discountTotal += Number(order.discount_amount || 0)

        const orderTypeKey = order.order_type || 'unknown'
        const existingOrderType = orderTypeGroups.get(orderTypeKey) || { label: orderTypeLabel(order.order_type), count: 0 }
        existingOrderType.count += 1
        orderTypeGroups.set(orderTypeKey, existingOrderType)

        const payments = order.pos_order_payments ? order.pos_order_payments.filter((p: any) => p.status === 'paid') : []
        payments.forEach((payment: any) => {
          const bucket = normalizePaymentBucket(payment.payment_method)
          paymentSummary[bucket] += Number(payment.amount || 0)
          paymentCounts[bucket] += 1
        })

        if (payments.length === 0) {
          const bucket = normalizePaymentBucket(order.payment_method)
          const amount = Number(order.net_total ?? order.total_amount ?? 0)
          paymentSummary[bucket] += amount
          paymentCounts[bucket] += 1
        }
      })

      const payInTotal = historyTransactions.filter((t: any) => t.type === 'pay_in').reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
      const payOutTotal = historyTransactions.filter((t: any) => t.type === 'pay_out').reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
      txGroups.set('pay_in', { label: `รับเงินเข้าระหว่างกะ (${historyTransactions.filter((t: any) => t.type === 'pay_in').length} ครั้ง)`, amount: payInTotal })
      txGroups.set('pay_out', { label: `จ่ายเงินออกระหว่างกะ (${historyTransactions.filter((t: any) => t.type === 'pay_out').length} ครั้ง)`, amount: payOutTotal })

      const paymentBreakdown = [
        { label: 'เงินสด', amount: paymentSummary.cash, count: paymentCounts.cash },
        { label: 'โอนเงิน / QR', amount: paymentSummary.transfer, count: paymentCounts.transfer },
        { label: 'บัตรเครดิต / เดบิต', amount: paymentSummary.card, count: paymentCounts.card },
      ]
      if (paymentSummary.other > 0) paymentBreakdown.push({ label: 'อื่น ๆ', amount: paymentSummary.other, count: paymentCounts.other })

      const reportData = {
        shiftId: shift.id,
        openedAt: new Date(shift.opened_at).toLocaleString(),
        closedAt: new Date(shift.closed_at || new Date()).toLocaleString(),
        staffName: 'Staff (Historical)', // Cannot easily map past staff name without more queries
        startCash: shift.start_cash || 0,
        orderCount: validOrders.length,
        cashOrderCount: paymentCounts.cash,
        nonCashOrderCount: paymentCounts.transfer + paymentCounts.card + paymentCounts.other,
        expectedCash: historyStats.expected || 0,
        actualCash: shift.close_cash || 0,
        difference: (shift.close_cash || 0) - (historyStats.expected || 0),
        cashSales: paymentSummary.cash,
        transferSales: paymentSummary.transfer,
        cardSales: paymentSummary.card,
        otherSales: paymentSummary.other,
        discountTotal,
        payInTotal,
        payOutTotal,
        paymentBreakdown,
        orderTypeBreakdown: Array.from(orderTypeGroups.values()).sort((a, b) => b.count - a.count),
        transactionBreakdown: Array.from(txGroups.values()),
        notes: (shift.close_cash || 0) === (historyStats.expected || 0)
          ? 'ยอดตรงตามระบบ (พิมพ์ย้อนหลัง)'
          : 'ยอดไม่ตรงตามระบบ (พิมพ์ย้อนหลัง)'
      }
      const printShopData = { name: shopSettings?.name || 'RUSH UP', branch: shopSettings?.branch_name }
      try {
        for (const rp of receiptPrinters) {
           if (!rp.ip) continue;
           await printGraphicModeZReport(rp.ip, reportData, printShopData, rp.model, rp.encoding)
        }
      } catch (e) { console.error(e) }
    }
  }


const SwipeCloseShiftButton = ({ onSwipe, isSubmitting, locale }: { onSwipe: () => void; isSubmitting: boolean; locale: string }) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [trackWidth, setTrackWidth] = useState(300);
  const x = useMotionValue(0);

  // Dynamically map drag x position to text opacity
  const textOpacity = useTransform(x, [0, Math.max(1, trackWidth - 100)], [1, 0]);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setTrackWidth(node.offsetWidth);
    }
  }, []);

  React.useEffect(() => {
    if (!isSubmitting) {
      setIsSwiped(false);
      x.set(0);
    }
  }, [isSubmitting, x]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = trackWidth - 56;
    const currentX = x.get();
    if (currentX >= threshold * 0.8) {
      setIsSwiped(true);
      onSwipe();
    } else {
      setIsSwiped(false);
      animate(x, 0, { type: "spring", stiffness: 450, damping: 28 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-14 bg-amber-50/50 rounded-full border border-amber-200/50 p-1 relative overflow-hidden flex items-center justify-center select-none w-full shrink-0"
    >
      <div className="absolute inset-y-0 left-0 bg-amber-100/20 pointer-events-none rounded-l-full" style={{ width: '100%' }} />

      <motion.span 
        style={{ opacity: textOpacity }}
        className="text-[10px] font-black text-amber-800/80 z-0 tracking-widest uppercase animate-pulse select-none pointer-events-none"
      >
        {isSubmitting ? 'กำลังปิดกะ...' : locale === 'en' ? 'SLIDE TO CLOSE SHIFT' : 'เลื่อนเพื่อปิดกะทำงาน'}
      </motion.span>

      {!isSwiped && !isSubmitting && (
        <motion.div
          drag="x"
          dragElastic={0.1}
          dragMomentum={false}
          dragConstraints={{ left: 0, right: Math.max(0, trackWidth - 56) }}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="w-12 h-12 bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-900 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing absolute left-1 shadow-md z-10 transition-colors"
        >
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            <ChevronsRight size={18} />
          </motion.div>
        </motion.div>
      )}

      {(isSwiped || isSubmitting) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-amber-500 flex items-center justify-center text-neutral-900 font-bold text-xs gap-2 rounded-full z-20"
        >
          <Loader2 className="animate-spin" size={16} />
          <span>{locale === 'en' ? 'Closing Shift...' : 'กำลังปิดกะทำงาน...'}</span>
        </motion.div>
      )}
    </div>
  );
};

    if (renderPart === 'right') {
        return (
            <div className="flex-grow flex flex-col min-h-0 p-6 space-y-6 bg-white lg:rounded-[2rem] h-full font-bold">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
                    <h2 className="text-lg font-black text-neutral-800 uppercase tracking-tight flex items-center gap-3">
                        <Wallet size={20} className="text-neutral-400" />
                        <span>{isPinModalOpen ? (locale === 'en' ? 'Manager Verification' : 'ยืนยันรหัสผ่านผู้จัดการ') : (locale === 'en' ? 'Close Shift & Drawer' : 'ปิดกะ & จัดการลิ้นชัก')}</span>
                    </h2>
                </div>

                {isPinModalOpen ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-4 my-auto w-full">
                        <div className="flex flex-col items-center text-center space-y-1 mb-8 w-full shrink-0">
                            <h3 className="text-[17px] font-normal tracking-wide text-neutral-800">
                                {isPinModalOpen ? 'ป้อนรหัส' : 'ป้อนรหัสผู้จัดการ'}
                            </h3>
                            {pinError && <p className="text-[13px] font-medium text-red-500">รหัสไม่ถูกต้อง</p>}
                        </div>

                        {/* PIN Display Bullets */}
                        <div className="flex gap-4 mb-10 h-4 items-center justify-center shrink-0">
                            {Array.from({ length: Math.max(correctPin.length, 4) }).map((_, idx) => {
                                const isFilled = idx < enteredPin.length
                                return (
                                    <div 
                                        key={idx}
                                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border-[1.5px] ${pinError ? 'border-red-500 bg-red-500' : isFilled ? 'border-[#D3202B] bg-[#D3202B]' : 'border-neutral-800 bg-transparent'}`}
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
                                    onClick={() => handlePinKeyPress(num)}
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
                                onClick={() => handlePinKeyPress('0')}
                                className="w-[72px] h-[72px] mx-auto rounded-full bg-neutral-100/60 hover:bg-neutral-200/60 active:bg-red-50 active:text-[#D3202B] transition-colors flex items-center justify-center text-neutral-900 border border-black/[0.03]"
                            >
                                <span className="text-[34px] font-light leading-none">0</span>
                            </button>

                            {/* Delete or Cancel Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (enteredPin.length > 0) {
                                        handlePinDelete()
                                    } else {
                                        setIsPinModalOpen(false)
                                        setEnteredPin('')
                                        setPinError(false)
                                        pinActionRef.current = null
                                    }
                                }}
                                className="w-[72px] h-[72px] mx-auto transition-colors text-[15px] font-normal flex items-center justify-center text-neutral-900 active:text-neutral-500"
                            >
                                {enteredPin.length > 0 ? 'ลบ' : 'ยกเลิก'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Actions Panel */
                    <div className="flex-grow flex flex-col justify-between gap-6 min-h-0 overflow-y-auto no-scrollbar py-2">
                        {/* Giant Expected Cash Container on the Right (Basket/Drawer control) Panel */}
                        <div className="flex flex-col items-center justify-center py-8 bg-[#FDFDFB] border-2 border-neutral-200 rounded-3xl shrink-0">
                            <span className="text-[10px] font-black text-[#8C8A81] uppercase tracking-[0.25em]">
                                {locale === 'en' ? 'Expected Cash in Drawer' : 'เงินสดที่ควรมีในลิ้นชัก'}
                            </span>
                            <span className="text-5xl font-black text-neutral-900 mt-3 font-sans tracking-tight">
                                ฿{shiftStats?.expected?.toLocaleString() || '0'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8C8A81] uppercase tracking-widest">{locale === 'en' ? 'Actual Counted Cash' : 'ระบุยอดเงินสดที่นับจริง'}</label>
                            <input 
                                type="number" 
                                value={closingCash === 0 && closingCash.toString() === "0" ? "" : closingCash} 
                                onChange={e => setClosingCash(Number(e.target.value))} 
                                className="w-full bg-[#fcfcf9] border-2 border-neutral-200 py-6 px-6 text-3xl font-black text-neutral-900 rounded-xl outline-none transition-all focus:border-neutral-800 focus:bg-white text-center" 
                                placeholder="0.00" 
                            />
                        </div>

                        <div className="space-y-3 mt-auto">
                            <button 
                                onClick={handleOpenDrawerClick}
                                className={`w-full py-3.5 border border-neutral-200 text-xs font-black uppercase tracking-widest transition-all rounded-2xl shadow-sm ${isDrawerOpen ? 'bg-neutral-50 text-neutral-400 border-neutral-200' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200/80 active:scale-95'}`}
                            >
                                {isDrawerOpen ? 'LOCKED / OPENED' : locale === 'en' ? 'OPEN DRAWER' : 'สั่งเปิดลิ้นชัก'}
                            </button>

                            <SwipeCloseShiftButton onSwipe={handleCloseShift} isSubmitting={isClosingShift} locale={locale} />
                        </div>
                    </div>
                )}

                {/* Modals needed for shift actions removed */}
            </div>
        )
    }

    return (
        <main className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-8 bg-transparent custom-scrollbar font-bold overflow-x-hidden flex flex-col min-h-0">
            {shiftBlocker.open && renderPart === 'left' ? (
                <div className="flex flex-col min-h-0 h-full w-full font-sans">
                    <div className="pb-4 flex flex-col gap-3 shrink-0 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[14px] font-black text-gray-900 flex items-center gap-2">
                                    {shiftBlocker.type === 'unpaid' ? 'บิลค้างชำระ' : shiftBlocker.type === 'ghost' ? 'โต๊ะเปิดค้าง' : 'ยังไม่ออกงาน'}
                                </h3>
                                <span className="bg-[#D3202B] text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                                    {shiftBlocker.orders.length}
                                </span>
                            </div>
                            {shiftBlocker.type !== 'checkout' && shiftBlocker.orders.length > 0 && (
                                <button
                                    onClick={() => {
                                        const pin = shopSettings?.role_permissions?.manager_pin
                                        if (!pin) {
                                            alert('กรุณาตั้งรหัสผ่านผู้จัดการ (Manager PIN) ในตั้งค่าร้านค้าก่อนทำรายการ');
                                            return;
                                        }
                                        if (confirm('ยืนยันลบบิลที่แสดงอยู่ทั้งหมดใช่หรือไม่?')) {
                                            const action = async () => {
                                                const ids = shiftBlocker.orders.map((o: any) => o.id);
                                                await supabase.from('pos_orders').update({ status: 'void', note: 'Bulk deleted from drawer blocker' }).in('id', ids);
                                                handleSetShiftBlocker({ ...shiftBlocker, open: false, orders: [] });
                                            };
                                            window.dispatchEvent(new CustomEvent('OPEN_DRAWER_PIN', { detail: { action } }));
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    <Trash2 size={12} />
                                    ล้างทั้งหมด
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">กรุณาจัดการรายการเหล่านี้ให้เสร็จสิ้นก่อนปิดกะ</p>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 flex flex-col">
                        {shiftBlocker.orders.map((order, idx) => (
                            <div key={idx} className="flex flex-col py-4 border-b border-gray-100 last:border-0 relative overflow-hidden shrink-0">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm text-gray-900">
                                                {order.table_number ? `โต๊ะ ${order.table_number}` : `บิล ${order.order_number}`}
                                            </span>
                                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                                                {shiftBlocker.type === 'ghost' ? 'ค้างโต๊ะ' : 'ค้างชำระ'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-400 mt-1">{order.order_number}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-[15px] text-gray-900">
                                            ฿{Number(order.total_amount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-gray-100 mb-3">
                                    {order.pos_order_items && order.pos_order_items.length > 0 ? (
                                        order.pos_order_items.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-start text-[11px] font-medium text-gray-500">
                                                <div className="flex gap-2">
                                                    <span className="text-gray-400 font-bold">{item.quantity}x</span>
                                                    <span>{item.item?.name || 'Unknown Item'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[11px] text-gray-400 font-medium italic">ไม่มีรายการอาหาร (เปิดโต๊ะค้างไว้)</span>
                                    )}
                                </div>
                                {shiftBlocker.type !== 'checkout' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button 
                                            onClick={() => {
                                                handleSetShiftBlocker({ ...shiftBlocker, open: false })
                                                if (shiftBlocker.type === 'ghost' && order.table_number) {
                                                    if (setSelectedTable) setSelectedTable({ id: order.table_id || null, name: order.table_number })
                                                    onSetView('tables')
                                                } else {
                                                    if (setEditingOrderId) setEditingOrderId(order.id)
                                                    if (setEditingOrderNumber) setEditingOrderNumber(order.order_number)
                                                    onSetView('terminal')
                                                }
                                            }}
                                            className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-1.5"
                                        >
                                            {shiftBlocker.type === 'ghost' ? 'จัดการโต๊ะ' : 'จัดการบิล'}
                                            <ChevronRight size={14} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const pin = shopSettings?.role_permissions?.manager_pin
                                                if (!pin) {
                                                    alert('กรุณาตั้งรหัสผ่านผู้จัดการ (Manager PIN) ในตั้งค่าร้านค้าก่อนทำรายการ');
                                                    return;
                                                }
                                                if (confirm('ยืนยันลบบิลนี้ใช่หรือไม่?')) {
                                                    const action = async () => {
                                                        await supabase.from('pos_orders').update({ status: 'void', note: 'Deleted from drawer blocker' }).eq('id', order.id);
                                                        const newOrders = shiftBlocker.orders.filter((o: any) => o.id !== order.id);
                                                        handleSetShiftBlocker({
                                                            ...shiftBlocker,
                                                            open: newOrders.length > 0,
                                                            orders: newOrders
                                                        });
                                                    };
                                                    window.dispatchEvent(new CustomEvent('OPEN_DRAWER_PIN', { detail: { action } }));
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1.5"
                                        >
                                            <Trash2 size={14} />
                                            ลบ
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="shrink-0 pt-4 mt-auto border-t border-gray-100">
                        <button 
                            onClick={() => handleSetShiftBlocker({ ...shiftBlocker, open: false })}
                            className="w-full py-4 bg-neutral-100 text-neutral-600 border-2 border-neutral-200 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-neutral-200 active:scale-95 transition-all"
                        >
                            ยกเลิก (Cancel)
                        </button>
                    </div>
                </div>
            ) : (
                <>
            {/* SELF-CONTAINED SEGMENT SWITCHER */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/60 mb-6 shrink-0">
                <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setViewMode('current')}
                        className={`px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            viewMode === 'current'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                    >
                        {locale === 'en' ? 'Current Shift' : 'กะปัจจุบัน'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('history')}
                        className={`px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
                            viewMode === 'history'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                    >
                        <History size={12} />
                        <span>{locale === 'en' ? 'History' : 'ประวัติลิ้นชัก'}</span>
                    </button>
                </div>
                
                {viewMode === 'history' && (
                    <div className="relative shrink-0">
                        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border-2 border-neutral-200 hover:border-neutral-800 rounded-xl text-xs font-bold text-neutral-800 shadow-sm transition-all pointer-events-none">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{(() => {
                                if (!historyDate) return '';
                                const date = historyDate instanceof Date ? historyDate : new Date(historyDate);
                                const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                                const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const day = date.getDate();
                                const month = locale === 'en' ? monthsEn[date.getMonth()] : monthsTh[date.getMonth()];
                                const year = date.getFullYear() + (locale === 'en' ? 0 : 543);
                                return `${day} ${month} ${year}`;
                            })()}</span>
                            <ChevronDown size={12} className="text-gray-400 ml-1" />
                        </div>
                        <input
                            type="date"
                            value={historyDate instanceof Date ? historyDate.toLocaleDateString('en-CA') : new Date(historyDate).toLocaleDateString('en-CA')}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setHistoryDate(new Date(e.target.value));
                                    setSelectedHistoryShiftId(null);
                                }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                )}
            </div>

            <div className="flex-grow flex flex-col min-h-0">
                {viewMode === 'history' ? (
                    <div className="flex-grow flex flex-col gap-6 font-sans h-full min-h-0">
                        {historyLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="animate-spin text-neutral-400" size={32} />
                            </div>
                        ) : historyShifts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <History size={48} className="mb-4 opacity-20" />
                                <p className="uppercase tracking-widest text-xs font-black">{locale === 'en' ? 'No shifts found for this date' : 'ไม่มีประวัติกะในวันที่เลือก'}</p>
                            </div>
                        ) : (
                            <>
                                {historyShifts.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {historyShifts.map((shift, i) => (
                                            <button
                                                key={shift.id}
                                                type="button"
                                                onClick={() => setSelectedHistoryShiftId(shift.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${
                                                    selectedHistoryShiftId === shift.id 
                                                        ? 'bg-[#D3202B] text-white' 
                                                        : 'bg-white border-2 border-neutral-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {locale === 'en' ? 'Shift' : 'กะที่'} {historyShifts.length - i}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedHistoryShiftId && historyStats && (
                                    <div className="flex-grow flex flex-col min-h-0 gap-6">
                                        {/* TOP SECTION: CLEAN HERO (FLAT) */}
                                        <div className="flex-none relative overflow-hidden py-2">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-1.5 mb-3">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {locale === 'en' ? 'Expected Cash in Drawer' : 'เงินสดที่ควรมีในลิ้นชัก (Expected Cash)'}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/60 w-fit">
                                                                {locale === 'en' ? 'Started: ' : 'เริ่มกะ: '}
                                                                {new Date(historyShifts.find(s => s.id === selectedHistoryShiftId)?.opened_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {historyShifts.find(s => s.id === selectedHistoryShiftId)?.status === 'open' ? (
                                                              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60 w-fit">
                                                                  {locale === 'en' ? 'Not Closed Yet' : 'ยังไม่ได้ปิดกะ'}
                                                                </span>
                                                            ) : (
                                                              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/60 w-fit">
                                                                  {locale === 'en' ? 'Closed: ' : 'ปิดกะ: '}
                                                                  {new Date(historyShifts.find(s => s.id === selectedHistoryShiftId)?.closed_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                              </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-5xl font-black font-sans tracking-tight text-gray-900">
                                                        ฿{historyStats.expected?.toLocaleString() || '0'}
                                                    </div>
                                                </div>

                                                {/* Horizontal Breakdown */}
                                                <div className="grid grid-cols-4 gap-6 py-6 border-t border-b border-gray-100 mt-4 w-full">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-1 h-8 rounded-full bg-neutral-400 shrink-0" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Starting Cash' : 'เริ่มต้น'}</span>
                                                            <span className="font-sans text-sm font-bold text-gray-900 mt-0.5">฿ {Number(historyShifts.find(s => s.id === selectedHistoryShiftId)?.start_cash || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Cash Sales' : 'ยอดขายเงินสด'}</span>
                                                            <span className="font-sans text-sm font-bold mt-0.5" style={{ color: '#10B981' }}>+ ฿ {historyStats.cashSales?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Pay In' : 'นำเงินเข้า'}</span>
                                                            <span className="font-sans text-sm font-bold mt-0.5" style={{ color: '#10B981' }}>+ ฿ {historyStats.payIns?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-1 h-8 rounded-full bg-[#D3202B] shrink-0" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Pay Out' : 'นำเงินออก'}</span>
                                                            <span className="text-[#D3202B] font-sans text-sm font-bold mt-0.5">- ฿ {historyStats.payOuts?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transactions List */}
                                        <div className="flex-grow flex flex-col min-h-0 pt-4">
                                            <div className="pb-3">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Transactions' : 'ประวัตินำเงินเข้า-ออก (Transactions)'}</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                                                <div className="space-y-0 relative pl-4 border-l border-gray-100 ml-4 mt-2">
                                                    {historyTransactions.map(t => (
                                                        <div key={t.id} className="relative pb-6 last:pb-2">
                                                            <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${t.type === 'pay_in' ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'bg-[#D3202B] shadow-[0_0_0_3px_rgba(211,32,43,0.15)]'}`} />
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="text-sm font-bold text-gray-800">{t.reason}</div>
                                                                    <div className="text-[10px] font-semibold text-gray-400 mt-0.5">
                                                                        {t.type === 'pay_in' ? 'นำเข้า' : 'นำออก'} • {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                                <div className={`text-sm font-black ${t.type === 'pay_in' ? 'text-emerald-600' : 'text-[#D3202B]'}`}>
                                                                    {t.type === 'pay_in' ? '+' : '-'} ฿ {t.amount.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {historyTransactions.length === 0 && (
                                                        <div className="py-16 flex flex-col items-center justify-center text-gray-300 text-xs font-bold uppercase tracking-widest">
                                                            <ArrowUpRight size={24} className="mb-2 opacity-30"/>
                                                            {locale === 'en' ? 'No transactions' : 'ไม่มีรายการ'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : !activeShift ? (
                    <div className="max-w-xl mx-auto py-10 sm:py-20 font-bold">
                        <section className="bg-white border-2 border-neutral-200 p-6 sm:p-16 shadow-2xl rounded-[2rem]">
                            <h2 className="font-serif-luxury text-3xl sm:text-5xl font-light tracking-tighter text-[#1A1A18]">{locale === 'en' ? 'เริ่มกะทำงานใหม่' : 'เริ่มกะทำงานใหม่'}</h2>
                            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[#8C8A81] mt-4 sm:mt-6">{locale === 'en' ? 'ระบุเงินสดเริ่มต้น (Starting Cash)' : 'ระบุเงินสดเริ่มต้น (Starting Cash)'}</p>
                            <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-10">
                                <button
                                  type="button"
                                  onClick={handleOpenDrawerBeforeShift}
                                  disabled={isOpeningDrawerForShift}
                                  className="w-full py-4 sm:py-5 bg-neutral-50 border-2 border-neutral-200 text-neutral-800 text-[10px] sm:text-[11px] font-black tracking-[0.25em] disabled:opacity-50 rounded-xl hover:bg-neutral-100 transition-colors"
                                >
                                  {isOpeningDrawerForShift ? 'กำลังเปิดลิ้นชัก...' : 'เปิดลิ้นชักก่อนนับเงิน'}
                                </button>
                                <input type="number" value={openingCash} onChange={e => setOpeningCash(Number(e.target.value))} className="w-full bg-[#fcfcf9] border-2 border-neutral-200 py-4 sm:py-8 px-6 sm:px-8 text-2xl sm:text-4xl font-black outline-none text-black rounded-xl" />
                                <button onClick={handleOpenShift} disabled={loading} className="w-full py-4 sm:py-8 bg-[#D3202B] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] disabled:opacity-50 rounded-xl">{loading ? 'กำลังเปิดกะ...' : 'เปิดกะทำงาน (START SHIFT)'}</button>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col gap-6 font-sans h-full min-h-0">
                        {/* TOP SECTION: CLEAN HERO (FLAT) */}
                        <div className="flex-none relative overflow-hidden py-2">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {locale === 'en' ? 'Shift Performance' : 'สรุปยอดเงินกะปัจจุบัน'}
                                </span>
                                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
                                    {locale === 'en' ? 'Started: ' : 'เริ่มกะ: '}
                                    {new Date(activeShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Horizontal Breakdown - Flat grid */}
                            <div className="grid grid-cols-4 gap-6 py-6 border-t border-b border-gray-200/60 w-full">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-1 h-8 rounded-full bg-neutral-400 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Starting Cash' : 'เริ่มต้น'}</span>
                                        <span className="font-sans text-sm font-bold text-gray-900 mt-0.5">฿ {Number(activeShift.start_cash || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Cash Sales' : 'ยอดขายเงินสด'}</span>
                                        <span className="font-sans text-sm font-bold mt-0.5" style={{ color: '#10B981' }}>+ ฿ {shiftStats?.cashSales?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Pay In' : 'นำเงินเข้า'}</span>
                                        <span className="font-sans text-sm font-bold mt-0.5" style={{ color: '#10B981' }}>+ ฿ {shiftStats?.payIns?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="w-1 h-8 rounded-full bg-[#D3202B] shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Pay Out' : 'นำเงินออก'}</span>
                                        <span className="text-[#D3202B] font-sans text-sm font-bold mt-0.5">- ฿ {shiftStats?.payOuts?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ULTRA CLEAN MINIMAL STAFF BAR */}
                        <div className="py-4 border-b border-gray-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {locale === 'en' ? 'Shift Attendance' : 'พนักงานประจำกะวันนี้ (Staff on duty)'}
                                    </span>

                                    {/* Attendance Counter Badge */}
                                    {attendanceSummary?.totalRequiredStaff > 0 ? (
                                        attendanceSummary?.canOpenShift ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                {locale === 'en' ? 'Checked-in ' : 'เข้างานครบ '}
                                                ({attendanceSummary?.checkedInStaff?.length || 0}/{attendanceSummary?.totalRequiredStaff || 0})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100/60">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                {locale === 'en' ? 'Missing ' : 'ยังไม่เข้า '} 
                                                ({attendanceSummary?.missingCheckInStaff?.length || 0} คน)
                                            </span>
                                        )
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-50/50 text-gray-400 border border-gray-100/60">
                                            {locale === 'en' ? 'No shift today' : 'ไม่มีกะพนักงานวันนี้'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Staff Name Badges & Refresh */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {attendanceSummary?.checkedInStaff?.map((s: any) => (
                                        <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                            {s.display_name || s.full_name || s.email}
                                        </span>
                                    ))}
                                    {attendanceSummary?.missingCheckInStaff?.map((s: any) => (
                                        <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                            {s.display_name || s.full_name || s.email}
                                        </span>
                                    ))}
                                    {attendanceSummary?.emergencyLeaveStaff?.map((s: any) => (
                                        <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            {s.display_name || s.full_name || s.email} (ลา)
                                        </span>
                                    ))}
                                </div>

                                <button 
                                    type="button"
                                    onClick={fetchAttendanceSummary}
                                    disabled={isFetchingAttendance}
                                    title="รีเฟรชข้อมูล"
                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                                >
                                    <RefreshCcw size={12} className={isFetchingAttendance ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* BOTTOM SECTION: SPLIT PANEL */}
                        <div className={renderPart === 'left' ? "flex flex-col gap-6 flex-1 min-h-0" : "grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0"}>
                                {/* BOTTOM LEFT: TRANSACTIONS */}
                                <div className="flex flex-col min-h-0 flex-grow pt-4">
                                <div className="pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'Transactions' : 'ประวัตินำเงินเข้า-ออก (Transactions)'}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openTransactionModal('pay_in')}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors font-bold text-[10px] uppercase tracking-widest"
                                        >
                                          <ArrowUpRight size={14} /> {locale === 'en' ? 'Pay In' : 'นำเข้า'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openTransactionModal('pay_out')}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-[#D3202B] hover:bg-rose-100 transition-colors font-bold text-[10px] uppercase tracking-widest"
                                        >
                                          <ArrowDownLeft size={14} /> {locale === 'en' ? 'Pay Out' : 'นำออก'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-grow overflow-y-auto no-scrollbar py-2">
                                    <div className="space-y-0 relative pl-4 border-l border-gray-100 ml-4 mt-2">
                                        {transactions.map(t => (
                                            <div key={t.id} className="relative pb-6 last:pb-2">
                                                <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${t.type === 'pay_in' ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'bg-[#D3202B] shadow-[0_0_0_3px_rgba(211,32,43,0.15)]'}`} />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800">{t.reason}</div>
                                                        <div className="text-[10px] font-semibold text-gray-400 mt-0.5">
                                                            {t.type === 'pay_in' ? 'นำเข้า' : 'นำออก'} • {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className={`text-sm font-black ${t.type === 'pay_in' ? 'text-emerald-600' : 'text-[#D3202B]'}`}>
                                                        {t.type === 'pay_in' ? '+' : '-'} ฿ {t.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {transactions.length === 0 && <div className="py-16 flex flex-col items-center justify-center text-gray-300 text-xs font-bold uppercase tracking-widest"><ArrowUpRight size={24} className="mb-2 opacity-30"/>{locale === 'en' ? 'No transactions' : 'ไม่มีรายการ'}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM RIGHT: SHIFT ACTIONS */}
                            {renderPart !== 'left' && (
                                <div className="flex flex-col gap-6 min-h-0">
                                    <div className="bg-white rounded-[2rem] border-2 border-neutral-200/80 p-8 flex-1 flex flex-col">
                                        <div className="mb-6 flex justify-between items-center">
                                            <h3 className="text-xs font-black text-neutral-800 uppercase tracking-widest">{locale === 'en' ? 'Actual Cash Counted' : 'สรุปยอดเงินสดปิดกะ'}</h3>
                                        </div>
                                        <div className="flex-grow flex flex-col justify-center gap-3">
                                            <input 
                                                type="number" 
                                                value={closingCash === 0 && closingCash.toString() === "0" ? "" : closingCash} 
                                                onChange={e => setClosingCash(Number(e.target.value))} 
                                                className="w-full bg-[#fcfcf9] border-2 border-neutral-200 py-6 px-6 text-3xl font-black text-neutral-900 rounded-xl outline-none transition-all focus:border-neutral-800 focus:bg-white text-center" 
                                                placeholder="0.00" 
                                            />
                                            
                                            <button 
                                                onClick={handleOpenDrawerClick}
                                                className={`w-full py-3.5 border border-neutral-200 text-xs font-black uppercase tracking-widest transition-all rounded-[1.5rem] shadow-sm ${isDrawerOpen ? 'bg-neutral-50 text-neutral-400 border-neutral-200' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200/80 active:scale-95'}`}
                                            >
                                                {isDrawerOpen ? 'LOCKED / OPENED' : locale === 'en' ? 'OPEN DRAWER' : 'สั่งเปิดลิ้นชัก'}
                                            </button>

                                            <SwipeCloseShiftButton onSwipe={handleCloseShift} isSubmitting={isClosingShift} locale={locale} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
                </>
            )}

            {/* Shift Closure Step-Down Confirmation Modal removed */}

            <AnimatePresence>
              {transactionModal.open && transactionModal.type && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    className="bg-white border-2 border-neutral-200 p-6 sm:p-10 max-w-lg w-full shadow-2xl space-y-6 rounded-[2rem]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center ${transactionModal.type === 'pay_in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-[#D3202B]'}`}>
                        {transactionModal.type === 'pay_in' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-[#1A1A18]">
                          {transactionModal.type === 'pay_in' ? 'นำเงินเข้า' : 'นำเงินออก'}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mt-1">
                          {locale === 'en' ? 'Record cash in or out of drawer' : 'บันทึกเงินสดเข้าหรือออกจากลิ้นชัก'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">จำนวนเงิน</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={transactionModal.amount}
                          onChange={(e) => setTransactionModal(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full bg-[#fcfcf9] border-2 border-neutral-200 p-4 text-2xl font-black outline-none text-black rounded-xl"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">เหตุผล</label>
                        <input
                          type="text"
                          value={transactionModal.reason}
                          onChange={(e) => setTransactionModal(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full bg-[#fcfcf9] border-2 border-neutral-200 p-4 text-sm font-black outline-none text-black rounded-xl"
                          placeholder={transactionModal.type === 'pay_in' ? 'เช่น เติมเงินทอน' : 'เช่น เงินทอน / คืนเงิน'}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={closeTransactionModal}
                        disabled={loading}
                        className="flex-1 py-4 border-2 border-neutral-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 rounded-xl"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={submitTransaction}
                        disabled={loading || !transactionModal.amount || !transactionModal.reason.trim()}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 rounded-xl ${transactionModal.type === 'pay_in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                      >
                        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@200;300;400;500;900&family=Prompt:wght@200;300;400&display=swap');
                .font-serif-luxury { font-family: 'Cormorant Garamond', serif; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </main>
    )
}
