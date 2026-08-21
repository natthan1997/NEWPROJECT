'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getDeliveryPlatformBadge } from './POSHistory'

import POSRecipeViewModal from './POSRecipeViewModal'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CreditCard,
  Banknote,
  Search,
  LayoutGrid,
  Clock,
  Users,
  X,
  ChevronRight,
  Settings,
  ArrowLeft,
  History,
  ShieldCheck,
  Printer,
  QrCode,
  RefreshCcw,
  Image as ImageIcon,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  Bell,
  FileText,
  Ticket,
  ArrowRight,
  Home,
  MoreHorizontal,
  User,
  LogOut,
  UserPlus,
  Gift,
  Receipt,
  Coins,
  Percent,
  DollarSign,
  Wallet,
  Menu as MenuIcon,
  Filter,
  ChevronDown,
  List,
  Layers,
  Grid,
  BellRing,
  MapPin,
  Tag,
  Check,
  Truck,
  Utensils,
  Bike,
  AlertTriangle,
  Delete,
  Award,
  FlaskConical,
  Undo2,
  Power,
  Eye,
  Merge,
  Phone,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, type Profile } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { PrinterSocket } from 'custom-printer-plugin';
import { playAppSound } from '@/lib/audioUtils';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import { printCustomerReceipt, printKitchenTicket, printOpenDrawer, printPreReceipt } from '@/lib/printerUtils'
import { printGraphicModeCustomerReceipt, printGraphicModeKitchenTicket } from '@/lib/graphicPrinter'
import POSCustomerSelect from './POSCustomerSelect'
import POSShopStatusModal from './POSShopStatusModal'
import PointGenerator from './PointGenerator'
import POSHistoryPointsModal from './POSHistoryPointsModal'
import POSPinModal from './POSPinModal'
import POSSplitPaymentModal from './POSSplitPaymentModal'
import POSPromotionsModal from './POSPromotionsModal'
import DeliveryManager from '@/components/dashboard/delivery/DeliveryManager'
import { useI18n } from "@/lib/I18nContext";
import { fetchOrGenerateLoyaltyToken } from "@/lib/loyaltyUtils";
import { getMenuSearchText, getPrimaryMenuName, getSecondaryMenuName } from '@/lib/posMenuLabels'
import { sortMenuItemsByOrder } from '@/lib/posMenuOrder'

interface MenuItem {
  id: string
  name: string
  name_th?: string | null
  name_en?: string | null
  name_zh?: string | null
  sale_price: number
  cost_price?: number
  image_url: string | null
  category_id: string
  category?: { name: string }
  modifiers?: any[]
  platform_prices?: any
}

interface CartItem extends MenuItem {
  quantity: number
  selected_modifiers?: any[]
  note?: string
  discount_amount?: number
  discount_reason?: string
}

interface POSTable {
  id: string
  table_number: string
  zone: string
  status: string
}

const formatDeliveryPlatformLabel = (platform?: string | null) => {
  if (!platform) return 'เลือกค่าย'
  switch (platform) {
    case 'grab':
      return 'Grab'
    case 'lineman':
      return 'LINE MAN'
    case 'shopee':
      return 'ShopeeFood'
    case 'foodpanda':
      return 'foodpanda'
    case 'robinhood':
      return 'Robinhood'
    default:
      return platform.toUpperCase()
  }
}

type POSOrderIdentity = {
  orderNumber: string
  queueNumber: number
}

const normalizeLineModifiers = (modifiers?: any[]) =>
  JSON.stringify((modifiers || []).map((mod: any) => ({
    id: mod?.id || null,
    name: mod?.name || '',
    value: mod?.value || '',
    price: Number(mod?.price || 0),
  })).sort((a: any, b: any) => `${a.id || ''}${a.name}${a.value}${a.price}`.localeCompare(`${b.id || ''}${b.name}${b.value}${b.price}`)))

const cartLineKey = (item: any) => `${item.id || item.item_id}|${normalizeLineModifiers(item.selected_modifiers)}`
const POS_PRINT_FLOW_LOG = '[POS_PRINT_FLOW]'

const logPOSPrintFlow = (step: string, details?: any) => {
  if (details !== undefined) {
    console.log(POS_PRINT_FLOW_LOG, step, details)
  } else {
    console.log(POS_PRINT_FLOW_LOG, step)
  }
}

const buildCartFingerprint = (items: any[]) => {
  const summary = new Map<string, number>()
  items.forEach((item) => {
    const key = cartLineKey(item)
    summary.set(key, (summary.get(key) || 0) + Number(item.quantity || 0))
  })
  return Array.from(summary.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, quantity]) => `${key}:${quantity}`)
    .join('||')
}

const computeNewCartItems = (cartItems: any[], existingItems: any[]) => {
  const remainingExisting = new Map<string, number>()
  existingItems.forEach((item) => {
    const key = cartLineKey(item)
    remainingExisting.set(key, (remainingExisting.get(key) || 0) + Number(item.quantity || 0))
  })

  const delta: any[] = []
  cartItems.forEach((item) => {
    const key = cartLineKey(item)
    const existingQty = remainingExisting.get(key) || 0
    const cartQty = Number(item.quantity || 0)
    const newQty = Math.max(0, cartQty - existingQty)
    remainingExisting.set(key, Math.max(0, existingQty - cartQty))
    if (newQty > 0) delta.push({ ...item, quantity: newQty })
  })
  return delta
}

const getFallbackPrinterIp = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rushup_printer_ip') || localStorage.getItem('xylem_printer_ip') || null;
};

const setFallbackPrinterIp = (ip: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rushup_printer_ip', ip);
  localStorage.setItem('xylem_printer_ip', ip);
};

interface POSTerminalProps {
  profile: any
  activeShift: any
  isClosingSuccessShow?: boolean
  onShiftModalOpen: () => void
  shiftStats: any
  fetchShiftStats: (id: string) => void
  onCashActionModalOpen?: () => void
  onManageTables?: () => void
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onOpenShiftModal: () => void
  onOpenShift?: (cash: number) => Promise<void>
  onCloseShift?: (cash: number) => Promise<void>
  syncPulse?: number
  unlockAudio?: () => void
  isAudioEnabled?: boolean
  // Global States from Parent
  shopSettings: any
  setShopSettings: (s: any) => void
  pendingOrders: any[]
  setPendingOrders: (o: any[]) => void
  searchTerm: string
  setSearchTerm: (t: string) => void
  setIsStatusModalOpen: (o: boolean) => void
  isStatusModalOpen: boolean
  handleUpdateStatus: (status: string, expiry?: Date | null) => Promise<void>
  // New States
  cart: any[]
  setCart: React.Dispatch<React.SetStateAction<any[]>>
  selectedCustomer: any
  setSelectedCustomer: React.Dispatch<React.SetStateAction<any>>
  showCustomerModal: boolean
  setShowCustomerModal: (o: boolean) => void
  isCartExpanded: boolean
  setIsCartExpanded: (o: boolean) => void
  showPendingModal: boolean
  setShowPendingModal: (o: boolean) => void
  setViewExtraHeader: (node: React.ReactNode) => void
  // Lifted States
  selectedTable: any | null
  setSelectedTable: React.Dispatch<React.SetStateAction<any | null>>
  editingOrderId: string | null
  setEditingOrderId: React.Dispatch<React.SetStateAction<string | null>>
  editingOrderNumber: string | null
  setEditingOrderNumber: React.Dispatch<React.SetStateAction<string | null>>
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  setOrderType: React.Dispatch<React.SetStateAction<'dine_in' | 'takeaway' | 'delivery'>>
  deliveryPlatform: string
  setDeliveryPlatform: React.Dispatch<React.SetStateAction<string>>
  // Lifted Coupon States & Handlers
  claimingCoupons: any[]
  setClaimingCoupons: React.Dispatch<React.SetStateAction<any[]>>
  activeCouponClaimRequest: any | null
  setActiveCouponClaimRequest: React.Dispatch<React.SetStateAction<any | null>>
  appliedCouponId: string
  setAppliedCouponId: React.Dispatch<React.SetStateAction<string>>
  activeCoupon: any | null
  setActiveCoupon: React.Dispatch<React.SetStateAction<any | null>>
  pendingModalTab: 'orders' | 'coupons'
  setPendingModalTab: React.Dispatch<React.SetStateAction<'orders' | 'coupons'>>
  activeCategoryId: string | null
  setActiveCategoryId: React.Dispatch<React.SetStateAction<string | null>>
  handleAcceptCouponClaim: (claim: any) => void
  handleRejectCouponClaim: (claim: any) => Promise<void>
  discountValue: number
  setDiscountValue: React.Dispatch<React.SetStateAction<number>>
  discountRate: number
  setDiscountRate: React.Dispatch<React.SetStateAction<number>>
  discountType: 'fixed' | 'percent'
  setDiscountType: React.Dispatch<React.SetStateAction<'fixed' | 'percent'>>
  discountName: string
  setDiscountName: React.Dispatch<React.SetStateAction<string>>
  isAutoCreatingOrder?: boolean
  setIsAutoCreatingOrder?: React.Dispatch<React.SetStateAction<boolean>>
}


export function usePOSTerminal({
  profile,
  activeShift,
  onShiftModalOpen,
  shiftStats,
  fetchShiftStats,
  onCashActionModalOpen,
  onManageTables,
  activeView,
  allowedNav,
  onSetView,
  onOpenShiftModal,
  syncPulse,
  unlockAudio,
  isAudioEnabled,
  shopSettings,
  setShopSettings,
  pendingOrders,
  setPendingOrders,
  searchTerm,
  setSearchTerm,
  setIsStatusModalOpen,
  isStatusModalOpen,
  handleUpdateStatus,
  cart,
  setCart,
  selectedCustomer,
  setSelectedCustomer,
  showCustomerModal,
  setShowCustomerModal,
  isCartExpanded,
  setIsCartExpanded,
  showPendingModal,
  setShowPendingModal,
  setViewExtraHeader,
  selectedTable,
  setSelectedTable,
  editingOrderId,
  setEditingOrderId,
  editingOrderNumber,
  setEditingOrderNumber,
  orderType,
  setOrderType,
  deliveryPlatform,
  setDeliveryPlatform,
  claimingCoupons,
  setClaimingCoupons,
  activeCouponClaimRequest,
  setActiveCouponClaimRequest,
  appliedCouponId,
  setAppliedCouponId,
  activeCoupon,
  setActiveCoupon,
  pendingModalTab,
  setPendingModalTab,
  activeCategoryId,
  setActiveCategoryId,
  handleAcceptCouponClaim,
  handleRejectCouponClaim,
  discountValue,
  setDiscountValue,
  discountRate,
  setDiscountRate,
  discountType,
  setDiscountType,
  discountName,
  setDiscountName,
  isAutoCreatingOrder: isAutoCreatingOrderProp,
  setIsAutoCreatingOrder: setIsAutoCreatingOrderProp,
}: POSTerminalProps) {

  // --- INTERNAL STATES ---
  const paymentLockRef = useRef(false);
  const router = useRouter()
  const [items, setItems] = useState<MenuItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('pos_cached_items')
        if (cached) return JSON.parse(cached)
      } catch (e) {}
    }
    return []
  })
  const [categories, setCategories] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('pos_cached_categories')
        if (cached) return JSON.parse(cached)
      } catch (e) {}
    }
    return []
  })
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('pos_cached_items')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return false
        }
      } catch(e) {}
    }
    return true
  })
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
  const [tables, setTables] = useState<POSTable[]>([])
  const [successAudio, setSuccessAudio] = useState<HTMLAudioElement | null>(null)
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any | null>(null)

  // Real-time Member Check-in States
  const [memberCheckIns, setMemberCheckIns] = useState<any[]>([])
  const [linkedCheckInId, setLinkedCheckInId] = useState<string | null>(null)


  const { locale } = useI18n();
  const [showPointModal, setShowPointModal] = useState(false)
  const [showHistoryPointModalForCurrentOrder, setShowHistoryPointModalForCurrentOrder] = useState(false)
  const [currentPointOrderId, setCurrentPointOrderId] = useState<string | null>(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showDeliveryHub, setShowDeliveryHub] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMethod, setProcessingMethod] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const [paymentSplits, setPaymentSplits] = useState<any[]>([])


  // --- BILL DISCOUNT MODAL STATE ---
  const [showBillDiscountModal, setShowBillDiscountModal] = useState(false)
  const [billDiscountInput, setBillDiscountInput] = useState<string>('')
  const [billDiscountModalType, setBillDiscountModalType] = useState<'fixed' | 'percent'>('fixed')
  const [billDiscountReason, setBillDiscountReason] = useState<string>('')
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  const [vatRate, setVatRate] = useState(7) // Default to 7%

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const qrTargetOrderIdRef = useRef<string | null>(null)
  
  const editingOrderIdRef = useRef(editingOrderId)
  useEffect(() => { editingOrderIdRef.current = editingOrderId }, [editingOrderId])

  const branchIdRef = useRef(shopSettings?.branch_id)
  useEffect(() => { branchIdRef.current = shopSettings?.branch_id }, [shopSettings?.branch_id])

  // MODIFIER STATES
  const [modifierModalItem, setModifierModalItem] = useState<MenuItem | null>(null)
  const [optionsModalItem, setOptionsModalItem] = useState<MenuItem | null>(null)
  const [modifierGroups, setModifierGroups] = useState<any[]>([])
  const [tempSelectedModifiers, setTempSelectedModifiers] = useState<any[]>([])
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null)
  const [tempQuantity, setTempQuantity] = useState<number>(1)
  const [tempNote, setTempNote] = useState<string>('')

  // --- ITEM DISCOUNT MODAL STATE ---
  const [itemDiscountModalItem, setItemDiscountModalItem] = useState<CartItem | null>(null)
  const [itemDiscountValue, setItemDiscountValue] = useState<string>('')
  const [itemDiscountType, setItemDiscountType] = useState<'fixed' | 'percent'>('fixed')
  const [itemDiscountReason, setItemDiscountReason] = useState<string>('')
  const [activePromotions, setActivePromotions] = useState<any[]>([])
  const [showPromotionsModal, setShowPromotionsModal] = useState(false)


  const [hasVat, setHasVat] = useState(false) // Default to false as requested
  const [hasServiceCharge, setHasServiceCharge] = useState(false)

const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [mergeTableTarget, setMergeTableTarget] = useState<{table: any, pendingOrder: any} | null>(null)
  const [tableActionTarget, setTableActionTarget] = useState<POSTable | null>(null)
  const [pendingOrderTypeSwitch, setPendingOrderTypeSwitch] = useState<'dine_in' | 'takeaway' | 'delivery' | null>(null)
  const [pinCallback, setPinCallback] = useState<(() => void) | null>(null)
  const [pinTitle, setPinTitle] = useState('')
  const [pinDesc, setPinDesc] = useState('')

  const [couponSelectorCoupon, setCouponSelectorCoupon] = useState<any | null>(null)
  const [activeCouponCount, setActiveCouponCount] = useState<number>(0)

  // We keep this to show the member's available coupons in a future modal if needed
  const [memberAvailableCoupons, setMemberAvailableCoupons] = useState<any[]>([])

  // Cash Payment Modal States
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false)
  const [inlineCashPayment, setInlineCashPayment] = useState(false)
  
  const [totalPaid, setTotalPaid] = useState<number>(0)
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false)
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0)
  const [cashReceived, setCashReceived] = useState('')
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ received: number, change: number, orderId: string, orderNumber: string, queueNumber?: string, items: any[], subtotal: number, discount: number, tax: number, serviceCharge: number, total: number, paymentMethod: string, timestamp: string, deliveryPlatform?: string, referenceName?: string, tableNumber?: string, customerName?: string, orderType?: string, orderSource?: string, comment?: string, notes?: string, pickupTime?: string } | null>(null)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(-1)

  const [selectedTableZone, setSelectedTableZone] = useState('All')


  const [flyingItems, setFlyingItems] = useState<{id: string, x: number, y: number, imageUrl?: string}[]>([])
  const [isCartBumping, setIsCartBumping] = useState(false)
  const [platformOrderId, setPlatformOrderId] = useState('')
  const [isDeliveryPlatformModalOpen, setIsDeliveryPlatformModalOpen] = useState(false)
  const [memberLookupMode, setMemberLookupMode] = useState<'phone' | 'qr'>('qr')
  const [draftDeliveryPlatform, setDraftDeliveryPlatform] = useState('')
  const [draftPlatformOrderId, setDraftPlatformOrderId] = useState('')
  const [heldCartFingerprint, setHeldCartFingerprint] = useState<string | null>(null)

  const activeDeliveryPlatforms = shopSettings?.opening_hours?.active_delivery_platforms || ['grab', 'lineman', 'shopee', 'foodpanda', 'robinhood']

  const [showDeliveryCheckoutModal, setShowDeliveryCheckoutModal] = useState(false)

  // Member Checkout Flow States
  const [showMemberCheckoutFlow, setShowMemberCheckoutFlow] = useState(false)
  const showMemberCheckoutFlowRef = useRef(showMemberCheckoutFlow)
  useEffect(() => {
    showMemberCheckoutFlowRef.current = showMemberCheckoutFlow
  }, [showMemberCheckoutFlow])
  const [memberCheckoutStep, setMemberCheckoutStep] = useState<'lookup' | 'points'>('lookup')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [isSearchingMember, setIsSearchingMember] = useState(false)
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([])
  const [memberTiers, setMemberTiers] = useState<any[]>([])
  const [posQrLoyaltyToken, setPosQrLoyaltyToken] = useState<string | null>(null)
  const [posQrPointsEarned, setPosQrPointsEarned] = useState<number>(0)
  const [qrSessionId, setQrSessionId] = useState<string>('')

  // Reset payment/member steps and sub-views to the first step whenever payment modal or member flow opens
  useEffect(() => {
    if (showPaymentModal) {
      setInlineCashPayment(false);
      setShowSplitPaymentModal(false);
    }
  }, [showPaymentModal]);

  useEffect(() => {
    if (showMemberCheckoutFlow) {
      setMemberCheckoutStep('lookup');
    }
  }, [showMemberCheckoutFlow]);


  const openDeliveryPlatformModal = (platformOverride?: string) => {
    // ผู้ใช้ต้องการให้ "กดคือต้องเลือกค่ายใหม่ทุกครั้ง" จึงบังคับเคลียร์ค่า draft เสมอ
    setDraftDeliveryPlatform('')
    setDraftPlatformOrderId(platformOrderId || '')
    setIsDeliveryPlatformModalOpen(true)
  }

  const saveDeliveryPlatformDetails = () => {
    const trimmedOrderId = draftPlatformOrderId.trim()
    if (!draftDeliveryPlatform) {
      alert('กรุณาเลือกค่ายเดลิเวอรี่ก่อน')
      return
    }
    if (!trimmedOrderId) {
      alert('กรุณากรอกเลขบิลของออเดอร์เดลิเวอรี่')
      return
    }
    setDeliveryPlatform(draftDeliveryPlatform)
    setPlatformOrderId(trimmedOrderId)
    setIsDeliveryPlatformModalOpen(false)
  }

  const resetDeliveryDraft = () => {
    setDeliveryPlatform('')
    setPlatformOrderId('')
    setDraftDeliveryPlatform('')
    setDraftPlatformOrderId('')
    setIsDeliveryPlatformModalOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_saved_delivery_platform')
      localStorage.removeItem('pos_saved_platform_order_id')
    }
  }

  const resetOrderComposer = () => {
    if (editingOrderId) {
      const targetId = editingOrderId;
      void (async () => {
        try {
          const { data: ord } = await supabase
            .from('pos_orders')
            .select('id, status, total_amount, pos_order_items(id)')
            .eq('id', targetId)
            .maybeSingle();

          if (ord && ord.status === 'pending' && Number(ord.total_amount || 0) === 0 && (!ord.pos_order_items || ord.pos_order_items.length === 0)) {
            await supabase.from('pos_orders').delete().eq('id', targetId);
          }
        } catch (e) {
          console.error('Error cleaning up draft order on reset:', e);
        }
      })();
    }

    setCart([])
    setHeldCartFingerprint(null)
    setEditingOrderId(null)
    setEditingOrderNumber(null)
    setSelectedTable(null)
    setSelectedCustomer(null)
    setLinkedCheckInId(null)
    setIsCartExpanded(false)
    setOrderType('dine_in')
    resetDeliveryDraft()
    setDiscountValue(0)
    setDiscountRate(0)
    setDiscountType('percent')
    setDiscountName('')
    setAppliedCouponId('')
    setActiveCoupon(null)
    setMemberCheckoutStep('lookup')
    setInlineCashPayment(false)
    setShowSplitPaymentModal(false)
    setShowPaymentModal(false)
    setShowMemberCheckoutFlow(false)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_saved_cart')
      localStorage.removeItem('pos_saved_order_type')
      localStorage.removeItem('pos_saved_editing_order_id')
      localStorage.removeItem('pos_saved_editing_order_number')
      localStorage.removeItem('pos_saved_selected_table')
    }
  }

  const ensureDeliveryDetailsReady = () => {
    if (orderType !== 'delivery') return true
    if (!deliveryPlatform || !platformOrderId.trim()) {
      openDeliveryPlatformModal(deliveryPlatform || activeDeliveryPlatforms[0] || 'grab')
      return false
    }
    return true
  }

  const userRole = profile?.role || 'staff'
  const canToggleStock = ['admin', 'owner', 'superadmin'].includes(userRole) || shopSettings?.role_permissions?.[userRole]?.includes('menu-stock-toggle')

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPressTriggered = useRef(false)
  const touchStartPos = useRef<{ x: number, y: number } | null>(null)
  const [localIsAutoCreatingOrder, setLocalIsAutoCreatingOrder] = useState(false)
  const isAutoCreatingOrder = isAutoCreatingOrderProp !== undefined ? isAutoCreatingOrderProp : localIsAutoCreatingOrder
  const setIsAutoCreatingOrder = setIsAutoCreatingOrderProp || setLocalIsAutoCreatingOrder
  const isAutoCreatingOrderLock = useRef(false)

  const handlePressStart = (e: React.TouchEvent | React.MouseEvent, item: MenuItem) => {
    isLongPressTriggered.current = false
    
    if ('touches' in e) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else {
      touchStartPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }
    }

    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true
      setOptionsModalItem(item)
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50)
      }
    }, 600)
  }

  const handlePressMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return
    
    let currentX, currentY;
    if ('touches' in e) {
      currentX = e.touches[0].clientX
      currentY = e.touches[0].clientY
    } else {
      currentX = (e as React.MouseEvent).clientX
      currentY = (e as React.MouseEvent).clientY
    }

    const diffX = Math.abs(currentX - touchStartPos.current.x)
    const diffY = Math.abs(currentY - touchStartPos.current.y)

    // If moved more than 30 pixels, it's a scroll, so cancel the long press
    if (diffX > 30 || diffY > 30) {
      handlePressCancel()
    }
  }

  function handlePressCancel() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
  }



  const toggleItemStock = async (item: MenuItem, closeMode: 'today' | 'indefinite' | null = null) => {
    try {
      const newStockStatus = item.in_stock === false ? true : false
      // Optimistic update
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, in_stock: newStockStatus } : i))
      
      const { error: menuError } = await supabase.from('pos_menu_items').update({ in_stock: newStockStatus }).eq('id', item.id)
      if (menuError) throw menuError

      // Manage auto_restock_daily_items in pos_shop_settings
      if (shopSettings?.branch_id) {
        let currentAutoRestock = shopSettings?.settings?.auto_restock_daily_items || []
        let needsUpdate = false
        
        if (newStockStatus === false && closeMode === 'today') {
          if (!currentAutoRestock.includes(item.id)) {
            currentAutoRestock = [...currentAutoRestock, item.id]
            needsUpdate = true
          }
        } else {
          // If opening, or closing indefinitely, remove from auto-restock
          if (currentAutoRestock.includes(item.id)) {
            currentAutoRestock = currentAutoRestock.filter((id: string) => id !== item.id)
            needsUpdate = true
          }
        }
        
        if (needsUpdate) {
           const updatedSettings = { ...(shopSettings.settings || {}), auto_restock_daily_items: currentAutoRestock }
           const { error: settingsError } = await supabase.from('pos_shop_settings')
             .update({ settings: updatedSettings })
             .eq('branch_id', shopSettings.branch_id)
           if (settingsError) console.error('Error updating auto_restock_daily_items:', settingsError)
        }
      }

    } catch (err: any) {
      console.error('Error toggling stock:', err)
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, in_stock: item.in_stock } : i))
      Swal.fire({
        title: 'Error',
        text: 'Failed to update stock status: ' + err.message,
        icon: 'error',
        confirmButtonColor: '#000',
      })
    }
  }

  const handleProductClick = (e: React.MouseEvent, item: MenuItem) => {
    if (!item.modifiers || item.modifiers.length === 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const startX = rect.left + rect.width / 2
      const startY = rect.top + rect.height / 2
      
      const id = Date.now().toString() + Math.random()
      setFlyingItems(prev => [...prev, { id, x: startX, y: startY, imageUrl: item.image_url || undefined }])
      
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(fi => fi.id !== id))
      }, 500)
    }
    addToCart(item)
  }



  const buildNativePreReceipt = (
    model: string = 'xprinter-xp-n160ii',
    encoding: string = 'cp874',
    orderTypeForPrint: string = orderType,
    deliveryPlatformForPrint: string = deliveryPlatform,
    platformOrderIdForPrint: string = platformOrderId
  ) => {
    const encoder = new ReceiptPrinterEncoder({
      printerModel: model as any,
      columns: 48, codepageMapping: { 'cp874': 0xff, 'tis620': 0xff }
    });
    
    let result = encoder.initialize().codepage(encoding as any).align('center');
    
    result = result.bold(true).size(2, 2).line(shopSettings?.shop_name || 'RUSH UP').size(1, 1).bold(false);
    result = result.newline();
    result = result.bold(true).line('BILL / ใบแจ้งยอด').bold(false).newline();
    
    result = result.align('left').line(`Date       : ${new Date().toLocaleString()}`);
    result = result.line(`Type       : ${orderTypeForPrint === 'delivery' ? 'DELIVERY' : orderTypeForPrint === 'takeaway' ? 'TAKEAWAY' : 'DINE-IN'}`);
    if (orderTypeForPrint === 'delivery') {
      result = result.line(`Platform   : ${deliveryPlatformForPrint ? deliveryPlatformForPrint.toUpperCase() : '-'}`);
      result = result.line(`Bill No.   : ${platformOrderIdForPrint || '-'}`);
    }
    if (selectedTable) result = result.line(`Table      : ${selectedTable.table_number}`);
    
    result = result.line('-'.repeat(48));
    
    const isLarge = shopSettings?.receipt_font_size === 'large';
    
    cart.forEach(item => {
      const quantity = item.quantity || 1;
      const title = `${quantity}x ${item.name}`;
      const itemSubtotal = getEffectiveItemUnitPrice(item) * quantity;
      const priceStr = itemSubtotal.toLocaleString();
      
      const space = Math.max(0, 48 - title.length - priceStr.length);
      const lineStr = title + ' '.repeat(space) + priceStr;
      
      if (isLarge) {
          result = result.size(1, 2).line(lineStr).size(1, 1);
      } else {
          result = result.line(lineStr);
      }
      
      if (item.selected_modifiers && item.selected_modifiers.length > 0) {
        item.selected_modifiers.forEach((m: any) => {
          if (isLarge) {
              result = result.size(1, 2).line(`   - ${m.name}`).size(1, 1);
          } else {
              result = result.line(`   - ${m.name}`);
          }
        });
      }
    });
    
    result = result.line('-'.repeat(48)).align('right');
    
    if (isLarge) result = result.size(1, 2);
    result = result.line(`Subtotal: ${cartSubTotal.toLocaleString()}`);
    if (discountTotalValue > 0) result = result.line(`Discount: -${discountTotalValue.toLocaleString()}`);
    if (vatAmount > 0) result = result.line(`VAT: ${vatAmount.toLocaleString()}`);
    result = result.bold(true).line(`Total: ${cartTotal.toLocaleString()}`).bold(false);
    if (isLarge) result = result.size(1, 1);
    
    result = result.newline();
    result = result.align('center');
    
    if (shopSettings?.receipt_footer) {
      const footerLines = shopSettings.receipt_footer.split('\n');
      footerLines.forEach((line: string) => result = result.line(line));
      result = result.newline();
    } else {
      result = result.line('Please review your order').newline();
    }
    
    return result.newline().newline().newline().cut().encode();
  };

  const fetchPrintOrderData = async (orderId: string) => {
    const { data: order, error } = await supabase
      .from('pos_orders')
      .select(`*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(*)`)
      .eq('id', orderId)
      .maybeSingle()

    if (error) throw error
    if (!order) throw new Error('ไม่พบข้อมูลออเดอร์ในระบบ')

    const getPaidAmountLocal = (o: any) => {
      const paymentRows = Array.isArray(o.pos_order_payments) ? o.pos_order_payments : []
      const paidFromRows = paymentRows
        .filter((row: any) => String(row.status || '').toLowerCase() === 'paid')
        .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
      return paidFromRows > 0 ? paidFromRows : Number(o.net_total ?? o.total_amount ?? 0)
    }

    const getOrderPaymentMethodLocal = (o: any) => {
      const paymentRows = Array.isArray(o.pos_order_payments) ? o.pos_order_payments : []
      const firstPaidMethod = paymentRows.find((row: any) => String(row.status || '').toLowerCase() === 'paid')?.payment_method
      return firstPaidMethod || o.payment_method || 'cash'
    }

    const orderData: any = {
      orderNumber: order.order_number,
      queueNumber: order.queue_number ? String(order.queue_number) : undefined,
      date: new Date(order.created_at).toLocaleString('th-TH'),
      orderSource: order.order_source || 'pos',
      staffName: profile?.full_name || profile?.display_name || 'POS',
      customerName: order.customer_name || undefined,
      tableNumber: order.table_number || undefined,
      comment: order.comment || order.notes || '',
      pickupTime: order.pickup_time || '',
      items: (order.pos_order_items || []).map((item: any) => ({
        name: item.item?.name || item.name || 'Unknown Item',
        quantity: Number(item.quantity || 0),
        subtotal: Number(item.subtotal || (Number(item.unit_price || 0) * Number(item.quantity || 0))),
        selected_modifiers: item.selected_modifiers || [],
        category_id: item.item?.category_id || 'uncategorized'
      })),
      subtotal: Number(order.total_amount || 0),
      discount: Number(order.discount_amount || 0),
      tax: Number(order.tax_amount || 0),
      total: Number(order.net_total ?? order.total_amount ?? 0),
      paymentMethod: getOrderPaymentMethodLocal(order),
      receivedAmount: getPaidAmountLocal(order),
      changeAmount: Math.max(0, getPaidAmountLocal(order) - Number(order.net_total ?? order.total_amount ?? 0)),
      orderType: order.order_type || 'dine_in',
      deliveryPlatform: order.delivery_platform || undefined,
      referenceName: order.reference_name || undefined,
      deliveryFee: Number(order.delivery_fee || 0),
    }

    if (order.id && !order.customer_id && !order.customer_name && (!order.points_earned || order.points_earned === 0)) {
      const netTotal = Number(order.net_total ?? order.total_amount ?? 0)
      const { token, points } = await fetchOrGenerateLoyaltyToken(order.id, netTotal, shopSettings)
      if (token) {
        orderData.loyaltyClaimToken = token
        orderData.pointsEarned = points
      }
    }

    return orderData
  }

  const executeNativePrint = async (type: 'receipt' | 'kitchen', openDrawer: boolean = false) => {
    const printers = shopSettings?.printers || [];
    let targetPrinters = printers.filter((p: any) => p.type === type || p.type === 'both');
    if (type === 'receipt' && targetPrinters.length === 0) {
        targetPrinters = printers.filter((p: any) => p.type === 'kitchen' || p.type === 'both');
    }
    
    // Fallback if no printers configured in DB or none of them have an IP
    if (targetPrinters.length === 0 || targetPrinters.every((p: any) => !p.ip)) {
        let ip = getFallbackPrinterIp();
        if (!ip) {
            ip = prompt('กรุณาระบุ IP Address ของเครื่องปริ้น (เช่น 192.168.1.100):', '192.168.1.100');
            if (ip) setFallbackPrinterIp(ip);
            else return;
        }
        targetPrinters = [{ ip, type, model: 'xprinter-xp-n160ii', encoding: 'graphic', categories: ['all'] }];
    }

    try {
        let currentPrintOrderData: any = null;
        if (paymentSuccessData) {
            if (paymentSuccessData.orderId && paymentSuccessData.orderId !== 'NEW') {
                try {
                    currentPrintOrderData = await fetchPrintOrderData(paymentSuccessData.orderId);
                } catch (err) {
                    console.warn('Failed to fetch order from DB, falling back to state data:', err);
                }
            }
            if (!currentPrintOrderData) {
                currentPrintOrderData = {
                  orderNumber: paymentSuccessData.orderNumber,
                  queueNumber: paymentSuccessData.queueNumber,
                  date: new Date(paymentSuccessData.timestamp).toLocaleString(),
                  orderSource: paymentSuccessData.orderSource || 'pos',
                  tableNumber: paymentSuccessData.tableNumber,
                  orderType: paymentSuccessData.orderType || orderType,
                  staffName: profile?.full_name || 'Staff',
                  customerName: paymentSuccessData.customerName,
                  deliveryPlatform: paymentSuccessData.deliveryPlatform,
                  referenceName: paymentSuccessData.referenceName,
                  comment: paymentSuccessData.comment || paymentSuccessData.notes || '',
                  pickupTime: paymentSuccessData.pickupTime || '',
                  subtotal: paymentSuccessData.subtotal,
                  discount: paymentSuccessData.discount,
                  serviceCharge: paymentSuccessData.serviceCharge,
                  tax: paymentSuccessData.tax,
                  total: paymentSuccessData.total,
                  paymentMethod: paymentSuccessData.paymentMethod,
                  receivedAmount: paymentSuccessData.received,
                  changeAmount: paymentSuccessData.change,
                  items: paymentSuccessData.items
                };
            }
        } else {
            // Manual Print: Construct from current cart and state
            const cartSubTotal = cart.reduce((total, item) => total + (item.cost_price || 0) * item.quantity, 0); // Not real subtotal but fallback
            const cartTotal = rawCartSubTotal - discountTotalValue - itemDiscountTotal + serviceChargeAmount + vatAmount;
            
            currentPrintOrderData = {
              orderNumber: editingOrderNumber || 'Draft',
              queueNumber: editingOrderId ? String(getPreviewQueueNumber(editingOrderId) || '') : '',
              date: new Date().toLocaleString(),
              orderSource: 'pos',
              tableNumber: selectedTable?.table_number || 'Unknown',
              orderType: orderType,
              staffName: profile?.full_name || 'Staff',
              customerName: selectedCustomer?.display_name || selectedCustomer?.full_name || '',
              deliveryPlatform: orderType === 'delivery' ? deliveryPlatform : '',
              referenceName: orderType === 'delivery' ? platformOrderId : '',
              comment: '',
              pickupTime: '',
              subtotal: rawCartSubTotal,
              discount: discountTotalValue + itemDiscountTotal,
              serviceCharge: serviceChargeAmount,
              tax: vatAmount,
              total: cartTotal,
              paymentMethod: 'Unpaid',
              receivedAmount: 0,
              changeAmount: 0,
              items: cart.map(i => ({
                 name: i.name,
                 quantity: i.quantity,
                 modifiers: i.selected_modifiers?.map((m: any) => m.name) || [],
                 selected_modifiers: i.selected_modifiers || [],
                 category_id: i.category_id,
                 sale_price: getEffectiveItemUnitPrice(i)
              }))
            };
        }
        
        const storyMode = shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode;
        const availableStories = shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || [];
        
        let passStories = availableStories;
        if (selectedStoryIndex !== -1 && passStories.length > selectedStoryIndex) {
            passStories = [passStories[selectedStoryIndex]];
        }

        const printShopData = {
          name: shopSettings?.name || shopSettings?.shop_name || 'RUSH UP',
          branch: shopSettings?.branch_name,
          taxId: shopSettings?.tax_id,
          address: shopSettings?.address,
          phone: shopSettings?.phone,
          receiptHeader: shopSettings?.opening_hours?.receipt_header || shopSettings?.receipt_header,
          receiptFooter: shopSettings?.opening_hours?.receipt_footer || shopSettings?.receipt_footer,
          receiptShowLogo: shopSettings?.receipt_show_logo,
          receiptFontSize: shopSettings?.receipt_font_size,
          kitchenFontSize: shopSettings?.kitchen_font_size,
          kitchenShowType: shopSettings?.kitchen_show_type,
          orderNumberFormat: shopSettings?.order_number_format || shopSettings?.opening_hours?.order_number_format,
          receiptPaymentQrImage: shopSettings?.opening_hours?.receipt_payment_qr_image
            || shopSettings?.receipt_payment_qr_image
            || (shopSettings as any)?.receipt_payment_qr_image,
          receipt_story_mode: storyMode,
          receipt_stories: passStories
        };

        const printJobs = targetPrinters.map(async (printer: any) => {
            if (!printer.ip) return;
            if (type === 'receipt') {
               if (printer.encoding === 'graphic') {
                   const { printGraphicModeCustomerReceipt } = await import('@/lib/graphicPrinter');
                   await printGraphicModeCustomerReceipt(printer.ip, currentPrintOrderData, printShopData, printer.model, printer.encoding, openDrawer);
               } else {
                   await printCustomerReceipt(printer.ip, currentPrintOrderData, printShopData, printer.model, printer.encoding, openDrawer);
               }
            } else {
               let itemsToPrint = currentPrintOrderData.items;
               const printerCats = printer.categories || [];
               
               if (!printerCats.includes('all') && printerCats.length > 0) {
                  itemsToPrint = currentPrintOrderData.items.filter((i: any) => printerCats.includes(i.category_id));
               }
               
               if (itemsToPrint.length > 0) {
                  const routedOrderData = { ...currentPrintOrderData, items: itemsToPrint };
                  if (printer.encoding === 'graphic') {
                      const { printGraphicModeKitchenTicket } = await import('@/lib/graphicPrinter');
                      await printGraphicModeKitchenTicket(printer.ip, routedOrderData, printShopData, printer.model, printer.encoding);
                  } else {
                      await printKitchenTicket(printer.ip, routedOrderData, printShopData, printer.model, printer.encoding);
                  }
               }
            }
        });
        const results = await Promise.allSettled(printJobs);
        const errors = results.filter(r => r.status === 'rejected').map((r: any) => r.reason?.message || r.reason);
        if (errors.length > 0) {
           throw new Error(errors.join(', '));
        }
    } catch (e: any) {
        console.error(e);
        alert('Native print error: ' + (e?.message || JSON.stringify(e)));
    }
  };

  const printFromDatabaseOrder = async (orderId: string, type: 'receipt' | 'kitchen', openDrawer: boolean = false, preloadedOrderData?: any) => {
    logPOSPrintFlow('print_from_db:start', { orderId, type })

    let orderData: any;
    if (preloadedOrderData) {
      logPOSPrintFlow('print_from_db:using_preloaded', { orderId, type })
      orderData = {
        orderNumber: preloadedOrderData.orderNumber,
        queueNumber: preloadedOrderData.queueNumber,
        date: preloadedOrderData.date || new Date(preloadedOrderData.timestamp || Date.now()).toLocaleString('th-TH'),
        orderSource: preloadedOrderData.orderSource || 'pos',
        staffName: preloadedOrderData.staffName || profile?.full_name || profile?.display_name || 'POS',
        customerName: preloadedOrderData.customerName || undefined,
        tableNumber: preloadedOrderData.tableNumber || undefined,
        comment: preloadedOrderData.comment || preloadedOrderData.notes || '',
        pickupTime: preloadedOrderData.pickupTime || '',
        items: (preloadedOrderData.items || []).map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity || 0),
          subtotal: Number(item.subtotal || 0),
          selected_modifiers: item.selected_modifiers || [],
          category_id: item.category_id || 'uncategorized'
        })),
        subtotal: Number(preloadedOrderData.subtotal || 0),
        discount: Number(preloadedOrderData.discount || 0),
        tax: Number(preloadedOrderData.tax || 0),
        total: Number(preloadedOrderData.total || 0),
        paymentMethod: preloadedOrderData.paymentMethod,
        receivedAmount: Number(preloadedOrderData.receivedAmount ?? preloadedOrderData.received ?? 0),
        changeAmount: Number(preloadedOrderData.changeAmount ?? preloadedOrderData.change ?? 0),
        orderType: preloadedOrderData.orderType || 'dine_in',
        deliveryPlatform: preloadedOrderData.deliveryPlatform,
        referenceName: preloadedOrderData.referenceName,
        deliveryFee: Number(preloadedOrderData.deliveryFee || 0),
        loyaltyClaimToken: preloadedOrderData.loyaltyClaimToken,
        pointsEarned: preloadedOrderData.pointsEarned,
      };

      if (type === 'receipt' && orderId && orderId !== 'NEW' && !orderData.customerName && (!orderData.pointsEarned || orderData.pointsEarned === 0)) {
        const netTotal = Number(orderData.total || 0)
        const { token, points } = await fetchOrGenerateLoyaltyToken(orderId, netTotal, shopSettings)
        if (token) {
          orderData.loyaltyClaimToken = token
          orderData.pointsEarned = points
        }
      }
    } else {
      // 1. Fetch order exactly like POSHistory
      const { data: order, error } = await supabase
        .from('pos_orders')
        .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status), customer:pos_members!customer_id(display_name, full_name, phone)')
        .eq('id', orderId)
        .maybeSingle();

      if (error) {
        console.error('Database fetch error for print:', error);
        logPOSPrintFlow('print_from_db:order_fetch_fail', { orderId, type, error: error.message || error })
        throw error;
      }
      if (!order) {
        logPOSPrintFlow('print_from_db:order_missing', { orderId, type })
        throw new Error('ไม่พบข้อมูลออเดอร์ในระบบ');
      }

      const getPaidAmountLocal = (o: any) => {
        const paymentRows = Array.isArray(o.pos_order_payments) ? o.pos_order_payments : []
        const paidFromRows = paymentRows
          .filter((row: any) => String(row.status || '').toLowerCase() === 'paid')
          .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
        return paidFromRows > 0 ? paidFromRows : Number(o.net_total ?? o.total_amount ?? 0)
      }

      const getOrderPaymentMethodLocal = (o: any) => {
        const paymentRows = Array.isArray(o.pos_order_payments) ? o.pos_order_payments : []
        const firstPaidMethod = paymentRows.find((row: any) => String(row.status || '').toLowerCase() === 'paid')?.payment_method
        return firstPaidMethod || o.payment_method || 'cash'
      }

      orderData = {
        orderNumber: order.order_number,
        queueNumber: order.queue_number ? String(order.queue_number) : undefined,
        date: new Date(order.created_at).toLocaleString('th-TH'),
        orderSource: order.order_source || 'pos',
        staffName: profile?.full_name || profile?.display_name || 'POS',
        customerName: order.customer?.full_name || order.customer?.display_name || order.customer_name || undefined,
        tableNumber: order.table_number || undefined,
        items: (order.pos_order_items || []).map((item: any) => ({
          name: item.item?.name || item.name || 'Unknown Item',
          quantity: Number(item.quantity || 0),
          subtotal: Number(item.subtotal || (Number(item.unit_price || 0) * Number(item.quantity || 0))),
          selected_modifiers: item.selected_modifiers || [],
          category_id: item.item?.category_id || 'uncategorized'
        })),
        subtotal: Number(order.total_amount || 0),
        discount: Number(order.discount_amount || 0),
        tax: Number(order.tax_amount || 0),
        total: Number(order.net_total ?? order.total_amount ?? 0),
        paymentMethod: getOrderPaymentMethodLocal(order),
        receivedAmount: getPaidAmountLocal(order),
        changeAmount: Math.max(0, getPaidAmountLocal(order) - Number(order.net_total ?? order.total_amount ?? 0)),
        orderType: order.order_type || 'dine_in',
        deliveryPlatform: order.delivery_platform || undefined,
        referenceName: order.reference_name || undefined,
        deliveryFee: Number(order.delivery_fee || 0),
        loyaltyClaimToken: order.loyalty_claim_token || undefined,
        pointsEarned: order.points_earned || undefined,
      };

      if (type === 'receipt' && order.id && !order.customer_id && !order.customer_name && (!order.points_earned || order.points_earned === 0)) {
        const netTotal = Number(order.net_total ?? order.total_amount ?? 0)
        const { token, points } = await fetchOrGenerateLoyaltyToken(order.id, netTotal, shopSettings)
        if (token) {
          orderData.loyaltyClaimToken = token
          orderData.pointsEarned = points
        }
      }
    }

    let paymentsBreakdown: any[] = [];
    if (orderId && orderId !== 'NEW') {
      try {
        const { data: payRecords } = await supabase
          .from('pos_order_payments')
          .select('payment_method, amount, status')
          .eq('order_id', orderId);
        if (payRecords) {
          paymentsBreakdown = payRecords
            .filter((p: any) => String(p.status || '').toLowerCase() === 'paid')
            .map((p: any) => ({
              method: p.payment_method || 'cash',
              amount: Number(p.amount || 0)
            }));
        }
      } catch (e) {
        console.error('Failed to fetch payments breakdown:', e);
      }
    }
    if (orderData) {
      orderData.paymentsBreakdown = paymentsBreakdown;
    }

    // 3. Map shop settings exactly like POSHistory
    const shopData = {
      name: shopSettings?.name || shopSettings?.branch_name || 'RUSH UP',
      branch: shopSettings?.branch_name || '',
      taxId: shopSettings?.tax_id || '',
      address: shopSettings?.address || '',
      phone: shopSettings?.phone || '',
      receiptHeader: shopSettings?.opening_hours?.receipt_header || shopSettings?.receipt_header || '',
      receiptFooter: shopSettings?.opening_hours?.receipt_footer || shopSettings?.receipt_footer || '',
      receiptFontSize: shopSettings?.receipt_font_size || 'normal',
      kitchenFontSize: shopSettings?.kitchen_font_size || 'normal',
      kitchenShowType: shopSettings?.kitchen_show_type,
      orderNumberFormat: shopSettings?.order_number_format || shopSettings?.opening_hours?.order_number_format,
      receiptShowLogo: shopSettings?.receipt_show_logo || false,
      receipt_story_mode: shopSettings?.receipt_story_mode ?? shopSettings?.opening_hours?.receipt_story_mode ?? false,
      receipt_stories: (shopSettings?.receipt_stories && shopSettings.receipt_stories.length > 0)
        ? shopSettings.receipt_stories
        : (shopSettings?.opening_hours?.receipt_stories || []),
      receiptPaymentQrImage: shopSettings?.opening_hours?.receipt_payment_qr_image
        || shopSettings?.receipt_payment_qr_image
        || (shopSettings as any)?.receipt_payment_qr_image,
    };

    const printers = Array.isArray(shopSettings?.printers) ? shopSettings.printers : [];
    let targetPrinters = printers.filter((p: any) => p?.type === type || p?.type === 'both');
    if (type === 'receipt' && targetPrinters.length === 0) {
      targetPrinters = printers.filter((p: any) => p?.type === 'kitchen' || p?.type === 'both');
    }
    
    if (targetPrinters.length === 0 || targetPrinters.every((p: any) => !p.ip)) {
      const fallbackIp = getFallbackPrinterIp();
      if (fallbackIp) {
        targetPrinters = [{ ip: fallbackIp, type, model: 'xprinter-xp-n160ii', encoding: 'graphic', categories: ['all'] }];
      } else {
        logPOSPrintFlow('print_from_db:no_printer', { orderId: orderId, type, configuredPrinters: printers.length })
        throw new Error('ไม่พบเครื่องปริ้น หรือเครื่องปริ้นยังไม่มี IP Address')
      }
    }

    logPOSPrintFlow('printer_selection', {
      orderId,
      type,
      printers: targetPrinters.map((printer: any) => ({
        name: printer.name,
        ip: printer.ip,
        type: printer.type,
        encoding: printer.encoding || 'graphic',
        categories: printer.categories || [],
      })),
    })

    // 5. Send print jobs exactly like POSHistory reprint
    let queuedPrintJobs = 0
    const printJobs = targetPrinters.map(async (printer: any) => {
      if (!printer?.ip) return;
      const encoding = printer.encoding || 'graphic'
      if (type === 'receipt') {
        queuedPrintJobs += 1
        logPOSPrintFlow('print:start', { orderId, type, ip: printer.ip, encoding })
        if (encoding === 'graphic') {
          await printGraphicModeCustomerReceipt(printer.ip, orderData, shopData, printer.model, encoding, openDrawer);
        } else {
          await printCustomerReceipt(printer.ip, orderData, shopData, printer.model, encoding, openDrawer);
        }
        logPOSPrintFlow('print:success', { orderId, type, ip: printer.ip, encoding })
      } else {
        let itemsToPrint = orderData.items;
        const printerCats = printer.categories || [];
        if (!printerCats.includes('all') && printerCats.length > 0) {
          itemsToPrint = orderData.items.filter((i: any) => printerCats.includes(i.category_id));
        }

        if (itemsToPrint.length > 0) {
          queuedPrintJobs += 1
          const routedOrderData = { ...orderData, items: itemsToPrint };
          logPOSPrintFlow('print:start', { orderId, type, ip: printer.ip, encoding, itemCount: itemsToPrint.length })
          if (encoding === 'graphic') {
            await printGraphicModeKitchenTicket(printer.ip, routedOrderData, shopData, printer.model, encoding);
          } else {
            await printKitchenTicket(printer.ip, routedOrderData, shopData, printer.model, encoding);
          }
          logPOSPrintFlow('print:success', { orderId, type, ip: printer.ip, encoding, itemCount: itemsToPrint.length })
        } else {
          logPOSPrintFlow('print:skipped_empty_category_match', { orderId, type, ip: printer.ip, categories: printerCats })
        }
      }
    });

    try {
      await Promise.all(printJobs);
    } catch (printError: any) {
      logPOSPrintFlow('print:fail', { orderId, type, error: printError?.message || printError })
      throw printError
    }
    if (queuedPrintJobs === 0) {
      logPOSPrintFlow('print:no_jobs', { orderId, type })
      throw new Error('ไม่พบรายการที่เข้าเงื่อนไขเครื่องปริ้นสำหรับบิลนี้')
    }
  };

  const handlePrintReceipt = async () => {
    if (paymentSuccessData?.orderId && paymentSuccessData.orderId !== 'NEW') {
      try {
        await printFromDatabaseOrder(paymentSuccessData.orderId, 'receipt', false, paymentSuccessData);
      } catch (err: any) {
        alert('พิมพ์ใบเสร็จไม่สำเร็จ: ' + err.message);
      }
    } else {
      await executeNativePrint('receipt', false);
    }
  };

  const handlePrintKitchen = async () => {
    if (paymentSuccessData?.orderId && paymentSuccessData.orderId !== 'NEW') {
      try {
        await printFromDatabaseOrder(paymentSuccessData.orderId, 'kitchen', false, paymentSuccessData);
      } catch (err: any) {
        alert('พิมพ์ออเดอร์เข้าครัวไม่สำเร็จ: ' + err.message);
      }
    } else {
      await executeNativePrint('kitchen');
    }
  };

  const checkManagerPin = (
    onSuccessCallback: () => void,
    actionTitle: string = 'MANAGER AUTHORIZATION',
    actionDesc: string = 'กรุณาใส่รหัสผ่านผู้จัดการเพื่อทำรายการนี้'
  ) => {
    const correctPin = shopSettings?.role_permissions?.manager_pin
    if (correctPin) {
      setPinCallback(() => onSuccessCallback)
      setPinTitle(actionTitle)
      setPinDesc(actionDesc)
      setIsPinModalOpen(true)
    } else {
      // Fallback if no PIN is set, just allow it
      onSuccessCallback()
    }
  }

  const categoryScrollRef = useRef<HTMLDivElement>(null)
  // --- DERIVED STATES ---
  function getEffectiveItemUnitPrice(item: any) {
    if (item?.unit_price !== undefined && item?.unit_price !== null) {
      return Number(item.unit_price)
    }
    const platformPrice =
      orderType === 'delivery' && deliveryPlatform && item?.platform_prices?.[deliveryPlatform]
        ? Number(item.platform_prices[deliveryPlatform])
        : null
    return Number(platformPrice ?? item?.sale_price ?? item?.price ?? 0)
  }

  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart])
  const cartFingerprint = useMemo(() => buildCartFingerprint(cart), [cart])
  const isHeldOrderBaselineLoading = !!editingOrderId && heldCartFingerprint === null
  const hasUnsavedOrderChanges = !editingOrderId || cartFingerprint !== heldCartFingerprint
  const rawCartSubTotal = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const modsPrice =
          item.selected_modifiers?.reduce(
            (ma: number, m: any) => ma + ((m.price_adjustment || 0) * (m.qty || 1)),
            0
          ) || 0

        const basePrice = getEffectiveItemUnitPrice(item)
        const rowPrice = (basePrice + modsPrice) * item.quantity
        return acc + rowPrice
      }, 0),
    [cart, orderType, deliveryPlatform]
  )

  const itemDiscountTotal = useMemo(
    () => cart.reduce((acc, item) => acc + (item.discount_amount || 0), 0),
    [cart]
  )

  const cartSubTotal = useMemo(
    () => rawCartSubTotal - itemDiscountTotal,
    [rawCartSubTotal, itemDiscountTotal]
  )

  const discountTotalValue = useMemo(() => {
    if (activeCoupon && activeCoupon.discount_type !== 'free_item') {
      // Check minimum spend
      if (activeCoupon.min_order_amount > 0 && cartSubTotal < activeCoupon.min_order_amount) {
        return 0; // Does not meet minimum spend
      }

      // Filter valid items for discount based on inclusions/exclusions
      const validItems = cart.filter(item => {
        if (activeCoupon.excluded_items?.includes(item.id)) return false;
        if (activeCoupon.excluded_categories?.includes(item.category_id)) return false;
        if (activeCoupon.applicable_items?.length > 0 && !activeCoupon.applicable_items.includes(item.id)) return false;
        if (activeCoupon.applicable_categories?.length > 0 && !activeCoupon.applicable_categories.includes(item.category_id)) return false;
        return true;
      });

      if (validItems.length === 0) return 0;

      let discount = 0;
      
      if (activeCoupon.discount_type === 'percent') {
        const validTotal = validItems.reduce((acc, item) => {
          const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
          return acc + ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity);
        }, 0);
        discount = validTotal * (activeCoupon.discount_value / 100);
      } else if (activeCoupon.discount_type === 'fixed_amount' || activeCoupon.discount_type === 'fixed') {
        discount = activeCoupon.discount_value;
      }

      // Cap at max discount if specified
      if (activeCoupon.max_discount_amount && activeCoupon.max_discount_amount > 0) {
        if (discount > activeCoupon.max_discount_amount) {
          discount = activeCoupon.max_discount_amount;
        }
      }

      return discount;
    }

    return discountType === 'percent' ? cartSubTotal * (discountRate / 100) : discountValue
  }, [activeCoupon, cart, cartSubTotal, discountType, discountRate, discountValue])

  const vatAmount = useMemo(() => {
    return hasVat ? (cartSubTotal - discountTotalValue) * (vatRate / 100) : 0
  }, [hasVat, cartSubTotal, discountTotalValue, vatRate])

  const serviceChargeAmount = useMemo(() => {
    return hasServiceCharge ? (cartSubTotal - discountTotalValue) * 0.1 : 0
  }, [hasServiceCharge, cartSubTotal, discountTotalValue])

  const cartTotal = Math.max(
    0,
    Math.round(cartSubTotal - discountTotalValue + vatAmount + serviceChargeAmount)
  )
  const remainingTotal = Math.max(0, cartTotal - totalPaid)
  const isQrSourceOrder = (order: any) => order?.source === 'qr'
  const isLiffSourceOrder = (order: any) => order?.order_source === 'liff' || order?.source === 'liff'
  const isArchivedPendingOrder = (order: any) => {
    const status = String(order?.status || '').toLowerCase()
    return ['completed', 'cancelled', 'void', 'refunded'].includes(status)
  }
  const qrIncomingOrders = useMemo(
    () => pendingOrders.filter((order: any) => isQrSourceOrder(order) && String(order?.status || '').toLowerCase() === 'pending'),
    [pendingOrders]
  )
  const liffIncomingOrders = useMemo(
    () => pendingOrders.filter((order: any) => isLiffSourceOrder(order) && !isArchivedPendingOrder(order)),
    [pendingOrders]
  )
  const deliveryHubOrders = useMemo(
    () =>
      pendingOrders.filter((order: any) => {
        if (isArchivedPendingOrder(order)) return false
        return isLiffSourceOrder(order)
      }),
    [pendingOrders]
  )
  const suspendedOrders = useMemo(
    () => pendingOrders.filter((order: any) => {
      if (isLiffSourceOrder(order)) return false;
      const hasItems = order.pos_order_items && order.pos_order_items.length > 0;
      const total = Number(order.total_amount || 0);
      const isGhost = (!hasItems || total === 0) && order.status === 'pending';
      return !isGhost;
    }),
    [pendingOrders]
  )

  // --- HEADER PORTAL ---
  useEffect(() => {
    if (showMemberCheckoutFlow) {
      setQrSessionId(Date.now().toString());
      let isMounted = true;
      const getQrToken = async () => {
        try {
          if (!qrTargetOrderIdRef.current) {
            qrTargetOrderIdRef.current = editingOrderId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cart_${Date.now()}`);
          }
          const targetOrderId = qrTargetOrderIdRef.current;
          const formattedCartItems = cart.map((i: any) => ({
            item_id: i.id,
            name: getPrimaryMenuName(i),
            quantity: i.quantity,
            unit_price: getEffectiveItemUnitPrice(i),
            subtotal: ((getEffectiveItemUnitPrice(i) + (i.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0)) * i.quantity) - (i.discount_amount || 0),
            selected_modifiers: i.selected_modifiers || []
          }));
          const res = await fetchOrGenerateLoyaltyToken(targetOrderId, cartTotal, shopSettings, formattedCartItems);
          if (isMounted) {
            if (res.token) {
              setPosQrLoyaltyToken(res.token);
              setPosQrPointsEarned(res.points || 0);
            } else {
              setPosQrLoyaltyToken('general_member_checkin');
              setPosQrPointsEarned(0);
            }
          }
        } catch (err) {
          console.error("Failed to generate POS QR token", err);
          if (isMounted) {
            setPosQrLoyaltyToken('general_member_checkin');
          }
        }
      };
      getQrToken();
      return () => { isMounted = false; };
    } else {
      setPosQrLoyaltyToken(null);
      setPosQrPointsEarned(0);
      qrTargetOrderIdRef.current = null;
    }
  }, [showMemberCheckoutFlow, editingOrderId, cartTotal, shopSettings, cart]);




  useEffect(() => {
    setViewExtraHeader(
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4 lg:gap-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className={`relative hidden h-9 md:min-w-[40px] lg:min-w-[180px] items-center justify-center border px-3 lg:px-6 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm transition-all md:flex rounded-full lg:rounded-none ${
              !activeShift
                ? 'border-red-200 bg-red-50 text-red-600'
                : shopSettings?.status === 'open' || (shopSettings as any)?.is_open
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : shopSettings?.status === 'paused'
                    ? 'animate-pulse border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'animate-pulse border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            <span className="flex items-center gap-2 whitespace-nowrap font-bold">
              {/* Dot only on MD, full text on LG */}
              <span className="lg:hidden text-lg leading-none">●</span>
              <span className="hidden lg:inline">
              {!activeShift
                ? '● ปิดกะ (OFFLINE)'
                : shopSettings?.status === 'open' || (shopSettings as any)?.is_open
                  ? `● ร้านเปิด (${new Date(activeShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                  : shopSettings?.status === 'paused'
                    ? '● หยุดรับออเดอร์ชั่วคราว'
                    : '● ร้านปิด (CLOSED)'}
              </span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 border-l border-gray-100 pl-2 sm:pl-3">
            {/* MEMBER & PENDING CLUSTER */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setShowPromotionsModal(true)}
                className={`relative flex h-9 w-9 sm:h-10 sm:w-10 rounded-full items-center justify-center border font-bold transition-all border-[#F0F0E8] bg-white text-[#1A1A18] hover:border-black`}
                title="จัดการโปรโมชั่น"
              >
                <Tag size={16} />
              </button>
              
              <button
                onClick={async () => {
                  if (cart.length > 0) {
                    try {
                      const res = await handleHoldOrder({ suppressProcessingState: true, suppressAlert: true, keepComposer: true });
                      setCurrentPointOrderId(res?.orderId || editingOrderId);
                      setShowHistoryPointModalForCurrentOrder(true);
                    } catch (err) {
                      console.error(err);
                      alert('เกิดข้อผิดพลาดในการบันทึกบิลก่อนให้แต้ม');
                    }
                  } else {
                    setShowPointModal(true);
                  }
                }}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 rounded-full items-center justify-center border border-[#F0F0E8] bg-white text-[#1A1A18] hover:border-black font-bold transition-all"
                title={locale === 'en' ? 'สะสมแต้ม' : locale === 'zh' ? 'สะสมแต้ม' : 'ให้แต้ม'}
              >
                <QrCode size={16} />
              </button>

              <button
                onClick={() => {
                  if (claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 && qrIncomingOrders.length === 0) {
                    setPendingModalTab('coupons');
                  } else {
                    setPendingModalTab('orders');
                  }
                  setShowPendingModal(true);
                }}
                className={`relative flex h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-col items-center justify-center border font-bold transition-all ${
                  qrIncomingOrders.length > 0 || claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0
                    ? 'border-orange-400 bg-orange-500 text-white shadow-lg animate-pulse hover:bg-orange-600' 
                    : suspendedOrders.length > 0 
                      ? 'border-orange-200 bg-orange-50 text-orange-600 shadow-sm hover:bg-orange-100' 
                      : 'border-[#F0F0E8] bg-white text-gray-300 hover:bg-gray-50'
                }`}
                title={locale === 'en' ? 'ออเดอร์และคูปองรอดำเนินการ' : locale === 'zh' ? 'ออเดอร์และคูปองรอดำเนินการ' : 'ออเดอร์และคูปองรอดำเนินการ'}
              >
                {qrIncomingOrders.length > 0 || claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0
                  ? <BellRing size={16} className={claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 ? "animate-bounce" : ""} /> 
                  : <History size={16} />
                }
                {(suspendedOrders.length + claimingCoupons.filter(c => c.id !== appliedCouponId).length) > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5F1F] text-[8px] font-black text-white ring-1 ring-white">
                    {suspendedOrders.length + claimingCoupons.filter(c => c.id !== appliedCouponId).length}
                  </span>
                )}
              </button>

              <button
                onClick={e => {
                  e.stopPropagation()
                  setIsCartExpanded(false)
                  setShowDeliveryHub(true)
                }}
                className={`relative z-[10] flex h-9 w-9 sm:h-10 sm:w-10 rounded-full cursor-pointer items-center justify-center border bg-white font-bold shadow-sm transition-all hover:border-black hover:text-black ${
                  liffIncomingOrders.length > 0
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600 shadow-lg'
                    : deliveryHubOrders.length > 0
                      ? 'border-emerald-200 text-emerald-600'
                      : 'border-[#F0F0E8] text-gray-400'
                }`}
                title="Delivery"
              >
                <Truck size={16} />
                {deliveryHubOrders.length > 0 && (
                  <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white ring-1 ring-white ${
                    liffIncomingOrders.length > 0 ? 'bg-emerald-500' : 'bg-emerald-400'
                  }`}>
                    {deliveryHubOrders.length}
                  </span>
                )}
              </button>
            </div>

            <motion.button
              id="mobile-cart-button"
              onClick={() => {
                setShowDeliveryHub(false)
                setIsCartExpanded(true)
              }}
              animate={isCartBumping ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -5, 5, -2, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="group relative lg:hidden flex h-9 sm:h-10 items-center gap-1.5 bg-[#1A1A18] px-3 sm:px-4 font-bold text-white shadow-md transition-all hover:shadow-xl rounded-full"
            >
              <ShoppingBag size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">
                {locale === 'en' ? '                 ฿ ' : locale === 'zh' ? '                 ฿ ' : '                 ฿ '}{cartTotal.toLocaleString()}
              </span>
              {cartItemCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-[#1A1A18]">
                  {cartItemCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [
    setViewExtraHeader,
    searchTerm,
    shopSettings,
    activeShift,
    selectedCustomer,
    pendingOrders,
    qrIncomingOrders,
    suspendedOrders,
    liffIncomingOrders,
    deliveryHubOrders,
    cartTotal,
    cartItemCount,
  ])

  // --- RE-FETCH HELPERS ---
  const refreshPendingOrders = async () => {
    let query = supabase
      .from('pos_orders')
      .select(`*, pos_order_items (*, item:pos_menu_items!item_id(name, image_url))`)
      .in('status', ['open', 'pending', 'payment_pending', 'accepted', 'preparing', 'shipping'])
      .order('created_at', { ascending: false })

    if (shopSettings?.branch_id) {
      query = query.eq('branch_id', shopSettings.branch_id)
    }

    const { data } = await query

    if (data) {
      // Filter out auto-generated "ghost" draft orders that haven't been saved yet (no items and total_amount === 0)
      const validOrders = data.filter((order: any) => {
        const hasItems = order.pos_order_items && order.pos_order_items.length > 0;
        const isGhost = !hasItems && order.total_amount === 0;
        return !isGhost;
      })
      setPendingOrders(validOrders)
    }
  }

  function getPreviewQueueNumber(currentOrderId?: string | null) {
    const activeQueueStatuses = new Set(['open', 'pending', 'payment_pending', 'accepted', 'preparing', 'shipping'])
    const activeOrders = [...pendingOrders]
      .filter((order: any) => activeQueueStatuses.has(String(order.status || '').toLowerCase()))
      .sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())

    if (currentOrderId) {
      const existingOrder = activeOrders.find((order: any) => order.id === currentOrderId)
      if (existingOrder?.queue_number !== undefined && existingOrder?.queue_number !== null) {
        const storedQueue = Number(existingOrder.queue_number)
        if (Number.isFinite(storedQueue) && storedQueue > 0) return storedQueue
      }

      const existingIndex = activeOrders.findIndex((order: any) => order.id === currentOrderId)
      if (existingIndex >= 0) return existingIndex + 1
    }

    const storedQueues = activeOrders
      .map((order: any) => Number(order.queue_number))
      .filter((queue: number) => Number.isFinite(queue) && queue > 0)

    if (storedQueues.length > 0) {
      return Math.max(...storedQueues) + 1
    }

    return activeOrders.length + 1
  }

  const lastAutoCreateAttemptRef = useRef<number>(0);

  const fetchOrderIdentity = async (currentOrderId?: string | null): Promise<{ queueNumber: number, orderNumber: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('/api/pos/order-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          orderType,
          branchId: shopSettings?.branch_id || activeShift?.branch_id || null,
          shiftId: activeShift?.id || null,
          existingOrderId: currentOrderId || null,
          tableName: selectedTable?.table_number || null,
        })
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return { 
          queueNumber: data.queueNumber, 
          orderNumber: data.orderNumber 
        };
      }
    } catch (e) {
       console.warn("Fast fallback for order identity", e);
    }
    
    const fallbackQueue = (pendingOrders?.length || 0) + 1;
    const dateSuffix = Date.now().toString().slice(-6);
    return {
       queueNumber: fallbackQueue, 
       orderNumber: editingOrderNumber || `TAK-${dateSuffix}` 
    }
  };

  useEffect(() => {
    let isMounted = true;
    const now = Date.now();
    const isCartNonEmpty = cart.length > 0;
    
    if (
      orderType === 'takeaway' &&
      !editingOrderId &&
      isCartNonEmpty &&
      !isAutoCreatingOrderLock.current &&
      now - lastAutoCreateAttemptRef.current > 3000
    ) {
      isAutoCreatingOrderLock.current = true;
      lastAutoCreateAttemptRef.current = now;
      setIsAutoCreatingOrder(true);

      (async () => {
        try {
          const identity = await fetchOrderIdentity(null);
          if (!isMounted) return;

          const payload: any = {
            order_action: 'insert',
            order: {
              merchant_id: profile?.merchant_id || null,
              order_number: identity.orderNumber,
              staff_id: profile?.id,
              shift_id: activeShift?.id,
              branch_id: shopSettings?.branch_id || activeShift?.branch_id || null,
              status: 'pending',
              total_amount: 0,
              net_total: 0,
              order_type: 'takeaway',
              queue_number: identity.queueNumber,
              order_source: 'pos',
            }
          };

          const { data: rpcResult, error: rpcError } = await supabase.rpc('pos_checkout_order', { payload });
          if (!rpcError && rpcResult?.order_id && isMounted) {
            setEditingOrderId(rpcResult.order_id);
            setEditingOrderNumber(identity.orderNumber);
            setHeldCartFingerprint('');
          }
        } catch (err) {
          console.error('Auto create takeaway order error:', err);
        } finally {
          setIsAutoCreatingOrder(false);
          setTimeout(() => {
            isAutoCreatingOrderLock.current = false;
          }, 1000);
        }
      })();
    }
    return () => { isMounted = false; };
  }, [orderType, cart.length > 0, editingOrderId, profile?.id, activeShift?.id, shopSettings?.branch_id]);

  const activePrintData = useMemo(() => {
    if (paymentSuccessData) return paymentSuccessData;
    const finalCartTotal = cartTotal;
    return {
      orderNumber: editingOrderNumber || 'Draft',
      queueNumber: editingOrderId ? String(getPreviewQueueNumber(editingOrderId) || '') : '',
      orderType: orderType,
      orderSource: 'pos',
      deliveryPlatform: orderType === 'delivery' ? deliveryPlatform : '',
      referenceName: orderType === 'delivery' ? platformOrderId.trim() : '',
      tableNumber: selectedTable?.table_number,
      customerName: selectedCustomer?.full_name || selectedCustomer?.name || '',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        subtotal: getEffectiveItemUnitPrice(item) * item.quantity,
        modifiers: item.selected_modifiers?.map((m: any) => m.name) || [],
        selected_modifiers: item.selected_modifiers || [],
        category_id: item.category_id
      })),
      subtotal: rawCartSubTotal,
      discount: discountTotalValue + itemDiscountTotal,
      tax: vatAmount,
      serviceCharge: serviceChargeAmount,
      total: finalCartTotal,
      paymentMethod: 'Unpaid',
      received: 0,
      change: 0,
      timestamp: new Date().toISOString(),
      comment: cart.map((item: any) => item.note).filter(Boolean).join('\n') || '',
      notes: '',
      pickupTime: ''
    };
  }, [
    paymentSuccessData,
    cart,
    rawCartSubTotal,
    discountTotalValue,
    itemDiscountTotal,
    serviceChargeAmount,
    vatAmount,
    cartTotal,
    editingOrderNumber,
    editingOrderId,
    orderType,
    deliveryPlatform,
    platformOrderId,
    selectedTable,
    selectedCustomer,
    pendingOrders
  ]);

  const isMissingQueueColumnError = (error: any) => {
    const message = String(error?.message || error || '')
    return /queue_number/i.test(message) && /(does not exist|column)/i.test(message)
  }

  const handleDeleteOrder = async (id: string) => {
    if (
      !confirm(
        (profile?.role === 'admin' || profile?.staff_level === 'owner' || profile?.staff_level === 'superadmin')
          ? 'คุณแน่ใจว่าต้องการยกเลิกบิลนี้อย่างถาวร? (รายการจะถูกเปลี่ยนสถานะเป็นยกเลิก)'
          : 'คุณต้องการขอยกเลิกรายการนี้ใช่หรือไม่?'
      )
    )
      return

    checkManagerPin(async () => {
      try {
        const { error } = await supabase
          .from('pos_orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        
        const orderToCancel = pendingOrders.find(o => o.id === id)
        if (orderToCancel?.table_id) {
          await supabase.from('pos_tables').update({ status: 'available' }).eq('id', orderToCancel.table_id)
          await supabase.from('pos_tables').update({ parent_table_id: null }).eq('parent_table_id', orderToCancel.table_id)
        }
        
        if (id === editingOrderId) {
          resetOrderComposer();
          setShowPendingModal(true); // Automatically switch back to pending orders view
        }
        
        refreshPendingOrders()
      } catch (e: any) {
        alert('ไม่สามารถยกเลิกบิลได้: ' + e.message)
      }
    }, 'ยกเลิกบิล (VOID ORDER)', 'จำเป็นต้องใช้รหัสผ่านผู้จัดการในการยกเลิกบิล')
  }

  const handleClearAllOrders = async () => {
    if (pendingOrders.length === 0) return;
    if (
      !confirm(
        'คุณแน่ใจว่าต้องการล้าง (Clear) ออเดอร์ที่ค้างอยู่ทั้งหมด? (รายการทั้งหมดจะถูกเปลี่ยนสถานะเป็นยกเลิก)'
      )
    )
      return

    checkManagerPin(async () => {
      try {
        const orderIds = pendingOrders.map(o => o.id);
        const tableIds = pendingOrders.map(o => o.table_id).filter(Boolean);

        // Cancel all pending orders
        const { error } = await supabase
          .from('pos_orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .in('id', orderIds);
        if (error) throw error;
        
        // Free up tables
        if (tableIds.length > 0) {
          await supabase.from('pos_tables').update({ status: 'available' }).in('id', tableIds);
          await supabase.from('pos_tables').update({ parent_table_id: null }).in('parent_table_id', tableIds);
        }
        
        if (editingOrderId && orderIds.includes(editingOrderId)) {
          resetOrderComposer();
        }
        
        refreshPendingOrders();
      } catch (e: any) {
        alert('ไม่สามารถล้างบิลได้: ' + e.message)
      }
    }, 'เคลียร์บิลทั้งหมด (CLEAR ALL)', 'จำเป็นต้องใช้รหัสผ่านผู้จัดการในการเคลียร์บิลทั้งหมด')
  }

  const handleResumeOrder = async (order: any, mergeWithCurrentCart: boolean = false) => {
    try {
      const { data: directItems, error: itemsError } = await supabase
        .from('pos_order_items')
        .select(`*, item:pos_menu_items!item_id(*)`)
        .eq('order_id', order.id)
        .neq('status', 'cancelled')

      if (itemsError) throw itemsError

      // Always map fetched items, even if empty
      const fetchedItems = directItems && directItems.length > 0 ? directItems.map((i: any) => ({
        id: i.item_id,
        name: i.item?.name || 'Unknown Item',
        image_url: i.item?.image_url || '',
        sale_price: i.unit_price,
        cost_price: i.cost_price || 0,
        quantity: i.quantity,
        selected_modifiers: i.selected_modifiers || [],
        category_id: i.item?.category_id || 'uncategorized',
        customer_name: i.customer_name || null,
        discount_amount: i.discount_amount || 0,
        discount_reason: i.discount_reason || null,
        recipe_data: i.item?.recipe_data || [],
      })) : [];
      
      const existingFingerprint = buildCartFingerprint(fetchedItems)
      
      if (mergeWithCurrentCart) {
          const combinedCart = [...fetchedItems, ...cart];
          setCart(combinedCart);
          setHeldCartFingerprint(existingFingerprint)
      } else {
          setCart(fetchedItems);
          setHeldCartFingerprint(existingFingerprint)
      }

      setEditingOrderId(order.id)
      setEditingOrderNumber(order.order_number)

      // Customer Logic
      let customerToSet = null
      if (order.customer_id) {
          const { data } = await supabase.from('pos_members').select('*').eq('id', order.customer_id).maybeSingle()
          if (data) customerToSet = data
      } else if (order.line_user_id) {
          const { data } = await supabase.from('pos_members').select('*').eq('line_user_id', order.line_user_id).maybeSingle()
          if (data) customerToSet = data
      }
      setSelectedCustomer(customerToSet)
      
      // Fetch existing payments
      const { data: payments } = await supabase
        .from('pos_order_payments')
        .select('amount')
        .eq('order_id', order.id)
        .eq('status', 'paid')
      
      if (payments && payments.length > 0) {
        const sumPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
        setTotalPaid(sumPaid)
      } else {
        setTotalPaid(0)
      }
      const fetchedItemDiscountTotal = fetchedItems.reduce((acc: number, item: any) => acc + (item.discount_amount || 0), 0)
      const orderDiscountAmount = Number(order.discount_amount || 0)
      const billDiscount = orderDiscountAmount - fetchedItemDiscountTotal

      if (billDiscount > 0) {
        setDiscountType('fixed')
        setDiscountValue(billDiscount)
        setDiscountName('ส่วนลด/โปรโมชั่นเดิม')
      } else {
        setDiscountType('percent')
        setDiscountValue(0)
        setDiscountName('')
      }

      setOrderType(order.order_type)
      setDeliveryPlatform(order.delivery_platform || '')
      setPlatformOrderId(order.reference_name || '')
      setSelectedTable(tables.find(t => t.id === order.table_id) || (order.table_id ? ({ id: order.table_id, table_number: order.table_number } as any) : null))
      setShowPendingModal(false)
      setShowTableModal(false)
      setIsCartExpanded(true)

      if (fetchedItems.length === 0) {
        alert('ออเดอร์นี้ไม่มีรายการสินค้าเหลืออยู่ (ถูกยกเลิกหมดแล้ว) คุณสามารถเพิ่มรายการใหม่หรือยกเลิกบิลนี้ได้ครับ')
      }
    } catch (e: any) {
      console.error('Resume Order Error:', e)
      alert(`การกู้คืนออเดอร์ขัดข้อง: ${e.message}`)
    }
  }

  // --- LOCAL STORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pos_saved_cart');
      const parsedSavedCart = savedCart ? JSON.parse(savedCart) : [];
      if (parsedSavedCart.length > 0) setCart(parsedSavedCart);

      const savedOrderType = localStorage.getItem('pos_saved_order_type');
      const savedEditingOrderId = localStorage.getItem('pos_saved_editing_order_id');
      const shouldRestoreOrderType = parsedSavedCart.length > 0 || !!savedEditingOrderId;
      if (savedOrderType && shouldRestoreOrderType) setOrderType(savedOrderType as any);
      else setOrderType('dine_in');

      if (savedOrderType === 'delivery' && shouldRestoreOrderType) {
        const savedDeliveryPlatform = localStorage.getItem('pos_saved_delivery_platform');
        if (savedDeliveryPlatform) setDeliveryPlatform(savedDeliveryPlatform);

        const savedPlatformOrderId = localStorage.getItem('pos_saved_platform_order_id');
        if (savedPlatformOrderId) setPlatformOrderId(savedPlatformOrderId);
      }

      if (savedEditingOrderId) setEditingOrderId(savedEditingOrderId);
      
      const savedEditingOrderNumber = localStorage.getItem('pos_saved_editing_order_number');
      if (savedEditingOrderNumber) setEditingOrderNumber(savedEditingOrderNumber);

      const savedSelectedTable = localStorage.getItem('pos_saved_selected_table');
      if (savedSelectedTable) {
        // Table needs to be verified against the loaded tables to ensure it still exists, 
        // but since tables might not be loaded yet, we can set it and wait.
        setSelectedTable(JSON.parse(savedSelectedTable));
      }
    } catch (e) {
      console.error('Failed to load POS state from localStorage', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_saved_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!editingOrderId || heldCartFingerprint) return
    let cancelled = false
    const loadHeldFingerprint = async () => {
      const { data } = await supabase
        .from('pos_order_items')
        .select(`*, item:pos_menu_items!item_id(*)`)
        .eq('order_id', editingOrderId)
        .neq('status', 'cancelled')
      if (cancelled || !data) return
      const existingItems = data.map((row: any) => ({
        id: row.item_id,
        item_id: row.item_id,
        quantity: row.quantity,
        selected_modifiers: row.selected_modifiers || [],
      }))
      setHeldCartFingerprint(buildCartFingerprint(existingItems))
    }
    loadHeldFingerprint()
    return () => {
      cancelled = true
    }
  }, [editingOrderId, heldCartFingerprint])

  useEffect(() => {
    localStorage.setItem('pos_saved_order_type', orderType);
  }, [orderType]);

  useEffect(() => {
    if (orderType === 'delivery' && deliveryPlatform) localStorage.setItem('pos_saved_delivery_platform', deliveryPlatform);
    else localStorage.removeItem('pos_saved_delivery_platform');
  }, [deliveryPlatform, orderType]);

  useEffect(() => {
    if (orderType === 'delivery' && platformOrderId) localStorage.setItem('pos_saved_platform_order_id', platformOrderId);
    else localStorage.removeItem('pos_saved_platform_order_id');
  }, [platformOrderId, orderType]);

  useEffect(() => {
    if (orderType !== 'delivery') {
      setDeliveryPlatform('')
      setPlatformOrderId('')
    }
  }, [orderType]);

  useEffect(() => {
    if (editingOrderId) localStorage.setItem('pos_saved_editing_order_id', editingOrderId);
    else localStorage.removeItem('pos_saved_editing_order_id');
  }, [editingOrderId]);

  useEffect(() => {
    if (editingOrderNumber) localStorage.setItem('pos_saved_editing_order_number', editingOrderNumber);
    else localStorage.removeItem('pos_saved_editing_order_number');
  }, [editingOrderNumber]);

  useEffect(() => {
    if (selectedTable) localStorage.setItem('pos_saved_selected_table', JSON.stringify(selectedTable));
    else localStorage.removeItem('pos_saved_selected_table');
  }, [selectedTable]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const handleApplyCoupon = (e: any) => {
      const coupon = e.detail;

      // Close all modals & sheets to take user directly to Product Selection grid
      setShowPaymentModal(false);
      setShowMemberCheckoutFlow(false);
      setShowCustomerModal(false);
      setShowPendingModal(false);
      setShowPromotionsModal(false);
      setShowBillDiscountModal(false);

      if (coupon.discount_type === 'free_item') {
        setActiveCoupon(coupon);
        setDiscountValue(0);
        setDiscountRate(0);
        setDiscountType('fixed');
        setDiscountName(coupon.coupon_name || coupon.name);
        setAppliedCouponId(coupon.id);
        
        if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
          setActiveCategoryId(coupon.applicable_categories[0]);
          alert(`นำคูปอง "${coupon.coupon_name || coupon.name}" ไปประยุกต์ใช้สำเร็จ! ระบบนำไปยังหมวดหมู่สินค้าแล้ว กรุณาเลือกสินค้าฟรีเข้าตะกร้า 1 รายการ`);
        } else {
          alert(`นำคูปอง "${coupon.coupon_name || coupon.name}" ไปประยุกต์ใช้สำเร็จ! กรุณาเลือกสินค้าฟรีเข้าตะกร้า 1 รายการ`);
        }
      } else {
        setDiscountType(coupon.discount_type === 'percent' ? 'percent' : 'fixed');
        setDiscountValue(coupon.discount_value || 0);
        if (coupon.discount_type === 'percent') setDiscountRate(coupon.discount_value || 0);
        setDiscountName(coupon.coupon_name || coupon.name);
        setAppliedCouponId(coupon.id);

        if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
          setActiveCategoryId(coupon.applicable_categories[0]);
        }
        alert(`นำคูปอง "${coupon.coupon_name || coupon.name}" ไปประยุกต์ใช้สำเร็จ! ระบบนำไปยังหน้าเลือกสินค้าเรียบร้อยแล้ว`);
      }
    };

    const handleCancelCoupon = (e: any) => {
      const { id } = e.detail;
      setAppliedCouponId((currentAppliedId) => {
        if (currentAppliedId === id) {
          setActiveCoupon(null);
          setDiscountType('fixed');
          setDiscountValue(0);
          setDiscountRate(0);
          setDiscountName('');
          
          // Remove any free items from the cart since the coupon was cancelled
          setCart(prevCart => prevCart.filter(item => !item.is_free_coupon_item));
          
          // Play a sound or alert to notify cashier
          playAppSound('error');
          alert('ลูกค้ายกเลิกการใช้คูปองนี้จากโทรศัพท์มือถือแล้ว ระบบได้ทำการล้างคูปองออกจากออเดอร์');
          return null;
        }
        return currentAppliedId;
      });
      setActiveCoupon((currentActive: any) => {
         if (currentActive?.id === id) return null;
         return currentActive;
      });
    };

    window.addEventListener('applyPOSCoupon', handleApplyCoupon);
    window.addEventListener('cancelPOSCoupon', handleCancelCoupon);
    return () => {
      window.removeEventListener('applyPOSCoupon', handleApplyCoupon);
      window.removeEventListener('cancelPOSCoupon', handleCancelCoupon);
    }
  }, [cart]);

  useEffect(() => {
    const handleKickDrawer = (e: any) => {
      const method = e.detail?.method || 'cash';
      
      const shiftSettings = shopSettings?.opening_hours?.shift_settings || {};
      
      const kickOnCash = method === 'cash';
      const kickOnCredit = method === 'credit_card' && shiftSettings?.drawer_kick_on_credit;
      const kickOnCustom = method !== 'cash' && method !== 'credit_card' && shiftSettings?.drawer_kick_on_custom;
      
      if (kickOnCash || kickOnCredit || kickOnCustom) {
        try {
          const printers = shopSettings?.printers || [];
          const receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both');
          
          if (receiptPrinters.length > 0) {
            Promise.all(receiptPrinters.map((rp: any) => rp.ip ? printOpenDrawer(rp.ip) : Promise.resolve())).catch(console.error);
          } else {
            const fallbackIp = getFallbackPrinterIp();
            if (fallbackIp) printOpenDrawer(fallbackIp).catch(console.error);
          }
        } catch (err) {
          console.error('Failed to parse printers for drawer kick', err);
        }
      }
    };
    window.addEventListener('kickPOSDrawer', handleKickDrawer);
    return () => window.removeEventListener('kickPOSDrawer', handleKickDrawer);
  }, [shopSettings]);


  useEffect(() => {
    initData()
  }, [profile?.id, activeShift?.id])

  // Re-fetch menu items & tables when branch becomes known (shopSettings loads async after profile)
  useEffect(() => {
    if (shopSettings?.branch_id !== undefined) {
      fetchItems(false)
      fetchTables()
      fetchPromotions()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSettings?.branch_id])

  useEffect(() => {
    if (syncPulse && syncPulse > 0) {
      refreshPendingOrders()
      fetchTables()
    }
  }, [syncPulse])

  async function initData() {
    await Promise.all([fetchTables(), refreshPendingOrders(), fetchCampaigns(), fetchTiers()])
  }

  async function fetchTiers() {
    try {
      const { data } = await supabase.from('pos_member_tiers').select('*').order('min_points', { ascending: true });
      if (data) setMemberTiers(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCampaigns() {
    try {
      const { data } = await supabase.from('pos_loyalty_campaigns').select('*').eq('is_active', true);
      if (data) setActiveCampaigns(data);
    } catch (e) {
      console.error(e);
    }
  }

  // Sync totalPaid when editingOrderId changes
  useEffect(() => {
    if (!editingOrderId) {
      setTotalPaid(0)
      return
    }
    const fetchTotalPaid = async () => {
      const { data: payments } = await supabase
        .from('pos_order_payments')
        .select('amount')
        .eq('order_id', editingOrderId)
        .eq('status', 'paid')
      if (payments && payments.length > 0) {
        const sumPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
        setTotalPaid(sumPaid)
      } else {
        setTotalPaid(0)
      }
    }
    fetchTotalPaid()
  }, [editingOrderId])

  useEffect(() => {
    const channel = supabase
      .channel('pos_terminal_tables_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_tables' }, () => {
        fetchTables()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_menu_items' }, () => {
        fetchItems(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_menu_categories' }, () => {
        fetchItems(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_menu_modifiers' }, () => {
        fetchItems(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_menu_modifier_groups' }, () => {
        fetchItems(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_item_modifier_links' }, () => {
        fetchItems(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_promotions' }, () => {
        fetchPromotions()
      })
      .subscribe()

    // Removing initial fetchPromotions here since it is now called when shopSettings loads

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopSettings?.branch_id])

  // Real-time Member Check-in Listener & Handlers
  useEffect(() => {
    const fetchPendingCheckIns = async () => {
      const { data } = await supabase
        .from('pos_member_checkins')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (data) {
        data.forEach(item => {
          const isTargetMatch = (item.order_id && (item.order_id === editingOrderIdRef.current || item.order_id === qrTargetOrderIdRef.current)) || showMemberCheckoutFlowRef.current;
          if (isTargetMatch) {
            supabase.from('pos_members').select('*').eq('id', item.member_id).maybeSingle().then(({data: memberData}) => {
              if (memberData) {
                setSelectedCustomer(memberData);
                setLinkedCheckInId(item.id);
                supabase.from('pos_member_checkins').update({ status: 'linked' }).eq('id', item.id).then(()=>{});
                playAppSound('success');
                setMemberCheckoutStep('points');
              }
            });
          }
        });

        setMemberCheckIns(prev => {
          const merged = [...prev];
          data.forEach(item => {
            if (!merged.some(m => m.id === item.id)) {
              merged.push(item);
              playAppSound('notification');
            }
          });
          return merged.filter(m => data.some(d => d.id === m.id));
        });
      }
    };
    fetchPendingCheckIns();

    // Poll every 4 seconds as a robust fallback
    const interval = setInterval(fetchPendingCheckIns, 4000);

    const channel = supabase
      .channel('pos_member_checkins_watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_member_checkins' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new;
            if (newItem.status === 'pending' || newItem.status === 'linked') {
              // Check if check-in belongs to the current terminal's active QR or order
              const isTargetMatch = (newItem.order_id && (newItem.order_id === editingOrderIdRef.current || newItem.order_id === qrTargetOrderIdRef.current)) || showMemberCheckoutFlowRef.current;
              if (isTargetMatch) {
                supabase.from('pos_members').select('*').eq('id', newItem.member_id).maybeSingle().then(({data}) => {
                  if (data) {
                    setSelectedCustomer(data);
                    setLinkedCheckInId(newItem.id);
                    if (newItem.status === 'pending') {
                      supabase.from('pos_member_checkins').update({ status: 'linked' }).eq('id', newItem.id).then(()=>{});
                    }
                    playAppSound('success');
                    setMemberCheckoutStep('points');
                  }
                });
              } else if (newItem.status === 'pending') {
                setMemberCheckIns(prev => {
                  if (prev.some(item => item.id === newItem.id)) return prev;
                  return [...prev, newItem];
                });
                playAppSound('notification');
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new;
            if (updatedItem.status !== 'pending') {
              setMemberCheckIns(prev => prev.filter(item => item.id !== updatedItem.id));
            } else {
              setMemberCheckIns(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMemberCheckIns(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLinkCheckIn = async (checkIn: any) => {
    if (!checkIn) return;
    try {
      if (editingOrderId) {
        await supabase
          .from('pos_orders')
          .update({ customer_id: checkIn.member_id })
          .eq('id', editingOrderId);
      }

      const { error } = await supabase
        .from('pos_member_checkins')
        .update({ 
          status: 'linked', 
          order_id: editingOrderId || null 
        })
        .eq('id', checkIn.id);

      if (error) throw error;

      const { data: member } = await supabase
        .from('pos_members')
        .select('*')
        .eq('id', checkIn.member_id)
        .maybeSingle();

      if (member) {
        setSelectedCustomer(member);
        setLinkedCheckInId(checkIn.id);
      }
      
      refreshPendingOrders();
      setMemberCheckIns(prev => prev.filter(item => item.id !== checkIn.id));
    } catch (err) {
      console.error('Failed to link check-in:', err);
      alert('เกิดข้อผิดพลาดในการผูกข้อมูลสมาชิก');
    }
  };

  const handleLinkCheckInToOrder = async (checkIn: any, order: any) => {
    if (!checkIn || !order) return;
    try {
      const { error: orderErr } = await supabase
        .from('pos_orders')
        .update({ customer_id: checkIn.member_id })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      const { error: checkInErr } = await supabase
        .from('pos_member_checkins')
        .update({ status: 'linked', order_id: order.id })
        .eq('id', checkIn.id);

      if (checkInErr) throw checkInErr;

      const { data: member } = await supabase
        .from('pos_members')
        .select('*')
        .eq('id', checkIn.member_id)
        .maybeSingle();

      await handleResumeOrder(order, false);

      if (member) {
        setSelectedCustomer(member);
        setLinkedCheckInId(checkIn.id);
      }

      refreshPendingOrders();
      setMemberCheckIns(prev => prev.filter(item => item.id !== checkIn.id));
    } catch (err) {
      console.error('Failed to link check-in to order:', err);
      alert('เกิดข้อผิดพลาดในการผูกข้อมูลสมาชิกเข้ากับบิล');
    }
  };

  const handleRejectCheckIn = async (checkIn: any) => {
    if (!checkIn) return;
    try {
      await supabase
        .from('pos_member_checkins')
        .update({ status: 'cancelled' })
        .eq('id', checkIn.id);
      
      setMemberCheckIns(prev => prev.filter(item => item.id !== checkIn.id));
    } catch (err) {
      console.error('Failed to reject check-in:', err);
    }
  };



  async function fetchItems(forceRefresh = false) {
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        logPOSPrintFlow('menu_fetch:fail', { reason: 'offline' })
        alert('เน็ตไม่พร้อม: หน้า POS เป็นโหมด Online เท่านั้น กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนโหลดเมนู')
        return
      }

      const branchId = branchIdRef.current || shopSettings?.branch_id
      let url = branchId ? `/api/cache/menu?branchId=${branchId}` : '/api/cache/menu';
      if (forceRefresh) {
        url += url.includes('?') ? '&bust=true' : '?bust=true';
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch menu cache');
      const json = await response.json();

      if (json.data) {
        if (json.data.categories) {
          setCategories(json.data.categories);
          localStorage.setItem('pos_cached_categories', JSON.stringify(json.data.categories));
        }
        if (json.data.items) {
          const sorted = sortMenuItemsByOrder(json.data.items as any[]);
          setItems(sorted);
          localStorage.setItem('pos_cached_items', JSON.stringify(sorted));
        }
      }
    } catch (e) {
      console.error('RUSH UP POS Data Error:', e)
    } finally {
      setIsInitialLoading(false)
    }
  }

  async function fetchPromotions() {
    try {
      const branchId = branchIdRef.current || shopSettings?.branch_id
      let query = supabase.from('pos_promotions').select('*').eq('is_active', true)
      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
      } else {
        query = query.is('branch_id', null)
      }
      const { data } = await query
      if (data) {
        // filter by date
        const now = new Date()
        const validPromos = data.filter(p => {
          if (p.start_date && new Date(p.start_date) > now) return false
          if (p.end_date && new Date(p.end_date) < now) return false
          return true
        })
        setActivePromotions(validPromos)
      }
    } catch (e) {
      console.error('Error fetching promotions:', e)
    }
  }

  // Auto-print delivery receipt
  useEffect(() => {
    if (paymentSuccessData && paymentSuccessData.paymentMethod === 'delivery') {
      const timer = setTimeout(() => {
        handlePrintReceipt()
        // Wait 2.5s before auto-closing to let user see the success screen
        setTimeout(() => setPaymentSuccessData(null), 2500)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [paymentSuccessData])

  useEffect(() => {
    if (selectedCustomer && memberTiers.length > 0) {
      const totalPoints = selectedCustomer.total_accumulated_points ?? selectedCustomer.points ?? 0;
      // 1. Calculated Tier
      let calculatedTierIndex = 0;
      for (let i = memberTiers.length - 1; i >= 0; i--) {
        if (totalPoints >= memberTiers[i].min_points) {
          calculatedTierIndex = i;
          break;
        }
      }
      
      // 2. Retained Tier
      let retainedTierIndex = 0;
      if (selectedCustomer.member_tier && typeof selectedCustomer.member_tier === 'string') {
        const foundIndex = memberTiers.findIndex(t => t.name.toLowerCase() === selectedCustomer.member_tier.toLowerCase());
        if (foundIndex !== -1) retainedTierIndex = foundIndex;
      }
      
      const effectiveTierIndex = Math.max(calculatedTierIndex, retainedTierIndex);
      const appliedTier = memberTiers[effectiveTierIndex];
      
      if (appliedTier && appliedTier.discount_rate > 0) {
        setDiscountType('percent');
        setDiscountRate(appliedTier.discount_rate);
        setDiscountName(`ส่วนลดสมาชิกระดับ ${appliedTier.name}`);
      }
    } else if (!selectedCustomer && discountName.includes('ส่วนลดสมาชิกระดับ')) {
      setDiscountType('percent');
      setDiscountRate(0);
      setDiscountName('');
    }
  }, [selectedCustomer, memberTiers]);

  useEffect(() => {
    if (selectedCustomer?.id) {
      const fetchCoupons = async () => {
        const { data } = await supabase
          .from('pos_member_coupons')
          .select('*')
          .eq('member_id', selectedCustomer.id)
          .eq('status', 'active');
        if (data) {
          setMemberAvailableCoupons(data);
          setActiveCouponCount(data.length);
        } else {
          setMemberAvailableCoupons([]);
          setActiveCouponCount(0);
        }
      };
      fetchCoupons();

      // Realtime subscription for coupons
      const channel = supabase.channel(`member_coupons_${selectedCustomer.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pos_member_coupons',
            filter: `member_id=eq.${selectedCustomer.id}`
          },
          () => {
            // Re-fetch coupons when there's an insert or update
            fetchCoupons();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMemberAvailableCoupons([]);
      setActiveCouponCount(0);
    }
  }, [selectedCustomer]);

  async function fetchTables() {
    const branchId = shopSettings?.branch_id
    let query = supabase.from('pos_tables').select('*').order('table_number')
    if (branchId) {
      query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
    } else {
      query = query.is('branch_id', null)
    }
    const { data } = await query
    if (data) {
      const formatted = data.map((t, idx) => ({
        ...t,
        position_x: t.position_x != null ? t.position_x : ((idx % 4) * 180 + 40),
        position_y: t.position_y != null ? t.position_y : (Math.floor(idx / 4) * 180 + 40)
      }));
      setTables(formatted)
    }
  }

  const handleClearIdleTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId)
    if (!table) return

    checkManagerPin(async () => {
      await supabase.from('pos_tables').update({ status: 'available' }).eq('id', table.id)
      await supabase.from('pos_tables').update({ parent_table_id: null }).eq('parent_table_id', table.id)
      await supabase.from('pos_tables').update({ parent_table_id: null }).eq('id', table.id)

      if (selectedTable?.id === table.id) {
        resetOrderComposer()
      }

      await fetchTables()
    }, 'เคลียร์สถานะโต๊ะ', `คุณกำลังล้างสถานะการเปิดโต๊ะ ${table.table_number || ''}`)
  }

  const openEditCartItem = async (index: number) => {
    const item = cart[index];
    if (item.modifiers && item.modifiers.length > 0) {
      const groupIds = item.modifiers.map((m: any) => m.group_id)
      const { data: groups } = await supabase
        .from('pos_menu_modifier_groups')
        .select('*, options:pos_menu_modifiers(*)')
        .in('id', groupIds)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (groups) {
        const sortedGroups = groups.map(g => ({
          ...g,
          options: (g.options || []).sort(
            (a: any, b: any) =>
              (a.sort_order || 0) - (b.sort_order || 0) ||
              (a.name || '').localeCompare(b.name || '')
          ),
        }))
        setModifierGroups(sortedGroups)
      }
    } else {
      setModifierGroups([])
    }
    setModifierModalItem(item as any)
    setTempSelectedModifiers(item.selected_modifiers || [])
    setTempQuantity(item.quantity || 1)
    setTempNote(item.note || '')
    setEditingCartItemIndex(index)
  }

  async function addToCart(item: MenuItem, modifiers: any[] = [], qty: number = 1, fromModal: boolean = false) {
    if (!activeShift) {
      onOpenShiftModal()
      return
    }

    if (item.modifiers && item.modifiers.length > 0 && !fromModal && modifiers.length === 0) {
      const groupIds = item.modifiers.map((m: any) => m.group_id)
      const { data: groups } = await supabase
        .from('pos_menu_modifier_groups')
        .select('*, options:pos_menu_modifiers(*)')
        .in('id', groupIds)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (groups) {
        // Sort options within each group
        const sortedGroups = groups.map(g => ({
          ...g,
          options: (g.options || []).sort(
            (a: any, b: any) =>
              (a.sort_order || 0) - (b.sort_order || 0) ||
              (a.name || '').localeCompare(b.name || '')
          ),
        }))
        setModifierGroups(sortedGroups)
      }
      setModifierModalItem(item)
      setTempSelectedModifiers([])
      setTempQuantity(1)
      setTempNote('')
      return
    }

    setIsCartBumping(true)
    setTimeout(() => setIsCartBumping(false), 400)

    let discountAmount = 0;
    let isFreeByCoupon = false;

    if (activeCoupon && activeCoupon.discount_type === 'free_item') {
      const appItems = activeCoupon.applicable_items || [];
      const appCategories = activeCoupon.applicable_categories || [];

      const matchesItem = appItems.length === 0 || appItems.includes(item.id);
      const matchesCategory = appCategories.length === 0 || appCategories.includes(item.category_id);

      const isApplicable = matchesItem && matchesCategory;

      if (isApplicable) {
        isFreeByCoupon = true;
        const basePrice = getEffectiveItemUnitPrice(item);
        const modsPrice = modifiers.reduce((ma: number, m: any) => ma + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
        const unitPrice = basePrice + modsPrice;
        
        const maxLimit = activeCoupon.discount_value || 0;
        if (maxLimit > 0 && unitPrice > maxLimit) {
          discountAmount = maxLimit;
          alert(`แจ้งเตือน: สินค้าราคา ${unitPrice} บาท เกินมูลค่าคูปองฟรีสูงสุด (${maxLimit} บาท)\nลูกค้าต้องชำระส่วนต่าง ${unitPrice - maxLimit} บาท`);
        } else {
          discountAmount = unitPrice * 1;
        }
        
        // Clear activeCoupon so only the first added item is free!
        setActiveCoupon(null);

        // If quantity is more than 1, split it: add 1 free item, and add (qty - 1) paid items
        if (qty > 1) {
          const paidQty = qty - 1;
          setCart(prev => {
            const existingPaidIdx = prev.findIndex(
              i => i.id === item.id && 
                   JSON.stringify(i.selected_modifiers) === JSON.stringify(modifiers) &&
                   !i.is_free_coupon_item
            );
            if (existingPaidIdx > -1) {
              const copy = [...prev];
              copy[existingPaidIdx].quantity += paidQty;
              return copy;
            }
            return [...prev, {
              ...item,
              quantity: paidQty,
              selected_modifiers: modifiers
            }];
          });
          qty = 1;
        }
      }
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(
        i => i.id === item.id && 
             JSON.stringify(i.selected_modifiers) === JSON.stringify(modifiers) &&
             Boolean(i.is_free_coupon_item) === isFreeByCoupon
      )
      if (existingIdx > -1) {
        const copy = [...prev]
        copy[existingIdx].quantity += qty
        if (isFreeByCoupon) {
          const basePrice = getEffectiveItemUnitPrice(item);
          const modsPrice = modifiers.reduce((ma: number, m: any) => ma + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
          const unitPrice = basePrice + modsPrice;
          
          const maxLimit = activeCoupon.discount_value || 0;
          if (maxLimit > 0 && unitPrice > maxLimit) {
            copy[existingIdx].discount_amount = maxLimit;
          } else {
            copy[existingIdx].discount_amount = unitPrice * 1;
          }
        }
        return copy
      }
      return [...prev, { 
        ...item, 
        quantity: qty, 
        selected_modifiers: modifiers, 
        note: tempNote || undefined,
        discount_amount: discountAmount > 0 ? discountAmount : undefined,
        is_free_coupon_item: isFreeByCoupon,
        coupon_max_limit: isFreeByCoupon ? (activeCoupon.discount_value || 0) : undefined
      }]
    })
    setModifierModalItem(null)
  }

  const updateQuantity = (id: string, change: number, modifiers: any[] = [], isFreeCouponItem: boolean = false) => {
    setCart(prev =>
      prev.map(i => {
        if (i.id === id && JSON.stringify(i.selected_modifiers) === JSON.stringify(modifiers) && Boolean(i.is_free_coupon_item) === isFreeCouponItem) {
          const newQty = Math.max(1, i.quantity + change);
          let newDiscount = i.discount_amount || 0;
          if (i.is_free_coupon_item) {
            const basePrice = getEffectiveItemUnitPrice(i);
            const modsPrice = i.selected_modifiers?.reduce((ma: number, m: any) => ma + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
            const unitPrice = basePrice + modsPrice;
            
            const maxLimit = i.coupon_max_limit || 0;
            if (maxLimit > 0 && unitPrice > maxLimit) {
              newDiscount = maxLimit;
            } else {
              newDiscount = unitPrice * 1; // Only 1 free item!
            }
          }
          return { ...i, quantity: newQty, discount_amount: newDiscount }
        }
        return i
      })
    )
  }

  const removeFromCart = async (id: string, modifiers: any[] = [], isFreeCouponItem: boolean = false) => {
    // If we are editing an existing order, confirm and delete from DB immediately
    if (editingOrderId) {
      const confirmDelete = window.confirm(locale === 'en' ? 'Are you sure you want to cancel this item? It will be removed from the order immediately.' : 'คุณแน่ใจหรือไม่ที่จะยกเลิกรายการนี้? (ระบบจะลบออกจากออเดอร์และหน้าครัวทันที)');
      if (!confirmDelete) return;

      try {
        // Find existing items in the order
        const { data: existingItems } = await supabase
          .from('pos_order_items')
          .select('id, selected_modifiers')
          .eq('order_id', editingOrderId)
          .eq('item_id', id);

        if (existingItems && existingItems.length > 0) {
          // Try to match exact modifiers if possible
          const itemToCancel = existingItems.find((dbItem: any) => JSON.stringify(dbItem.selected_modifiers || []) === JSON.stringify(modifiers));
          if (itemToCancel) {
            await supabase.from('pos_order_items').update({ status: 'cancelled' }).eq('id', itemToCancel.id);
          } else {
            // Fallback: cancel the first one that matches item_id
            await supabase.from('pos_order_items').update({ status: 'cancelled' }).eq('id', existingItems[0].id);
          }
          
          const newCart = cart.filter((i: any) => !(i.id === id && JSON.stringify(i.selected_modifiers) === JSON.stringify(modifiers) && Boolean(i.is_free_coupon_item) === isFreeCouponItem));
          const newRawCartSubTotal = newCart.reduce((acc: number, item: any) => {
            const modsPrice = item.selected_modifiers?.reduce((ma: number, m: any) => ma + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
            const basePrice = Number(orderType === 'delivery' && deliveryPlatform ? (item.platform_price || item.sale_price || item.price || 0) : (item.sale_price || item.price || 0));
            return acc + ((basePrice + modsPrice) * item.quantity);
          }, 0);
          const newItemDiscountTotal = newCart.reduce((acc: number, item: any) => acc + (item.discount_amount || 0), 0);
          const newCartSubTotal = newRawCartSubTotal - newItemDiscountTotal;
          const newDiscountTotalValue = discountType === 'percent' ? newCartSubTotal * (discountRate / 100) : discountValue;
          const newVatAmount = hasVat ? (newCartSubTotal - newDiscountTotalValue) * (vatRate / 100) : 0;
          const newServiceChargeAmount = hasServiceCharge ? (newCartSubTotal - newDiscountTotalValue) * 0.1 : 0;
          const newCartTotal = Math.max(0, Math.round(newCartSubTotal - newDiscountTotalValue + newVatAmount + newServiceChargeAmount));

          const orderUpdatePayload = {
            total_amount: newRawCartSubTotal,
            net_total: newCartTotal,
            tax_amount: newVatAmount,
            service_charge_amount: newServiceChargeAmount,
            discount_amount: newDiscountTotalValue + newItemDiscountTotal,
            updated_at: new Date().toISOString()
          };
          
          // Trigger a realtime update by modifying pos_orders
          await supabase.from('pos_orders').update(orderUpdatePayload).eq('id', editingOrderId);
          playAppSound('notification'); // Optional sound confirmation
        }
      } catch (err) {
        console.error('Failed to cancel item from DB:', err);
        alert(locale === 'en' ? 'Failed to cancel item' : 'ไม่สามารถยกเลิกรายการได้');
        return;
      }
    }

    setCart(prev =>
      prev.filter(
        i => !(i.id === id && JSON.stringify(i.selected_modifiers) === JSON.stringify(modifiers) && Boolean(i.is_free_coupon_item) === isFreeCouponItem)
      )
    )
  }

  const applyItemDiscount = () => {
    if (!itemDiscountModalItem) return

    setCart(prev =>
      prev.map(i => {
        if (i.id === itemDiscountModalItem.id && JSON.stringify(i.selected_modifiers) === JSON.stringify(itemDiscountModalItem.selected_modifiers)) {
          let calcDiscount = 0
          const val = Number(itemDiscountValue)
          if (!isNaN(val) && val > 0) {
            if (itemDiscountType === 'percent') {
              const basePrice = getEffectiveItemUnitPrice(i)
              const modsPrice = i.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0
              calcDiscount = ((basePrice + modsPrice) * i.quantity) * (val / 100)
            } else {
              calcDiscount = val
            }
          }
          return { ...i, discount_amount: calcDiscount, discount_reason: calcDiscount > 0 ? itemDiscountReason : undefined }
        }
        return i
      })
    )
    setItemDiscountModalItem(null)
    setItemDiscountValue('')
  }

  const applyBillDiscount = () => {
    const val = Number(billDiscountInput)
    if (val > 0) {
      setDiscountType(billDiscountModalType)
      if (billDiscountModalType === 'percent') {
        setDiscountRate(val)
        setDiscountValue(0)
      } else {
        setDiscountValue(val)
        setDiscountRate(0)
      }
      setDiscountName(billDiscountReason)
    } else {
      setDiscountRate(0)
      setDiscountValue(0)
      setDiscountName('')
    }
    setShowBillDiscountModal(false)
  }

  const handleSendOrder = async () => {
    logPOSPrintFlow('preflight:start', {
      cartItems: cart.length,
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
      hasActiveShift: !!activeShift,
      orderType,
      hasSelectedTable: !!selectedTable,
      editingOrderId,
      isHeldOrderBaselineLoading,
      hasUnsavedOrderChanges,
    })

    if (cart.length === 0) {
      logPOSPrintFlow('preflight:fail', { reason: 'empty_cart' })
      return
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      logPOSPrintFlow('preflight:fail', { reason: 'offline' })
      alert('เน็ตไม่พร้อม: หน้า POS เป็นโหมด Online เท่านั้น กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนพักบิลหรือสั่งปริ้นเข้าครัว')
      return
    }

    if (!activeShift) {
      logPOSPrintFlow('preflight:fail', { reason: 'missing_active_shift' })
      alert('ยังไม่เปิดกะ: กรุณาเปิดกะ (Shift) ก่อนพักบิลหรือสั่งปริ้นเข้าครัว')
      onShiftModalOpen()
      return
    }

    if (isHeldOrderBaselineLoading) {
      logPOSPrintFlow('preflight:fail', { reason: 'held_baseline_loading', editingOrderId })
      alert('กำลังตรวจสอบบิลที่พักไว้ กรุณารอสักครู่ครับ')
      return
    }

    if (editingOrderId && !hasUnsavedOrderChanges) {
      logPOSPrintFlow('preflight:fail', { reason: 'no_unsaved_order_changes', editingOrderId })
      alert('บิลนี้พักไว้แล้วครับ ถ้าต้องการส่งออเดอร์เพิ่ม กรุณาเพิ่มรายการใหม่ก่อน')
      return
    }

    if (!ensureDeliveryDetailsReady()) {
      logPOSPrintFlow('preflight:fail', { reason: 'missing_delivery_details', orderType, deliveryPlatform, platformOrderId })
      return
    }

    if (orderType === 'dine_in' && !selectedTable) {
      logPOSPrintFlow('preflight:fail', { reason: 'missing_table' })
      alert('กรุณาเลือกโต๊ะก่อนส่งออเดอร์สำหรับ Dine-in ครับ')
      setShowTableModal(true)
      return
    }

    logPOSPrintFlow('preflight:pass')
    setIsProcessing(true); setCheckoutError(null);
    try {
        let savedOrder: any
        try {
          savedOrder = await handleHoldOrder({ suppressProcessingState: true, suppressAlert: true }) as any
        } catch (saveError: any) {
          logPOSPrintFlow('rpc:fail', { error: saveError?.message || saveError })
          alert('บันทึกบิลไม่สำเร็จ: ' + (saveError?.message || JSON.stringify(saveError)))
          return
        }

        if (!savedOrder) {
          logPOSPrintFlow('rpc:no_result')
          alert('บันทึกบิลไม่สำเร็จ: ไม่ได้รับข้อมูลออเดอร์กลับจากระบบ')
          return
        }

        if (savedOrder.orderId) {
            try {
                logPOSPrintFlow('print_after_save:start', { orderId: savedOrder.orderId })
                await printFromDatabaseOrder(savedOrder.orderId, 'kitchen', false);
                logPOSPrintFlow('print_after_save:success', { orderId: savedOrder.orderId })
            } catch (err: any) {
                console.error('Kitchen print error:', err);
                logPOSPrintFlow('print_after_save:fail', { orderId: savedOrder.orderId, error: err?.message || err })
                alert('บันทึกบิลสำเร็จ แต่ปริ้นไม่สำเร็จ: ' + (err.message || JSON.stringify(err)));
            }
        } else {
            logPOSPrintFlow('rpc:missing_order_id', savedOrder)
            alert('ไม่พบเลขที่ออเดอร์ในการส่งบิลเข้าครัวครับ');
        }
    } catch (error) {
        console.error('Error sending order to kitchen:', error);
        alert('เกิดข้อผิดพลาดในการส่งบิลเข้าครัว: ' + (error as any).message);
    } finally {
        setIsProcessing(false);
    }
  };

  async function handleHoldOrder(options?: { suppressProcessingState?: boolean; suppressAlert?: boolean; keepComposer?: boolean }) {
    if (paymentLockRef.current) return;
    if (cart.length === 0) return
    if (typeof window !== 'undefined' && !navigator.onLine) {
      logPOSPrintFlow('hold_guard:fail', { reason: 'offline' })
      const offlineError = new Error('เน็ตไม่พร้อม: หน้า POS เป็นโหมด Online เท่านั้น')
      if (!options?.suppressAlert) alert(offlineError.message)
      throw offlineError
    }
    if (!activeShift) {
      logPOSPrintFlow('hold_guard:fail', { reason: 'missing_active_shift' })
      alert('กรุณาเปิดกะ (Shift) ก่อนทำรายการครับ')
      onShiftModalOpen()
      return
    }
    if (!ensureDeliveryDetailsReady()) {
      logPOSPrintFlow('hold_guard:fail', { reason: 'missing_delivery_details' })
      return
    }


    if (orderType === 'dine_in' && !selectedTable) {
      logPOSPrintFlow('hold_guard:fail', { reason: 'missing_table' })
      alert('กรุณาเลือกโต๊ะก่อนพักบิลสำหรับ Dine-in ครับ')
      setShowTableModal(true)
      return
    }

    if (editingOrderId && !hasUnsavedOrderChanges) {
      throw new Error('บิลนี้พักไว้แล้ว กรุณาเพิ่มรายการใหม่ก่อนส่งออเดอร์เพิ่ม')
    }

        paymentLockRef.current = true;
	    if (!options?.suppressProcessingState) setIsProcessing(true); setCheckoutError(null)
	    try {
	      let finalOrderId = editingOrderId
	      let finalOrderNumber = editingOrderNumber || ''
	      let finalQueueNumber = 0;
	      let existingComparableItems: any[] = []
          let newItems: any[] = []

          const identity = await fetchOrderIdentity(editingOrderId)
          finalOrderNumber = identity.orderNumber
          finalQueueNumber = identity.queueNumber

	      if (editingOrderId) {
          const { data: existingRows, error: existingRowsError } = await supabase
            .from('pos_order_items')
            .select(`*, item:pos_menu_items!item_id(*)`)
            .eq('order_id', editingOrderId)
          if (existingRowsError) throw existingRowsError
          existingComparableItems = (existingRows || []).map((row: any) => ({
            id: row.item_id,
            item_id: row.item_id,
            name: row.item?.name || 'Unknown Item',
            quantity: row.quantity,
            selected_modifiers: row.selected_modifiers || [],
            category_id: row.item?.category_id || 'uncategorized',
          }))

          newItems = computeNewCartItems(cart, existingComparableItems)
          if (newItems.length === 0) {
            throw new Error('บิลนี้พักไว้แล้ว กรุณาเพิ่มรายการใหม่ก่อนส่งออเดอร์เพิ่ม')
          }
        }

        // WATERFALL QUEUE CALCULATION (Auto Queue Algorithm)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const { data: latestQueueData } = await supabase
          .from('pos_orders')
          .select('estimated_prep_completion')
          .in('status', ['pending', 'paid', 'accepted', 'preparing'])
          .gte('created_at', startOfToday.toISOString())
          .order('estimated_prep_completion', { ascending: false })
          .limit(1);

        const latestCompletionTime = latestQueueData?.[0]?.estimated_prep_completion 
          ? new Date(latestQueueData[0].estimated_prep_completion) 
          : new Date();

        const now = new Date();
        const baseTime = latestCompletionTime.getTime() > now.getTime() ? latestCompletionTime : now;
        
        // Fetch Category Prep Time Mapping
        const { data: catData } = await supabase.from('pos_menu_categories').select('id, estimated_prep_minutes');
        const prepTimeMap = new Map(catData?.map(c => [c.id, c.estimated_prep_minutes ?? 2]));

        const itemsToCount = editingOrderId ? newItems : cart;
        const prepDurationMinutes = itemsToCount.reduce((acc: number, item: any) => {
          const prepTime = prepTimeMap.get(item.category_id) ?? 2;
          return acc + (prepTime * (Number(item.quantity) || 1));
        }, 0);
        
        const estimatedPrepCompletion = new Date(baseTime.getTime() + prepDurationMinutes * 60000);

        const payload: any = {
          order_action: editingOrderId ? 'update' : 'insert',
          order_id: editingOrderId || undefined,
          order: {
            merchant_id: profile?.merchant_id || null,
            order_number: finalOrderNumber,
            staff_id: profile?.id,
            shift_id: activeShift?.id,
            branch_id: shopSettings?.branch_id || activeShift?.branch_id || null,
            status: 'pending',
            total_amount: rawCartSubTotal,
            net_total: cartTotal,
            tax_amount: vatAmount,
            service_charge_amount: serviceChargeAmount,
            discount_amount: discountTotalValue + itemDiscountTotal,
            promo_code: discountName || null,
            customer_id: selectedCustomer?.id,
            order_type: orderType,
            table_id: selectedTable?.id,
            table_number: selectedTable?.table_number,
            queue_number: finalQueueNumber,
            order_source: 'pos',
            paid_at: null,
            delivery_platform: orderType === 'delivery' ? deliveryPlatform : null,
            delivery_gp_amount: 0,
            reference_name: orderType === 'delivery' && platformOrderId ? platformOrderId.trim() : null,
            estimated_prep_completion: estimatedPrepCompletion.toISOString(),
          },
          order_items: cart.map(item => {
            const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
            return {
              item_id: item.id,
              quantity: item.quantity,
              unit_price: getEffectiveItemUnitPrice(item),
              cost_price: item.cost_price || 0,
              subtotal: ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity) - (item.discount_amount || 0),
              selected_modifiers: item.selected_modifiers,
              customer_name: item.customer_name || 'ลูกค้า',
              discount_amount: item.discount_amount || 0,
              discount_reason: item.discount_reason || null,
            }
          })
        };

        logPOSPrintFlow('rpc:start', {
          action: payload.order_action,
          orderId: editingOrderId || null,
          orderNumber: finalOrderNumber,
          itemCount: payload.order_items?.length || 0,
        })

        const { data: rpcResult, error: rpcError } = await supabase.rpc('pos_checkout_order', { payload });
        
        if (rpcError) {
          console.error('RPC HoldOrder Error:', rpcError);
          logPOSPrintFlow('rpc:fail', { error: rpcError.message || rpcError })
          throw rpcError;
        }

        finalOrderId = rpcResult?.order_id || editingOrderId;
        logPOSPrintFlow('rpc:success', { orderId: finalOrderId, orderNumber: finalOrderNumber })

	      const newItemsForPrint = editingOrderId
	        ? computeNewCartItems(cart, existingComparableItems)
	        : [...cart]

	      const orderItems = cart.map(item => {
          const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
          return {
	          order_id: finalOrderId,
            item_id: item.id,
            quantity: item.quantity,
            unit_price: getEffectiveItemUnitPrice(item),
            cost_price: item.cost_price || 0,
            subtotal: ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity) - (item.discount_amount || 0),
            selected_modifiers: item.selected_modifiers,
            customer_name: item.customer_name || 'ลูกค้า',
            discount_amount: item.discount_amount || 0,
            discount_reason: item.discount_reason || null,
          }
        })

// pos_checkout_order handles pos_order_items automatically now

	      setHeldCartFingerprint(buildCartFingerprint(cart))
	      const savedPayload = {
	        orderId: finalOrderId,
	        orderNumber: finalOrderNumber,
	        queueNumber: finalQueueNumber,
	        tableNumber: selectedTable?.table_number,
	        orderType,
	        deliveryPlatform: orderType === 'delivery' ? deliveryPlatform : '',
	        referenceName: orderType === 'delivery' ? platformOrderId.trim() : '',
	        newItems: newItemsForPrint,
	      }

	      if (!options?.keepComposer) {
	        resetOrderComposer()
	      }
	      refreshPendingOrders()
	      return savedPayload
	    } catch (e) {
	      console.error('Hold Error:', e)
	      if (!options?.suppressAlert) alert('ไม่สามารถพักบิลได้: ' + (e as any).message)
	      throw e
	    } finally {
          paymentLockRef.current = false;
	      if (!options?.suppressProcessingState) setIsProcessing(false)
	    }
	  }


  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (memberSearchQuery.trim().length >= 3) {
        setIsSearchingMember(true)
        try {
          const { data } = await supabase
            .from('pos_members')
            .select('*')
            .eq('merchant_id', shopSettings?.merchant_id)
            .or(`phone.ilike.%${memberSearchQuery}%,full_name.ilike.%${memberSearchQuery}%,display_name.ilike.%${memberSearchQuery}%`)
            .limit(5)
          if (data) {
            setMemberSearchResults(data)
          } else {
            setMemberSearchResults([])
          }
        } catch(e) {
          console.error(e)
        } finally {
          setIsSearchingMember(false)
        }
      } else {
        setMemberSearchResults([])
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [memberSearchQuery])

  const handleSearchMemberFlow = async () => {
    if (!memberSearchQuery.trim()) return;
    setIsSearchingMember(true);
    try {
      const { data, error } = await supabase
        .from('pos_members')
        .select('*')
        .eq('merchant_id', shopSettings?.merchant_id)
        .or(`phone.ilike.%${memberSearchQuery}%,full_name.ilike.%${memberSearchQuery}%,display_name.ilike.%${memberSearchQuery}%`)
        .limit(1)
        .maybeSingle();

      if (memberSearchResults.length > 0) {
        setSelectedCustomer(memberSearchResults[0]);
        setMemberCheckoutStep('points');
      } else if (data) {
        setSelectedCustomer(data);
        setMemberCheckoutStep('points');
      } else {
        alert(locale === 'en' ? 'Member not found' : 'ไม่พบข้อมูลสมาชิก');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSearchingMember(false);
    }
  };

  const handleProcessPayment = async (method: string, amount?: number, receivedAmount?: number): Promise<boolean> => {
    if (paymentLockRef.current || isProcessing) {
      alert('กำลังประมวลผล กรุณารอสักครู่... หากค้างนานเกินไปให้รีเฟรชแอปพลิเคชัน');
      return false;
    }
    if (cart.length === 0) {
      alert('ไม่สามารถชำระเงินได้เนื่องจากไม่มีรายการสินค้าในบิล');
      return false;
    }
    
    if (typeof window !== 'undefined' && !navigator.onLine) {
      alert('เน็ตไม่พร้อม: หน้า POS เป็นโหมด Online เท่านั้น กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนชำระเงิน')
      return false;
    }
    if (!activeShift) {
      alert('กรุณาเปิดกะ (Shift) ก่อนชำระเงินครับ')
      onShiftModalOpen()
      return false;
    }
    if (!ensureDeliveryDetailsReady()) return false;

    paymentLockRef.current = true;
    setIsProcessing(true); setCheckoutError(null); setProcessingMethod(method);
	    try {

	      playAppSound('pay');
	      let finalOrderId = editingOrderId
	      let finalOrderNumber = editingOrderNumber || ''
	      let finalQueueNumber = 0;
	      const amountToPay = amount !== undefined ? amount : remainingTotal
        let pointsEarned = 0;
      const newTotalPaid = totalPaid + amountToPay
      const newStatus = newTotalPaid >= cartTotal ? 'completed' : 'payment_pending'

      // Calculate combined payment method string if it's a split payment
      let combinedMethodStr = method;
      if (totalPaid > 0 && editingOrderId) {
        try {
          const { data: payRecords } = await supabase
            .from('pos_order_payments')
            .select('payment_method')
            .eq('order_id', editingOrderId);
          
          let methods = [method]; // start with current method
          if (payRecords && payRecords.length > 0) {
             methods = [...payRecords.map(p => p.payment_method?.replace('_', ' ') || ''), method];
          }
          const uniqueMethods = Array.from(new Set(methods.map(m => m?.toUpperCase() || ''))).filter(Boolean);
          if (uniqueMethods.length > 0) {
             combinedMethodStr = uniqueMethods.join(' + ');
          }
        } catch (e) {
          console.error('Failed to fetch previous payments for combined method', e);
        }
      }
      
      // Fetch fresh GP settings from DB to ensure we always have latest values
      let gpPercent = 0;
      if (orderType === 'delivery' && deliveryPlatform) {
        // First try from loaded shopSettings
        const gpFromSettings = shopSettings?.delivery_gp?.[deliveryPlatform]
          ?? shopSettings?.opening_hours?.delivery_gp?.[deliveryPlatform];
        if (gpFromSettings !== undefined && gpFromSettings !== null) {
          gpPercent = Number(gpFromSettings) || 0;
        } else {
          // Fallback: fetch fresh from DB
          try {
            const settingsId = shopSettings?.id;
            if (settingsId) {
              const { data: freshSettings } = await supabase
                .from('pos_shop_settings')
                .select('delivery_gp, opening_hours')
                .eq('id', settingsId)
                .maybeSingle();
              gpPercent = Number(
                freshSettings?.delivery_gp?.[deliveryPlatform]
                  ?? freshSettings?.opening_hours?.delivery_gp?.[deliveryPlatform]
              ) || 0;
            } else if (shopSettings?.branch_id) {
              const { data: freshSettings } = await supabase
                .from('pos_shop_settings')
                .select('delivery_gp, opening_hours')
                .eq('branch_id', shopSettings.branch_id)
                .maybeSingle();
              gpPercent = Number(
                freshSettings?.delivery_gp?.[deliveryPlatform]
                  ?? freshSettings?.opening_hours?.delivery_gp?.[deliveryPlatform]
              ) || 0;
            }
          } catch (e) {
            console.warn('Could not fetch GP settings:', e);
          }
        }
        console.log(`[GP] platform=${deliveryPlatform}, gpPercent=${gpPercent}%, cartTotal=${cartTotal}`);
      }
      const deliveryGpAmount = (cartTotal * gpPercent) / 100;
      const identity = await fetchOrderIdentity(editingOrderId)
		      finalQueueNumber = identity.queueNumber
              finalOrderNumber = identity.orderNumber

        let estimatedPrepCompletionStr: string | undefined = undefined;
        if (!editingOrderId) {
           const startOfToday = new Date();
           startOfToday.setHours(0, 0, 0, 0);
           const { data: latestQueueData } = await supabase
             .from('pos_orders')
             .select('estimated_prep_completion')
             .in('status', ['pending', 'paid', 'accepted', 'preparing'])
             .gte('created_at', startOfToday.toISOString())
             .order('estimated_prep_completion', { ascending: false })
             .limit(1);
   
           const latestCompletionTime = latestQueueData?.[0]?.estimated_prep_completion 
             ? new Date(latestQueueData[0].estimated_prep_completion) 
             : new Date();
   
           const now = new Date();
           const baseTime = latestCompletionTime.getTime() > now.getTime() ? latestCompletionTime : now;
           
           // Fetch Category Prep Time Mapping
           const { data: catData } = await supabase.from('pos_menu_categories').select('id, estimated_prep_minutes');
           const prepTimeMap = new Map(catData?.map(c => [c.id, c.estimated_prep_minutes ?? 2]));

           const prepDurationMinutes = cart.reduce((acc: number, item: any) => {
             const prepTime = prepTimeMap.get(item.category_id) ?? 2;
             return acc + (prepTime * (Number(item.quantity) || 1));
           }, 0);
           
           const estimatedPrepCompletion = new Date(baseTime.getTime() + prepDurationMinutes * 60000);
           estimatedPrepCompletionStr = estimatedPrepCompletion.toISOString();
        }

	      const payload: any = {
        order_action: editingOrderId ? 'update' : 'insert',
        order_id: editingOrderId || undefined,
        order: {
          merchant_id: profile?.merchant_id || null,
          order_number: finalOrderNumber,
          staff_id: profile?.id,
          shift_id: activeShift?.id,
          branch_id: activeShift?.branch_id || shopSettings?.branch_id || null,
          status: newStatus,
          total_amount: rawCartSubTotal,
          net_total: cartTotal,
          tax_amount: vatAmount,
          service_charge_amount: serviceChargeAmount,
          discount_amount: discountTotalValue + itemDiscountTotal,
          promo_code: discountName || null,
          customer_id: selectedCustomer?.id,
          order_type: orderType,
          table_id: selectedTable?.id,
          table_number: selectedTable?.table_number,
          queue_number: finalQueueNumber,
          payment_method: newStatus === 'completed' ? combinedMethodStr : method,
          order_source: 'pos',
          paid_at: new Date().toISOString(),
          delivery_platform: orderType === 'delivery' ? deliveryPlatform : null,
          delivery_gp_amount: deliveryGpAmount,
          reference_name: orderType === 'delivery' && platformOrderId ? platformOrderId.trim() : null,
          ...(estimatedPrepCompletionStr ? { estimated_prep_completion: estimatedPrepCompletionStr } : {}),
        },
        order_items: cart.map(item => {
          const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
          return {
            item_id: item.id,
            quantity: item.quantity,
            unit_price: getEffectiveItemUnitPrice(item),
            cost_price: item.cost_price || 0,
            subtotal: ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity) - (item.discount_amount || 0),
            selected_modifiers: item.selected_modifiers,
            customer_name: item.customer_name || 'ลูกค้า',
            discount_amount: item.discount_amount || 0,
            discount_reason: item.discount_reason || null,
          }
        }),
        payments: [{
          payment_method: method,
          amount: amountToPay,
          status: 'paid'
        }]
      };

      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const ingredientsToFetch: { ingredient_id: string, usage: number }[] = [];

        for (const item of cart) {
          const selectedMods = item.selected_modifiers || []
          
          // Phase 1: Context Extraction from selected modifiers
          let sweetnessRatio = 1.0
          let activeRoastIngredientId: string | null = null
          const substitutionsMap = new Map<string, { newIngredientId: string, name: string }>()

          selectedMods.forEach((mod: any) => {
            if (mod.sweetness_multiplier !== undefined && mod.sweetness_multiplier !== null) {
              sweetnessRatio = Number(mod.sweetness_multiplier)
            } else if (mod.name) {
              if (mod.name.includes('0%')) sweetnessRatio = 0.0
              else if (mod.name.includes('25%')) sweetnessRatio = 0.25
              else if (mod.name.includes('50%')) sweetnessRatio = 0.50
              else if (mod.name.includes('125%')) sweetnessRatio = 1.25
            }

            const modRecipes = mod.recipe_data || []
            modRecipes.forEach((ing: any) => {
              if (mod.name && (mod.name.includes('คั่ว') || mod.name.includes('Roast')) && ing.ingredient_id) {
                if (uuidRegex.test(ing.ingredient_id)) {
                  activeRoastIngredientId = ing.ingredient_id
                }
              }
              if (ing.is_substitution || mod.is_substitution || (mod.name && (mod.name.includes('Almond') || mod.name.includes('Oat') || mod.name.includes('อัลมอนด์')))) {
                if (ing.ingredient_id && uuidRegex.test(ing.ingredient_id)) {
                  const targetName = ing.substitute_target_name || 'นมสด'
                  substitutionsMap.set(targetName, { newIngredientId: ing.ingredient_id, name: ing.name })
                }
              }
            })
          })

          // Phase 2: Base Menu Recipe Deduction
          let reducedSweetenerVolume = 0
          let baseLiquidIngIndex = -1
          const baseIngredientsToDeduct: { ingredient_id: string, quantity: number, factor: number }[] = []

          if (item.recipe_data && Array.isArray(item.recipe_data)) {
            item.recipe_data.forEach((ing: any, idx: number) => {
              if (ing.order_types && Array.isArray(ing.order_types) && !ing.order_types.includes(orderType)) return;

              let baseQty = Number(ing.quantity || 0)
              const factor = Number(ing.factor || 1)

              const isSweetener = ing.is_sweetener || (ing.name && (ing.name.includes('น้ำเชื่อม') || ing.name.includes('นมข้น') || ing.name.includes('ไซรัป') || ing.name.includes('Syrup')))
              const isBaseLiquid = ing.is_base_liquid || (ing.name && (ing.name.includes('ชา') || ing.name.includes('กาแฟ') || ing.name.includes('Coffee') || ing.name.includes('Tea')))

              if (isSweetener) {
                const scaledQty = baseQty * sweetnessRatio
                reducedSweetenerVolume += (baseQty - scaledQty) * factor
                baseQty = scaledQty
              } else if (isBaseLiquid && baseLiquidIngIndex === -1) {
                baseLiquidIngIndex = idx
              }

              let targetId = ing.ingredient_id
              substitutionsMap.forEach((sub, key) => {
                if (ing.name && ing.name.includes(key)) {
                  targetId = sub.newIngredientId
                }
              })

              if (targetId && uuidRegex.test(targetId) && baseQty > 0) {
                baseIngredientsToDeduct.push({ ingredient_id: targetId, quantity: baseQty, factor })
              }
            })

            if (reducedSweetenerVolume > 0 && baseLiquidIngIndex !== -1 && item.recipe_data[baseLiquidIngIndex]) {
              const baseIng = item.recipe_data[baseLiquidIngIndex]
              const baseFactor = Number(baseIng.factor || 1)
              const topUpQty = reducedSweetenerVolume / (baseFactor || 1)
              
              const existingDeduct = baseIngredientsToDeduct.find(b => b.ingredient_id === baseIng.ingredient_id)
              if (existingDeduct) {
                existingDeduct.quantity += topUpQty
              }
            }

            for (const bIng of baseIngredientsToDeduct) {
              const usage = bIng.quantity * bIng.factor * Number(item.quantity)
              if (bIng.ingredient_id && uuidRegex.test(bIng.ingredient_id) && usage > 0) {
                ingredientsToFetch.push({ ingredient_id: bIng.ingredient_id, usage });
              }
            }
          }

          // Phase 3: Extra Modifier Recipe Deduction
          if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
            for (const mod of item.selected_modifiers) {
              if (mod.recipe_data && Array.isArray(mod.recipe_data)) {
                for (const ing of mod.recipe_data) {
                  if (ing.order_types && Array.isArray(ing.order_types) && !ing.order_types.includes(orderType)) continue;
                  if (ing.is_substitution) continue;

                  let targetIngId = ing.ingredient_id
                  if ((ing.is_contextual_roast || (mod.name && mod.name.includes('Shot'))) && activeRoastIngredientId) {
                    targetIngId = activeRoastIngredientId
                  }

                  const usage = Number(ing.quantity || 0) * Number(ing.factor || 1) * Number(item.quantity)
                  if (targetIngId && uuidRegex.test(targetIngId) && usage > 0) {
                    ingredientsToFetch.push({ ingredient_id: targetIngId, usage });
                  }
                }
              }
            }
          }
        }

        const movementsToInsert: any[] = []
        if (ingredientsToFetch.length > 0) {
          const ingredientIds = Array.from(new Set(ingredientsToFetch.map(i => i.ingredient_id)));
          const { data: invItems } = await supabase.from('inventory_items').select('id, stock_quantity').in('id', ingredientIds);
          
          if (invItems && invItems.length > 0) {
            const invMap = new Map(invItems.map(i => [i.id, Number(i.stock_quantity)]));
            
            for (const ing of ingredientsToFetch) {
              const currentStock = invMap.get(ing.ingredient_id);
              if (currentStock !== undefined) {
                movementsToInsert.push({
                  item_id: ing.ingredient_id,
                  change_amount: -ing.usage,
                  new_quantity: currentStock,
                  reason: 'sale'
                });
              }
            }
          }
        }
        
        if (movementsToInsert.length > 0) {
          payload.movements = movementsToInsert;
        }
      } catch (movErr) {
        console.error('Failed to prepare inventory movements:', movErr)
      }

      if (selectedCustomer?.id) {
        payload.member_id = selectedCustomer.id;
        payload.points_history = [];
        

        
        if (appliedCouponId) {
          payload.coupon_id_to_mark_used = appliedCouponId;
        }

        const earnThb = shopSettings?.opening_hours?.loyalty_earn_thb !== undefined ? shopSettings.opening_hours.loyalty_earn_thb : (shopSettings?.opening_hours?.loyalty_earn_rate || 100);
        const earnPts = shopSettings?.opening_hours?.loyalty_earn_pts !== undefined ? shopSettings.opening_hours.loyalty_earn_pts : 1;
        
        const pointableAmount = amountToPay;
        pointsEarned = 0;
        
        if (pointableAmount > 0 && earnThb > 0) {
          if (activeCampaigns && activeCampaigns.length > 0 && cart.length > 0) {
            let totalMultiplierEffectiveAmount = 0;
            const ratio = amountToPay / (cartTotal || 1);
            
            cart.forEach((item: any) => {
              const itemEffectivePrice = ((item.price || 0) * (item.quantity || 1)) * ratio;
              let multiplier = 1.0;
              const catName = item.category?.name || '';
              
              activeCampaigns.forEach(camp => {
                if (camp.applicable_categories && camp.applicable_categories.length > 0) {
                  const match = camp.applicable_categories.find((c: string) => c.toLowerCase() === catName.toLowerCase());
                  if (match) multiplier = Math.max(multiplier, camp.multiplier);
                } else {
                   multiplier = Math.max(multiplier, camp.multiplier);
                }
              });
              totalMultiplierEffectiveAmount += (itemEffectivePrice * multiplier);
            });
            pointsEarned = Math.floor(totalMultiplierEffectiveAmount / earnThb) * earnPts;
          } else {
            pointsEarned = Math.floor(amountToPay / earnThb) * earnPts;
          }
        }
        
        if (pointsEarned > 0) {
          payload.points_earned = pointsEarned;
          payload.points_history.push({
            points: pointsEarned,
            points_change: pointsEarned,
            type: 'earn',
            description: `สะสมจากการสั่งซื้อ ${orderType === 'takeaway' ? 'Takeaway' : orderType === 'delivery' ? 'Delivery' : 'หน้าร้าน'} #${finalOrderNumber}`
          });
        }
      }

      if (newStatus === 'completed' && selectedTable?.id) {
        payload.table_id_to_clear = selectedTable.id;
      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc('pos_checkout_order', { payload });
      
      if (rpcError) {
        console.error('RPC Checkout Error:', rpcError);
        throw rpcError;
      }

      finalOrderId = rpcResult?.order_id || editingOrderId;

      if (newStatus === 'completed') {
        const orderIdToSearch = finalOrderId || editingOrderId;
        if (orderIdToSearch) {
          const { data: activeCheckin } = await supabase
            .from('pos_member_checkins')
            .select('id')
            .eq('order_id', orderIdToSearch)
            .eq('status', 'linked')
            .maybeSingle();

          if (activeCheckin) {
            await supabase
              .from('pos_member_checkins')
              .update({
                status: 'completed',
                points_earned: pointsEarned || 0
              })
              .eq('id', activeCheckin.id);
          } else if (selectedCustomer?.id) {
            const { data: memberCheckin } = await supabase
              .from('pos_member_checkins')
              .select('id')
              .eq('member_id', selectedCustomer.id)
              .in('status', ['pending', 'linked'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (memberCheckin) {
              await supabase
                .from('pos_member_checkins')
                .update({
                  status: 'completed',
                  order_id: orderIdToSearch,
                  points_earned: pointsEarned || 0
                })
                .eq('id', memberCheckin.id);
            }
          }

          // Update pending point history record to completed
          if (orderIdToSearch) {
            try {
              await supabase
                .from('pos_points_history')
                .update({
                  status: 'completed',
                  points: pointsEarned || 0,
                  points_change: pointsEarned || 0,
                  description: `สะสมพอยท์จากการสั่งซื้อ #${finalOrderNumber}`
                })
                .eq('order_id', orderIdToSearch);
            } catch (pErr) {
              console.error('Failed to update pending point history:', pErr);
            }

            // Update QR reward token to the final order ID and points if it was generated with a fake UUID
            if (qrTargetOrderIdRef.current) {
              try {
                await supabase
                  .from('pos_qr_reward_tokens')
                  .update({ 
                    order_id: orderIdToSearch,
                    points: pointsEarned || 0 
                  })
                  .eq('order_id', qrTargetOrderIdRef.current);
              } catch (tErr) {
                console.error('Failed to update token order id and points:', tErr);
              }
            }
          }
        }
      }

      if (newStatus === 'completed' && selectedTable?.id) {
        fetchTables();
      }

      // --- Trigger Gamification Evaluation ---
      if (newStatus === 'completed' && selectedCustomer?.id && finalOrderId) {
        fetch('/api/gamification/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: finalOrderId,
            member_id: selectedCustomer.id
          })
        }).catch(err => console.error('Gamification eval error:', err));
      }

      // --- Hardware Printing Logic ---
      const printers = shopSettings?.printers || []
      
      // Drawer kick logic based on shift settings (moved outside printer condition)
      const shiftSettings = shopSettings?.opening_hours?.shift_settings || {};
      const kickOnCash = method === 'cash';
      const kickOnCredit = method === 'credit_card' && shiftSettings.drawer_kick_on_credit;
      const kickOnCustom = method !== 'cash' && method !== 'credit_card' && shiftSettings.drawer_kick_on_custom;

      if (kickOnCash || kickOnCredit || kickOnCustom) {
        try {
          const receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
          if (receiptPrinters.length > 0) {
            Promise.all(receiptPrinters.map(rp => rp.ip ? printOpenDrawer(rp.ip) : Promise.resolve())).catch(console.error);
          } else {
            const fallbackIp = getFallbackPrinterIp()
            if (fallbackIp) printOpenDrawer(fallbackIp).catch(console.error);
          }
        } catch (kickErr) {
          console.error('Drawer kick failed:', kickErr);
        }
      }

	      if (printers.length > 0) {
	        try {
	          const orderNumToPrint = finalOrderNumber || (finalOrderId ? (finalOrderId as string).slice(0, 8) : 'NEW')
	          const queueNumToPrint = finalQueueNumber
          
          // Original Full Item List
          const allItems = cart.map(item => ({
              id: item.id, // keep id to lookup category
              category_id: item.category_id,
              name: item.name,
              quantity: item.quantity,
              subtotal: getEffectiveItemUnitPrice(item) * item.quantity,
              modifiers: item.selected_modifiers?.map((m: any) => m.name) || [],
              selected_modifiers: item.selected_modifiers || []
          }))

          const printOrderData = {
            orderNumber: orderNumToPrint,
            queueNumber: String(queueNumToPrint),
            date: new Date().toLocaleString(),
            orderSource: 'pos',
            tableNumber: selectedTable?.table_number,
            orderType: orderType,
            staffName: profile?.full_name || 'Staff',
            customerName: selectedCustomer?.full_name,
            deliveryPlatform: orderType === 'delivery' ? deliveryPlatform : '',
            referenceName: orderType === 'delivery' ? platformOrderId.trim() : '',
            comment: cart.some((item: any) => item.note) ? cart.map((item: any) => item.note).filter(Boolean).join('\n') : '',
            pickupTime: '',
            subtotal: cartSubTotal,
            discount: discountTotalValue,
            serviceCharge: serviceChargeAmount,
            tax: vatAmount,
            netTotal: cartTotal,
            paymentMethod: method,
            items: allItems
          }
          
          const printShopData = {
            name: shopSettings?.name || 'RUSH UP',
            branch: shopSettings?.branch_name,
            taxId: shopSettings?.tax_id,
            address: shopSettings?.address,
            phone: shopSettings?.phone,
            receiptHeader: shopSettings?.opening_hours?.receipt_header || shopSettings?.receipt_header,
            receiptFooter: shopSettings?.opening_hours?.receipt_footer || shopSettings?.receipt_footer,
            receiptShowLogo: shopSettings?.receipt_show_logo,
            receiptFontSize: shopSettings?.receipt_font_size,
            kitchenFontSize: shopSettings?.kitchen_font_size,
            kitchenShowType: shopSettings?.kitchen_show_type,
            orderNumberFormat: shopSettings?.order_number_format || shopSettings?.opening_hours?.order_number_format,
            receiptPaymentQrImage: shopSettings?.opening_hours?.receipt_payment_qr_image || shopSettings?.receipt_payment_qr_image
          }

        } catch (printErr) {
          console.error('Printing failed during checkout:', printErr)
        }
      }

	      const receivedNum = method === 'cash' ? (receivedAmount !== undefined ? receivedAmount : (cashReceived ? Number(cashReceived) : amountToPay)) : amountToPay;
	      const changeNum = receivedNum - amountToPay;
	      const orderNumToPrint = finalOrderNumber || (finalOrderId ? (finalOrderId as string).slice(0, 8) : 'NEW');
	      const queueNumToPrint = finalQueueNumber

      let finalMethodStr = newStatus === 'completed' ? combinedMethodStr : method;

      if (newStatus === 'completed' && !showSplitPaymentModal) {
        setPaymentSuccessData({
          received: receivedNum,
          change: changeNum > 0 ? changeNum : 0,
          orderId: finalOrderId || 'NEW',
          orderNumber: orderNumToPrint,
          queueNumber: String(queueNumToPrint),
          deliveryPlatform: orderType === 'delivery' ? deliveryPlatform : '',
          referenceName: orderType === 'delivery' ? platformOrderId.trim() : '',
          tableNumber: selectedTable?.table_number,
          customerName: selectedCustomer?.full_name || selectedCustomer?.name,
          orderType,
          items: cart.map(item => {
            const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
            return {
              name: item.name,
              quantity: item.quantity,
              subtotal: ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity) - (item.discount_amount || 0),
              modifiers: item.selected_modifiers?.map((m: any) => m.name) || [],
              selected_modifiers: item.selected_modifiers || [],
              category_id: item.category_id || 'uncategorized'
            };
          }),
          subtotal: rawCartSubTotal,
          discount: discountTotalValue + itemDiscountTotal,
          tax: vatAmount,
          serviceCharge: serviceChargeAmount,
          total: cartTotal,
          paymentMethod: finalMethodStr,
          timestamp: new Date().toISOString()
        });

        resetOrderComposer()
        setShowPaymentModal(false)
        setShowCashPaymentModal(false)
        setShowSplitPaymentModal(false)
      } else {
        // Partial split payment or final split payment via split modal: update totalPaid state so remainingTotal updates, do NOT close split modal or show full success popup
        setTotalPaid(newTotalPaid);
        if (finalOrderId) {
          setEditingOrderId(finalOrderId);
        }
        if (rpcResult?.order_number) {
          setEditingOrderNumber(rpcResult.order_number);
        }
      }

      if (activeShift?.id) {
        refreshPendingOrders()
        fetchShiftStats(activeShift.id)
      }
      return true;
    } catch (e: any) {
      console.error('Payment Error:', e)
      setCheckoutError(`การชำระเงินขัดข้อง: ${e.message || String(e)}`)
      return false;
    } finally {
      paymentLockRef.current = false;
      setIsProcessing(false)
      setProcessingMethod(null)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = getMenuSearchText(item).includes(searchTerm.toLowerCase())
    const matchesCategory =
      !activeCategoryId || activeCategoryId === 'all' ? true : item.category_id === activeCategoryId
    return matchesSearch && matchesCategory
  })

  // --- RENDER ---
  return {
    paymentLockRef,
    router,
    items,
    setItems,
    categories,
    setCategories,
    isInitialLoading,
    setIsInitialLoading,
    activeCampaigns,
    setActiveCampaigns,
    tables,
    setTables,
    successAudio,
    setSuccessAudio,
    selectedRecipeItem,
    setSelectedRecipeItem,
    memberCheckIns,
    setMemberCheckIns,
    linkedCheckInId,
    setLinkedCheckInId,
    showPointModal,
    setShowPointModal,
    showHistoryPointModalForCurrentOrder,
    setShowHistoryPointModalForCurrentOrder,
    currentPointOrderId,
    setCurrentPointOrderId,
    showTableModal,
    setShowTableModal,
    showNotificationModal,
    setShowNotificationModal,
    showDeliveryHub,
    setShowDeliveryHub,
    showPaymentModal,
    setShowPaymentModal,
    isProcessing,
    setIsProcessing,
    processingMethod,
    setProcessingMethod,
    checkoutError,
    setCheckoutError,
    paymentSplits,
    setPaymentSplits,
    showBillDiscountModal,
    setShowBillDiscountModal,
    billDiscountInput,
    setBillDiscountInput,
    billDiscountModalType,
    setBillDiscountModalType,
    billDiscountReason,
    setBillDiscountReason,
    isSummaryExpanded,
    setIsSummaryExpanded,
    vatRate,
    setVatRate,
    viewMode,
    setViewMode,
    qrTargetOrderIdRef,
    editingOrderIdRef,
    branchIdRef,
    modifierModalItem,
    setModifierModalItem,
    optionsModalItem,
    setOptionsModalItem,
    modifierGroups,
    setModifierGroups,
    tempSelectedModifiers,
    setTempSelectedModifiers,
    tempQuantity,
    setTempQuantity,
    tempNote,
    setTempNote,
    editingCartItemIndex,
    setEditingCartItemIndex,
    itemDiscountModalItem,
    setItemDiscountModalItem,
    itemDiscountValue,
    setItemDiscountValue,
    itemDiscountType,
    setItemDiscountType,
    itemDiscountReason,
    setItemDiscountReason,
    activePromotions,
    setActivePromotions,
    showPromotionsModal,
    setShowPromotionsModal,
    hasVat,
    setHasVat,
    hasServiceCharge,
    setHasServiceCharge,
    isPinModalOpen,
    setIsPinModalOpen,
    mergeTableTarget,
    setMergeTableTarget,
    tableActionTarget,
    setTableActionTarget,
    pendingOrderTypeSwitch,
    setPendingOrderTypeSwitch,
    pinCallback,
    setPinCallback,
    pinTitle,
    setPinTitle,
    pinDesc,
    setPinDesc,
    couponSelectorCoupon,
    setCouponSelectorCoupon,
    activeCouponCount,
    setActiveCouponCount,
    memberAvailableCoupons,
    setMemberAvailableCoupons,
    showCashPaymentModal,
    setShowCashPaymentModal,
    inlineCashPayment,
    setInlineCashPayment,
    totalPaid,
    setTotalPaid,
    showSplitPaymentModal,
    setShowSplitPaymentModal,
    currentPaymentAmount,
    setCurrentPaymentAmount,
    cashReceived,
    setCashReceived,
    paymentSuccessData,
    setPaymentSuccessData,
    selectedStoryIndex,
    setSelectedStoryIndex,
    selectedTableZone,
    setSelectedTableZone,
    flyingItems,
    setFlyingItems,
    isCartBumping,
    setIsCartBumping,
    platformOrderId,
    setPlatformOrderId,
    isDeliveryPlatformModalOpen,
    setIsDeliveryPlatformModalOpen,
    memberLookupMode,
    setMemberLookupMode,
    draftDeliveryPlatform,
    setDraftDeliveryPlatform,
    draftPlatformOrderId,
    setDraftPlatformOrderId,
    heldCartFingerprint,
    setHeldCartFingerprint,
    activeDeliveryPlatforms,
    showDeliveryCheckoutModal,
    setShowDeliveryCheckoutModal,
    showMemberCheckoutFlow,
    setShowMemberCheckoutFlow,
    showMemberCheckoutFlowRef,
    memberCheckoutStep,
    setMemberCheckoutStep,
    memberSearchQuery,
    setMemberSearchQuery,
    isSearchingMember,
    setIsSearchingMember,
    memberSearchResults,
    setMemberSearchResults,
    memberTiers,
    setMemberTiers,
    posQrLoyaltyToken,
    setPosQrLoyaltyToken,
    posQrPointsEarned,
    setPosQrPointsEarned,
    qrSessionId,
    setQrSessionId,
    openDeliveryPlatformModal,
    saveDeliveryPlatformDetails,
    resetDeliveryDraft,
    resetOrderComposer,
    discardDraftOrder: async () => {
      if (editingOrderId && !editingOrderNumber) {
        const targetId = editingOrderId;
        try {
          await supabase.from('pos_order_items').delete().eq('order_id', targetId);
          await supabase.from('pos_orders').delete().eq('id', targetId);
        } catch (e) {
          console.error('Error discarding draft order:', e);
        }
      }
    },
    ensureDeliveryDetailsReady,
    userRole,
    canToggleStock,
    longPressTimer,
    isLongPressTriggered,
    touchStartPos,
    localIsAutoCreatingOrder,
    setLocalIsAutoCreatingOrder,
    isAutoCreatingOrder,
    setIsAutoCreatingOrder,
    isAutoCreatingOrderLock,
    handlePressStart,
    handlePressMove,
    handlePressCancel,
    fetchTables,
    formatDeliveryPlatformLabel,
    getEffectiveItemUnitPrice,
    addToCart,
    fetchPromotions,
    handleHoldOrder,
    toggleItemStock,
    handleProductClick,
    buildNativePreReceipt,
    fetchPrintOrderData,
    executeNativePrint,
    printFromDatabaseOrder,
    handlePrintReceipt,
    handlePrintKitchen,
    checkManagerPin,
    categoryScrollRef,
    cartItemCount,
    cartFingerprint,
    isHeldOrderBaselineLoading,
    hasUnsavedOrderChanges,
    rawCartSubTotal,
    itemDiscountTotal,
    cartSubTotal,
    discountTotalValue,
    vatAmount,
    serviceChargeAmount,
    cartTotal,
    remainingTotal,
    isQrSourceOrder,
    isLiffSourceOrder,
    isArchivedPendingOrder,
    qrIncomingOrders,
    liffIncomingOrders,
    deliveryHubOrders,
    suspendedOrders,
    refreshPendingOrders,
    lastAutoCreateAttemptRef,
    fetchOrderIdentity,
    activePrintData,
    isMissingQueueColumnError,
    handleDeleteOrder,
    handleClearAllOrders,
    handleResumeOrder,
    handleLinkCheckIn,
    handleLinkCheckInToOrder,
    handleRejectCheckIn,
    handleClearIdleTable,
    openEditCartItem,
    updateQuantity,
    removeFromCart,
    applyItemDiscount,
    applyBillDiscount,
    handleSendOrder,
    handleSearchMemberFlow,
    handleProcessPayment,
    filteredItems
  }

}
