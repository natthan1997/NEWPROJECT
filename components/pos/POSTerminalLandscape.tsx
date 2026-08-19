'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react'
import POSTableManager from './POSTableManager'
import POSDrawerManager from './POSDrawerManager'
import POSMemberManager from './POSMemberManager'
import POSManagementUnified from './POSManagementUnified'
import POSReports from './POSReports'
import POSStaffManager from './POSStaffManager'
import POSMenuAppConfig from './POSMenuAppConfig'
import POSHistory, { getDeliveryPlatformBadge } from './POSHistory'
import POSShopSettings from './POSShopSettings'

const platformBranding: Record<string, { brand: string; lightBg: string; text: string }> = {
  grab: { brand: '#00B14F', lightBg: '#EAF7EE', text: '#00B14F' },
  lineman: { brand: '#06C755', lightBg: '#EBF9EE', text: '#06C755' },
  shopee: { brand: '#EE4D2D', lightBg: '#FDF1EE', text: '#EE4D2D' },
  foodpanda: { brand: '#D70F64', lightBg: '#FDF0F5', text: '#D70F64' },
  robinhood: { brand: '#8A2E8A', lightBg: '#F6EFF7', text: '#8A2E8A' },
};

const DeliveryPlatformIcon = ({ platform, className, size = 20 }: { platform: string; className?: string; size?: number }) => {
  const p = platform.toLowerCase();
  let src = '';
  
  if (p.includes('grab')) {
    src = '/images/delivery/grab.svg';
  } else if (p.includes('lineman') || p.includes('line_man')) {
    src = '/images/delivery/lineman.png';
  } else if (p.includes('shopee')) {
    src = '/images/delivery/shopee.svg';
  } else if (p.includes('foodpanda') || p.includes('panda')) {
    src = '/images/delivery/foodpanda.svg';
  } else if (p.includes('robinhood') || p.includes('rbh')) {
    src = '/images/delivery/robinhood.png';
  }
  
  if (!src) return null;
  
  return (
    <img 
      src={src} 
      alt={platform} 
      className={`${className} object-contain rounded-full`} 
      style={{ width: size, height: size }}
    />
  );
};

import POSShiftModal from './POSShiftModal'
import POSRecipeViewModal from './POSRecipeViewModal'
import { AnimatePresence, motion, useDragControls, useAnimation } from 'framer-motion'
import {
  ShoppingBag,
  Calculator,
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
  ChevronsRight,
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
  Package,
  BarChart3,
  ClipboardList,
  ChevronLeft,
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
import POSInventoryManager from './POSInventoryManager'
import POSMenuManager from './POSMenuManager'

interface CartItemRowProps {
  item: any;
  idx: number;
  locale: string;
  setSelectedRecipeItem: (item: any) => void;
  setItemDiscountModalItem: (item: any) => void;
  removeFromCart: (itemId: string, selectedModifiers: any[], isFreeCouponItem: boolean) => void;
  updateQuantity: (itemId: string, delta: number, selectedModifiers: any[], isFreeCouponItem: boolean) => void;
  openEditCartItem: (idx: number) => void;
  getEffectiveItemUnitPrice: (item: any) => number;
  getPrimaryMenuName: (item: any) => string;
  getSecondaryMenuName: (item: any, lang: string) => string;
}

const CartItemRow = ({
  item,
  idx,
  locale,
  setSelectedRecipeItem,
  setItemDiscountModalItem,
  removeFromCart,
  updateQuantity,
  openEditCartItem,
  getEffectiveItemUnitPrice,
  getPrimaryMenuName,
  getSecondaryMenuName,
}: CartItemRowProps) => {
  const controls = useAnimation();

  const handleDragEnd = (event: any, info: any) => {
    // If dragged to the left by more than 40px or fast flick
    if (info.offset.x < -40 || info.velocity.x < -200) {
      controls.start({ x: -180, transition: { type: 'spring', stiffness: 450, damping: 35 } });
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 450, damping: 35 } });
    }
  };

  return (
    <div className="relative overflow-hidden border-b border-gray-100 last:border-0 select-none bg-neutral-50">
      {/* Swipe Action Drawer Behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch z-0">
        <button
          type="button"
          onClick={() => {
            controls.start({ x: 0 });
            setItemDiscountModalItem(item);
          }}
          className="w-[60px] bg-orange-500 hover:bg-orange-600 text-white flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <Tag size={16} />
          <span className="text-[9px] font-black uppercase tracking-wider">โปร</span>
        </button>

        <button
          type="button"
          onClick={() => {
            controls.start({ x: 0 });
            setSelectedRecipeItem(item);
          }}
          className="w-[60px] bg-[#1A1A18] hover:bg-black text-white flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <FlaskConical size={16} />
          <span className="text-[9px] font-black uppercase tracking-wider">สูตร</span>
        </button>

        <button
          type="button"
          onClick={() => {
            controls.start({ x: 0 });
            removeFromCart(item.id, item.selected_modifiers || [], item.is_free_coupon_item);
          }}
          className="w-[60px] bg-[#D3202B] hover:bg-red-700 text-white flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <Trash2 size={16} />
          <span className="text-[9px] font-black uppercase tracking-wider">ลบ</span>
        </button>
      </div>

      {/* Cart Item Front Card */}
      <motion.div
        drag="x"
        dragDirectionLock={true}
        dragConstraints={{ left: -180, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.1 }}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="bg-white z-10 relative flex gap-3 py-3 px-4 items-center cursor-grab active:cursor-grabbing"
      >
        {/* Left: Thumbnail */}
        <div 
          className="relative h-12 w-12 shrink-0 overflow-hidden bg-gray-50 cursor-pointer rounded-lg border border-gray-100 shadow-sm self-start"
          onClick={() => openEditCartItem(idx)}
        >
          {item.image_url ? (
            <img loading="lazy" crossOrigin="anonymous" 
              src={item.image_url || ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageIcon size={16} />
            </div>
          )}
        </div>

        {/* Middle: Details (Name, Modifiers list) */}
        <div className="flex-1 min-w-0 cursor-pointer text-left self-start" onClick={() => openEditCartItem(idx)}>
          <h4 className="text-[13px] font-black text-gray-900 leading-tight truncate">
            {getPrimaryMenuName(item)}
          </h4>
          {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
            <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5">
              {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
            </p>
          )}
          
          {/* Modifiers List (No truncate so it wraps cleanly!) */}
          {item.selected_modifiers && item.selected_modifiers.length > 0 && (
            <p className="text-[10px] font-bold text-gray-400 mt-1 leading-normal whitespace-pre-wrap break-words">
              {item.selected_modifiers.map((m: any) => `${m.qty > 1 ? `${m.qty}x ` : ''}${m.name}`).join(', ')}
            </p>
          )}

          {item.customer_name && (
            <div className="text-[9px] font-bold text-emerald-500 mt-1">
              👤 {item.customer_name}
            </div>
          )}

          {/* Discount Banner */}
          {item.discount_amount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                ส่วนลด: -฿{item.discount_amount.toLocaleString()} {item.discount_reason && `(${item.discount_reason})`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Price (Top) and Quantity Selector (Bottom) */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 select-none self-center pl-2">
          {/* Price */}
          <span className="text-[13px] font-black text-gray-900 text-right leading-none">
            ฿ {(
              ((getEffectiveItemUnitPrice(item) +
                (item.selected_modifiers?.reduce(
                  (a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)),
                  0
                ) || 0)) *
              item.quantity) - (item.discount_amount || 0)
            ).toLocaleString()}
          </span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1.5 text-gray-500 mt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateQuantity(item.id, -1, item.selected_modifiers || [], item.is_free_coupon_item);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-90"
            >
              <Minus size={11} strokeWidth={2.5} />
            </button>
            <span className="w-5 text-center text-[12px] font-black text-gray-700">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateQuantity(item.id, 1, item.selected_modifiers || [], item.is_free_coupon_item);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-90"
            >
              <Plus size={11} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function POSTerminalLandscape({ state, props }: { state: any, props: any }) {
  const { locale } = useI18n();
  const modifierDragControls = useDragControls();
  const billDiscountDragControls = useDragControls();
  const itemDiscountDragControls = useDragControls();
  const pendingDragControls = useDragControls();
  const deliveryDragControls = useDragControls();
  const deliveryPlatformDragControls = useDragControls();
  const {
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
  } = state;
  const {
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
    setDiscountName
  } = props;


  const [currentRightPanel, setCurrentRightPanel] = useState<'cart' | 'pending' | 'delivery' | 'delivery_platform' | 'modifiers' | 'table_select'>('cart');
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const [checkoutShake, setCheckoutShake] = useState(false);
  const [checkoutWarning, setCheckoutWarning] = useState(false);

  // Split Thai string into base consonants + combining vowels/tones to prevent typography issues
  const splitThaiClusters = (text: string): string[] => {
    const clusters: string[] = [];
    const combiningReg = /[\u0E31\u0E33\u0E34-\u0E3A\u0E47-\u0E4E]/;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (combiningReg.test(char) && clusters.length > 0) {
        clusters[clusters.length - 1] += char;
      } else {
        clusters.push(char);
      }
    }
    return clusters;
  };

  // Unified Landscape Sub-view Navigation States
  const [activeLandscapeTab, setActiveLandscapeTab] = useState<string>('terminal');
  const [renderedLandscapeTab, setRenderedLandscapeTab] = useState<string>('terminal');
  const [editingTable, setEditingTable] = useState<any>(null);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const handleSwitchTab = (tab: string) => {
    setActiveLandscapeTab(tab);
    setRenderedLandscapeTab(tab);
    if (tab !== 'tables') {
      setEditingTable(null);
      setIsLayoutMode(false);
    }
  };
  const [showInlineNav, setShowInlineNav] = useState(false);

  // History states
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);

  const isSplitTab = activeLandscapeTab === 'terminal' || activeLandscapeTab === 'tables' || activeLandscapeTab === 'table_select' || activeLandscapeTab === 'drawer';
  const [activeTableZone, setActiveTableZone] = useState<string>('Main');

  const commonProps = {
    profile,
    shopSettings,
    activeShift,
    shiftStats,
    fetchShiftStats,
    onOpenShift: props.onOpenShift || (async () => {}),
    onCloseShift: props.onCloseShift || (async () => {}),
    cart,
    setCart,
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
    onSetView: (v: any) => handleSwitchTab(v),
    setViewExtraHeader: () => {},
    pendingOrders,
    refreshPendingOrders,
    activeView,
    allowedNav,
    onShiftModalOpen,
    onCashActionModalOpen,
    onManageTables,
    onOpenShiftModal,
  };
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyDate, setHistoryDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [historyFilter, setHistoryFilter] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery' | 'cancelled'>('all');
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Delivery states
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<any | null>(null);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'pending' | 'shipping' | 'completed' | 'cancelled'>('all');
  const [deliveryLoading, setDeliveryLoading] = useState<boolean>(false);

  // Shift/Staff states
  const [staffProfiles, setStaffProfiles] = useState<any[]>([]);
  const [todayAttendanceLogs, setTodayAttendanceLogs] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);

  // Settings states
  const [activeSettingsSection, setActiveSettingsSection] = useState<'shop' | 'printers' | 'shift' | 'pin'>('shop');

  // Fetch History Orders
  useEffect(() => {
    if (activeLandscapeTab !== 'history') return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const startOfDay = new Date(historyDate + 'T00:00:00');
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        let query = supabase
          .from('pos_orders')
          .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status), customer:pos_members!customer_id(display_name, full_name, phone)')
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        if (data) {
          const branchId = activeShift?.branch_id || shopSettings?.branch_id;
          const filtered = branchId ? data.filter(o => !o.branch_id || o.branch_id === branchId) : data;
          setHistoryOrders(filtered);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [activeLandscapeTab, historyDate, activeShift?.branch_id, shopSettings?.branch_id]);

  // Fetch Delivery Orders
  useEffect(() => {
    if (activeLandscapeTab !== 'delivery') return;
    const fetchDelivery = async () => {
      setDeliveryLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('pos_orders')
          .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status)')
          .eq('order_type', 'delivery')
          .gte('created_at', todayStr + 'T00:00:00Z')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          const branchId = activeShift?.branch_id || shopSettings?.branch_id;
          const filtered = branchId ? data.filter(o => !o.branch_id || o.branch_id === branchId) : data;
          setDeliveryOrders(filtered);
        }
      } catch (err) {
        console.error('Error fetching delivery:', err);
      } finally {
        setDeliveryLoading(false);
      }
    };
    fetchDelivery();
  }, [activeLandscapeTab, activeShift?.branch_id, shopSettings?.branch_id]);

  // Fetch Staff and Attendance
  const fetchStaffAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      const todayStr = new Date().toISOString().split('T')[0];
      const { data: logs, error: lErr } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('created_at', todayStr + 'T00:00:00Z');

      if (profiles) setStaffProfiles(profiles);
      if (logs) setTodayAttendanceLogs(logs);
    } catch (err) {
      console.error('Error fetching staff/attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeLandscapeTab === 'shifts') {
      fetchStaffAttendance();
    }
  }, [activeLandscapeTab]);

  useEffect(() => {
    if (!activeShift?.id) {
      handleSwitchTab('terminal');
    }
  }, [activeShift?.id]);

  const handleAttendanceAction = async (profileId: string, actionType: 'check_in' | 'check_out') => {
    const managerPin = shopSettings?.role_permissions?.manager_pin;
    if (!managerPin) {
      alert('ยังไม่ได้ตั้งรหัสผ่าน Manager PIN กรุณาไปตั้งค่าที่ Shop Settings');
      return;
    }
    const enteredPin = window.prompt('กรุณากรอกรหัสผ่าน Manager PIN เพื่อดำเนินการ:');
    if (enteredPin !== managerPin) {
      alert('รหัสผ่าน PIN ไม่ถูกต้อง!');
      return;
    }

    try {
      if (actionType === 'check_in') {
        const { error } = await supabase.from('attendance_logs').insert({
          profile_id: profileId,
          type: 'check_in',
          date: new Date().toISOString().split('T')[0]
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendance_logs').insert({
          profile_id: profileId,
          type: 'check_out',
          date: new Date().toISOString().split('T')[0]
        });
        if (error) throw error;
      }
      fetchStaffAttendance();
      alert('บันทึกเวลาสำเร็จ!');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  useEffect(() => {
    if (showPendingModal) {
      setCurrentRightPanel('pending');
      setShowPendingModal(false);
    }
  }, [showPendingModal, setShowPendingModal]);

  useEffect(() => {
    if (showDeliveryHub) {
      setCurrentRightPanel('delivery');
      setShowDeliveryHub(false);
    }
  }, [showDeliveryHub, setShowDeliveryHub]);

  useEffect(() => {
    if (modifierModalItem) {
      setCurrentRightPanel('modifiers');
    } else if (currentRightPanel === 'modifiers') {
      setCurrentRightPanel('cart');
    }
  }, [modifierModalItem]);

  // Render dynamic left and right panels for landscape tab options
  const renderUnifiedLeftPanel = (title: string, Icon: any, children: React.ReactNode, transparent?: boolean) => {
    return (
      <div className={`flex-grow flex flex-col min-h-0 ${transparent ? 'bg-transparent space-y-6 lg:overflow-hidden' : 'bg-white p-6 space-y-6 lg:rounded-[2rem] lg:overflow-hidden'}`}>
        <div className={`flex items-center justify-between ${transparent ? 'pb-4' : 'border-b border-gray-100 pb-4'} shrink-0`}>
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
            <button 
              onClick={() => handleSwitchTab('terminal')}
              className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0"
              title="กลับสู่หน้าขาย"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <Icon size={20} className="text-gray-400" />
            <span>{title}</span>
          </h2>
        </div>
        <div className="flex-grow flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    );
  };
  const renderHistoryLeftPanel = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white p-6 space-y-6 lg:rounded-[2rem] lg:overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
            <button 
              onClick={() => handleSwitchTab('terminal')}
              className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0"
              title="กลับสู่หน้าขาย"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <History size={20} className="text-gray-400" />
            <span>ประวัติการขาย</span>
          </h2>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={historyDate}
              onChange={(e) => e.target.value && setHistoryDate(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'dine_in', label: 'ทานที่ร้าน' },
            { id: 'takeaway', label: 'กลับบ้าน' },
            { id: 'delivery', label: 'จัดส่ง' },
            { id: 'cancelled', label: 'ยกเลิก' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setHistoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${historyFilter === tab.id ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Orders */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">กำลังโหลดประวัติ...</span>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Receipt size={32} className="mb-2 opacity-50" />
              <span className="text-xs font-bold">ไม่พบประวัติในวันนี้</span>
            </div>
          ) : (
            historyOrders
              .filter(o => {
                if (historyFilter === 'cancelled') return o.status === 'cancelled';
                if (historyFilter === 'dine_in') return o.order_type === 'dine_in' && o.status !== 'cancelled';
                if (historyFilter === 'takeaway') return o.order_type !== 'dine_in' && o.order_type !== 'delivery' && o.status !== 'cancelled';
                if (historyFilter === 'delivery') return o.order_type === 'delivery' && o.status !== 'cancelled';
                return true;
              })
              .map((order) => {
                const isSelected = selectedHistoryOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedHistoryOrder(order)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'border-black bg-[#fcfcf9] ring-2 ring-black/5' : 'border-neutral-200 bg-white hover:border-black'}`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-black text-neutral-900">
                          {order.order_type === 'dine_in' && order.table_number ? `โต๊ะ ${order.table_number}` : `#${String(order.queue_number || 0).padStart(3, '0')}`}
                        </span>
                        
                        {order.order_type === 'delivery' && (
                          (() => {
                            const badge = getDeliveryPlatformBadge(order.delivery_platform);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${badge.bgClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                                {badge.label}
                              </span>
                            );
                          })()
                        )}
                        
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
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold">
                        <span>{new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{order.order_type === 'dine_in' ? 'ทานที่ร้าน' : order.order_type === 'delivery' ? 'จัดส่ง' : 'กลับบ้าน'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-neutral-900">฿{(order.net_total || order.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    );
  };

  const renderHistoryRightPanel = () => {
    if (!selectedHistoryOrder) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white text-gray-400">
          <Receipt size={40} className="mb-3 opacity-50" />
          <p className="text-xs font-bold">เลือกรายการสั่งซื้อด้านซ้ายเพื่อดูรายละเอียด</p>
        </div>
      );
    }

    const order = selectedHistoryOrder;
    return (
      <div className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold">
        {/* Center Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
          <div className="text-center py-4 border-b border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ยอดชำระเงิน</span>
            <div className="text-3xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
              <span className="text-xl text-gray-400 font-bold mr-1">฿</span>
              {(order.net_total || order.total_amount).toLocaleString()}
            </div>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider">
              {order.status === 'cancelled' ? 'ยกเลิกแล้ว (VOIDED)' : 'ชำระเงินเรียบร้อย'}
            </span>
          </div>

          {/* Details Metadata */}
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">เลขบิล:</span>
              <span className="font-bold text-gray-800">{order.order_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">เวลาทำรายการ:</span>
              <span className="font-bold text-gray-800">
                {new Date(order.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
              </span>
            </div>
            {order.void_reason && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-[11px] font-bold">
                <span className="block text-[9px] uppercase tracking-wider text-red-400 mb-0.5">เหตุผลการยกเลิก:</span>
                {order.void_reason}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">รายการสินค้า</h4>
            <div className="divide-y divide-gray-50">
              {(order.pos_order_items || []).map((row: any, idx: number) => {
                const menuName = row.item?.name || row.menu_name || 'สินค้า';
                return (
                  <div key={idx} className="py-2.5 flex justify-between items-start text-xs">
                    <div className="space-y-0.5">
                      <span className="font-black text-gray-900">{menuName}</span>
                      {row.selected_modifiers?.length > 0 && (
                        <div className="text-[10px] text-gray-400 font-bold">
                          {row.selected_modifiers.map((m: any) => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-gray-400 font-bold mr-2">x{row.quantity}</span>
                      <span className="font-black text-gray-900">฿{(row.unit_price * row.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reprint & Void footer */}
        <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPrintDropdown(prev => !prev)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Printer size={14} className="text-gray-400" />
                <span>พิมพ์สำเนาเอกสาร...</span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPrintDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      printCustomerReceipt(order, shopSettings);
                      setShowPrintDropdown(false);
                    }}
                    className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <FileText size={14} className="text-gray-400" />
                    <span>พิมพ์ใบเสร็จ (Receipt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      printKitchenTicket(order, shopSettings);
                      setShowPrintDropdown(false);
                    }}
                    className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Utensils size={14} className="text-gray-400" />
                    <span>พิมพ์ใบครัว (Kitchen)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {order.status !== 'cancelled' && (
            <button
              onClick={() => {
                const managerPin = shopSettings?.role_permissions?.manager_pin;
                if (!managerPin) {
                  alert('ยังไม่ได้ตั้งรหัสผ่าน Manager PIN');
                  return;
                }
                const pin = window.prompt('กรุณากรอก Manager PIN เพื่อยกเลิกบิล:');
                if (pin !== managerPin) {
                  alert('รหัสผ่าน PIN ไม่ถูกต้อง!');
                  return;
                }
                const reason = window.prompt('ระบุเหตุผลในการยกเลิกบิล (Void Reason):');
                if (!reason || reason.trim() === '') {
                  alert('จำเป็นต้องระบุเหตุผลการยกเลิก');
                  return;
                }

                supabase.from('pos_orders')
                  .update({ status: 'cancelled', void_reason: reason.trim() })
                  .eq('id', order.id)
                  .then(({ error }) => {
                    if (error) alert('ยกเลิกบิลล้มเหลว: ' + error.message);
                    else {
                      alert('ยกเลิกบิลสำเร็จ!');
                      setSelectedHistoryOrder(null);
                      // Trigger refetch
                      setHistoryDate(prev => prev);
                    }
                  });
              }}
              className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-red-200/50"
            >
              <Trash2 size={14} /> ยกเลิกบิลรายการ (VOID)
            </button>
          )}

          <button
            onClick={() => setSelectedHistoryOrder(null)}
            className="w-full py-3.5 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center"
          >
            ปิดหน้าต่างรายละเอียด
          </button>
        </footer>
      </div>
    );
  };

  const renderDeliveryLeftPanel = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white p-6 space-y-6 lg:rounded-[2rem] lg:overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
            <button 
              onClick={() => handleSwitchTab('terminal')}
              className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0"
              title="กลับสู่หน้าขาย"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <Truck size={20} className="text-gray-400" />
            <span>ออเดอร์ส่งอาหาร (Delivery)</span>
          </h2>
          <button
            onClick={() => setDeliveryOrders([...deliveryOrders])}
            className="flex items-center gap-1.5 border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-600 transition-all hover:bg-neutral-50 rounded-xl"
          >
            <RefreshCw size={12} /> รีเฟรช
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'pending', label: 'รอเตรียม' },
            { id: 'shipping', label: 'กำลังส่ง' },
            { id: 'completed', label: 'ส่งสำเร็จ' },
            { id: 'cancelled', label: 'ยกเลิก' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDeliveryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${deliveryFilter === tab.id ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Delivery Orders list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {deliveryLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">กำลังโหลด...</span>
            </div>
          ) : deliveryOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Truck size={32} className="mb-2 opacity-50" />
              <span className="text-xs font-bold">ไม่พบรายการจัดส่งในวันนี้</span>
            </div>
          ) : (
            deliveryOrders
              .filter(o => {
                if (deliveryFilter === 'cancelled') return o.status === 'cancelled';
                if (deliveryFilter === 'pending') return o.status === 'paid';
                if (deliveryFilter === 'shipping') return o.status === 'shipping';
                if (deliveryFilter === 'completed') return o.status === 'completed';
                return true;
              })
              .map((order) => {
                const isSelected = selectedDeliveryOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedDeliveryOrder(order)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'border-black bg-neutral-50 shadow-sm' : 'border-gray-100 bg-white hover:bg-neutral-50/50'}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">
                          #{String(order.queue_number || 0).padStart(3, '0')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-50 text-blue-600">
                          {order.delivery_platform || 'เดลิเวอรี'}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold">
                        {order.customer_name || 'ลูกค้าทั่วไป'} · {order.customer_phone || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900 block">฿{order.net_total || order.total_amount}</span>
                      <span className="text-[9px] font-bold text-gray-400">{order.status}</span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    );
  };

  const renderDeliveryRightPanel = () => {
    if (!selectedDeliveryOrder) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white text-gray-400">
          <Truck size={40} className="mb-3 opacity-50" />
          <p className="text-xs font-bold">เลือกออเดอร์เดลิเวอรีด้านซ้ายเพื่อดูรายละเอียด</p>
        </div>
      );
    }

    const order = selectedDeliveryOrder;
    return (
      <div className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold p-6 justify-between">
        <div className="space-y-6">
          <div className="text-center py-2 border-b border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">เดลิเวอรีออเดอร์</span>
            <h3 className="text-2xl font-black text-gray-900">#{String(order.queue_number || 0).padStart(3, '0')}</h3>
            <span className="text-[11px] text-gray-500 block mt-1">{order.delivery_platform || 'Delivery'}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">ชื่อลูกค้า:</span>
              <span className="font-bold text-gray-800">{order.customer_name || 'Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">เบอร์โทร:</span>
              <span className="font-bold text-gray-800">{order.customer_phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold">ที่อยู่จัดส่ง:</span>
              <span className="font-bold text-gray-800 truncate max-w-[200px]">{order.delivery_address || 'จัดส่งโดยแพลตฟอร์ม'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">รายการอาหาร</h4>
            <div className="divide-y divide-gray-50 text-xs">
              {(order.pos_order_items || []).map((row: any, idx: number) => (
                <div key={idx} className="py-2 flex justify-between">
                  <span>{row.item?.name || row.menu_name} x{row.quantity}</span>
                  <span>฿{row.unit_price * row.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 shrink-0 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                supabase.from('pos_orders').update({ status: 'shipping' }).eq('id', order.id)
                  .then(() => {
                    alert('เริ่มจัดส่งแล้ว!');
                    setSelectedDeliveryOrder(null);
                    // Refresh
                    setDeliveryOrders([...deliveryOrders]);
                  });
              }}
              className="py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs"
            >
              เริ่มจัดส่ง
            </button>
            <button
              onClick={() => {
                supabase.from('pos_orders').update({ status: 'completed' }).eq('id', order.id)
                  .then(() => {
                    alert('จัดส่งสำเร็จ!');
                    setSelectedDeliveryOrder(null);
                    setDeliveryOrders([...deliveryOrders]);
                  });
              }}
              className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-xl text-xs"
            >
              จัดส่งสำเร็จ
            </button>
          </div>
          <button
            onClick={() => setSelectedDeliveryOrder(null)}
            className="w-full py-3.5 bg-black text-white font-bold rounded-xl text-xs"
          >
            ปิดหน้ารายละเอียด
          </button>
        </div>
      </div>
    );
  };

  const renderShiftLeftPanel = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white p-6 space-y-6 lg:rounded-[2rem] lg:overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
            <button 
              onClick={() => handleSwitchTab('terminal')}
              className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0"
              title="กลับสู่หน้าขาย"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <Clock size={20} className="text-gray-400" />
            <span>พนักงาน & กะทำงาน</span>
          </h2>
          <button
            onClick={fetchStaffAttendance}
            className="flex items-center gap-1.5 border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-600 transition-all hover:bg-neutral-50 rounded-xl"
          >
            <RefreshCw size={12} className={attendanceLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        </div>

        {/* Staff profiles list */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {attendanceLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span>กำลังโหลดข้อมูลพนักงาน...</span>
            </div>
          ) : (
            staffProfiles.map((p) => {
              const checkInLog = todayAttendanceLogs.find(l => l.profile_id === p.id && l.type === 'check_in');
              const checkOutLog = todayAttendanceLogs.find(l => l.profile_id === p.id && l.type === 'check_out');
              const isCheckedIn = !!checkInLog && !checkOutLog;

              return (
                <div key={p.id} className="p-4 rounded-xl border border-gray-100 bg-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0">
                      {p.full_name ? p.full_name[0] : '?'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{p.full_name || p.display_name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.role || 'staff'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-wider ${isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {isCheckedIn ? 'เข้างานแล้ว' : 'ยังไม่เข้างาน'}
                    </span>
                    <button
                      onClick={() => handleAttendanceAction(p.id, isCheckedIn ? 'check_out' : 'check_in')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isCheckedIn ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-900 text-white border-gray-900 hover:bg-black'}`}
                    >
                      {isCheckedIn ? 'ออกงาน' : 'ลงเวลาเข้า'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };



  const renderSettingsLeftPanel = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white p-6 space-y-6 lg:rounded-[2rem] lg:overflow-hidden">
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
          <button 
            onClick={() => handleSwitchTab('terminal')}
            className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0"
            title="กลับสู่หน้าขาย"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <Settings size={20} className="text-gray-400" />
          <span>ตั้งค่าระบบ POS</span>
        </h2>

        <div className="space-y-2">
          {[
            { id: 'shop', label: 'ข้อมูลและสถานะร้านสาขา' },
            { id: 'printers', label: 'การเชื่อมต่อเครื่องพิมพ์' },
            { id: 'shift', label: 'การตั้งค่าเงินสดเริ่มต้นกะ' },
            { id: 'pin', label: 'จัดการรหัสผ่าน Manager PIN' }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSettingsSection(sec.id as any)}
              className={`w-full text-left p-3.5 rounded-xl text-xs font-black transition-all border ${activeSettingsSection === sec.id ? 'bg-[#1A1A18] text-white border-black shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsRightPanel = () => {
    return (
      <div className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold p-6 justify-between">
        <div className="space-y-6">
          <div className="text-center py-2 border-b border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">การตั้งค่า</span>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
              {activeSettingsSection === 'shop' && 'ข้อมูลและสถานะร้านสาขา'}
              {activeSettingsSection === 'printers' && 'เครื่องพิมพ์'}
              {activeSettingsSection === 'shift' && 'เงินสดเปิดกะ'}
              {activeSettingsSection === 'pin' && 'Manager PIN'}
            </h3>
          </div>

          {activeSettingsSection === 'shop' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">ชื่อร้านสาขา</label>
                <input 
                  type="text" 
                  value={shopSettings?.branch_name || ''} 
                  disabled
                  className="w-full h-11 border border-gray-200 rounded-xl px-3 bg-gray-50 text-xs font-bold text-gray-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">สถานะร้านค้า</label>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-gray-700 font-bold">เปิดให้บริการตามปกติ</span>
                </div>
              </div>
            </div>
          )}

          {activeSettingsSection === 'printers' && (
            <div className="space-y-4 text-xs font-bold text-gray-500">
              <p>เครื่องพิมพ์ตั้งต้น: 80mm Graphic Thermal Printer</p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <span>สถานะการเชื่อมต่อ:</span>
                <span className="text-emerald-600 flex items-center gap-1"><Check size={12} /> Connected</span>
              </div>
              <button
                onClick={() => {
                  printOpenDrawer().then(() => alert('ทดสอบสำเร็จ! ลิ้นชักเปิดออกเรียบร้อย'));
                }}
                className="w-full py-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 text-xs"
              >
                ทดสอบพิมพ์ใบเสร็จจำลอง (Test Print)
              </button>
            </div>
          )}

          {activeSettingsSection === 'shift' && (
            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">ค่าเงินสดตั้งต้นเปิดกะ (บาท)</label>
              <input 
                type="number"
                value={shopSettings?.opening_hours?.shift_settings?.default_start_cash || 0}
                onChange={(e) => {
                  // Simulate updating
                  alert('บันทึกสำเร็จ!');
                }}
                className="w-full h-11 border border-gray-200 focus:border-black rounded-xl px-3 text-xs font-bold text-gray-900 outline-none"
              />
            </div>
          )}

          {activeSettingsSection === 'pin' && (
            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">รหัสผ่านผู้จัดการ (Manager PIN)</label>
              <input 
                type="password"
                value={shopSettings?.role_permissions?.manager_pin || ''}
                disabled
                className="w-full h-11 border border-gray-200 rounded-xl px-3 bg-gray-50 text-xs font-bold text-gray-400 outline-none"
              />
              <p className="text-[10px] text-gray-400">กรุณาติดต่อเจ้าของร้านผ่านหน้าแอดมินบอร์ดหลักเพื่อแก้ไขรหัส PIN</p>
            </div>
          )}
        </div>

        <button
          onClick={() => handleSwitchTab('terminal')}
          className="w-full py-3.5 bg-black text-white font-bold rounded-xl text-xs shrink-0"
        >
          เสร็จสิ้นและกลับสู่หน้าขาย
        </button>
      </div>
    );
  };

  

  useEffect(() => {
    if (cart.length === 0 && !paymentSuccessData) {
      setShowMemberCheckoutFlow(false);
      setPaymentSuccessData(null);
    }
  }, [cart.length, paymentSuccessData]);

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className="relative flex flex-1 flex-col lg:flex-row bg-white font-bold overflow-hidden h-full min-h-0 lg:gap-4 lg:p-4 lg:pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      {/* Closed Shift Blurred Motion Overlay */}
      {!activeShift?.id && renderedLandscapeTab === 'terminal' && (
        <div className="absolute inset-0 bg-[#FDFDFB]/70 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 lg:pr-[380px] xl:pr-[450px] select-none pointer-events-auto transition-all">
          <AnimatePresence mode="wait">
            {props.isClosingSuccessShow ? (
              <motion.div
                key="thank-you-typing"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="text-center font-bold"
              >
                <h2 
                  style={{ fontFamily: "'Prompt', 'Plus Jakarta Sans', sans-serif" }}
                  className="text-2xl sm:text-3xl font-medium tracking-normal text-[#1A1A18] leading-tight min-h-[1.2em] flex items-center justify-center flex-wrap gap-[0.02em]"
                >
                  {splitThaiClusters(locale === 'en' ? 'THANK YOU' : 'ขอบคุณสำหรับการทำงาน').map((cluster, index) => (
                    <motion.span
                      key={index}
                      variants={{
                        hidden: { 
                          opacity: 0, 
                          y: 12,
                          scale: 0.9,
                          filter: "blur(4px)"
                        },
                        visible: { 
                          opacity: 1, 
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)"
                        }
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: 'inline-block', whiteSpace: cluster === ' ' ? 'pre' : 'normal' }}
                    >
                      {cluster}
                    </motion.span>
                  ))}
                </h2>
                <div className="h-px bg-neutral-200 w-16 mx-auto my-6" />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  style={{ fontFamily: "'Prompt', 'Plus Jakarta Sans', sans-serif" }}
                  className="text-xs font-normal tracking-wide text-neutral-500"
                >
                  {locale === 'en' ? 'Shift Closed Successfully' : 'ปิดกะทำงานเรียบร้อยแล้ว'}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="open-shift-prompt"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 max-w-xs flex flex-col items-center justify-center"
              >
                {/* Shop Name */}
                <h1 
                  style={{ fontFamily: "'Prompt', 'Plus Jakarta Sans', sans-serif" }}
                  className="text-3xl font-black tracking-tight text-neutral-900 mb-2 select-none"
                >
                  {shopSettings?.name || shopSettings?.branch_name || 'RUSH UP'}
                </h1>
                {/* Pulsing Arrow pointing Right */}
                <motion.div 
                  animate={{ x: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="flex items-center gap-2.5 text-[#1A1A18]"
                >
                  <span className="text-xs font-black uppercase tracking-[0.25em]">
                    {locale === 'en' ? 'Open Shift on the Right' : 'เปิดกะทำงาน ฝั่งขวา'}
                  </span>
                  <ArrowRight size={16} strokeWidth={3} className="text-[#1A1A18]" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* LEFT CONTENT: Categories & Grid */}
      <motion.div
        layout
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          order: activeLandscapeTab === 'tables' ? 2 : 1,
          willChange: 'transform'
        }}
        className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent relative lg:overflow-visible"
      >

        <div className="relative flex-1 flex flex-col min-h-0 w-full h-full">
          {/* 1. OTHER SUB-VIEWS */}
          {renderedLandscapeTab !== 'terminal' && renderedLandscapeTab !== 'tables' && renderedLandscapeTab !== 'table_select' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={renderedLandscapeTab}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute inset-0 flex flex-col min-h-0 bg-white z-20 w-full h-full ${
                  renderedLandscapeTab === 'drawer'
                    ? ''
                    : 'lg:rounded-[2rem] lg:shadow-[0_25px_60px_rgba(0,0,0,0.12),0_4px_20px_rgba(0,0,0,0.04)] lg:border lg:border-neutral-200/30'
                }`}
              >
                {renderedLandscapeTab === 'history' ? (
                  renderUnifiedLeftPanel('ประวัติการขาย', History, <POSHistory {...commonProps} />)
                ) : renderedLandscapeTab === 'delivery' ? (
                  renderDeliveryLeftPanel()
                ) : renderedLandscapeTab === 'shifts' ? (
                  renderShiftLeftPanel()
                ) : renderedLandscapeTab === 'settings' ? (
                  renderUnifiedLeftPanel('ตั้งค่าระบบ POS', Settings, <POSShopSettings {...commonProps} />)
                ) : renderedLandscapeTab === 'drawer' ? (
                  renderUnifiedLeftPanel('ลิ้นชักเงินสด', Wallet, <POSDrawerManager {...commonProps} renderPart="left" />, true)
                ) : renderedLandscapeTab === 'members' ? (
                  renderUnifiedLeftPanel('ระบบสมาชิก CRM', Users, <POSMemberManager {...commonProps} />)
                ) : renderedLandscapeTab === 'inventory' ? (
                  renderUnifiedLeftPanel('วัตถุดิบ & สต็อกสินค้า', Package, <POSInventoryManager {...commonProps} />)
                ) : renderedLandscapeTab === 'reports' ? (
                  renderUnifiedLeftPanel('รายงาน & สถิติ', BarChart3, <POSReports {...commonProps} />)
                ) : renderedLandscapeTab === 'staff' ? (
                  renderUnifiedLeftPanel('พนักงาน & SOP', ClipboardList, <POSStaffManager {...commonProps} />)
                ) : renderedLandscapeTab === 'menu-management' ? (
                  renderUnifiedLeftPanel('แก้ไขรายการอาหาร', ShoppingBag, <POSMenuManager {...commonProps} />)
                ) : renderedLandscapeTab === 'promotions' ? (
                  renderUnifiedLeftPanel('แคมเปญ & คูปอง', Tag, <POSPromotionsModal isOpen={true} isInline={true} onClose={() => handleSwitchTab('terminal')} shopSettings={shopSettings} />)
                ) : null}
              </motion.div>
            </AnimatePresence>
          )}

          {/* 2. TABLES MANAGER GRID (Always mounted, toggled visibility) */}
          <motion.div
            animate={{
              opacity: renderedLandscapeTab === 'tables' ? 1 : 0,
              x: renderedLandscapeTab === 'tables' ? 0 : 20,
              zIndex: renderedLandscapeTab === 'tables' ? 10 : 0
            }}
            style={{
              pointerEvents: renderedLandscapeTab === 'tables' ? 'auto' : 'none'
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col min-h-0 bg-white lg:bg-transparent"
          >
            <POSTableManager 
              {...commonProps} 
              showOnlyGrid={true} 
              activeZoneProps={activeTableZone} 
              setActiveZoneProps={setActiveTableZone} 
              editingTableProps={editingTable}
              setEditingTableProps={setEditingTable}
              isLayoutModeProps={isLayoutMode}
              setIsLayoutModeProps={setIsLayoutMode}
            />
          </motion.div>
          {/* 3.5 TABLE SELECTOR CANVAS (Always mounted, toggled visibility) */}
          <motion.div
            animate={{
              opacity: renderedLandscapeTab === 'table_select' ? 1 : 0,
              x: renderedLandscapeTab === 'table_select' ? 0 : -20,
              zIndex: renderedLandscapeTab === 'table_select' ? 10 : 0
            }}
            style={{
              pointerEvents: renderedLandscapeTab === 'table_select' ? 'auto' : 'none'
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col min-h-0 bg-white lg:rounded-[2rem] overflow-hidden"
          >
<motion.div
            key="table-select-view"
            initial={{ opacity: 0, x: 20 }}
            animate={checkoutShake ? { opacity: 1, x: [0, -6, 6, -4, 4, -2, 2, 0] } : { opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={checkoutShake ? { duration: 0.5, ease: "easeInOut" } : { duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold will-change-transform"
          >
            {/* Header */}
            <header className="flex items-center justify-between bg-white px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('terminal')}
                  className="flex items-center justify-center text-[#D3202B] hover:text-red-700 transition-colors shrink-0"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tighter text-black">
                    {locale === 'en' ? 'Select Table' : locale === 'zh' ? '选择桌子' : 'เลือกโต๊ะ'}
                  </h3>
                  <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                    {tables.length} {locale === 'en' ? 'tables' : 'โต๊ะ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSwitchTab('tables')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-[#D3202B] transition-colors"
                title="จัดการโต๊ะ"
              >
                <Settings size={18} strokeWidth={2.5} />
              </button>
            </header>

            {/* Zone tabs */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar bg-white px-4 pb-2.5 pt-2 shrink-0 border-b border-gray-100">
              {['All', ...Array.from(new Set(tables.map((t: any) => (t.zone || 'Main'))))].map((zone: any) => (
                <button
                  key={zone}
                  onClick={() => setSelectedTableZone(zone)}
                  className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedTableZone === zone ? 'bg-[#1A1A18] text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto relative bg-white">
              <div
                className="relative"
                style={{
                  minWidth: Math.max(500, ...tables.map((t: any) => (t.position_x || 0) + 160)) + 40,
                  minHeight: Math.max(500, ...tables.map((t: any) => (t.position_y || 0) + 160)) + 40,
                  backgroundColor: '#ffffff'
                }}
              >
                {tables
                  .filter((t: any) => selectedTableZone === 'All' || (t.zone || 'Main') === selectedTableZone)
                  .map((table: any, idx: number) => {
                    const targetTable = table.parent_table_id
                      ? tables.find((t: any) => t.id === table.parent_table_id) || table
                      : table;
                    const childrenTables = tables.filter((t: any) => t.parent_table_id === table.id);
                    const isParent = childrenTables.length > 0;
                    const pendingForThisTable = pendingOrders.filter(
                      (o: any) => o.table_id === targetTable.id && o.status === 'pending'
                    );
                    const isOccupied = pendingForThisTable.length > 0 || targetTable.status === 'occupied';
                    const isSelected = selectedTable?.id === targetTable.id;

                    const shape = table.shape || 'square';
                    const dims =
                      shape === 'rectangle'          ? { w: 160, h: 96 } :
                      shape === 'rectangle_vertical' ? { w: 96, h: 160 } :
                                                       { w: 96, h: 96 };
                    const borderRadius = shape === 'circle' ? '50%' : shape === 'square' ? '1rem' : '1.5rem';
                    
                    // Fallback to auto-grid if not positioned (or if sitting at exactly 0,0 which causes overlaps)
                    const posX = (table.position_x || 0) > 0 ? table.position_x : ((idx % 4) * 180 + 40);
                    const posY = (table.position_y || 0) > 0 ? table.position_y : (Math.floor(idx / 4) * 180 + 40);
                    
                    const isShortName = (table.table_number || '').length <= 3;

                    return (
                      <div
                        key={table.id}
                        style={{ position: 'absolute', left: posX, top: posY, width: dims.w, height: dims.h }}
                        className="group"
                      >
                        <button
                          type="button"
                          style={{ width: '100%', height: '100%', borderRadius, WebkitTouchCallout: 'none', userSelect: 'none' }}
                          onContextMenu={e => e.preventDefault()}
                          onClick={() => {
                            if (isSelected) {
                              resetOrderComposer();
                              setTotalPaid(0);
                              handleSwitchTab('terminal');
                            } else if (editingOrderId) {
                              setTableActionTarget(targetTable);
                            } else if (pendingForThisTable.length > 0 && cart.length > 0) {
                              setMergeTableTarget({ table: targetTable, pendingOrder: pendingForThisTable[0] });
                            } else {
                              setSelectedTable(targetTable);
                              setOrderType('dine_in');
                              resetDeliveryDraft();
                              handleSwitchTab('terminal');
                              if (pendingForThisTable.length > 0) {
                                handleResumeOrder(pendingForThisTable[0]);
                              }
                            }
                          }}
                          className={`relative flex flex-col items-center justify-center transition-all duration-200 border-2 active:scale-95 ${
                            isSelected
                              ? 'bg-[#D3202B] text-white border-[#D3202B] shadow-xl shadow-red-500/30 scale-105'
                              : isOccupied
                                ? 'bg-[#1A1A18] text-white border-[#1A1A18] shadow-lg'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-md'
                          }`}
                        >
                          {isOccupied && !isSelected && (
                            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D3202B]" />
                            </span>
                          )}
                          <span className={`leading-none text-center pointer-events-none ${isShortName ? 'text-lg font-black tracking-tight' : 'text-[9px] font-bold tracking-tight px-1 break-all'}`}>
                            {table.table_number}
                          </span>
                          {(table.parent_table_id || isParent) && (
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow z-10 ${isSelected ? 'bg-white text-[#D3202B]' : isOccupied ? 'bg-white text-[#1A1A18]' : 'bg-[#1A1A18] text-white'}`}>
                              {table.parent_table_id ? `🔗 ${targetTable.table_number}` : `+${childrenTables.map((t: any) => t.table_number).join(',')}`}
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Table Action bottom-sheet moved to Cart side */}
          </motion.div>
          </motion.div>


          {/* 3. TERMINAL SALES CATALOG (Always mounted, toggled visibility) */}
          <motion.div
            animate={{
              opacity: renderedLandscapeTab === 'terminal' ? 1 : 0,
              x: renderedLandscapeTab === 'terminal' ? 0 : -20,
              zIndex: renderedLandscapeTab === 'terminal' ? 10 : 0
            }}
            style={{
              pointerEvents: renderedLandscapeTab === 'terminal' ? 'auto' : 'none'
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col min-h-0 bg-white lg:rounded-[2rem]"
          >
                      <>
{/* Closed Shift Blurred Motion Overlay */}
        {!activeShift?.id && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-auto transition-all">
            <div className="space-y-3 max-w-xs flex flex-col items-center justify-center">
              {/* Pulsing Arrow pointing Right */}
              <motion.div 
                animate={{ x: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="flex items-center gap-2.5 text-[#1A1A18]"
              >
                <span className="text-xs font-black uppercase tracking-[0.25em]">
                  {locale === 'en' ? 'Open Shift on the Right' : 'เปิดกะทำงาน ฝั่งขวา'}
                </span>
                <ArrowRight size={16} strokeWidth={3} className="text-[#1A1A18]" />
              </motion.div>
            </div>
          </div>
        )}

        {showMemberCheckoutFlow || paymentSuccessData ? (
          /* Embedded Member Check-in or Success Animation */
          <div className="flex-1 flex flex-col min-h-0 bg-white p-6 sm:p-8 animate-in fade-in duration-300 relative">
            
            {/* Header */}
            {!paymentSuccessData && (
              <header className="flex items-center justify-between pb-6 shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (linkedCheckInId) {
                        supabase.from('pos_member_checkins').update({ status: 'cancelled' }).eq('id', linkedCheckInId).then(() => {});
                        setLinkedCheckInId(null);
                      }
                      setSelectedCustomer(null);
                      setMemberSearchQuery('');
                      setShowMemberCheckoutFlow(false);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h3 className="text-base font-black text-gray-900 leading-tight">
                      {selectedCustomer ? 'ข้อมูลสมาชิก' : 'สะสมแต้มสมาชิก'}
                    </h3>
                  </div>
                </div>

                {selectedCustomer && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black border border-emerald-100">
                    <Check size={14} strokeWidth={2.5} /> Connected
                  </span>
                )}
              </header>
            )}

            {/* Body */}
            {paymentSuccessData ? (
              /* Success / Earned Points Screen */
              selectedCustomer ? (
                /* Member Success screen: keeps the profile card layout at top and replaces coupons with animated points */
                <div className="flex-1 flex flex-col min-h-0 gap-6 mt-2 overflow-hidden">
                  {/* Profile Card (Without change button since transaction is completed) */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {selectedCustomer.customer_image || selectedCustomer.avatar_url ? (
                          <img src={selectedCustomer.customer_image || selectedCustomer.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                            <User size={24} className="text-gray-300" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[#1A1A18] rounded-full p-1 border-2 border-white shadow-sm">
                          <Award size={12} className="fill-[#1A1A18]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 leading-tight">
                          {selectedCustomer.full_name || selectedCustomer.display_name}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 mt-0.5 tracking-wider">{selectedCustomer.phone}</p>
                        <div className="bg-[#1A1A18] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-2">
                          <span className="text-yellow-400 font-black text-xs">{selectedCustomer.points || 0}</span>
                          <span className="text-white font-bold text-[9px] tracking-widest uppercase">PTS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points Earned & Success Card */}
                  <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100 relative">
                      <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 50 50">
                        <motion.circle
                          cx="25"
                          cy="25"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        />
                        <motion.path
                          d="M16 26L22 32L34 18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
                        />
                      </svg>
                    </div>

                    <motion.h2
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
                      className="text-2xl font-black text-gray-900 tracking-tight"
                    >
                      ชำระเงินสำเร็จ!
                    </motion.h2>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.9, ease: "easeOut" }}
                      className="mt-4 flex flex-col items-center gap-1.5"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">คะแนนที่ได้รับจากบิลนี้</span>
                      <div className="inline-flex items-center gap-1 bg-yellow-50 text-[#1A1A18] px-6 py-2.5 rounded-2xl font-black text-3xl border border-yellow-100">
                        + {Math.floor((paymentSuccessData?.total || 0) / (Number(shopSettings?.opening_hours?.loyalty_points_per_thb) || 25))} <span className="text-xs uppercase tracking-wider font-bold text-gray-400">PTS</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                /* General Success screen for non-members */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl mt-2">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100 relative">
                    <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 50 50">
                      <motion.circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                      <motion.path
                        d="M16 26L22 32L34 18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
                      />
                    </svg>
                  </div>

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
                    className="text-3xl font-black text-gray-900 tracking-tight mb-2"
                  >
                    ชำระเงินสำเร็จ!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                    className="text-gray-500 text-sm font-medium mt-2"
                  >
                    ขอบคุณที่ใช้บริการ
                  </motion.p>
                </div>
              )
            ) : selectedCustomer ? (
              /* Scanned Member Profile Screen */
              <div className="flex-1 flex flex-col min-h-0 gap-6 mt-2 overflow-hidden">
                {/* Profile Card */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {selectedCustomer.customer_image || selectedCustomer.avatar_url ? (
                        <img src={selectedCustomer.customer_image || selectedCustomer.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                          <User size={24} className="text-gray-300" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[#1A1A18] rounded-full p-1 border-2 border-white shadow-sm">
                        <Award size={12} className="fill-[#1A1A18]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-gray-900 leading-tight">
                        {selectedCustomer.full_name || selectedCustomer.display_name}
                      </h4>
                      <p className="text-xs font-bold text-gray-400 mt-0.5 tracking-wider">{selectedCustomer.phone}</p>
                      <div className="bg-[#1A1A18] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-2">
                        <span className="text-yellow-400 font-black text-xs">{selectedCustomer.points || 0}</span>
                        <span className="text-white font-bold text-[9px] tracking-widest uppercase">PTS</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (linkedCheckInId) {
                        supabase.from('pos_member_checkins').update({ status: 'cancelled' }).eq('id', linkedCheckInId).then(() => {});
                        setLinkedCheckInId(null);
                      }
                      setSelectedCustomer(null);
                      setMemberSearchQuery('');
                      setMemberCheckoutStep('lookup');
                    }}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 border border-transparent hover:border-red-100 rounded-xl transition-all"
                  >
                    เปลี่ยน/ยกเลิก
                  </button>
                </div>

                {/* Available Coupons List */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-6 flex flex-col min-h-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#1A1A18]">
                      คูปองที่ลูกค้าใช้ได้
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                      {memberAvailableCoupons.length}
                    </span>
                  </div>

                  {memberAvailableCoupons.length > 0 ? (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {memberAvailableCoupons.map((coupon, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const event = new CustomEvent('applyPOSCoupon', { detail: coupon });
                            window.dispatchEvent(event);
                            if (coupon.discount_type !== 'free_item') {
                              alert(`นำคูปอง "${coupon.coupon_name || coupon.name}" ไปใช้สำเร็จ!`);
                            }
                          }}
                          className="bg-white border border-gray-100 hover:border-emerald-500 rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                          {coupon.image_url ? (
                            <img src={coupon.image_url} alt={coupon.coupon_name} className="w-12 h-12 object-cover rounded-xl" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors border border-gray-100">
                              <Ticket size={20} className="text-gray-400 group-hover:text-emerald-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-gray-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">
                              {coupon.coupon_name}
                            </h4>
                            <p className="text-[10px] font-black text-orange-500 mt-1 uppercase tracking-widest">
                              {coupon.discount_type === 'free_item' ? 'รับฟรี 1 รายการ' : ''}
                              {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : ''}
                              {coupon.discount_type === 'fixed' ? `ลด ${coupon.discount_value} บาท` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-8">
                      <Ticket size={36} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-wider">ไม่มีคูปองที่ใช้ได้</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Swipeable Container between QR and Phone */
              <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden mt-2">
                <motion.div
                  drag="x"
                  dragDirectionLock={true}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -100) {
                      setMemberLookupMode('phone');
                    } else if (info.offset.x > 100) {
                      setMemberLookupMode('qr');
                    }
                  }}
                  animate={{ x: memberLookupMode === 'qr' ? '0%' : '-50%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex h-full w-[200%] absolute left-0 top-0 items-stretch cursor-grab active:cursor-grabbing"
                >
                  {/* Panel 1: QR Code Scan (Full Area) */}
                  <div className="w-1/2 h-full flex flex-col items-center justify-center px-6 text-center select-none">
                    
                    {posQrPointsEarned > 0 && (
                      <div className="mb-6 animate-in fade-in duration-300">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">คะแนนที่จะได้รับ</span>
                        <div className="text-[56px] font-black text-gray-900 tracking-tighter leading-none mt-1">
                          +{posQrPointsEarned} <span className="text-lg font-bold text-gray-400 uppercase tracking-widest">PTS</span>
                        </div>
                      </div>
                    )}

                    <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex items-center justify-center relative">
                      {posQrLoyaltyToken ? (
                        <QRCodeSVG
                          value={
                            posQrLoyaltyToken !== 'general_member_checkin'
                              ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi'}/#?path=/member&claimToken=${posQrLoyaltyToken}&session=${qrSessionId}`
                              : `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi'}/#?path=/member`
                          }
                          size={240}
                          level="H"
                          includeMargin={false}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 w-[240px] h-[240px]">
                          <Loader2 className="animate-spin text-gray-300" size={36} />
                          <span className="text-[10px] font-bold text-gray-400">กำลังสร้าง QR...</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] font-black text-gray-800 mt-6 tracking-wide uppercase">
                      แสกนคิวอาร์โค้ดผ่าน LINE เพื่อรับแต้ม
                    </p>
                    
                    <div className="mt-4 flex items-center gap-1.5 text-gray-400 text-[10px] font-bold animate-pulse">
                      <span>ปัดหน้าจอเพื่อกรอกเบอร์โทร</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  {/* Panel 2: Phone Input (Full Area) */}
                  <div className="w-1/2 h-full flex flex-col items-center justify-center px-6 text-center select-none">
                    <div className="mb-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">ค้นหาสมาชิก</span>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">กรอกเบอร์โทรศัพท์</h3>
                    </div>

                    <div className="relative w-full max-w-xs mb-4">
                      <input
                        type="tel"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="08X-XXX-XXXX"
                        className="w-full bg-gray-50 border border-gray-100 focus:border-black focus:bg-white rounded-2xl py-4 px-6 text-2xl font-black text-center tracking-[0.1em] transition-all outline-none placeholder:text-gray-300"
                        autoFocus={memberLookupMode === 'phone'}
                      />

                      {memberSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-20 max-h-[160px] overflow-y-auto">
                          {memberSearchResults.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedCustomer(m);
                                setMemberCheckoutStep('points');
                                setMemberSearchResults([]);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 transition-colors group"
                            >
                              <div>
                                <div className="font-bold text-gray-800 text-xs truncate group-hover:text-black">{m.full_name || m.display_name}</div>
                                <div className="text-[10px] text-gray-400 font-bold">{m.phone}</div>
                              </div>
                              <div className="text-xs font-black text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                {m.points || 0} PTS
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSearchMemberFlow}
                      disabled={!memberSearchQuery.trim() || isSearchingMember}
                      className="w-full max-w-xs h-12 bg-black text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {isSearchingMember ? <Loader2 className="animate-spin" size={16} /> : 'ค้นหาสมาชิก'}
                    </button>

                    <div className="mt-6 flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                      <ArrowLeft size={12} />
                      <span>ปัดกลับเพื่อแสดง QR Code</span>
                    </div>
                  </div>
                </motion.div>

                {/* Dot indicators at the very bottom */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 shrink-0 pointer-events-none">
                  <span onClick={() => setMemberLookupMode('qr')} className={`h-1.5 rounded-full transition-all cursor-pointer pointer-events-auto ${memberLookupMode === 'qr' ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-200'}`}></span>
                  <span onClick={() => setMemberLookupMode('phone')} className={`h-1.5 rounded-full transition-all cursor-pointer pointer-events-auto ${memberLookupMode === 'phone' ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-200'}`}></span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 2. ORDER TYPE & CATEGORIES */}
            {!(
              editingOrderId && pendingOrders.find(o => o.id === editingOrderId)?.order_source === 'liff'
            ) && (
              <div className="flex flex-shrink-0 flex-col bg-transparent z-10 relative">
                <div className="flex items-center gap-4 bg-transparent px-4 py-2.5 border-b border-neutral-200/30 min-h-[60px] relative overflow-hidden">
                  {/* Borderless Custom Red Logo Menu Button with Red Pulsing Chevrons Motion */}
                  <motion.button 
                    onClick={() => setShowInlineNav(prev => !prev)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 bg-transparent border-none p-0 outline-none hover:bg-transparent active:scale-95 shrink-0 select-none shadow-none"
                  >
                    {showInlineNav ? (
                      <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }} transition={{ duration: 0.2 }} className="text-[#D3202B] hover:text-red-700 w-11 h-11 flex items-center justify-center">
                        <X size={24} strokeWidth={2.5} />
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-1 min-h-[44px]">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="w-10 h-10 flex items-center justify-center">
                          <img src="/logo-red.png" alt="Menu" className="w-8.5 h-8.5 object-contain" />
                        </motion.div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                          className="text-[#D3202B] flex items-center justify-center"
                        >
                          <ChevronsRight size={18} strokeWidth={3} />
                        </motion.div>
                      </div>
                    )}
                  </motion.button>

                  <AnimatePresence mode="wait">
                    {showInlineNav ? (
                      /* Sliding inline navigation bar overlaying table select and search! */
                      <motion.div
                        key="inline-nav-bar"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-grow flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
                      >
                        {(() => {
                          const inlineTabs = [
                            ...allowedNav.map(item => ({
                              id: item.id,
                              label: item.label,
                              icon: item.icon,
                              group: item.group
                            })),
                            // Append custom delivery tab if not already present
                            ...(allowedNav.some(n => n.id === 'history') ? [{ id: 'delivery', label: 'ส่งอาหาร', icon: Truck, group: 'operations' }] : [])
                          ];
                          return inlineTabs.map((tab) => {
                            const Icon = tab.icon || ShoppingBag;
                            const isActive = activeLandscapeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  handleSwitchTab(tab.id);
                                  setShowInlineNav(false);
                                }}
                                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 border ${isActive ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                              >
                                <Icon size={14} className={isActive ? 'text-red-600' : 'opacity-70'} />
                                <span>{tab.label}</span>
                              </button>
                            );
                          });
                        })()}
                      </motion.div>
                    ) : (
                      /* Default table selector and search input bar */
                      <motion.div
                        key="normal-search-bar"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-grow flex items-center gap-4 min-w-0"
                      >
                        {/* Search Bar Input */}
                        <div className="relative group flex-1 min-w-0">
                          <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D3202B] transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="ค้นหาเมนู..."
                            className="w-full bg-white border border-gray-200 h-11 !rounded-xl pl-12 pr-12 text-[13px] font-bold text-gray-900 focus:!outline-none transition-all placeholder:text-gray-400 focus:!border-[#D3202B] focus:!ring-1 focus:!ring-[#D3202B] focus:!ring-offset-0 focus:shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all active:scale-95 z-10"
                            title={viewMode === 'grid' ? 'แสดงแบบรายการ' : 'แสดงแบบตาราง'}
                          >
                            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Categories */}
                <div className="relative flex h-[56px] border-b border-neutral-200/30 bg-transparent">
                  <div
                    ref={categoryScrollRef}
                    className="no-scrollbar flex flex-1 items-stretch gap-8 overflow-x-auto px-6 h-full"
                  >
                    <button
                      onClick={() => setActiveCategoryId(null)}
                      className={`flex-shrink-0 h-full border-b-2 px-1 text-[13px] font-black uppercase tracking-wider transition-all ${!activeCategoryId || activeCategoryId === 'all' ? 'border-[#D3202B] text-[#D3202B]' : 'border-transparent text-[#7B7A74] hover:text-[#1A1A18]'}`}
                    >
                      ทั้งหมด
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`flex-shrink-0 h-full border-b-2 px-1 text-[13px] font-black uppercase tracking-wider transition-all ${activeCategoryId === cat.id ? 'border-[#D3202B] text-[#D3202B]' : 'border-transparent text-[#7B7A74] hover:text-[#1A1A18]'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MOTION STATE OVERLAY */}
            {activeCoupon && activeCoupon.discount_type === 'free_item' && (
              <motion.div 
                className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="absolute inset-0 border-[2px] border-orange-500/50 shadow-[inset_0_0_20px_rgba(249,115,22,0.15)] pointer-events-none"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                />

                <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center pointer-events-none px-4">
                  <motion.div 
                    className="pointer-events-auto cursor-pointer flex items-center gap-3 bg-white/95 backdrop-blur-xl pl-2 pr-4 py-2 rounded-full shadow-[0_8px_30px_rgb(249,115,22,0.15)] border border-orange-200 group"
                    onClick={() => setActiveCoupon(null)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 text-orange-600 shrink-0 shadow-sm border border-orange-100/50">
                      <Gift size={18} strokeWidth={2.5} className="group-hover:animate-bounce" />
                    </div>
                    
                    <div className="flex flex-col py-1">
                      <span className="font-bold text-[13px] text-gray-900 leading-tight">
                        เลือกสินค้าสำหรับรับฟรี
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 leading-tight">
                        แตะที่เมนูเพื่อใช้สิทธิ์
                      </span>
                    </div>

                    <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

                    <span className="text-[11px] font-extrabold text-orange-500 group-hover:text-red-500 transition-colors px-2 uppercase tracking-wide">
                      ยกเลิก
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}

            <main className="custom-scrollbar flex-1 overflow-y-auto bg-transparent p-3 sm:p-4 xl:p-6 font-bold min-h-0">
              <div className="mx-auto font-bold min-h-full pb-32">
                {filteredItems.length > 0 ? (
                  <div
                    className={`grid font-bold ${viewMode === 'list' ? 'gap-3 sm:gap-4 xl:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'}`}
                  >
                    {filteredItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`relative group select-none touch-manipulation w-full ${viewMode === 'grid' ? 'pb-[100%] block' : 'h-full flex flex-col'}`}
                        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (canToggleStock) setOptionsModalItem(item)
                        }}
                        onTouchStart={(e) => handlePressStart(e, item)}
                        onTouchEnd={handlePressCancel}
                        onTouchMove={handlePressMove}
                        onMouseDown={(e) => handlePressStart(e, item)}
                        onMouseUp={handlePressCancel}
                        onMouseMove={handlePressMove}
                        onMouseLeave={handlePressCancel}
                      >
                        <button
                          onClick={(e) => {
                            handlePressCancel()
                            if (isLongPressTriggered.current) {
                              e.preventDefault()
                              e.stopPropagation()
                              isLongPressTriggered.current = false
                              return
                            }
                            if (item.in_stock !== false) handleProductClick(e, item)
                          }}
                          disabled={item.in_stock === false}
                          className={`transition-all duration-300 outline-none ${item.in_stock === false ? 'opacity-70 grayscale cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1'} ${viewMode === 'list' ? 'relative w-full h-full flex text-left font-bold border border-[#E5E5DF] bg-white rounded-2xl p-3 sm:p-4 flex-row gap-4 items-center' : 'absolute inset-0 w-full h-full flex text-left font-bold rounded-2xl overflow-hidden border border-[#E5E5DF]/40 bg-white shadow-sm'}`}
                        >
                          {item.in_stock === false && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none rounded-[1.2rem]">
                               <div className="flex flex-col items-center justify-center transform -rotate-12 border-[3px] border-white/80 rounded-2xl p-3 shadow-lg">
                                 <span className="text-white/90 text-[20px] font-black uppercase tracking-widest drop-shadow-sm">SOLD</span>
                                 <span className="text-white/90 text-[20px] font-black uppercase tracking-widest drop-shadow-sm mt-[-4px]">OUT</span>
                               </div>
                            </div>
                          )}
                          
                          {(() => {
                            const primaryName = getPrimaryMenuName(item)
                            const secondaryName = getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')
                            
                            if (viewMode === 'list') {
                              return (
                                <>
                                  {item.image_url ? (
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-gray-100 rounded-xl"><img loading="lazy" crossOrigin="anonymous" src={item.image_url || ''} className="h-full w-full object-cover" /></div>
                                  ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-gray-100 text-gray-300 rounded-xl"><ImageIcon size={20} /></div>
                                  )}
                                  <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
                                    <div className="text-left">
                                      <h4 className="line-clamp-2 text-[14px] font-black text-gray-900 leading-tight">
                                        {primaryName}
                                      </h4>
                                      {secondaryName && (
                                        <p className="line-clamp-1 text-[10px] font-bold text-[#7B7A74] mt-0.5 leading-tight">
                                          {secondaryName}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-end justify-between border-t border-gray-100 pt-2 mt-2">
                                      <span className="text-[14px] sm:text-[15px] font-black text-emerald-600">
                                        ฿ {getEffectiveItemUnitPrice(item).toLocaleString()}
                                      </span>
                                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-white">
                                        <Plus size={16} />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )
                            }

                            return (
                              <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden bg-[#2C2B27]">
                                {item.image_url ? (
                                  <img loading="lazy" crossOrigin="anonymous" src={item.image_url || ''} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 z-0" />
                                ) : (
                                  <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 z-0"><ImageIcon size={48} /></div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10 transition-colors duration-300"></div>
                                
                                <div className="relative z-10 h-full flex flex-col justify-end p-4 text-white w-full">
                                  <div className="flex flex-col w-full gap-0.5 text-left">
                                    <h4 className="line-clamp-2 text-[15px] font-black leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                      {primaryName}
                                    </h4>
                                    {secondaryName && (
                                      <p className="line-clamp-1 text-[11px] font-bold text-gray-300/90 leading-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                                        {secondaryName}
                                      </p>
                                    )}
                                    <div className="flex items-baseline mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                      <span className="text-[17px] font-black text-white">{getEffectiveItemUnitPrice(item).toLocaleString()}</span>
                                      <span className="text-[11px] font-bold ml-1 text-gray-300">บาท</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </button>
                    </div>
                    ))}
                  </div>
                ) : isInitialLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mb-4"></div>
                    <p className="text-sm font-black uppercase tracking-widest">กำลังโหลดเมนู...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 py-20">
                    <Search size={48} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">ไม่พบรายการที่ค้นหา</p>
                  </div>
                )}
              </div>
            </main>
          </>
        )}
          </>

          </motion.div>
        </div>      </motion.div>

      {/* RIGHT CONTENT: CART DRAWER / SPLIT VIEW */}
      <motion.div
        layout
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        id="desktop-cart-panel"
        style={{ 
          order: activeLandscapeTab === 'tables' ? 1 : 2,
          willChange: 'transform'
        }}
        className={`fixed inset-0 z-[1100] lg:relative lg:inset-auto lg:z-[35] flex justify-end font-bold transition-all duration-300 lg:transition-none ${isCartExpanded ? 'visible' : 'invisible lg:visible'} ${isSplitTab ? 'lg:w-[380px] xl:w-[450px] lg:flex-shrink-0 lg:bg-white lg:rounded-[2rem] lg:shadow-[0_25px_60px_rgba(0,0,0,0.12),0_4px_20px_rgba(0,0,0,0.04)] lg:border lg:border-neutral-200/30' : 'hidden lg:hidden w-0'}`}
      >
        <div
          className={`absolute inset-0 bg-[#3a3a38]/40 backdrop-blur-md lg:hidden transition-opacity duration-300 ${isCartExpanded ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartExpanded(false)}
        ></div>
        <div className={`relative flex h-full w-full flex-col bg-white font-bold shadow-2xl lg:shadow-none lg:rounded-[2rem] lg:overflow-hidden transition-transform duration-500 sm:max-w-xl lg:max-w-none ${isCartExpanded ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="relative flex-grow flex flex-col min-h-0 w-full h-full">
          {/* 1. OTHER SUB-VIEWS */}
          {renderedLandscapeTab !== 'terminal' && renderedLandscapeTab !== 'tables' && renderedLandscapeTab !== 'table_select' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={renderedLandscapeTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col min-h-0 bg-white z-20 w-full h-full lg:rounded-[2rem]"
              >
                {renderedLandscapeTab === 'history' ? (
                  null
                ) : renderedLandscapeTab === 'delivery' ? (
                  null
                ) : renderedLandscapeTab === 'shifts' ? (
                  null
                ) : renderedLandscapeTab === 'settings' ? (
                  null
                ) : renderedLandscapeTab === 'drawer' ? (
                  <POSDrawerManager {...commonProps} renderPart="right" />
                ) : renderedLandscapeTab === 'members' ? (
                  null
                ) : renderedLandscapeTab === 'inventory' || renderedLandscapeTab === 'reports' || renderedLandscapeTab === 'staff' || renderedLandscapeTab === 'menu-management' || renderedLandscapeTab === 'promotions' ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-100 m-6 font-sans">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 animate-pulse">
                      <Settings size={28} />
                    </div>
                    <h3 className="text-base font-black text-gray-900 mb-1">
                          {renderedLandscapeTab === 'inventory' ? 'ระบบสต็อก' : renderedLandscapeTab === 'reports' ? 'รายงานขาย' : renderedLandscapeTab === 'staff' ? 'จัดการพนักงาน' : renderedLandscapeTab === 'menu-management' ? 'จัดการเมนู' : 'โปรโมชั่น'}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mb-4">
                          {renderedLandscapeTab === 'inventory' ? 'วัตถุดิบ & คลังสินค้า' : renderedLandscapeTab === 'reports' ? 'รายงานผลการขาย' : renderedLandscapeTab === 'staff' ? 'บันทึกเวลาและ SOP' : renderedLandscapeTab === 'menu-management' ? 'จัดการเมนู' : 'ส่วนลดและแคมเปญ'}
                    </p>
                    <p className="text-[11px] text-gray-400 max-w-[280px] leading-relaxed font-semibold">
                        {renderedLandscapeTab === 'inventory' && 'ดูแลวัตถุดิบและปรับปรุงจำนวนคงเหลือในคลังสินค้าเพื่อความถูกต้องของระบบหักยอดวัตถุดิบอัตโนมัติ'}
                        {renderedLandscapeTab === 'reports' && 'รายงานวิเคราะห์ยอดขาย ช่องทางชำระเงิน และสถิติเมนูยอดนิยมเพื่อช่วยเพิ่มยอดขายให้กับร้านค้า'}
                        {renderedLandscapeTab === 'staff' && 'บริหารจัดการสิทธิ์พนักงาน อนุมัติวันลา บันทึก SOP งาน และรายงานบันทึกเวลาเข้างาน'}
                        {renderedLandscapeTab === 'menu-management' && 'แก้ไขราคา รูปภาพ จัดระเบียบหมวดหมู่ และกำหนดค่าตัวเลือกเพิ่มเติม (Modifiers) ของเมนูอาหาร'}
                        {renderedLandscapeTab === 'promotions' && 'สร้างแคมเปญส่วนลด คูปองพิเศษ และเงื่อนไขการใช้คะแนนสำหรับลูกค้าสมาชิก'}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          )}

          {/* 2. TABLE ZONES SELECTOR (Always mounted, toggled visibility) */}
          <motion.div
            animate={{
              opacity: renderedLandscapeTab === 'tables' ? 1 : 0,
              x: renderedLandscapeTab === 'tables' ? 0 : -20,
              zIndex: renderedLandscapeTab === 'tables' ? 10 : 0
            }}
            style={{
              pointerEvents: renderedLandscapeTab === 'tables' ? 'auto' : 'none'
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col min-h-0 bg-white lg:rounded-[2rem] lg:shadow-[0_25px_60px_rgba(0,0,0,0.12),0_4px_20px_rgba(0,0,0,0.04)] lg:border lg:border-neutral-200/30"
          >
            {renderUnifiedLeftPanel('จัดการโต๊ะ', Home, (
              <POSTableManager 
                {...commonProps} 
                showOnlyZones={true} 
                activeZoneProps={activeTableZone} 
                setActiveZoneProps={setActiveTableZone} 
                editingTableProps={editingTable}
                setEditingTableProps={setEditingTable}
                isLayoutModeProps={isLayoutMode}
                setIsLayoutModeProps={setIsLayoutMode}
              />
            ))}
          </motion.div>

          {/* 3. TERMINAL CART (Always mounted, toggled visibility) */}
          <motion.div
            animate={{
              opacity: (renderedLandscapeTab === 'terminal' || renderedLandscapeTab === 'drawer' || renderedLandscapeTab === 'table_select') ? 1 : 0,
              x: (renderedLandscapeTab === 'terminal' || renderedLandscapeTab === 'drawer' || renderedLandscapeTab === 'table_select') ? 0 : 20,
              zIndex: (renderedLandscapeTab === 'terminal' || renderedLandscapeTab === 'drawer' || renderedLandscapeTab === 'table_select') ? 10 : 0
            }}
            style={{
              pointerEvents: (renderedLandscapeTab === 'terminal' || renderedLandscapeTab === 'drawer' || renderedLandscapeTab === 'table_select') ? 'auto' : 'none'
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col min-h-0 bg-white lg:rounded-[2rem]"
          >
                        <>

        {!activeShift?.id ? (
          <motion.div
            key="open-shift-inline"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
          >
            <POSShiftModal
              isInline={true}
              isOpen={true}
              onClose={() => {}}
              onOpenShift={props.onOpenShift || (async () => {})}
              shopSettings={shopSettings}
            />
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : showBillDiscountModal ? (
          <motion.div
            key="bill-discount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragDirectionLock={true}
            dragConstraints={{ left: 0, right: 600 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || info.velocity.x > 400) {
                setShowBillDiscountModal(false);
              }
            }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 will-change-transform"
          >
            <header className="flex items-center gap-4 border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <button
                onClick={() => setShowBillDiscountModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-black">
                  ส่วนลดทั้งบิล
                </h3>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-gray-500">
                  จัดการโปรโมชั่นหรือส่วนลดท้ายบิล
                </p>
              </div>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ประเภทส่วนลด
                </label>
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => setBillDiscountModalType('fixed')}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                      billDiscountModalType === 'fixed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    ลดเป็นบาท (฿)
                  </button>
                  <button
                    onClick={() => setBillDiscountModalType('percent')}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                      billDiscountModalType === 'percent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    ลดเปอร์เซ็นต์ (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  มูลค่าส่วนลด
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-xl font-medium text-gray-400 pointer-events-none">
                    {billDiscountModalType === 'fixed' ? '฿' : '%'}
                  </div>
                  <input
                    type="number"
                    value={billDiscountInput}
                    onChange={e => setBillDiscountInput(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-2xl font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {activePromotions.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    โปรโมชั่นที่เปิดใช้งาน
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activePromotions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setBillDiscountModalType(p.discount_type)
                          setBillDiscountInput(String(p.discount_value))
                          setBillDiscountReason(`โปรโมชั่น: ${p.name}`)
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100"
                      >
                        <Tag size={14} className="text-indigo-500" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  เหตุผล (หมายเหตุ)
                </label>
                <input
                    type="text"
                    value={billDiscountReason}
                    onChange={e => setBillDiscountReason(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 transition-all focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <footer className="border-t border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <button
                onClick={applyBillDiscount}
                disabled={!billDiscountInput || Number(billDiscountInput) <= 0}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all ${
                  !billDiscountInput || Number(billDiscountInput) <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                }`}
              >
                ยืนยันส่วนลดทั้งบิล
              </button>
            </footer>
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : itemDiscountModalItem ? (
          <motion.div
            key="item-discount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragDirectionLock={true}
            dragConstraints={{ left: 0, right: 600 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || info.velocity.x > 400) {
                setItemDiscountModalItem(null);
              }
            }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 will-change-transform"
          >
            <header className="flex items-center gap-4 border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <button
                onClick={() => setItemDiscountModalItem(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black uppercase tracking-tighter text-black truncate">
                  ส่วนลดรายการ
                </h3>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-emerald-500 truncate">
                  {itemDiscountModalItem && getPrimaryMenuName(itemDiscountModalItem)}
                </p>
              </div>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ประเภทส่วนลด
                </label>
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => setItemDiscountType('fixed')}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                      itemDiscountType === 'fixed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    ลดเป็นบาท (฿)
                  </button>
                  <button
                    onClick={() => setItemDiscountType('percent')}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                      itemDiscountType === 'percent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    ลดเปอร์เซ็นต์ (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  มูลค่าส่วนลด
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-xl font-medium text-gray-400 pointer-events-none">
                    {itemDiscountType === 'fixed' ? '฿' : '%'}
                  </div>
                  <input
                    type="number"
                    value={itemDiscountValue}
                    onChange={e => setItemDiscountValue(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-2xl font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {activePromotions.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    โปรโมชั่นที่เปิดใช้งาน
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activePromotions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setItemDiscountType(p.discount_type)
                          setItemDiscountValue(String(p.discount_value))
                          setItemDiscountReason(`โปรโมชั่น: ${p.name}`)
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100"
                      >
                        <Tag size={14} className="text-indigo-500" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  เหตุผล (หมายเหตุ)
                </label>
                <input
                    type="text"
                    value={itemDiscountReason}
                    onChange={e => setItemDiscountReason(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 transition-all focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <footer className="border-t border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <button
                onClick={applyItemDiscount}
                disabled={!itemDiscountValue || Number(itemDiscountValue) <= 0}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all ${
                  !itemDiscountValue || Number(itemDiscountValue) <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                }`}
              >
                ยืนยันส่วนลดรายการ
              </button>
            </footer>
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : currentRightPanel === 'pending' ? (
          <motion.div
            key="pending-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragDirectionLock={true}
            dragConstraints={{ left: 0, right: 600 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || info.velocity.x > 400) {
                setCurrentRightPanel('cart');
              }
            }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 will-change-transform"
          >
            <header className="flex items-center justify-between border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-black uppercase tracking-tighter text-black">
                  ศูนย์แจ้งเตือนและรายการ
                </h3>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  รายการออเดอร์ค้างและโปรโมชั่น
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentRightPanel('cart')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </header>

            {/* Tabs inside sidebar pending view */}
            <div className="flex gap-6 px-6 sm:px-8 border-b border-gray-100 bg-white pt-4 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setPendingModalTab('orders')}
                className={`text-xs font-black pb-2 px-1 relative transition-all ${
                  pendingModalTab === 'orders' ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                รายการออเดอร์ ({suspendedOrders.length})
                {qrIncomingOrders.length > 0 && (
                  <span className="ml-1.5 inline-block bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                    QR ใหม่
                  </span>
                )}
                {pendingModalTab === 'orders' && (
                  <motion.div layoutId="pendingSidebarTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setPendingModalTab('coupons')}
                className={`text-xs font-black pb-2 px-1 relative transition-all flex items-center gap-1.5 ${
                  pendingModalTab === 'coupons' ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                คำขอใช้คูปอง ({claimingCoupons.filter(c => c.id !== appliedCouponId).length})
                {claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
                {pendingModalTab === 'coupons' && (
                  <motion.div layoutId="pendingSidebarTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                )}
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-white">
              {pendingModalTab === 'orders' ? (
                suspendedOrders.length > 0 ? (
                  suspendedOrders
                    .sort((a, b) => {
                      if (a.source === 'qr' && b.source !== 'qr') return -1
                      if (b.source === 'qr' && a.source !== 'qr') return 1
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    })
                    .map(order => (
                      <div
                        key={order.id}
                        onClick={() => {
                          handleResumeOrder(order);
                          setCurrentRightPanel('cart');
                        }}
                        className="group flex cursor-pointer flex-col items-center justify-between border bg-white p-5 transition-all hover:border-[#1A1A18] sm:flex-row rounded-2xl gap-4"
                      >
                        <div className="flex items-center gap-4 font-bold min-w-0">
                          {order.source === 'qr' ? (
                            <BellRing size={24} className="text-orange-400 animate-pulse group-hover:text-orange-500 shrink-0" />
                          ) : order.order_type === 'delivery' && order.delivery_platform ? (
                            <DeliveryPlatformIcon platform={order.delivery_platform} size={28} className="rounded-full shadow-sm shrink-0" />
                          ) : (
                            <History size={24} className="text-gray-200 group-hover:text-[#1A1A18] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <div className="text-xs font-black uppercase tracking-wide text-[#1A1A18]">
                                {order.order_type === 'delivery' ? (
                                  `คิวส่ง #${String(order.queue_number || '').padStart(3, '0')}`
                                ) : order.order_type === 'dine_in' && order.table_number ? (
                                  `โต๊ะ ${order.table_number}`
                                ) : (
                                  `#${String(order.queue_number || '').padStart(3, '0')}`
                                )}
                              </div>
                              {order.source === 'qr' && (
                                <span className="bg-orange-500 text-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter animate-pulse">
                                  QR ORDER
                                </span>
                              )}
                              {order.table_number && (
                                <span className="bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-amber-700">
                                  Table {order.table_number}
                                </span>
                              )}
                              {!order.source || order.source !== 'qr' ? (
                                <span className="bg-gray-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-gray-500">
                                  {order.order_type === 'dine_in'
                                    ? 'Dine In'
                                    : order.order_type === 'takeaway'
                                      ? 'Take Away'
                                      : 'Delivery'}
                                </span>
                              ) : null}
                              {order.order_type === 'delivery' && order.delivery_platform && (() => {
                                const brandInfo = platformBranding[order.delivery_platform] || { brand: '#10B981', lightBg: '#ECFDF5', text: '#047857' };
                                return (
                                  <span
                                    style={{
                                      backgroundColor: brandInfo.lightBg,
                                      color: brandInfo.text,
                                    }}
                                    className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter rounded"
                                  >
                                    {formatDeliveryPlatformLabel(order.delivery_platform)}
                                  </span>
                                );
                              })()}
                              {order.order_type === 'delivery' && order.reference_name && (
                                <span className="bg-[#1A1A18] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white truncate max-w-[80px]">
                                  {order.reference_name}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[9px] text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {order.source === 'qr' && <span className="ml-2 text-orange-400 font-black">● ลูกค้าสั่งเข้ามา</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-auto sm:ml-0">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-[#1A1A18]">
                              ฿{order.total_amount.toLocaleString()}
                            </span>
                            {(order.pos_order_payments?.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0) > 0 && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-1.5 py-0.5">
                                จ่ายแล้ว ฿{(order.pos_order_payments?.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0)).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteOrder(order.id)
                            }}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="py-20 text-center text-gray-400 text-sm font-bold">
                    ไม่มีออเดอร์รอดำเนินการ
                  </div>
                )
              ) : (
                claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {claimingCoupons.filter(c => c.id !== appliedCouponId).map((claim) => (
                      <div 
                        key={claim.id} 
                        onClick={() => {
                          setCurrentRightPanel('cart');
                          setActiveCouponClaimRequest(claim);
                        }}
                        className="cursor-pointer bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-block px-2 rounded-full text-[8px] font-black bg-amber-200 text-amber-800 uppercase tracking-widest mb-1.5">
                              {claim.discount_type === 'percent' ? `${claim.discount_value}% OFF` : claim.discount_type === 'free_item' ? 'FREE ITEM' : `฿${claim.discount_value} OFF`}
                            </span>
                            <h4 className="text-xs font-black text-amber-950 truncate leading-snug">{claim.coupon_name}</h4>
                            <p className="text-[10px] font-bold text-amber-700/80 mt-1 truncate">
                              โดย: {claim.member?.display_name || claim.member?.full_name || 'ลูกค้าทั่วไป'} ({claim.member?.phone})
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all shadow-md active:scale-95 text-center mt-auto"
                        >
                          ดูรายละเอียดและสแกน
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-gray-400 text-sm font-bold">
                    ไม่มีคำขอใช้คูปองในขณะนี้
                  </div>
                )
              )}
            </div>
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : currentRightPanel === 'delivery' ? (
          <motion.div
            key="delivery-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragDirectionLock={true}
            dragConstraints={{ left: 0, right: 600 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || info.velocity.x > 400) {
                setCurrentRightPanel('cart');
              }
            }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 will-change-transform"
          >
            <header className="flex items-center justify-between border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-black uppercase tracking-tighter text-black">
                  เดลิเวอรี่ฮับ
                </h3>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  จัดการเดลิเวอรี่และค่ายส่งอาหาร
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentRightPanel('cart')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </header>
            <div className="min-h-0 flex-1 relative bg-white">
              <DeliveryManager
                unlockAudio={unlockAudio}
                isAudioEnabled={isAudioEnabled}
                variant="drawer"
                syncPulse={syncPulse}
                onClose={() => setCurrentRightPanel('cart')}
                onStatusChange={refreshPendingOrders}
              />
            </div>
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : currentRightPanel === 'delivery_platform' ? (
          <motion.div
            key="delivery-platform-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragDirectionLock={true}
            dragConstraints={{ left: 0, right: 600 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || info.velocity.x > 400) {
                setCurrentRightPanel('cart');
              }
            }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold will-change-transform"
          >
            <header className="flex items-center justify-between border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-black uppercase tracking-tighter text-black">
                  เลือกค่ายเดลิเวอรี่
                </h3>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  ระบุค่ายส่งอาหารและเลขที่ออเดอร์
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentRightPanel('cart')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-white">
              {!draftDeliveryPlatform ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    {activeDeliveryPlatforms.map((platform: string) => {
                      const brandInfo = platformBranding[platform] || { brand: '#1A1A18', lightBg: '#F3F4F6', text: '#1A1A18' };
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => setDraftDeliveryPlatform(platform)}
                          style={{
                            borderColor: draftDeliveryPlatform === platform ? brandInfo.brand : '#E5E7EB',
                            color: brandInfo.text,
                            backgroundColor: '#FFFFFF',
                          }}
                          className="group rounded-[2rem] border-2 px-4 py-8 text-center transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 flex flex-col items-center justify-center gap-2"
                        >
                          <DeliveryPlatformIcon platform={platform} size={48} className="transition-transform group-hover:scale-110 shadow-sm" />
                          <div className="mt-2 text-lg font-black">{formatDeliveryPlatformLabel(platform)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 w-full">
                  {/* Selected Platform Header */}
                  <div
                    style={{
                      backgroundColor: (platformBranding[draftDeliveryPlatform] || {}).lightBg || '#F9FAFB',
                      borderColor: (platformBranding[draftDeliveryPlatform] || {}).brand + '30' || '#E5E7EB',
                    }}
                    className="flex items-center gap-3 border px-5 py-2.5 rounded-full mb-8 shadow-sm"
                  >
                    <DeliveryPlatformIcon platform={draftDeliveryPlatform} size={18} className="rounded-full shadow-sm" />
                    <span
                      style={{ color: (platformBranding[draftDeliveryPlatform] || {}).text || '#1A1A18' }}
                      className="text-[13px] font-black uppercase tracking-widest"
                    >
                      {formatDeliveryPlatformLabel(draftDeliveryPlatform)}
                    </span>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftDeliveryPlatform('')
                        setDraftPlatformOrderId('')
                      }}
                      className="text-[11px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-all active:scale-95"
                    >
                      เปลี่ยนค่าย
                    </button>
                  </div>

                  {/* Display screen */}
                  <div className="relative w-full max-w-[280px] h-20 flex flex-col items-center justify-center rounded-3xl mb-8 transition-all">
                    <span className="absolute -top-3 bg-white px-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 z-10">
                      Order ID
                    </span>
                    <div className={`w-full h-full flex items-center justify-center rounded-3xl border-2 transition-all ${draftPlatformOrderId ? 'border-[#1A1A18] bg-[#1A1A18] text-white shadow-xl scale-105' : 'border-gray-200 bg-gray-50 text-gray-300 border-dashed'}`}>
                      <span className="text-3xl font-black tracking-widest font-mono">
                        {draftPlatformOrderId || '---'}
                      </span>
                    </div>
                  </div>

                  {/* Ultra-sleek Numpad */}
                  <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[260px]">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDraftPlatformOrderId(prev => (prev.length < 15 ? prev + num : prev))}
                        className="h-14 w-14 mx-auto rounded-full bg-gray-50/50 hover:bg-gray-100 text-xl font-black text-[#1A1A18] hover:shadow-md active:scale-90 active:bg-gray-200 transition-all flex items-center justify-center"
                      >
                        {num}
                      </button>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setDraftPlatformOrderId('')}
                      className="h-14 w-14 mx-auto rounded-full text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:shadow-sm active:scale-90 transition-all flex items-center justify-center"
                    >
                      Clear
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setDraftPlatformOrderId(prev => (prev.length < 15 ? prev + '0' : prev))}
                      className="h-14 w-14 mx-auto rounded-full bg-gray-50/50 hover:bg-gray-100 text-xl font-black text-[#1A1A18] hover:shadow-md active:scale-90 active:bg-gray-200 transition-all flex items-center justify-center"
                    >
                      0
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setDraftPlatformOrderId(prev => prev.slice(0, -1))}
                      className="h-14 w-14 mx-auto rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#1A1A18] hover:shadow-sm active:scale-90 transition-all flex items-center justify-center"
                    >
                      <Delete size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentRightPanel('cart')}
                className={`${draftDeliveryPlatform ? 'flex-1' : 'w-full'} rounded-[1.25rem] bg-gray-50 py-4 text-[12px] font-black uppercase tracking-[0.2em] text-gray-500 transition-all hover:bg-gray-200 hover:text-black`}
              >
                ยกเลิก
              </button>
              {draftDeliveryPlatform && (
                <button
                  type="button"
                  disabled={!draftPlatformOrderId}
                  onClick={() => {
                    const trimmed = draftPlatformOrderId.trim();
                    if (!trimmed) return;
                    setDeliveryPlatform(draftDeliveryPlatform);
                    setPlatformOrderId(trimmed);
                    setCurrentRightPanel('cart');
                  }}
                  className={`flex-1 rounded-[1.25rem] py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all ${draftPlatformOrderId ? 'bg-[#D3202B] text-white hover:bg-red-700 hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  ยืนยัน
                </button>
              )}
            </div>
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        
        ) : currentRightPanel === 'modifiers' && modifierModalItem ? (


          <motion.div
            key="modifiers-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragDirectionLock={true}
            dragConstraints={{ left: 0, right: 600 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || info.velocity.x > 400) {
                setModifierModalItem(null);
                setEditingCartItemIndex(null);
              }
            }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold will-change-transform"
          >
            <header className="flex items-center gap-4 border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModifierModalItem(null);
                  setEditingCartItemIndex(null);
                }}
                className="flex items-center justify-center text-[#D3202B] hover:text-[#B91C1C] transition-colors pr-2 active:scale-95"
              >
                <ArrowLeft size={22} strokeWidth={3} />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-black text-black leading-tight truncate">
                  {getPrimaryMenuName(modifierModalItem)}
                </h3>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mt-0.5">
                  เลือกตัวเลือกเพิ่มเติม
                </p>
              </div>
            </header>

            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6 sm:p-8">
              {modifierGroups.map((group, gIdx) => {
                const minReq = group.min_selection || group.min_select || 0;
                const maxAllowed = group.max_selection || group.max_select || 99;
                const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === group.id);
                const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0);
                const isComplete = totalQtyInGroup >= minReq;
                const isAtMax = totalQtyInGroup >= maxAllowed;

                return (
                  <div 
                    key={group.id} 
                    id={`modifier-group-${group.id}`} 
                    className="space-y-4 transition-all duration-500 scroll-mt-24"
                  >
                    <div className="pb-2 border-b border-gray-100/60">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[14px] font-black text-[#1A1A18] tracking-tight">
                          {group.name}
                        </h4>
                        {minReq > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                            {isComplete ? '✓ ครบ' : `* บังคับเลือก ${minReq}`}
                          </span>
                        ) : (
                          <span className="bg-gray-50 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-gray-400">
                            ไม่บังคับ
                          </span>
                        )}
                      </div>
                      {maxAllowed > 1 && maxAllowed < 99 && (
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">เลือกได้สูงสุด {maxAllowed} อย่าง</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {group.options?.map((opt: any) => {
                        const existingOptIndex = tempSelectedModifiers.findIndex(m => m.id === opt.id);
                        const isSelected = existingOptIndex > -1;
                        const optQty = isSelected ? (tempSelectedModifiers[existingOptIndex].qty || 1) : 0;
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            disabled={!isSelected && isAtMax && maxAllowed > 1}
                            onClick={() => {
                              let nextSelected = [...tempSelectedModifiers];
                              if (isSelected) {
                                if (maxAllowed === 1) {
                                  nextSelected.splice(existingOptIndex, 1);
                                } else {
                                  if (!isAtMax) {
                                    nextSelected[existingOptIndex] = { ...nextSelected[existingOptIndex], qty: optQty + 1 };
                                  }
                                }
                              } else {
                                if (maxAllowed === 1) {
                                  nextSelected = [
                                    ...nextSelected.filter(m => m.group_id !== group.id),
                                    { ...opt, qty: 1 },
                                  ];
                                } else {
                                  nextSelected = [...nextSelected, { ...opt, qty: 1 }];
                                }
                              }
                              setTempSelectedModifiers(nextSelected);
                            }}
                            className={`group relative flex h-20 flex-col justify-between rounded-xl p-3 text-left transition-all ${
                              isSelected 
                                ? 'bg-emerald-50/20 border border-emerald-500 shadow-sm' 
                                : isAtMax && maxAllowed > 1 
                                  ? 'cursor-not-allowed bg-gray-50 border border-transparent text-gray-400 opacity-60' 
                                  : 'bg-white border border-gray-200/85 hover:border-emerald-250 hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] active:scale-95'
                            }`}
                          >
                            <div className="flex w-full items-start justify-between gap-1">
                              <span className={`text-[12px] font-black leading-tight pr-6 truncate ${isSelected ? 'text-emerald-950' : 'text-[#1A1A18]'}`}>
                                {opt.name}
                              </span>
                              <div className="absolute right-2 top-2">
                                {isSelected && maxAllowed > 1 ? (
                                  <div className="flex items-center gap-1 bg-emerald-100 rounded-full border border-emerald-200 pr-1">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const nextSelected = [...tempSelectedModifiers];
                                        const idx = nextSelected.findIndex(m => m.id === opt.id);
                                        if (idx > -1) {
                                          if ((nextSelected[idx].qty || 1) > 1) {
                                            nextSelected[idx] = { ...nextSelected[idx], qty: nextSelected[idx].qty - 1 };
                                          } else {
                                            nextSelected.splice(idx, 1);
                                          }
                                          setTempSelectedModifiers(nextSelected);
                                        }
                                      }}
                                      className="w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center hover:bg-red-50 cursor-pointer border border-emerald-50"
                                    >
                                      <Minus size={10} strokeWidth={4} />
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-800">{optQty}</span>
                                  </div>
                                ) : (
                                  <div className="flex h-5 w-5 items-center justify-center">
                                    {isSelected && <Check size={16} strokeWidth={3} className="text-emerald-600" />}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span
                              className={`self-start text-[9px] font-black uppercase tracking-wider ${
                                isSelected 
                                  ? 'text-emerald-600' 
                                  : 'text-gray-400'
                              }`}
                            >
                              {opt.price_adjustment > 0
                                ? `+ ฿${opt.price_adjustment * Math.max(1, optQty)}`
                                : opt.price_adjustment < 0
                                  ? `- ฿${Math.abs(opt.price_adjustment * Math.max(1, optQty))}`
                                  : 'FREE'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="border-t border-gray-100 bg-white p-5 flex flex-col gap-3 shrink-0">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                  ตัวเลือกที่เลือก (Selected Options)
                </span>
                <div className="flex flex-wrap gap-1">
                  {tempSelectedModifiers.length > 0 ? (
                    tempSelectedModifiers.map(m => (
                      <span
                        key={m.id}
                        className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-[9px] font-black text-gray-600 shadow-sm"
                      >
                        {m.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-bold italic text-gray-300">
                      ยังไม่ได้เลือกตัวเลือกเพิ่มเติม
                    </span>
                  )}
                </div>
              </div>

              {(() => {
                const incomplete = modifierGroups.filter(g => {
                  const minReq = Number(g.min_selection ?? g.min_select ?? 0);
                  const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === g.id);
                  const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0);
                  return totalQtyInGroup < minReq;
                });
                const canConfirm = incomplete.length === 0;

                return (
                  <div className="flex items-center gap-2 mt-2">
                    {/* QUANTITY SELECTOR */}
                    <div className="flex items-center h-12 bg-gray-50 rounded-xl border border-gray-200 p-1 w-28 shrink-0">
                      <button 
                        type="button"
                        onClick={() => setTempQuantity(q => Math.max(1, q - 1))}
                        className="w-8 h-full rounded-lg bg-white text-gray-400 shadow-sm hover:text-[#1A1A18] hover:shadow active:scale-95 flex items-center justify-center border border-gray-100"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <div className="flex-1 text-center font-black text-lg text-[#1A1A18]">
                        {tempQuantity}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setTempQuantity(q => q + 1)}
                        className="w-8 h-full rounded-lg bg-white text-gray-400 shadow-sm hover:text-[#1A1A18] hover:shadow active:scale-95 flex items-center justify-center border border-gray-100"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (incomplete.length > 0) {
                          const firstIncomplete = incomplete[0];
                          const element = document.getElementById(`modifier-group-${firstIncomplete.id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // Highly polished shake & color flash animation directly on element styles
                            element.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                            element.style.transform = 'scale(1.025)';
                            element.style.backgroundColor = '#FEF2F2'; // light red background flash
                            element.style.borderRadius = '16px';
                            element.style.padding = '12px';
                            element.style.boxShadow = '0 10px 25px -5px rgba(239, 68, 68, 0.05)';
                            
                            // Horizontal shake motion
                            let isLeft = true;
                            let count = 0;
                            const shakeInterval = setInterval(() => {
                              element.style.transform = `scale(1.025) translateX(${isLeft ? '-6px' : '6px'})`;
                              isLeft = !isLeft;
                              count++;
                              if (count >= 6) {
                                clearInterval(shakeInterval);
                                element.style.transform = 'scale(1.025)';
                              }
                            }, 80);

                            setTimeout(() => {
                              element.style.transform = 'scale(1)';
                              element.style.backgroundColor = '';
                              element.style.borderRadius = '';
                              element.style.padding = '';
                              element.style.boxShadow = '';
                            }, 1500);
                          }
                          return;
                        }

                        if (editingCartItemIndex !== null) {
                          setCart(prev => {
                            const copy = [...prev];
                            copy[editingCartItemIndex] = {
                              ...copy[editingCartItemIndex],
                              selected_modifiers: tempSelectedModifiers,
                              quantity: tempQuantity
                            };
                            if (copy[editingCartItemIndex].is_free_coupon_item) {
                              const basePrice = getEffectiveItemUnitPrice(copy[editingCartItemIndex]);
                              const modsPrice = tempSelectedModifiers.reduce((ma: number, m: any) => ma + ((m.price_adjustment || 0) * (m.qty || 1)), 0);
                              copy[editingCartItemIndex].discount_amount = basePrice + modsPrice;
                            }
                            return copy;
                          });
                          setModifierModalItem(null);
                          setEditingCartItemIndex(null);
                        } else {
                          addToCart(modifierModalItem, tempSelectedModifiers, tempQuantity, true);
                        }
                      }}
                      className="relative flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-black uppercase tracking-wider transition-all overflow-hidden bg-[#D3202B] text-white hover:bg-[#B91C1C] hover:shadow-md active:scale-95"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                      <span>{canConfirm ? 'ยืนยัน' : `ยืนยัน (ขาดอีก ${incomplete.length} หมวด)`}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}
            </footer>
          </motion.div>
        ) : paymentSuccessData ? (
          /* Receipt Success Panel in Right Sidebar! */
          <motion.div
            key="receipt-success-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            {/* Center Content: Payment Amount / Change details */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">ชำระเงินสำเร็จ</span>
              
              {paymentSuccessData.paymentMethod === 'cash' ? (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.change.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase">
                    เงินทอน (CHANGE)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center">
                    <span className="text-2xl text-gray-400 font-bold mr-1">฿</span>
                    {paymentSuccessData.total.toLocaleString()}
                  </div>
                  <div className="mt-2 text-[9px] font-black text-gray-400 tracking-widest uppercase font-black">
                    {paymentSuccessData.paymentMethod}
                  </div>
                </>
              )}

              {/* Optional Story Selection (Minimal Flat Select if active) */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mt-8 w-full max-w-xs p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 text-center">ตัวเลือกเรื่องเล่าท้ายบิล</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-[#1A1A18] outline-none hover:border-gray-300 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>🎲 สุ่มตอน (Random Chapter)</option>
                      {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                        <option key={idx} value={idx}>📖 {story.title}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Dropdown print options and Next Order CTA */}
            <footer className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-3 relative">
              {/* Print Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrintDropdown(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Printer size={14} className="text-gray-400" />
                    <span>สั่งพิมพ์เอกสาร...</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showPrintDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPrintDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPrintDropdown(false)}></div>
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden z-30 divide-y divide-gray-50 animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintReceipt();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span>พิมพ์ใบเสร็จ (Receipt)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePrintKitchen();
                          setShowPrintDropdown(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Utensils size={14} className="text-gray-400" />
                        <span>พิมพ์ใบครัว (Kitchen)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Next Order CTA */}
              <button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setSelectedCustomer(null);
                  setMemberSearchQuery('');
                  setShowMemberCheckoutFlow(false);
                  setShowPrintDropdown(false);
                }}
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                สั่งรายการถัดไป <ArrowRight size={14} />
              </button>
            </footer>
          </motion.div>
        ) : showPaymentModal ? (
          /* Payment Options Panel in Right Sidebar! */
          <motion.div
            key="payment-options-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-[#FAFAFA] absolute inset-0"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">ชำระเงิน</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">เลือกช่องทางการชำระเงิน</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Total Due display */}
              <div className="text-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">ยอดชำระสุทธิ</div>
                <div className="text-5xl font-black text-gray-900 tracking-tight">
                  <span className="text-2xl font-medium text-gray-400 mr-1">฿</span>
                  {remainingTotal.toLocaleString()}
                </div>
                {totalPaid > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black tracking-wider text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                    <span>ชำระแล้ว: ฿{totalPaid.toLocaleString()} / รวม: ฿{cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold leading-normal">
                  {checkoutError}
                </div>
              )}

              {/* Split Bill option */}
              <button
                disabled={isProcessing || remainingTotal <= 0}
                onClick={() => {
                  fetchTables();
                  refreshPendingOrders();
                  setShowPaymentModal(false);
                  setShowSplitPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                หารจ่าย / แยกจ่าย (Split Bill)
              </button>

              {/* Quick Payment buttons grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    setShowPaymentModal(false);
                    setCashReceived('');
                    setPaymentSuccessData(null);
                    setCurrentPaymentAmount(remainingTotal);
                    setShowCashPaymentModal(true);
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'cash' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <Banknote size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">เงินสด</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('promptpay');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'promptpay' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <QrCode size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">สแกน</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setCheckoutError(null);
                    handleProcessPayment('credit_card');
                  }}
                  className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${processingMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40`}
                >
                  {processingMethod === 'credit_card' ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <CreditCard size={28} strokeWidth={1.5} />
                  )}
                  <span className="text-[11px] font-bold tracking-wide">บัตร</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cart-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
          >
          <header className="flex flex-col gap-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:pt-8 bg-white p-6 sm:p-8">
            <div className="flex w-full items-start justify-between gap-4">
              <div className="flex flex-col min-w-0">
                <motion.h3 
                  animate={isCartBumping ? { x: [-3, 3, -3, 3, 0], scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="text-[20px] font-black uppercase tracking-tight text-gray-900 leading-tight truncate"
                >
                  {locale === 'en' ? 'Order list' : locale === 'zh' ? '订单清单' : 'รายการสั่งซื้อ'}
                </motion.h3>
                {editingOrderNumber && (
                  <div className="mt-1">
                    <span className="bg-[#1A1A18] px-2.5 py-0.5 font-mono text-[10px] font-bold text-white rounded-md uppercase tracking-wider inline-block">
                      {editingOrderNumber}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(editingOrderId || cart.length > 0 || !!selectedTable) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (editingOrderId && cart.length === 0) {
                        await handleDeleteOrder(editingOrderId);
                      }
                      resetOrderComposer();
                      if (renderedLandscapeTab === 'table_select') {
                        handleSwitchTab('terminal');
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors"
                    title={locale === 'en' ? 'Exit active held bill and start a new order' : 'ล้างตะกร้า / เริ่มสั่งรายการใหม่'}
                  >
                    <Undo2 size={18} />
                  </button>
                )}

                {/* History / Pending */}
                <button
                  type="button"
                  onClick={() => {
                    if (claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 && qrIncomingOrders.length === 0) {
                      setPendingModalTab('coupons');
                    } else {
                      setPendingModalTab('orders');
                    }
                    setCurrentRightPanel('pending');
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                    qrIncomingOrders.length > 0 || claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0
                      ? 'border-orange-400 bg-orange-500 text-white animate-pulse'
                      : suspendedOrders.length > 0
                        ? 'border-orange-200 bg-orange-50 text-orange-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                  }`}
                  title="ออเดอร์รอดำเนินการ"
                >
                  {qrIncomingOrders.length > 0 || claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 ? (
                    <BellRing size={16} className={claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 ? "animate-bounce" : ""} />
                  ) : (
                    <History size={16} />
                  )}
                  {(suspendedOrders.length + claimingCoupons.filter(c => c.id !== appliedCouponId).length) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5F1F] text-[8px] font-black text-white ring-1 ring-white">
                      {suspendedOrders.length + claimingCoupons.filter(c => c.id !== appliedCouponId).length}
                    </span>
                  )}
                </button>

                {/* Delivery */}
                <button
                  type="button"
                  onClick={() => setCurrentRightPanel('delivery')}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                    liffIncomingOrders.length > 0
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-600 animate-pulse'
                      : deliveryHubOrders.length > 0
                        ? 'border-emerald-200 text-emerald-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
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

                {/* Close Cart */}
                <button
                  type="button"
                  onClick={() => setIsCartExpanded(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors lg:hidden"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Segmented Control for Order Type */}
            <div className="flex w-full rounded-[1rem] border border-gray-200 p-1 font-bold bg-white">
              <button
                onClick={() => {
                  if (orderType === 'dine_in') {
                      fetchTables();
                      handleSwitchTab('table_select');
                  } else if (editingOrderId) {
                      setPendingOrderTypeSwitch('dine_in');
                  } else {
                      setOrderType('dine_in');
                      fetchTables();
                      handleSwitchTab('table_select');
                  }
                }}
                className={`flex h-12 flex-1 items-center justify-center gap-2 text-[12px] font-bold transition-all rounded-[0.8rem] ${orderType === 'dine_in' ? 'text-[#D3202B]' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <Utensils size={18} />
                {selectedTable && orderType === 'dine_in' && (
                  <span className="text-[12px]">
                    T-{selectedTable.table_number}
                  </span>
                )}
              </button>
              
              <div className="w-[1px] h-8 bg-gray-200 my-auto"></div>
              
              <button
                onClick={() => {
                  if (editingOrderId) {
                      setPendingOrderTypeSwitch('takeaway');
                  } else {
                      setSelectedTable(null);
                      setOrderType('takeaway');
                  }
                }}
                className={`flex h-12 flex-1 items-center justify-center gap-2 text-[12px] font-bold transition-all rounded-[0.8rem] ${orderType === 'takeaway' ? 'text-[#D3202B]' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <ShoppingBag size={18} />
              </button>
              
              <div className="w-[1px] h-8 bg-gray-200 my-auto"></div>
              
              <button
                onClick={() => {
                  if (editingOrderId) {
                      setPendingOrderTypeSwitch('delivery');
                  } else {
                      setOrderType('delivery');
                      setSelectedTable(null);
                      setDraftDeliveryPlatform('');
                      setDraftPlatformOrderId('');
                      setCurrentRightPanel('delivery_platform');
                  }
                }}
                className={`flex h-12 flex-1 items-center justify-center gap-2 text-[12px] font-bold transition-all rounded-[0.8rem] ${orderType === 'delivery' ? 'text-[#D3202B]' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <Bike size={18} />
              </button>
            </div>



              {orderType === 'delivery' && (() => {
                const brandInfo = deliveryPlatform ? platformBranding[deliveryPlatform] : null;
                const hasSelected = !!deliveryPlatform;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftDeliveryPlatform('');
                      setDraftPlatformOrderId(platformOrderId || '');
                      setCurrentRightPanel('delivery_platform');
                    }}
                    style={{
                      backgroundColor: brandInfo?.lightBg || '#FFF7ED',
                      borderColor: brandInfo ? brandInfo.brand + '30' : '#FED7AA',
                    }}
                    className="mt-2 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all hover:brightness-95"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {hasSelected ? (
                        <DeliveryPlatformIcon platform={deliveryPlatform} size={36} className="rounded-full shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                          <Bike size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div
                          style={{ color: brandInfo?.text || '#F97316' }}
                          className="text-[10px] font-black uppercase tracking-[0.25em]"
                        >
                          ค่ายเดลิเวอรี่
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-black text-[#1A1A18]">
                            {hasSelected ? formatDeliveryPlatformLabel(deliveryPlatform) : 'ยังไม่เลือกค่าย'}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            {platformOrderId ? `เลขบิล ${platformOrderId}` : '(แตะเพื่อตั้งค่า)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: brandInfo?.brand || '#F97316' }} className="shrink-0" />
                  </button>
                );
              })()}
            </header>

            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto bg-white p-4 transition-all sm:p-6">

              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <CartItemRow
                    key={idx}
                    item={item}
                    idx={idx}
                    locale={locale}
                    setSelectedRecipeItem={setSelectedRecipeItem}
                    setItemDiscountModalItem={setItemDiscountModalItem}
                    removeFromCart={removeFromCart}
                    updateQuantity={updateQuantity}
                    openEditCartItem={openEditCartItem}
                    getEffectiveItemUnitPrice={getEffectiveItemUnitPrice}
                    getPrimaryMenuName={getPrimaryMenuName}
                    getSecondaryMenuName={getSecondaryMenuName}
                  />
                ))
              ) : (
                <div className="pointer-events-none flex h-full flex-col items-center justify-center opacity-10">
                  <ShoppingBag size={80} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Empty Order Bag
                  </p>
                </div>
              )}
            </div>

            <footer className="border-t border-gray-100 bg-white p-4 sm:p-6 flex flex-col gap-4">
              {/* VAT & Discount Controls in one clean line */}
              <div className="flex items-center justify-between text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setBillDiscountInput(discountType === 'percent' ? String(discountRate) : String(discountValue))
                    setBillDiscountModalType(discountType)
                    setBillDiscountReason(discountName || 'โปรโมชั่น/ส่วนลด')
                    setShowBillDiscountModal(true)
                  }}
                  className="text-gray-500 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <Tag size={13} className={discountTotalValue > 0 ? "text-emerald-500" : "text-gray-400"} />
                  {discountTotalValue > 0 ? (
                    <span className="text-emerald-600 font-black">ส่วนลด: -฿{discountTotalValue.toLocaleString()}</span>
                  ) : (
                    <span className="text-gray-400">เพิ่มส่วนลดทั้งบิล</span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">ภาษี VAT 7%</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setHasVat(!hasVat)
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasVat ? 'bg-[#D3202B]' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasVat ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Minimal breakdown (only visible when discount or VAT is active) */}
              {(discountTotalValue > 0 || (hasVat && vatAmount > 0)) && (
                <div className="flex flex-col gap-1 border-t border-dashed border-gray-100 pt-2 text-[10px] font-bold text-gray-400">
                  <div className="flex justify-between">
                    <span>ยอดรวมสินค้า</span>
                    <span className="text-gray-600">฿{cartSubTotal.toLocaleString()}</span>
                  </div>
                  {discountTotalValue > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>ส่วนลดทั้งบิล</span>
                      <span>-฿{discountTotalValue.toLocaleString()}</span>
                    </div>
                  )}
                  {hasVat && vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span>ภาษี (VAT 7%)</span>
                      <span className="text-gray-600">฿{Math.round(vatAmount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex gap-3 pt-1">
                {/* Hold/Save button */}
                <button
                  type="button"
                  onClick={handleSendOrder}
                  disabled={isProcessing || isAutoCreatingOrder || cart.length === 0 || isHeldOrderBaselineLoading || (!!editingOrderId && !hasUnsavedOrderChanges)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title={isAutoCreatingOrder ? 'กำลังดำเนินการ...' : isHeldOrderBaselineLoading ? 'กำลังโหลด...' : !!editingOrderId && !hasUnsavedOrderChanges ? 'พักบิลสำเร็จแล้ว' : 'พักบิล / บันทึกออเดอร์'}
                >
                  <Printer size={18} strokeWidth={2.5} />
                </button>

                {/* Primary Action Button */}
                {!!editingOrderId && cart.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteOrder(editingOrderId)
                      resetOrderComposer()
                    }}
                    className="flex h-12 flex-1 items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    <span className="text-[13px] font-black uppercase tracking-wider">เคลียร์โต๊ะ (ยกเลิกบิล)</span>
                  </button>
                ) : (
                  <motion.button
                    animate={checkoutShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
                    transition={checkoutShake ? { duration: 0.5, ease: "easeInOut" } : { duration: 0.2 }}
                    type="button"
                    onClick={async () => {
                      if (orderType === 'dine_in' && !selectedTable) {
                        setCheckoutShake(true)
                        setCheckoutWarning(true)
                        setTimeout(() => setCheckoutShake(false), 400)
                        setTimeout(() => setCheckoutWarning(false), 2000)
                        fetchTables()
                        refreshPendingOrders()
                        handleSwitchTab('table_select')
                        return
                      }
                      if (orderType === 'delivery') {
                        setShowDeliveryCheckoutModal(true)
                        return
                      }

                      if (showMemberCheckoutFlow && !selectedCustomer) {
                        // Skip member flow and go directly to payment options!
                        setShowPaymentModal(true);
                        return;
                      }

                      if (selectedCustomer) {
                        setShowPaymentModal(true);
                      } else {
                        setMemberCheckoutStep('lookup');
                        setShowMemberCheckoutFlow(true);
                      }
                    }}
                    disabled={isAutoCreatingOrder || cart.length === 0}
                    className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-white transition-all duration-300 shadow-md ${
                      (isAutoCreatingOrder || cart.length === 0) 
                        ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed' 
                        : checkoutWarning
                          ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                          : 'bg-[#D3202B] hover:bg-red-700 shadow-[#D3202B]/20'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={checkoutWarning ? 'warning' : 'checkout'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="text-[13px] font-black uppercase tracking-wider"
                      >
                        {checkoutWarning
                          ? 'กรุณาเลือกโต๊ะก่อน'
                          : orderType === 'delivery' 
                            ? `ยืนยันส่งออเดอร์ ฿${cartTotal.toLocaleString()}` 
                            : (showMemberCheckoutFlow && !selectedCustomer)
                              ? `ข้ามไปชำระเงิน ฿${cartTotal.toLocaleString()}`
                              : `ชำระเงิน ฿${cartTotal.toLocaleString()}`
                        }
                      </motion.span>
                    </AnimatePresence>
                    {!checkoutWarning && orderType !== 'delivery' && <ArrowRight size={16} strokeWidth={3} />}
                  </motion.button>
                )}
              </div>
            </footer>
          </motion.div>
        )}
          </>

          </motion.div>
        </div>
        {/* ORDER TYPE SWITCH MODAL (Inline Drawer Over Cart Panel) */}
        <AnimatePresence>
          {pendingOrderTypeSwitch && (
            <div className="absolute inset-0 z-[100] flex items-end justify-center font-bold p-4">
              {/* Backdrop layer bounded inside the rounded cart panel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm lg:rounded-[2rem]"
                onClick={() => setPendingOrderTypeSwitch(null)}
              />
              {/* Card sliding up from bottom */}
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative w-full bg-white p-6 rounded-[2rem] text-center shadow-2xl border border-neutral-100/50 z-10"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#D3202B]">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-neutral-800">
                  {locale === 'en' ? 'Change Order Type?' : locale === 'zh' ? 'Change Order Type?' : 'เปลี่ยนประเภทการสั่ง?'}
                </h3>
                <p className="mb-6 text-xs font-bold text-neutral-500 leading-relaxed max-w-[280px] mx-auto">
                  {locale === 'en' ? 'You have items in the cart or an active order. Are you sure you want to switch to ' : locale === 'zh' ? 'You have items in the cart or an active order. Are you sure you want to switch to ' : 'คุณมีรายการสินค้าในตะกร้าหรือกำลังแก้ไขบิลอยู่ คุณแน่ใจหรือไม่ที่จะเปลี่ยนประเภทเป็น '}
                  <span className="text-[#D3202B]">
                    {pendingOrderTypeSwitch === 'dine_in' ? (locale === 'en' ? 'Dine-In' : 'Dine-In') : pendingOrderTypeSwitch === 'takeaway' ? (locale === 'en' ? 'Takeaway' : 'Takeaway') : (locale === 'en' ? 'Delivery' : 'Delivery')}
                  </span>?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      const newType = pendingOrderTypeSwitch;
                      setOrderType(newType);
                      if (newType !== 'dine_in') {
                          setSelectedTable(null);
                      }
                      if (newType === 'delivery') {
                          setDraftDeliveryPlatform('');
                          setDraftPlatformOrderId(platformOrderId || '');
                          setCurrentRightPanel('delivery_platform');
                      }
                      setPendingOrderTypeSwitch(null);
                      
                      // Auto-update db if editing
                      if (editingOrderId) {
                          if (newType !== 'dine_in') {
                              await supabase.from('pos_orders').update({ order_type: newType, table_id: null, table_number: null }).eq('id', editingOrderId);
                              if (selectedTable?.id) {
                                  await supabase.from('pos_tables').update({ status: 'available' }).eq('id', selectedTable.id);
                              }
                              fetchTables();
                              refreshPendingOrders();
                          } else {
                              // They are switching to dine_in, open table modal to pick a table
                              handleSwitchTab('table_select');
                          }
                      }
                    }}
                    className="w-full rounded-2xl bg-[#D3202B] py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
                  >
                    {locale === 'en' ? 'Yes, change type' : locale === 'zh' ? 'Yes, change type' : 'ยืนยันการเปลี่ยนประเภท'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingOrderTypeSwitch(null)}
                    className="w-full py-2 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {locale === 'en' ? 'Cancel' : locale === 'zh' ? 'Cancel' : 'ยกเลิก'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TABLE ACTION MODAL (Moved from left panel to right panel) */}
        <AnimatePresence>
          {tableActionTarget && (
            <div className="absolute inset-0 z-[100] flex items-end justify-center font-bold p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm lg:rounded-[2rem]"
                onClick={() => setTableActionTarget(null)}
              />
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-full bg-white p-6 rounded-[2rem] text-center shadow-2xl border border-neutral-100/50 z-10"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <ArrowRight size={28} />
                </div>
                <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-neutral-800">
                  จัดการบิล
                </h3>
                <p className="mb-6 text-xs font-bold text-neutral-500 leading-relaxed mx-auto">
                  โต๊ะ <span className="text-neutral-800">{selectedTable?.table_number}</span>
                  {' → '}
                  โต๊ะ <span className="text-[#D3202B]">{tableActionTarget.table_number}</span>
                </p>
                
                <div className="flex flex-col gap-2">
                  {(tables.find((t: any) => t.id === tableActionTarget.id)?.status === 'occupied' ||
                    pendingOrders.some((o: any) => o.table_id === tableActionTarget.id && o.status === 'pending')) ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          const targetOrder = suspendedOrders.find((o: any) => o.table_id === tableActionTarget.id && o.status === 'pending');
                          if (!targetOrder) { alert('ไม่พบบิลของโต๊ะปลายทาง'); return; }
                          setIsProcessing(true); setCheckoutError(null);
                          (async () => {
                            try {
                              const { data: oldOrderData } = await supabase.from('pos_orders').select('*').eq('id', editingOrderId).single();
                              if (oldOrderData) {
                                const mergedTableNumber = targetOrder.table_number?.includes(oldOrderData.table_number) ? targetOrder.table_number : `${targetOrder.table_number} + ${oldOrderData.table_number}`;
                                await supabase.from('pos_orders').update({ subtotal: Number(targetOrder.subtotal||0)+Number(oldOrderData.subtotal||0), tax: Number(targetOrder.tax||0)+Number(oldOrderData.tax||0), service_charge: Number(targetOrder.service_charge||0)+Number(oldOrderData.service_charge||0), total: Number(targetOrder.total||0)+Number(oldOrderData.total||0), table_number: mergedTableNumber }).eq('id', targetOrder.id);
                              }
                              const { data: currentItems } = await supabase.from('pos_order_items').select('*').eq('order_id', editingOrderId);
                              if (currentItems?.length) {
                                await supabase.from('pos_order_items').upsert(currentItems.map((item: any) => ({ ...item, order_id: targetOrder.id, selected_modifiers: [...(item.selected_modifiers||[]), { name: `[ย้ายมาจากโต๊ะ ${selectedTable?.table_number||'เดิม'}]`, price_adjustment: 0, qty: 1 }] })));
                              }
                              await supabase.from('pos_orders').update({ status: 'cancelled' }).eq('id', editingOrderId);
                              if (selectedTable?.id) { await supabase.from('pos_tables').update({ parent_table_id: tableActionTarget.id }).eq('id', selectedTable.id); }
                              fetchTables(); refreshPendingOrders(); resetDeliveryDraft();
                              setTableActionTarget(null); handleSwitchTab('terminal');
                            } catch (err: any) { alert('Error: ' + err.message); } finally { setIsProcessing(false); }
                          })();
                        }}
                        className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-500 py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Merge size={15} />}
                        รวมบิลเข้าด้วยกัน
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetOrder = suspendedOrders.find((o: any) => o.table_id === tableActionTarget.id && o.status === 'pending');
                          setSelectedTable(tableActionTarget); setOrderType('dine_in'); resetDeliveryDraft();
                          setTableActionTarget(null); handleSwitchTab('terminal');
                          if (targetOrder) handleResumeOrder(targetOrder);
                        }}
                        className="flex items-center justify-center gap-2 w-full rounded-2xl bg-neutral-100 py-3.5 text-[12px] font-black uppercase tracking-widest text-neutral-800 shadow-sm active:scale-95 transition-all"
                      >
                        <Eye size={15} /> สลับไปดูบิลโต๊ะนี้
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setIsProcessing(true); setCheckoutError(null);
                        (async () => {
                          try {
                            await supabase.from('pos_orders').update({ table_id: tableActionTarget.id, table_number: tableActionTarget.table_number }).eq('id', editingOrderId);
                            if (selectedTable?.id) { await supabase.from('pos_tables').update({ parent_table_id: null }).eq('id', selectedTable.id); }
                            fetchTables(); refreshPendingOrders();
                            setSelectedTable(tableActionTarget); setTableActionTarget(null); handleSwitchTab('terminal');
                          } catch (err: any) { alert('Error: ' + err.message); } finally { setIsProcessing(false); }
                        })();
                      }}
                      className="flex items-center justify-center gap-2 w-full rounded-2xl bg-amber-500 py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                      ย้ายบิลมาโต๊ะนี้
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTableActionTarget(null)}
                    className="w-full py-2 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>



      {/* 6. CUSTOMER SELECTION MODAL */}
      {showCustomerModal && (
        <POSCustomerSelect
          onSelect={c => {
            setSelectedCustomer(c)
            setShowCustomerModal(false)
          }}
          selectedCustomer={selectedCustomer}
          onClose={() => setShowCustomerModal(false)}
          onManage={() => onSetView('members')}
          shopSettings={shopSettings}
        />
      )}

      {/* 7. POINT GENERATOR MODAL */}
      {showPointModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPointModal(false)}
          ></div>
          <div className="animate-in zoom-in-95 relative w-full max-w-xl duration-200">
            <PointGenerator onClose={() => setShowPointModal(false)} />
          </div>
        </div>
      )}
      
      {showHistoryPointModalForCurrentOrder && (
        <POSHistoryPointsModal
          order={{ id: currentPointOrderId || editingOrderId, total_amount: cartTotal }}
          shopSettings={shopSettings}
          onClose={() => {
            setShowHistoryPointModalForCurrentOrder(false)
            setCurrentPointOrderId(null)
          }}
          onSuccess={() => {
            setShowHistoryPointModalForCurrentOrder(false)
            setCurrentPointOrderId(null)
          }}
        />
      )}





      {/* PAYMENT OPTIONS EMBEDDED IN RIGHT PANEL */}
            {showSplitPaymentModal && (
        <POSSplitPaymentModal
          cart={cart}
          cartTotal={cartTotal}
          remainingTotal={remainingTotal}
          isProcessing={isProcessing}
          onClose={() => setShowSplitPaymentModal(false)}
          handleProcessPayment={async (method: string, amount: number) => {
             return await handleProcessPayment(method, amount);
          }}
          onFinishOrder={() => {
             setShowSplitPaymentModal(false);
             resetOrderComposer();
          }}
          activePrintData={activePrintData}
          shopSettings={shopSettings}
        />
      )}
      
      {/* 10. MODIFIER SELECTION MODAL - PREMIUM REDESIGN */}
      {/* MENU ITEM OPTIONS MODAL */}
      {optionsModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOptionsModalItem(null)}></div>
          <div className="relative w-full max-w-[320px] bg-white rounded-[2rem] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col items-center text-center font-bold">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-5"></div>
            <h3 className="text-[19px] font-black text-[#1A1A18] leading-tight px-4">{getPrimaryMenuName(optionsModalItem)}</h3>
            
            <div className="w-full mt-6 flex flex-col gap-3">
              {canToggleStock ? (
                <>
                  {optionsModalItem.in_stock === false ? (
                    <button
                      onClick={() => {
                        toggleItemStock(optionsModalItem)
                        setOptionsModalItem(null)
                      }}
                      className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold transition-all bg-[#D3202B] text-white hover:bg-[#B91C1C] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]"
                    >
                      <Power size={20} strokeWidth={2.5} />
                      <span className="text-[15px]">{locale === 'en' ? 'Mark as Available' : locale === 'zh' ? '标记为有货' : 'เปิดขายเมนูนี้'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          toggleItemStock(optionsModalItem, 'today')
                          setOptionsModalItem(null)
                        }}
                        className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-bold transition-all bg-orange-50 text-orange-600 hover:bg-orange-100"
                      >
                        <Power size={18} strokeWidth={2.5} />
                        <span className="text-[14px]">{locale === 'en' ? 'Close for Today (Auto-open tomorrow)' : 'ปิดวันนี้ (พรุ่งนี้เปิดอัตโนมัติ)'}</span>
                      </button>
                      <button
                        onClick={() => {
                          toggleItemStock(optionsModalItem, 'indefinite')
                          setOptionsModalItem(null)
                        }}
                        className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Power size={18} strokeWidth={2.5} />
                        <span className="text-[14px]">{locale === 'en' ? 'Close Indefinitely' : 'ปิดชั่วคราว (จนกว่าจะเปิดเอง)'}</span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-[#1A1A18]/50 text-[13px] py-4 bg-gray-50 rounded-2xl font-medium">
                  {locale === 'en' ? 'You do not have permission to edit stock.' : locale === 'zh' ? '您没有权限编辑库存。' : 'คุณไม่มีสิทธิ์เปิด/ปิดสต็อก'}
                </div>
              )}
              <button
                onClick={() => setOptionsModalItem(null)}
                className="w-full py-3.5 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-[#1A1A18] transition-all text-[15px] font-medium"
              >
                {locale === 'en' ? 'Cancel' : locale === 'zh' ? '取消' : 'ปิดหน้าต่าง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER PIN AUTHORIZATION MODAL */}
      {/* CASH PAYMENT MODAL */}
      {showCashPaymentModal && !paymentSuccessData && (
        <div className="fixed inset-0 z-[2800] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A18]/40 backdrop-blur-md" onClick={() => !isProcessing && setShowCashPaymentModal(false)}></div>
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in fade-in zoom-in-95 p-8 flex flex-col font-bold rounded-[2rem]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-[#1A1A18]">{locale === 'en' ? 'ชำระเงินสด (CASH)' : locale === 'zh' ? 'ชำระเงินสด (CASH)' : 'ชำระเงินสด (CASH)'}</h3>
              {!isProcessing && (
                <button onClick={() => setShowCashPaymentModal(false)} className="text-gray-400 hover:text-[#1A1A18] transition-all bg-gray-50 hover:bg-gray-100 rounded-full p-2">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="flex justify-between items-center p-5 bg-white rounded-[1.25rem] border border-gray-100 mb-6 shadow-sm">
              <span className="text-sm font-black text-gray-500 uppercase tracking-widest">{locale === 'en' ? 'ยอดที่ต้องชำระ' : locale === 'zh' ? 'ยอดที่ต้องชำระ' : 'ยอดที่ต้องชำระ'}</span>
              <span className="text-3xl font-black text-emerald-600 tracking-tighter">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}{cartTotal.toLocaleString()}</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">{locale === 'en' ? 'รับเงินมา (Received)' : locale === 'zh' ? 'รับเงินมา (Received)' : 'รับเงินมา (Received)'}</label>
                <button 
                  onClick={() => setCashReceived('')}
                  className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all"
                >
                  {locale === 'en' ? 'Clear' : 'ล้าง'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">฿</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full h-16 pl-12 pr-6 text-2xl font-black bg-gray-50 border-2 border-transparent outline-none focus:border-[#1A1A18] focus:bg-white rounded-[1.25rem] transition-all"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-8">
              <button onClick={() => setCashReceived(cartTotal.toString())} className="h-14 bg-white hover:bg-black hover:text-white text-[#1A1A18] rounded-[1rem] font-black transition-all border border-gray-100 active:scale-95 flex flex-col items-center justify-center">
                <span className="text-xs uppercase">{locale === 'en' ? 'พอดี' : 'พอดี'}</span>
              </button>
              <button onClick={() => setCashReceived(prev => (Number(prev || 0) + 100).toString())} className="h-14 bg-white hover:bg-[#1A1A18] hover:text-white text-[#1A1A18] rounded-[1rem] font-black transition-all border border-gray-100 active:scale-95 flex flex-col items-center justify-center">
                <span className="text-sm">+100</span>
              </button>
              <button onClick={() => setCashReceived(prev => (Number(prev || 0) + 500).toString())} className="h-14 bg-white hover:bg-[#1A1A18] hover:text-white text-[#1A1A18] rounded-[1rem] font-black transition-all border border-gray-100 active:scale-95 flex flex-col items-center justify-center">
                <span className="text-sm">+500</span>
              </button>
              <button onClick={() => setCashReceived(prev => (Number(prev || 0) + 1000).toString())} className="h-14 bg-white hover:bg-[#1A1A18] hover:text-white text-[#1A1A18] rounded-[1rem] font-black transition-all border border-gray-100 active:scale-95 flex flex-col items-center justify-center">
                <span className="text-sm">+1000</span>
              </button>
            </div>

            <button
              disabled={isProcessing || !cashReceived || Number(cashReceived) < cartTotal}
              onClick={async () => {
                const received = Number(cashReceived);
                if (received < cartTotal) {
                  alert('รับเงินมาไม่ครบยอดชำระ');
                  return;
                }
                await handleProcessPayment('cash', currentPaymentAmount);
              }}
              className="w-full h-[60px] bg-[#1A1A18] text-white rounded-[1.25rem] font-black tracking-widest uppercase hover:bg-black hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative"
            >
              {isProcessing ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {!isProcessing && cashReceived && Number(cashReceived) >= cartTotal && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                  )}
                  <span>{locale === 'en' ? 'Confirm Payment' : 'ยืนยันชำระเงิน'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

            {/* MEMBER CHECKOUT FLOW MODAL REMOVED - NOW IN LEFT PANEL */}
      {/* DELIVERY CHECKOUT MODAL */}
      <AnimatePresence>
        {showDeliveryCheckoutModal && (
          <div className="fixed inset-0 z-[2550] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeliveryCheckoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-[1] w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Delivery Flow</div>
                    <h3 className="mt-1 text-2xl font-black text-[#1A1A18]">ยืนยันออเดอร์เดลิเวอรี่</h3>
                  </div>
                  <button
                    onClick={() => setShowDeliveryCheckoutModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 hover:text-black active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Delivery Platform & Order ID (optional preview, click to edit) */}
                  <div
                    style={{
                      backgroundColor: deliveryPlatform ? (platformBranding[deliveryPlatform] || {}).lightBg || '#F9FAFB' : '#FFF7ED',
                      borderColor: deliveryPlatform ? ((platformBranding[deliveryPlatform] || {}).brand + '20' || '#E5E7EB') : '#FED7AA',
                    }}
                    className="rounded-2xl border-2 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">แพลตฟอร์ม & รหัสออเดอร์</label>
                      <button
                        onClick={() => {
                          setDraftDeliveryPlatform(deliveryPlatform || '');
                          setDraftPlatformOrderId(platformOrderId || '');
                          setShowDeliveryCheckoutModal(false);
                          setCurrentRightPanel('delivery_platform');
                        }}
                        style={{ color: deliveryPlatform ? (platformBranding[deliveryPlatform] || {}).brand || '#F97316' : '#F97316' }}
                        className="text-[10px] font-black"
                      >
                        แก้ไข
                      </button>
                    </div>
                    {deliveryPlatform && platformOrderId ? (
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: '#FFFFFF' }}
                          className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
                        >
                          <Truck size={16} style={{ color: (platformBranding[deliveryPlatform] || {}).brand || '#1A1A18' }} />
                        </div>
                        <div>
                          <div
                            style={{ color: (platformBranding[deliveryPlatform] || {}).text || '#1A1A18' }}
                            className="text-sm font-black uppercase"
                          >
                            {formatDeliveryPlatformLabel(deliveryPlatform)}
                          </div>
                          <div className="text-[11px] font-bold text-gray-500 font-mono tracking-widest">#{platformOrderId}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                          <AlertCircle size={16} />
                        </div>
                        <button
                          onClick={() => openDeliveryPlatformModal(activeDeliveryPlatforms[0] || 'grab')}
                          className="text-sm font-black text-orange-500 hover:text-orange-600 text-left"
                        >
                          ยังไม่ได้ระบุข้อมูล<br/>
                          <span className="text-[10px] text-orange-400">คลิกเพื่อระบุค่ายและรหัส</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Story Mode Selection */}
                  {(shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">เลือกข้อความท้ายบิล</label>
                      <div className="relative group">
                        <select
                          value={selectedStoryIndex}
                          onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                          className="w-full h-14 pl-5 pr-12 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-bold text-[#1A1A18] outline-none hover:border-gray-200 focus:border-[#1A1A18] focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value={-1}>🎲 สุ่มข้อความ (Random Message)</option>
                          {(shopSettings?.receipt_stories || shopSettings?.opening_hours?.receipt_stories || []).map((story: any, idx: number) => (
                            <option key={idx} value={idx}>📖 {story.title}</option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-6 sm:p-8">
                <button
                  onClick={async () => {
                    if (!deliveryPlatform || !platformOrderId.trim()) {
                      alert('กรุณาระบุแพลตฟอร์มและรหัสออเดอร์ก่อนยืนยันครับ')
                      return
                    }
                    await handleProcessPayment('delivery')
                    setShowDeliveryCheckoutModal(false)
                  }}
                  disabled={isProcessing}
                  className="relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-[13px] font-black uppercase tracking-widest text-white shadow-[0_8px_20px_-8px_rgba(249,115,22,0.5)] transition-all hover:bg-orange-600 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยัน และ ปริ้นใบเสร็จ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* MERGE MODAL */}
      {mergeTableTarget && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center font-bold">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMergeTableTarget(null)}></div>
          <div className="animate-in zoom-in-95 relative w-[90%] max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
              <ShoppingBag size={32} />
            </div>
            <h3 className="mb-2 text-2xl font-black uppercase tracking-tight text-gray-900">
              {locale === 'en' ? 'Merge with Table?' : locale === 'zh' ? 'Merge with Table?' : 'รวมรายการเข้าโต๊ะ?'}
            </h3>
            <p className="mb-8 text-sm font-bold text-gray-500">
              {locale === 'en' ? 'Table ' : locale === 'zh' ? 'Table ' : 'โต๊ะ '}{mergeTableTarget.table.name} {locale === 'en' ? ' already has an open order. Do you want to add your ' : locale === 'zh' ? ' already has an open order. Do you want to add your ' : ' มีออเดอร์ค้างอยู่แล้ว คุณต้องการนำรายการที่เลือกไว้ '}{cart.length} {locale === 'en' ? ' items to it?' : locale === 'zh' ? ' items to it?' : ' รายการ ไปรวมในบิลนี้เลยหรือไม่?'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setSelectedTable(mergeTableTarget.table)
                  setCurrentRightPanel('cart')
                  handleResumeOrder(mergeTableTarget.pendingOrder, true)
                  setMergeTableTarget(null)
                }}
                className="w-full rounded-2xl bg-[#1A1A18] py-4 text-[13px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {locale === 'en' ? 'Merge items' : locale === 'zh' ? 'Merge items' : 'ยืนยันการรวมบิล (Merge)'}
              </button>
              <button
                onClick={() => {
                  setSelectedTable(mergeTableTarget.table)
                  setCurrentRightPanel('cart')
                  handleResumeOrder(mergeTableTarget.pendingOrder, false)
                  setMergeTableTarget(null)
                }}
                className="w-full rounded-2xl bg-gray-100 py-4 text-[13px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-200"
              >
                {locale === 'en' ? 'Discard new items & view table' : locale === 'zh' ? 'Discard new items & view table' : 'ทิ้งรายการใหม่ & ดูบิลเดิม'}
              </button>
              <button
                onClick={() => setMergeTableTarget(null)}
                className="w-full py-2 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
              >
                {locale === 'en' ? 'Cancel' : locale === 'zh' ? 'Cancel' : 'ยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* GLOBAL PAYMENT SUCCESS MODAL REMOVED - NOW IN LEFT PANEL */}
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

      <POSPromotionsModal 
        isOpen={showPromotionsModal}
        onClose={() => setShowPromotionsModal(false)}
        onPromotionsChanged={fetchPromotions}
        shopSettings={shopSettings}
      />

      {/* GLOBAL PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          @page { size: 80mm auto; margin: 0; }
          html, body {
            background: transparent !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* FLYING ANIMATIONS */}
      <AnimatePresence>
        {flyingItems.map((fi) => {
          let targetX = window.innerWidth / 2;
          let targetY = window.innerHeight;

          const desktopPanel = document.getElementById('desktop-cart-panel');
          const mobileBtn = document.getElementById('mobile-cart-button');

          if (window.innerWidth >= 1024 && desktopPanel) { // lg breakpoint
            const rect = desktopPanel.getBoundingClientRect();
            targetX = rect.left + 40; 
            targetY = rect.top + 80;
          } else if (mobileBtn && mobileBtn.offsetParent !== null) {
            const rect = mobileBtn.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
          }

          return (
            <motion.div
              key={fi.id}
              initial={{ x: fi.x, y: fi.y, scale: 1, opacity: 1 }}
              animate={{ x: targetX, y: targetY, scale: 0.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed z-[9999] pointer-events-none rounded-full shadow-2xl overflow-hidden"
              style={{ 
                width: '60px', 
                height: '60px', 
                marginTop: '-30px', 
                marginLeft: '-30px',
                backgroundColor: fi.imageUrl ? 'transparent' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {fi.imageUrl ? (
                <img loading="lazy" crossOrigin="anonymous"  src={fi.imageUrl || ''} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-4 h-4 bg-black rounded-full" />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      <POSRecipeViewModal
        isOpen={!!selectedRecipeItem}
        onClose={() => setSelectedRecipeItem(null)}
        item={selectedRecipeItem}
        orderType={orderType}
      />

      {/* 🔔 Real-time Member Check-in Alert Modal */}
      <AnimatePresence>
        {memberCheckIns.length > 0 && (
          <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
            {/* Backdrop with soft blur */}
            <div className="absolute inset-0 bg-[#0A0A0A]/40 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white text-[#1A1A18] rounded-[2rem] w-full max-w-4xl shadow-2xl border border-gray-100/50 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden font-sans z-10"
            >
              {/* Left Column: Customer Profile & Current Cart */}
              <div className="w-full md:w-[380px] p-8 flex flex-col items-center justify-between shrink-0">
                <div className="w-full flex flex-col items-center text-center">
                  {/* Alert icon */}
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 relative shrink-0">
                    <QrCode size={28} className="text-emerald-600 animate-pulse" />
                    <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                    </span>
                  </div>

{/* Removed Title */}

                  {/* Customer Card */}
                  <div className="w-full bg-gray-50 border border-[#F0F0E8] rounded-2xl p-4 flex items-center gap-3.5 mb-6 text-left">
                    {memberCheckIns[0].customer_image ? (
                      <img 
                        src={memberCheckIns[0].customer_image} 
                        alt="Customer" 
                        crossOrigin="anonymous"
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 font-bold shrink-0">
                        {memberCheckIns[0].customer_name?.[0] || 'M'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-gray-900 truncate">
                        {memberCheckIns[0].customer_name}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        LINE Member
                      </p>
                    </div>
                  </div>

                  {/* Current Cart Match Section */}
                  <div className="w-full border border-dashed border-gray-200 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        ตะกร้าปัจจุบัน (Active Cart)
                      </span>
                      {cart.length > 0 ? (
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)} รายการ
                        </span>
                      ) : (
                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          ว่างเปล่า
                        </span>
                      )}
                    </div>
                    {cart.length > 0 ? (
                      <div className="text-left mb-4">
                        <span className="text-2xl font-black text-gray-900">
                          ฿{cart.reduce((sum, item) => sum + (getEffectiveItemUnitPrice(item) * item.quantity), 0).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium text-left mb-4">
                        ยังไม่มีสินค้าในตะกร้า เริ่มเพิ่มสินค้าหรือผูกกับบิลค้างด้านขวา
                      </p>
                    )}

                    <button
                      onClick={() => handleLinkCheckIn(memberCheckIns[0])}
                      disabled={cart.length === 0}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 disabled:scale-100 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>ผูกกับบิลปัจจุบัน</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleRejectCheckIn(memberCheckIns[0])}
                  className="w-full py-3.5 text-gray-400 hover:text-red-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all text-center"
                >
                  ปฏิเสธการเช็คอิน
                </button>
              </div>

            {/* Right Column: List of Held/Pending Orders */}
            <div className="flex-1 p-8 flex flex-col min-w-0">
                <div className="mb-4">
                  <h4 className="text-sm font-black text-gray-900 tracking-tight">
                    หรือผูกกับบิลที่เปิดค้างไว้
                  </h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    Select open bill to link points
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-2">
                  {pendingOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-300 mb-3">
                        <ShoppingBag size={20} />
                      </div>
                      <p className="text-xs text-gray-400 font-bold">ไม่มีบิลค้างในระบบขณะนี้</p>
                    </div>
                  ) : (
                    pendingOrders.map((order: any) => {
                      const itemCount = (order.pos_order_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
                      const itemSummary = (order.pos_order_items || [])
                        .map((item: any) => `${item.quantity}x ${item.item?.name || item.name || 'สินค้า'}`)
                        .join(', ');

                      return (
                        <div 
                          key={order.id} 
                          className="bg-gray-50 border border-[#F0F0E8] hover:border-emerald-300 hover:bg-emerald-50/20 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-black text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                                #{String(order.queue_number || 0).padStart(3, '0')}
                              </span>
                              {order.table_number && (
                                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  โต๊ะ {order.table_number}
                                </span>
                              )}
                              {order.order_number && (
                                <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5">
                                  {order.order_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium truncate max-w-md font-sans">
                              {itemSummary || 'ไม่มีรายการสินค้า'}
                            </p>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-4">
                            <div>
                              <div className="text-sm font-black text-gray-900">
                                ฿{Number(order.net_total || order.total_amount || 0).toLocaleString()}
                              </div>
                              <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                {itemCount} รายการ
                              </div>
                            </div>
                            <button
                              onClick={() => handleLinkCheckInToOrder(memberCheckIns[0], order)}
                              className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                            >
                              ผูกบิลนี้
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
