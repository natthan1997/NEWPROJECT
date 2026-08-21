'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getDeliveryPlatformBadge } from './POSHistory'

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



export default function POSTerminalPortrait({ state, props }: { state: any, props: any }) {
  const { locale } = useI18n();
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

  useEffect(() => {
    if (modifierModalItem) {
      setIsCartExpanded(true);
    }
  }, [modifierModalItem, setIsCartExpanded]);

  return (
    <div className="relative flex flex-1 flex-col lg:flex-row bg-white font-bold overflow-hidden h-full min-h-0">
      {/* LEFT CONTENT: Categories & Grid */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white relative">
      {/* 2. ORDER TYPE & CATEGORIES */}
      {!(
        editingOrderId && pendingOrders.find(o => o.id === editingOrderId)?.order_source === 'liff'
      ) && (
        <div className="flex flex-shrink-0 flex-col bg-white z-10 relative">
          <div className="flex items-center gap-4 bg-white px-6 py-4 border-b border-gray-100">
            {/* Hamburger Menu & Table Select */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => {/* Hamburger action placeholder */}}
                className="flex items-center justify-center w-11 h-11 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <MenuIcon size={20} />
              </button>
              
              <button
                onClick={() => {
                   fetchTables()
                   refreshPendingOrders()
                   setShowTableModal(true)
                }}
                className={`flex items-center h-11 gap-3 border px-5 transition-all rounded-xl ${selectedTable || orderType === 'takeaway' ? 'border-[#1A1A18] bg-[#1A1A18] text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <Users size={16} />
                <span className="text-[13px] font-bold">
                  {orderType === 'takeaway'
                    ? 'Takeaway'
                    : selectedTable
                      ? `T-${selectedTable.table_number}`
                      : 'เลือกโต๊ะ'}
                </span>
                <ChevronDown size={14} className="ml-1 opacity-50" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative group flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors"
              />
              <input
                type="text"
                placeholder={locale === 'en' ? 'ค้นหาเมนู...' : locale === 'zh' ? 'ค้นหาเมนู...' : 'ค้นหาเมนู...'}
                className="w-full bg-white border border-gray-200 h-11 rounded-xl pl-12 pr-4 text-[13px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* View Toggles */}
            <div className="flex items-center border border-gray-200 bg-white p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#D3202B] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#D3202B] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="relative flex items-center h-[70px] border-b border-gray-100 bg-white">
            <div
              ref={categoryScrollRef}
              className="no-scrollbar flex flex-1 items-center gap-3 overflow-x-auto px-6"
            >
              <button
                onClick={() => setActiveCategoryId(null)}
                className={`flex-shrink-0 h-10 px-6 text-[12px] font-bold uppercase transition-all rounded-full border ${!activeCategoryId || activeCategoryId === 'all' ? 'bg-[#D3202B] text-white border-[#D3202B]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-black'}`}
              >
                {locale === 'en' ? 'ทั้งหมด' : locale === 'zh' ? 'ทั้งหมด' : 'ทั้งหมด'}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex-shrink-0 h-10 px-6 text-[12px] font-bold uppercase transition-all rounded-full border ${activeCategoryId === cat.id ? 'bg-[#D3202B] text-white border-[#D3202B]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-black'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOTION STATE OVERLAY - Replaces the box banner */}
      {activeCoupon && activeCoupon.discount_type === 'free_item' && (
        <motion.div 
          className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Subtle Orange Glowing Edge Border */}
          <motion.div 
            className="absolute inset-0 border-[2px] border-orange-500/50 shadow-[inset_0_0_20px_rgba(249,115,22,0.15)] pointer-events-none"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />

          {/* Clean Floating Action Text - Moved to bottom (Snackbar style) */}
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
                  {locale === 'en' ? 'Select Free Item' : 'เลือกสินค้าสำหรับรับฟรี'}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 leading-tight">
                  {locale === 'en' ? 'Tap a menu to apply' : 'แตะที่เมนูเพื่อใช้สิทธิ์'}
                </span>
              </div>

              <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

              <span className="text-[11px] font-extrabold text-orange-500 group-hover:text-red-500 transition-colors px-2 uppercase tracking-wide">
                {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}

      <main className="custom-scrollbar flex-1 overflow-y-auto bg-white p-3 sm:p-4 xl:p-6 font-bold min-h-0">
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
                      handlePressCancel() // Cancel long press if clicked quickly
                      if (isLongPressTriggered.current) {
                        e.preventDefault()
                        e.stopPropagation()
                        isLongPressTriggered.current = false
                        return
                      }
                      if (item.in_stock !== false) handleProductClick(e, item)
                    }}
                    disabled={item.in_stock === false}
                    className={`transition-all duration-300 outline-none ${item.in_stock === false ? 'opacity-70 grayscale cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1'} ${viewMode === 'list' ? 'relative w-full h-full flex text-left font-bold border border-[#E5E5DF] bg-white rounded-2xl p-3 sm:p-4 flex-row gap-4 items-center' : 'absolute inset-0 w-full h-full flex text-left font-bold rounded-[0.8rem] overflow-hidden border border-[#E5E5DF]/50 bg-gray-100'}`}
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
                            <div className="relative overflow-hidden rounded-xl bg-gray-50 font-bold transition-all duration-500 shrink-0 h-20 w-20">
                              {item.image_url ? (
                                <img loading="lazy" crossOrigin="anonymous" 
                                  src={item.image_url || ''}
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                  <ImageIcon size={32} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                            </div>
                            <div className="flex flex-1 flex-col justify-between py-1 text-[#1A1A18]">
                              <div>
                                <h4 className="line-clamp-5 text-[13px] sm:text-[14px] font-black uppercase leading-snug tracking-tight text-[#1A1A18]">
                                  {primaryName}
                                </h4>
                                {secondaryName && (
                                  <p className="mt-1 line-clamp-2 text-[10px] sm:text-[11px] font-semibold leading-snug text-[#7B7A74]">
                                    {secondaryName}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-end justify-between border-t border-gray-100 pt-2 mt-2">
                                <span className="text-[14px] sm:text-[15px] font-black text-emerald-600">
                                  {locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{getEffectiveItemUnitPrice(item).toLocaleString()}
                                </span>
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-white">
                                  <Plus size={16} />
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      }

                      // GRID VIEW
                      return (
                        <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden bg-[#2C2B27]">
                          {item.image_url ? (
                            <img loading="lazy" crossOrigin="anonymous" src={item.image_url || ''} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 z-0" />
                          ) : (
                            <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 z-0"><ImageIcon size={48} /></div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 transition-colors duration-300"></div>
                          
                          <div className="relative z-10 h-full flex flex-col justify-end p-3 sm:p-3.5 text-white w-full">
                            <div className="flex flex-col w-full gap-0.5 text-left">
                              <h4 className="line-clamp-2 text-[13.5px] sm:text-[14px] font-black leading-[1.2] text-white tracking-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                                {primaryName}
                              </h4>
                              {secondaryName && (
                                <p className="line-clamp-1 text-[9.5px] sm:text-[10px] font-medium text-white/70 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                                  {secondaryName}
                                </p>
                              )}
                              <div className="flex items-baseline mt-1.5 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                                <span className="text-[15px] sm:text-[16px] font-black text-white/95">฿ {getEffectiveItemUnitPrice(item).toLocaleString()}</span>
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
              <p className="text-sm font-black uppercase tracking-widest">{locale === 'en' ? 'Loading menu...' : locale === 'zh' ? '正在加载菜单...' : 'กำลังโหลดเมนู...'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 py-20">
              <Search size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">{locale === 'en' ? 'ไม่พบรายการที่ค้นหา' : locale === 'zh' ? 'ไม่พบรายการที่ค้นหา' : 'ไม่พบรายการที่ค้นหา'}</p>
            </div>
          )}
        </div>
      </main>
      </div>

      {/* RIGHT CONTENT: CART DRAWER / SPLIT VIEW */}
      <div id="desktop-cart-panel" className={`fixed inset-0 z-[1100] lg:relative lg:inset-auto lg:z-auto flex justify-end font-bold transition-all duration-300 ${isCartExpanded ? 'visible' : 'invisible lg:visible'} lg:w-[340px] xl:w-[400px] lg:flex-shrink-0 lg:border-l lg:border-[#F0F0E8]`}>
        <div
          className={`absolute inset-0 bg-[#3a3a38]/40 backdrop-blur-md lg:hidden transition-opacity duration-300 ${isCartExpanded ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartExpanded(false)}
        ></div>
        <div className={`relative flex h-full w-full flex-col bg-white font-bold shadow-2xl lg:shadow-none transition-transform duration-500 sm:max-w-xl lg:max-w-none ${isCartExpanded ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <AnimatePresence mode="wait">
        {showBillDiscountModal ? (
          <motion.div
            key="bill-discount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
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
        ) : itemDiscountModalItem ? (
          <motion.div
            key="item-discount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
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
        ) : modifierModalItem ? (
          <motion.div
            key="modifiers-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0 font-bold"
          >
            <header className="flex items-center gap-4 border-b border-gray-100 bg-white p-6 sm:p-8 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModifierModalItem(null);
                  setEditingCartItemIndex(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={24} />
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

            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
              {modifierGroups.map((group, gIdx) => {
                const minReq = group.min_selection || group.min_select || 0;
                const maxAllowed = group.max_selection || group.max_select || 99;
                const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === group.id);
                const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0);
                const isComplete = totalQtyInGroup >= minReq;
                const isAtMax = totalQtyInGroup >= maxAllowed;

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="pb-1 border-b border-gray-100/60">
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
                                ? 'bg-emerald-50/50 border-2 border-emerald-500 shadow-sm' 
                                : isAtMax && maxAllowed > 1 
                                  ? 'cursor-not-allowed bg-gray-50 border-2 border-transparent text-gray-400 opacity-60' 
                                  : 'bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-sm active:scale-95'
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
                                  <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-transparent'}`}>
                                    <Check size={11} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </div>
                            <span
                              className={`self-start px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                isSelected 
                                  ? 'bg-emerald-100/80 text-emerald-700' 
                                  : opt.price_adjustment > 0 ? 'bg-gray-50 text-gray-500' : 'text-gray-400'
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
                    <div className={`flex items-center h-12 bg-gray-50 rounded-xl border border-gray-200 p-1 w-28 shrink-0 ${canConfirm ? '' : 'opacity-50 pointer-events-none'}`}>
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
                      disabled={!canConfirm}
                      onClick={() => {
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
                      className={`relative flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-black uppercase tracking-wider transition-all overflow-hidden ${
                        canConfirm 
                          ? 'bg-[#D3202B] text-white hover:bg-[#B91C1C] hover:shadow-md active:scale-95' 
                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                      }`}
                    >
                      {canConfirm && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                      )}
                      <span>{canConfirm ? 'ยืนยัน' : `ขาดอีก ${incomplete.length} หมวด`}</span>
                      {canConfirm && <ArrowRight size={14} />}
                    </button>
                  </div>
                );
              })()}
            </footer>
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
            <div className="flex w-full items-center justify-between">
              <motion.h3 
                animate={isCartBumping ? { x: [-3, 3, -3, 3, 0], scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 text-[22px] font-black uppercase tracking-tight text-gray-900"
              >
                <span>{locale === 'en' ? 'Order list' : locale === 'zh' ? '订单清单' : 'รายการสั่งซื้อ'}</span>
                {editingOrderNumber && (
                  <span className="bg-[#1A1A18] px-3 py-1 font-mono text-[10px] text-white rounded-md">
                    {editingOrderNumber}
                  </span>
                )}
              </motion.h3>
              <div className="flex items-center gap-3">
                {(editingOrderId || cart.length > 0 || !!selectedTable) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (editingOrderId && cart.length === 0) {
                        await handleDeleteOrder(editingOrderId);
                      }
                      resetOrderComposer();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors"
                    title={locale === 'en' ? 'Exit active held bill and start a new order' : 'ล้างตะกร้า / เริ่มสั่งรายการใหม่'}
                  >
                    <Undo2 size={18} />
                  </button>
                )}
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors"
                  title="History"
                >
                  <History size={18} />
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors"
                  title="Delivery"
                >
                  <Truck size={18} />
                </button>
                <button
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
                      setShowTableModal(true);
                  } else if (editingOrderId) {
                      setPendingOrderTypeSwitch('dine_in');
                  } else {
                      setOrderType('dine_in');
                      fetchTables();
                      setShowTableModal(true);
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
                      openDeliveryPlatformModal();
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
                    onClick={() => openDeliveryPlatformModal()}
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

            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6 transition-all sm:p-10">

              {cart.length > 0 ? (
                cart.map((item, idx) => (
                    <div
                      key={idx}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setItemDiscountModalItem(item);
                      }}
                      className="animate-in slide-in-from-right group flex gap-4 duration-300 py-2 border-b border-gray-100 last:border-0"
                    >
                      {/* Left: Thumbnail */}
                      <div 
                        className="relative h-20 w-20 shrink-0 overflow-hidden bg-gray-100 cursor-pointer rounded-lg"
                        onClick={() => openEditCartItem(idx)}
                      >
                        {item.image_url ? (
                          <img loading="lazy" crossOrigin="anonymous" 
                            src={item.image_url || ''}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>

                      {/* Right: Details & Actions */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="cursor-pointer" onClick={() => openEditCartItem(idx)}>
                            <h4 className="text-[14px] font-black text-gray-900 leading-tight mb-0.5">
                              {getPrimaryMenuName(item)}
                            </h4>
                            {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                              <p className="text-[11px] font-bold text-gray-400">
                                {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                              </p>
                            )}
                            <p className="text-[12px] font-bold text-gray-400 mt-0.5">
                              ฿ {getEffectiveItemUnitPrice(item).toLocaleString()}
                            </p>
                            {item.customer_name && (
                              <div className="text-[10px] font-bold text-emerald-500 mt-1">
                                👤 {item.customer_name}
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setSelectedRecipeItem(item)}
                              className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                              title="ดูสูตรอาหาร"
                            >
                              <FlaskConical size={16} />
                            </button>
                            <button
                              onClick={() => setItemDiscountModalItem(item)}
                              className="p-1.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                              title="เพิ่มส่วนลด / โปรโมชั่น"
                            >
                              <Tag size={16} />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id, item.selected_modifiers, item.is_free_coupon_item)}
                              className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                              title="ลบรายการ"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Row: Controls & Total Price & Modifiers */}
                        <div className="mt-2 flex items-end justify-between">
                          <div className="flex items-center border border-gray-200 rounded-md bg-white">
                            <button
                              onClick={() => updateQuantity(item.id, -1, item.selected_modifiers, item.is_free_coupon_item)}
                              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-[13px] font-black text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1, item.selected_modifiers, item.is_free_coupon_item)}
                              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                              {item.discount_amount && item.discount_amount > 0 ? (
                                <span className="text-[11px] font-bold text-gray-400 line-through">
                                  ฿ {((getEffectiveItemUnitPrice(item) + (item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0)) * item.quantity).toLocaleString()}
                                </span>
                              ) : null}
                              <span className="text-[16px] font-black text-gray-900">
                                ฿ {(
                                  ((getEffectiveItemUnitPrice(item) +
                                    (item.selected_modifiers?.reduce(
                                      (a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)),
                                      0
                                    ) || 0)) *
                                  item.quantity) - (item.discount_amount || 0)
                                ).toLocaleString()}
                              </span>
                            </div>
                            
                            {item.discount_amount && item.discount_amount > 0 && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[10px] font-bold text-red-500">
                                  ส่วนลด: ฿{item.discount_amount.toLocaleString()} {item.discount_reason && `(${item.discount_reason})`}
                                </span>
                              </div>
                            )}

                            {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                              <div className="mt-2 flex flex-col items-end gap-1">
                                {item.selected_modifiers.map((m: any) => (
                                  <span
                                    key={m.id}
                                    className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-sm"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                    {m.qty > 1 ? `${m.qty}x ` : ''}{m.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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

                        <footer className="border-t border-gray-100 bg-white p-6 sm:p-8 flex flex-col gap-6">
              {/* COLLAPSIBLE TOGGLE */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300">
                <div
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-400">
                      <ChevronDown size={16} className={`transition-transform duration-300 ${isSummaryExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-500">
                      จัดการส่วนลดและภาษี
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-400">
                      ภาษี (7%)
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setHasVat(!hasVat)
                      }}
                      className={`relative h-5 w-9 rounded-full transition-all duration-300 ${hasVat ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    >
                      <div
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${hasVat ? 'translate-x-4' : 'translate-x-0'}`}
                      ></div>
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE SECTION */}
                <div
                  className={`transition-all duration-500 ease-in-out ${isSummaryExpanded ? 'mt-4 max-h-[500px] opacity-100' : 'pointer-events-none max-h-0 opacity-0 overflow-hidden'}`}
                >
                  {/* DISCOUNT SELECTOR */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-gray-900">
                        ส่วนลดทั้งบิล
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBillDiscountInput(discountType === 'percent' ? String(discountRate) : String(discountValue))
                          setBillDiscountModalType(discountType)
                          setBillDiscountReason(discountName || 'โปรโมชั่น/ส่วนลด')
                          setShowBillDiscountModal(true)
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-900 hover:bg-gray-50"
                      >
                        <Tag size={12} className={discountTotalValue > 0 ? "text-emerald-500" : "text-gray-400"} />
                        {discountTotalValue > 0 ? (
                           <span className="text-emerald-600">แก้ไขส่วนลด</span>
                        ) : (
                           <span>เพิ่มส่วนลด</span>
                        )}
                      </button>
                      
                      {discountTotalValue > 0 && (
                        <button
                          onClick={() => {
                            setDiscountRate(0)
                            setDiscountValue(0)
                            setDiscountName('')
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BREAKDOWN */}
                  <div className="flex flex-col gap-2 pt-3 text-[11px] font-bold">
                    <div className="flex justify-between text-gray-500">
                      <span>ยอดรวมสินค้า</span>
                      <span className="text-gray-900">฿ {cartSubTotal.toLocaleString()}</span>
                    </div>

                    {discountTotalValue > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>ส่วนลด ({discountRate}%)</span>
                        <span>- ฿ {discountTotalValue.toLocaleString()}</span>
                      </div>
                    )}

                    {hasVat && (
                      <div className="flex justify-between text-gray-500">
                        <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <span className="text-gray-900">฿ {Math.round(vatAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FINAL TOTAL */}
              <div className="flex items-end justify-between px-2">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-gray-900">
                    ยอดรวมสุทธิ
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">
                    {hasVat ? 'รวมภาษีมูลค่าเพิ่มแล้ว' : 'ยังไม่รวมภาษี'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 text-right">
                  <span className="text-[13px] font-black text-gray-900">THB</span>
                  <span className="text-[32px] font-black leading-none tracking-tighter text-gray-900">
                    {cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendOrder}
                  disabled={isProcessing || isAutoCreatingOrder || cart.length === 0 || isHeldOrderBaselineLoading || (!!editingOrderId && !hasUnsavedOrderChanges)}
                  className="flex h-14 w-[100px] flex-col items-center justify-center gap-1 rounded-2xl border border-gray-200 bg-white text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={20} strokeWidth={2} />
                  <span className="text-[10px] font-bold">{isAutoCreatingOrder ? '...' : isHeldOrderBaselineLoading ? '...' : !!editingOrderId && !hasUnsavedOrderChanges ? 'พักแล้ว' : 'บันทึก'}</span>
                </button>

                {!!editingOrderId && cart.length === 0 ? (
                  <button
                    onClick={() => {
                      handleDeleteOrder(editingOrderId)
                      resetOrderComposer()
                    }}
                    className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    <span className="text-[15px] font-black">เคลียร์โต๊ะ (ยกเลิกบิล)</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (orderType === 'dine_in' && !selectedTable) {
                        fetchTables()
                        refreshPendingOrders()
                        setShowTableModal(true)
                        return
                      }
                      if (orderType === 'delivery') {
                        setShowDeliveryCheckoutModal(true)
                        return
                      }

                      if (selectedCustomer) {
                        setShowPaymentModal(true);
                      } else {
                        setMemberCheckoutStep('lookup');
                        setShowMemberCheckoutFlow(true);
                      }
                    }}
                    disabled={isAutoCreatingOrder || cart.length === 0}
                    className={`flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl text-white transition-all shadow-lg ${
                      (isAutoCreatingOrder || cart.length === 0) ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed' : 'bg-[#D3202B] hover:bg-red-700 shadow-[#D3202B]/30'
                    }`}
                  >
                    <span className="text-[15px] font-black">
                      {orderType === 'delivery' ? 'ยืนยันส่งออเดอร์' : `ทั้งหมด ฿${cartTotal.toLocaleString()}`}
                    </span>
                    {orderType !== 'delivery' && <ArrowRight size={18} strokeWidth={3} />}
                  </button>
                )}
              </div>
            </footer>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
      </div>

      <div className={`fixed inset-0 z-[1150] flex justify-end font-bold transition-all duration-300 ${showDeliveryHub ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-[#3a3a38]/40 backdrop-blur-md transition-opacity duration-300 ${showDeliveryHub ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setShowDeliveryHub(false)}
        ></div>
        <div className={`relative flex h-full w-full max-w-[min(100vw,560px)] flex-col bg-white font-bold shadow-2xl transition-transform duration-500 ${showDeliveryHub ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="min-h-0 flex-1">
            <DeliveryManager
              unlockAudio={unlockAudio}
              isAudioEnabled={isAudioEnabled}
              variant="drawer"
              syncPulse={syncPulse}
              onClose={() => setShowDeliveryHub(false)}
              onStatusChange={refreshPendingOrders}
            />
          </div>
        </div>
      </div>

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

      {/* 7. TABLE SELECTION MODAL */}
      
      {showTableModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTableModal(false)}
          ></div>
          <div className="animate-in zoom-in-95 relative flex h-[80vh] max-h-[90vh] w-full max-w-4xl flex-col bg-white font-bold shadow-2xl duration-200 overflow-hidden rounded-2xl">
            
            <header className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black">
                  {locale === 'en' ? 'Select Table' : locale === 'zh' ? '选择桌子' : 'เลือกโต๊ะ'}
                </h2>
                <button onClick={() => setShowTableModal(false)} className="p-2">
                  <X size={20} />
                </button>
            </header>

            <div className="flex flex-col flex-1 min-h-0 bg-white">
              {/* Zone Filter (Top Horizontal Bar) */}
              <div className="w-full shrink-0 bg-[#FAFAFA] border-b border-gray-100 flex flex-row gap-2 p-3 overflow-x-auto hide-scrollbar">
                {['All', ...Array.from(new Set(tables.map(t => t.zone || 'MAIN')))].map(zone => {
                  const tableCount = zone === 'All' ? tables.length : tables.filter(t => (t.zone || 'MAIN') === zone).length;
                  const isSelected = selectedTableZone === zone;
                  return (
                    <button
                      key={zone}
                      onClick={() => setSelectedTableZone(zone)}
                      className={`shrink-0 px-4 py-3 rounded-2xl text-[11px] sm:text-[12px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden min-w-[80px] sm:min-w-[100px] ${
                        isSelected 
                          ? 'bg-black text-white shadow-md scale-100' 
                          : 'bg-transparent text-gray-500 hover:bg-white hover:text-black hover:shadow-sm scale-[0.98]'
                      }`}
                    >
                      <span className="relative z-10 truncate max-w-full text-center">{zone}</span>
                      <span className={`relative z-10 text-[9px] sm:text-[10px] font-bold ${isSelected ? 'opacity-70' : 'text-gray-400'}`}>
                        {tableCount} {locale === 'en' ? 'tables' : 'โต๊ะ'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Table Grid */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:grid-cols-4 lg:grid-cols-5">
                {tables.filter(t => selectedTableZone === 'All' || (t.zone || 'MAIN') === selectedTableZone).map(table => {
                  const targetTable = table.parent_table_id ? tables.find(t => t.id === table.parent_table_id) || table : table;
                  const childrenTables = tables.filter(t => t.parent_table_id === table.id);
                  const isParent = childrenTables.length > 0;
                  
                  const pendingForThisTable = pendingOrders.filter(
                    o => o.table_id === targetTable.id && o.status === 'pending'
                  )
                  const isOccupied = pendingForThisTable.length > 0 || targetTable.status === 'occupied'
                  const isIdleOccupied = targetTable.status === 'occupied' && pendingForThisTable.length === 0
                  
                  const isSelected = selectedTable?.id === targetTable.id;
                  
                  // Text size logic
                  const isShortName = table.table_number.length <= 3;
                  const tableNumClass = isShortName 
                    ? 'text-3xl sm:text-4xl font-black tracking-tighter' 
                    : 'text-sm sm:text-base font-bold tracking-tight leading-tight break-words px-1';

                      const handleMergeTable = () => {
                          if (editingOrderId && isOccupied) {
                              if (confirm(`โต๊ะ ${targetTable.table_number} มีลูกค้าอยู่แล้ว ต้องการนำบิลของโต๊ะ ${selectedTable?.table_number || 'ปัจจุบัน'} ไปรวมบิลด้วยใช่หรือไม่?`)) {
                                  setIsProcessing(true); setCheckoutError(null);
                                  (async () => {
                                      try {
                                          const targetOrder = pendingForThisTable[0];
                                          if (!targetOrder) throw new Error('ไม่พบออเดอร์ปลายทาง');
                                          
                                          const { data: oldOrderData } = await supabase.from('pos_orders').select('*').eq('id', editingOrderId).single();
                                          
                                          if (oldOrderData) {
                                              const newTotal = Number(targetOrder.total || 0) + Number(oldOrderData.total || 0);
                                              const newSubtotal = Number(targetOrder.subtotal || 0) + Number(oldOrderData.subtotal || 0);
                                              const newTax = Number(targetOrder.tax || 0) + Number(oldOrderData.tax || 0);
                                              const newServiceCharge = Number(targetOrder.service_charge || 0) + Number(oldOrderData.service_charge || 0);
                                              
                                              const mergedTableNumber = targetOrder.table_number?.includes(oldOrderData.table_number) 
                                                  ? targetOrder.table_number 
                                                  : (targetOrder.table_number + ' + ' + oldOrderData.table_number);

                                              await supabase.from('pos_orders').update({
                                                  subtotal: newSubtotal,
                                                  tax: newTax,
                                                  service_charge: newServiceCharge,
                                                  total: newTotal,
                                                  table_number: mergedTableNumber
                                              }).eq('id', targetOrder.id);
                                          }

                                          const { data: currentItems } = await supabase.from('pos_order_items').select('*').eq('order_id', editingOrderId);
                                          
                                          if (currentItems && currentItems.length > 0) {
                                              const updatedItems = currentItems.map(item => {
                                                  const mods = item.selected_modifiers || [];
                                                  mods.push({ name: `[ย้ายมาจากโต๊ะ ${selectedTable?.table_number || 'เดิม'}]`, price_adjustment: 0, qty: 1 });
                                                  return { ...item, order_id: targetOrder.id, selected_modifiers: mods };
                                              });
                                              await supabase.from('pos_order_items').upsert(updatedItems);
                                          }
                                          
                                          await supabase.from('pos_orders').update({ status: 'cancelled' }).eq('id', editingOrderId);
                                          
                                          if (selectedTable?.id) {
                                              await supabase.from('pos_tables').update({ parent_table_id: targetTable.id }).eq('id', selectedTable.id);
                                          }
                                          
                                          alert('รวมโต๊ะสำเร็จ! รายการอาหารถูกย้ายไปรวมในบิลของโต๊ะ ' + targetTable.table_number + ' เรียบร้อยแล้ว');
                                          
                                          fetchTables();
                                          refreshPendingOrders();
                                          resetDeliveryDraft();
                                          setShowTableModal(false);
                                      } catch (err: any) {
                                          alert('Error merging tables: ' + err.message);
                                      } finally {
                                          setIsProcessing(false);
                                      }
                                  })();
                              }
                          }
                      };

                      return (
                        <div key={table.id} className="relative aspect-square flex flex-col group">
                          <button
                            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={(e) => {
                              if (selectedTable?.id === targetTable.id) {
                                resetOrderComposer()
                                setTotalPaid(0)
                                setShowTableModal(false)
                              } else {
                                if (editingOrderId) {
                                    setTableActionTarget(targetTable)
                                } else {
                                    if (pendingForThisTable.length > 0 && cart.length > 0) {
                                        setMergeTableTarget({ table: targetTable, pendingOrder: pendingForThisTable[0] })
                                    } else {
                                        setSelectedTable(targetTable)
                                        setOrderType('dine_in')
                                        resetDeliveryDraft()
                                        setShowTableModal(false)
                                        if (pendingForThisTable.length > 0) {
                                            handleResumeOrder(pendingForThisTable[0])
                                        }
                                    }
                                }
                              }
                            }}
                        className={`w-full h-full relative flex flex-col items-center justify-center overflow-visible rounded-3xl transition-all duration-300 ease-out border-2 ${
                          isSelected 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20 scale-105 z-10' 
                            : isOccupied 
                              ? 'bg-[#1A1A18] text-white border-[#1A1A18] shadow-lg' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col h-full w-full p-3 sm:p-4">
                            {/* Top Row: Zone & Dot */}
                            <div className="flex justify-end items-start w-full min-h-[16px]">
                                {isOccupied && !isSelected && (
                                <div className="relative flex items-center justify-center w-2 h-2 mt-0.5">
                                    <div className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                                    <div className="relative w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                </div>
                                )}
                            </div>
                            
                            {/* Center: Table Name */}
                            <div className="flex-1 flex items-center justify-center w-full">
                                <span className={`${tableNumClass} text-center`}>
                                {table.table_number}
                                </span>
                            </div>
                        </div>

                        {/* Linked Table Floating Pill */}
                        {(table.parent_table_id || isParent) && (
                          <div className={`absolute -bottom-3 inset-x-0 mx-auto w-max px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all z-20 ${
                            isSelected
                              ? 'bg-white text-emerald-600 border border-emerald-100'
                              : isOccupied
                                ? 'bg-white text-[#1A1A18] border border-gray-200'
                                : 'bg-[#1A1A18] text-white border border-[#1A1A18]'
                          }`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {table.parent_table_id 
                                ? `โต๊ะ ${targetTable.table_number}`
                                : `+ โต๊ะ ${childrenTables.map(t => t.table_number).join(', ')}`
                              }
                            </span>
                          </div>
                        )}
                      </button>
                      
                      {/* Idle Clear Button */}
                      {isIdleOccupied && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClearIdleTable(table)
                          }}
                          className="absolute -bottom-8 inset-x-0 mx-auto w-max z-20 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                        >
                          เคลียร์โต๊ะ
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
          
          {/* Action Menu Modal (Table Merge/Move) */}
          {tableActionTarget && (
            <div className="fixed inset-0 z-[3000] flex flex-col justify-end sm:items-center sm:justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setTableActionTarget(null)}
              ></div>
              <div className="animate-in slide-in-from-bottom relative flex w-full max-w-sm flex-col bg-white shadow-2xl duration-300 rounded-[2rem] overflow-hidden">
                <div className="p-6 text-center border-b border-gray-100">
                  <h3 className="text-lg font-black tracking-tight text-[#1A1A18]">
                    จัดการบิล: โต๊ะ {selectedTable?.table_number} <ArrowRight className="inline-block mx-1 w-4 h-4" /> โต๊ะ {tableActionTarget.table_number}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-bold">
                    เลือกสิ่งที่คุณต้องการทำกับบิลนี้
                  </p>
                </div>
                
                <div className="flex flex-col p-4 gap-2">
                  {tables.find(t => t.id === tableActionTarget.id)?.status === 'occupied' ? (
                    <>
                      <button
                        onClick={() => {
                          const targetTableObj = tables.find(t => t.id === tableActionTarget.id);
                          const targetOrder = targetTableObj ? suspendedOrders.find(o => o.table_id === targetTableObj.id && o.status === 'pending' && !o.table_number?.includes('+')) : null;
                          
                          if (!targetOrder) {
                             alert('ไม่พบบิลของโต๊ะปลายทาง กรุณาลองใหม่อีกครั้ง');
                             return;
                          }

                          if (confirm(`ยืนยันการรวมบิล: โต๊ะ ${selectedTable?.table_number || 'ปัจจุบัน'} ไปรวมบิลเข้ากับโต๊ะ ${tableActionTarget.table_number} ใช่หรือไม่?`)) {
                            setIsProcessing(true); setCheckoutError(null);
                            (async () => {
                                try {
                                    const { data: oldOrderData } = await supabase.from('pos_orders').select('*').eq('id', editingOrderId).single();
                                    
                                    if (oldOrderData) {
                                        const newTotal = Number(targetOrder.total || 0) + Number(oldOrderData.total || 0);
                                        const newSubtotal = Number(targetOrder.subtotal || 0) + Number(oldOrderData.subtotal || 0);
                                        const newTax = Number(targetOrder.tax || 0) + Number(oldOrderData.tax || 0);
                                        const newServiceCharge = Number(targetOrder.service_charge || 0) + Number(oldOrderData.service_charge || 0);
                                        
                                        const mergedTableNumber = targetOrder.table_number?.includes(oldOrderData.table_number) 
                                            ? targetOrder.table_number 
                                            : (targetOrder.table_number + ' + ' + oldOrderData.table_number);

                                        await supabase.from('pos_orders').update({
                                            subtotal: newSubtotal,
                                            tax: newTax,
                                            service_charge: newServiceCharge,
                                            total: newTotal,
                                            table_number: mergedTableNumber
                                        }).eq('id', targetOrder.id);
                                    }

                                    const { data: currentItems } = await supabase.from('pos_order_items').select('*').eq('order_id', editingOrderId);
                                    
                                    if (currentItems && currentItems.length > 0) {
                                        const updatedItems = currentItems.map(item => {
                                            const mods = item.selected_modifiers || [];
                                            mods.push({ name: `[ย้ายมาจากโต๊ะ ${selectedTable?.table_number || 'เดิม'}]`, price_adjustment: 0, qty: 1 });
                                            return { ...item, order_id: targetOrder.id, selected_modifiers: mods };
                                        });
                                        await supabase.from('pos_order_items').upsert(updatedItems);
                                    }
                                    
                                    await supabase.from('pos_orders').update({ status: 'cancelled' }).eq('id', editingOrderId);
                                    
                                    if (selectedTable?.id) {
                                        await supabase.from('pos_tables').update({ parent_table_id: tableActionTarget.id }).eq('id', selectedTable.id);
                                    }
                                    
                                    alert('รวมโต๊ะสำเร็จ! บิลถูกย้ายไปรวมกันเรียบร้อยแล้ว');
                                    
                                    fetchTables();
                                    refreshPendingOrders();
                                    resetDeliveryDraft();
                                    setTableActionTarget(null);
                                    setShowTableModal(false);
                                } catch (err: any) {
                                    alert('Error merging tables: ' + err.message);
                                } finally {
                                    setIsProcessing(false);
                                }
                            })();
                          }
                        }}
                        className="flex items-center justify-center gap-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-black uppercase tracking-wide transition-all"
                      >
                        <Merge size={18} /> รวมบิลเข้าด้วยกัน
                      </button>
                      <button
                        onClick={() => {
                          const targetOrder = suspendedOrders.find(o => o.table_id === tableActionTarget.id && o.status === 'pending');
                          setSelectedTable(tableActionTarget)
                          setOrderType('dine_in')
                          resetDeliveryDraft()
                          setTableActionTarget(null)
                          setShowTableModal(false)
                          if (targetOrder) {
                              handleResumeOrder(targetOrder)
                          }
                        }}
                        className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-gray-200 text-[#1A1A18] rounded-2xl py-4 font-black uppercase tracking-wide transition-all"
                      >
                        <Eye size={18} /> สลับไปดูบิลโต๊ะนี้
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (confirm(`ยืนยันการย้ายบิลจากโต๊ะ ${selectedTable?.table_number || 'ปัจจุบัน'} ไปยังโต๊ะ ${tableActionTarget.table_number} ใช่หรือไม่?`)) {
                             setIsProcessing(true); setCheckoutError(null);
                             (async () => {
                                 try {
                                     await supabase.from('pos_orders').update({
                                         table_id: tableActionTarget.id,
                                         table_number: tableActionTarget.table_number
                                     }).eq('id', editingOrderId);
                                     
                                     // Also clear any parent_table_id logic if needed, but usually just moving is enough
                                     if (selectedTable?.id) {
                                        await supabase.from('pos_tables').update({ parent_table_id: null }).eq('id', selectedTable.id);
                                     }
                                     
                                     fetchTables();
                                     refreshPendingOrders();
                                     setSelectedTable(tableActionTarget);
                                     setTableActionTarget(null);
                                     setShowTableModal(false);
                                 } catch (err: any) {
                                     alert('Error moving table: ' + err.message);
                                 } finally {
                                     setIsProcessing(false);
                                 }
                             })();
                          }
                        }}
                        className="flex items-center justify-center gap-3 w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl py-4 font-black uppercase tracking-wide transition-all"
                      >
                        <ArrowRight size={18} /> ย้ายบิลไปโต๊ะนี้
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setTableActionTarget(null)}
                    className="flex items-center justify-center w-full bg-white border-2 border-gray-100 hover:border-gray-300 text-gray-500 rounded-2xl py-3 font-bold uppercase tracking-wide transition-all mt-2"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* 8. PENDING ORDERS MODAL */}
      {showPendingModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPendingModal(false)}
          ></div>
          <div className="animate-in slide-in-from-bottom relative flex max-h-[90vh] w-full max-w-4xl flex-col bg-white font-bold shadow-2xl duration-300 rounded-[2rem] overflow-hidden">
            <header className="flex flex-col border-b border-gray-100 bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black">
                    ศูนย์แจ้งเตือนและรายการ
                  </h2>
                </div>
                <button onClick={() => setShowPendingModal(false)} className="p-2 text-gray-400 hover:text-black transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 mt-6 border-b border-gray-100 pb-2">
                <button
                  onClick={() => setPendingModalTab('orders')}
                  className={`text-sm font-black pb-2 px-1 relative transition-all ${
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
                    <motion.div layoutId="pendingModalTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                  )}
                </button>
                <button
                  onClick={() => setPendingModalTab('coupons')}
                  className={`text-sm font-black pb-2 px-1 relative transition-all flex items-center gap-1.5 ${
                    pendingModalTab === 'coupons' ? 'text-black' : 'text-gray-400 hover:text-black'
                  }`}
                >
                  คำขอใช้คูปอง ({claimingCoupons.filter(c => c.id !== appliedCouponId).length})
                  {claimingCoupons.filter(c => c.id !== appliedCouponId).length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                  {pendingModalTab === 'coupons' && (
                    <motion.div layoutId="pendingModalTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                  )}
                </button>
              </div>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-10">
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
                        onClick={() => handleResumeOrder(order)}
                        className="group flex cursor-pointer flex-col items-center justify-between border bg-white p-6 transition-all hover:border-[#1A1A18] sm:flex-row"
                      >
                        <div className="flex items-center gap-8 font-bold">
                          {order.source === 'qr' ? (
                            <BellRing size={32} className="text-orange-400 animate-pulse group-hover:text-orange-500" />
                          ) : order.order_type === 'delivery' && order.delivery_platform ? (
                            <DeliveryPlatformIcon platform={order.delivery_platform} size={32} className="rounded-full shadow-sm" />
                          ) : (
                            <History size={32} className="text-gray-200 group-hover:text-[#1A1A18]" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-0.5">
                                <div className="text-sm font-black uppercase tracking-wide text-[#1A1A18]">
                                  {order.order_type === 'delivery' ? (
                                    `คิวส่ง #${String(order.queue_number || '').padStart(3, '0')}`
                                  ) : order.order_type === 'dine_in' && order.table_number ? (
                                    `โต๊ะ ${order.table_number}`
                                  ) : (
                                    `#${String(order.queue_number || '').padStart(3, '0')}`
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-normal">
                                  {order.order_number || ''}
                                </div>
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
                                <span className="bg-[#1A1A18] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white">
                                  {order.reference_name}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[10px] text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString()}
                              {order.source === 'qr' && <span className="ml-2 text-orange-400 font-black">{locale === 'en' ? '• รายการใหม่จากลูกค้า' : locale === 'zh' ? '• รายการใหม่จากลูกค้า' : '• รายการใหม่จากลูกค้า'}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-[#1A1A18]">
                              {locale === 'en' ? '                           ฿ ' : locale === 'zh' ? '                           ฿ ' : '                           ฿ '}{order.total_amount.toLocaleString()}
                            </span>
                            {(order.pos_order_payments?.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0) > 0 && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-1.5 py-0.5">
                                {locale === 'en' ? '                             จ่ายแล้ว ฿ ' : locale === 'zh' ? '                             จ่ายแล้ว ฿ ' : '                             จ่ายแล้ว ฿ '}{(order.pos_order_payments?.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0)).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteOrder(order.id)
                            }}
                            className="p-2 text-red-200 hover:text-red-500"
                          >
                            <X size={20} />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {claimingCoupons.filter(c => c.id !== appliedCouponId).map((claim) => (
                      <div 
                        key={claim.id} 
                        onClick={() => {
                          setShowPendingModal(false);
                          setActiveCouponClaimRequest(claim);
                        }}
                        className="cursor-pointer bg-amber-50/70 border border-amber-200/60 rounded-[1.5rem] p-5 flex flex-col gap-4 shadow-sm hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-200 text-amber-800 uppercase tracking-widest mb-2">
                              {claim.discount_type === 'percent' ? `${claim.discount_value}% OFF` : claim.discount_type === 'free_item' ? 'FREE ITEM' : `฿${claim.discount_value} OFF`}
                            </span>
                            <h4 className="text-sm font-black text-amber-950 truncate leading-snug">{claim.coupon_name}</h4>
                            <p className="text-[11px] font-bold text-amber-700/80 mt-1 truncate">
                              โดย: {claim.member?.display_name || claim.member?.full_name || 'ลูกค้าทั่วไป'} ({claim.member?.phone})
                            </p>
                          </div>
                        </div>
                        <button
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-center mt-auto"
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
          </div>
        </div>
      )}

      {/* 9. PAYMENT MODAL - ULTRA MINIMAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[2700] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
          ></div>
          <div className="relative flex w-full max-w-lg flex-col bg-white font-sans shadow-xl rounded-3xl overflow-hidden">
            <header className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {inlineCashPayment && (
                  <button
                    onClick={() => setInlineCashPayment(false)}
                    className="p-2 -ml-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {inlineCashPayment ? (locale === 'en' ? 'Cash Payment' : locale === 'zh' ? '现金支付' : 'ชำระเงินสด') : (locale === 'en' ? 'Checkout' : locale === 'zh' ? '结账' : 'ชำระเงิน')}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {inlineCashPayment ? (locale === 'en' ? 'Enter received amount' : 'ระบุยอดเงินที่รับมา') : (locale === 'en' ? 'Select Payment Method' : 'เลือกช่องทางการชำระเงิน')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isProcessing && setShowPaymentModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </header>

            <div className="p-8 sm:p-10 bg-[#FAFAFA] relative overflow-hidden min-h-[400px]">
              <AnimatePresence mode="wait">
                {inlineCashPayment ? (
                  <motion.div
                    key="cash-payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center p-5 bg-white rounded-[1.25rem] border border-gray-100 shadow-sm">
                      <span className="text-sm font-black text-gray-500 uppercase tracking-widest">{locale === 'en' ? 'Amount Due' : 'ยอดที่ต้องชำระ'}</span>
                      <span className="text-3xl font-black text-emerald-600 tracking-tighter">฿{currentPaymentAmount.toLocaleString()}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">{locale === 'en' ? 'Received' : 'รับเงินมา'}</label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">฿</span>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="w-full h-20 pl-12 pr-28 text-3xl font-black bg-gray-50 border-2 border-transparent outline-none focus:border-[#1A1A18] focus:bg-white rounded-[1.25rem] transition-all"
                          placeholder="0"
                          autoFocus
                        />
                        <button 
                          onClick={() => setCashReceived(currentPaymentAmount.toString())} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-16 px-6 bg-white shadow-sm border border-gray-100 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-[15px] transition-all whitespace-nowrap"
                        >
                          พอดี
                        </button>
                      </div>
                    </div>

                    <button
                      disabled={isProcessing || !cashReceived || Number(cashReceived) < currentPaymentAmount}
                      onClick={async () => {
                        const received = Number(cashReceived);
                        if (received < currentPaymentAmount) {
                          alert('รับเงินมาไม่ครบยอดชำระ');
                          return;
                        }
                        await handleProcessPayment('cash', currentPaymentAmount);
                      }}
                      className="w-full h-[60px] bg-[#1A1A18] text-white rounded-[1.25rem] font-black tracking-widest uppercase hover:bg-black hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative mt-4"
                    >
                      {isProcessing ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          {!isProcessing && cashReceived && Number(cashReceived) >= currentPaymentAmount && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                          )}
                          <span>{locale === 'en' ? 'Confirm Payment' : 'ยืนยันชำระเงิน'}</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="payment-options"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-10"
                  >
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-400 mb-3 tracking-widest uppercase">
                        {locale === 'en' ? 'Total Amount Due' : 'ยอดชำระสุทธิ'}
                      </div>
                      <div className="text-7xl sm:text-8xl font-bold text-gray-900 tracking-tighter drop-shadow-sm">
                        <span className="text-4xl sm:text-5xl font-medium text-gray-400 mr-2">฿</span>
                        {remainingTotal.toLocaleString()}
                      </div>
                      {totalPaid > 0 && (
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold tracking-widest text-green-600">
                          <Check size={14} strokeWidth={3} />
                          <span>{locale === 'en' ? 'PAID:' : 'ชำระแล้ว:'} ฿{totalPaid.toLocaleString()} / {locale === 'en' ? 'TOTAL:' : 'รวม:'} ฿{cartTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {checkoutError && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
                        <p className="text-sm font-medium">{checkoutError}</p>
                      </div>
                    )}

                    <div>
                      <button
                        disabled={isProcessing || remainingTotal <= 0}
                        onClick={() => {
                          fetchTables()
                          refreshPendingOrders()
                          setShowPaymentModal(false)
                          setShowSplitPaymentModal(true)
                        }}
                        className="w-full h-16 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-700 text-sm font-bold hover:bg-gray-50 hover:shadow transition-all flex items-center justify-center gap-2"
                      >
                        {locale === 'en' ? 'Split Bill / Partial Payment' : 'หารจ่าย / แยกจ่าย (Split Bill)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 sm:gap-5">
                      <button
                        disabled={isProcessing}
                        onClick={() => {
                          setCheckoutError(null);
                          setCashReceived('');
                          setPaymentSuccessData(null);
                          setCurrentPaymentAmount(remainingTotal);
                          setInlineCashPayment(true);
                        }}
                        className={`h-32 sm:h-36 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 ${processingMethod === 'cash' ? 'bg-black text-white border-black shadow-lg hover:shadow-xl' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40 disabled:hover:translate-y-0`}
                      >
                        {processingMethod === 'cash' ? (
                           <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-600 border-t-white" />
                        ) : (
                           <Banknote size={36} strokeWidth={1.5} />
                        )}
                        <span className="text-sm font-bold tracking-wide">{processingMethod === 'cash' ? (locale === 'en' ? 'Processing...' : 'กำลังบันทึก...') : (locale === 'en' ? 'Cash' : 'เงินสด')}</span>
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={() => {
                          setCheckoutError(null);
                          handleProcessPayment('promptpay')
                        }}
                        className={`h-32 sm:h-36 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 ${processingMethod === 'promptpay' ? 'bg-black text-white border-black shadow-lg hover:shadow-xl' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40 disabled:hover:translate-y-0`}
                      >
                        {processingMethod === 'promptpay' ? (
                           <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-600 border-t-white" />
                        ) : (
                           <QrCode size={36} strokeWidth={1.5} />
                        )}
                        <span className="text-sm font-bold tracking-wide">{processingMethod === 'promptpay' ? (locale === 'en' ? 'Processing...' : 'กำลังบันทึก...') : (locale === 'en' ? 'QR Pay' : 'สแกน')}</span>
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={() => {
                          setCheckoutError(null);
                          handleProcessPayment('credit_card')
                        }}
                        className={`h-32 sm:h-36 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 ${processingMethod === 'credit_card' ? 'bg-black text-white border-black shadow-lg hover:shadow-xl' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40 disabled:hover:translate-y-0`}
                      >
                        {processingMethod === 'credit_card' ? (
                           <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-600 border-t-white" />
                        ) : (
                           <CreditCard size={36} strokeWidth={1.5} />
                        )}
                        <span className="text-sm font-bold tracking-wide">{processingMethod === 'credit_card' ? (locale === 'en' ? 'Processing...' : 'กำลังบันทึก...') : (locale === 'en' ? 'Card' : 'บัตร')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

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


      {isDeliveryPlatformModalOpen && (
        <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDeliveryPlatformModalOpen(false)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Delivery Platform</div>
                <h3 className="mt-2 text-2xl font-black text-[#1A1A18]">เลือกค่ายและกรอกเลขบิล</h3>
                <p className="mt-2 text-sm font-bold text-gray-500">ข้อมูลนี้จะแสดงชัดเจนบนใบเสร็จและใบออเดอร์</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveryPlatformModalOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 min-h-[360px] flex flex-col justify-center">
              {!draftDeliveryPlatform ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="text-center mb-8">
                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">
                      Delivery Platform
                    </div>
                    <h4 className="text-2xl font-black text-[#1A1A18] tracking-tight">เลือกค่ายเดลิเวอรี่</h4>
                    <p className="text-xs font-bold text-gray-400 mt-2">กรุณาเลือกค่ายเพื่อกรอกรหัสบิล</p>
                  </div>
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
                          <div className="mt-2 text-xl font-black">{formatDeliveryPlatformLabel(platform)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 w-full px-2">
                  {/* Selected Platform Header (Sleek Pill) */}
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

                  {/* Display screen (Floating glass effect) */}
                  <div className="relative w-full max-w-[280px] h-20 flex flex-col items-center justify-center rounded-3xl mb-8 transition-all">
                    <span className="absolute -top-3 bg-white px-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 z-10">
                      Order ID
                    </span>
                    <div className={`w-full h-full flex items-center justify-center rounded-3xl border-2 transition-all ${draftPlatformOrderId ? 'border-[#1A1A18] bg-[#1A1A18] text-white shadow-xl scale-105' : 'border-gray-200 bg-gray-50 text-gray-300 border-dashed'}`}>
                      <span className="text-4xl font-black tracking-widest font-mono">
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
                        className="h-16 w-16 mx-auto rounded-full bg-gray-50/50 hover:bg-gray-100 text-2xl font-black text-[#1A1A18] hover:shadow-md active:scale-90 active:bg-gray-200 transition-all flex items-center justify-center"
                      >
                        {num}
                      </button>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setDraftPlatformOrderId('')}
                      className="h-16 w-16 mx-auto rounded-full text-red-400 font-black text-[12px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:shadow-sm active:scale-90 transition-all flex items-center justify-center"
                    >
                      Clear
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setDraftPlatformOrderId(prev => (prev.length < 15 ? prev + '0' : prev))}
                      className="h-16 w-16 mx-auto rounded-full bg-gray-50/50 hover:bg-gray-100 text-2xl font-black text-[#1A1A18] hover:shadow-md active:scale-90 active:bg-gray-200 transition-all flex items-center justify-center"
                    >
                      0
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setDraftPlatformOrderId(prev => prev.slice(0, -1))}
                      className="h-16 w-16 mx-auto rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#1A1A18] hover:shadow-sm active:scale-90 transition-all flex items-center justify-center"
                    >
                      <Delete size={24} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeliveryPlatformModalOpen(false)}
                className={`${draftDeliveryPlatform ? 'flex-1' : 'w-full'} rounded-[1.5rem] bg-gray-50 py-5 text-[12px] font-black uppercase tracking-[0.2em] text-gray-500 transition-all hover:bg-gray-200 hover:text-black`}
              >
                ยกเลิก (Cancel)
              </button>
              {draftDeliveryPlatform && (
                <button
                  type="button"
                  disabled={!draftPlatformOrderId}
                  onClick={saveDeliveryPlatformDetails}
                  className={`flex-1 rounded-[1.5rem] py-5 text-[12px] font-black uppercase tracking-[0.2em] transition-all ${draftPlatformOrderId ? 'bg-[#D3202B] text-white hover:bg-[#B91C1C] hover:shadow-xl hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  ยืนยัน (Confirm)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MEMBER CHECKOUT FLOW MODAL */}
      <AnimatePresence>
        {showMemberCheckoutFlow && (
          <div className="fixed inset-0 z-[2550] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowMemberCheckoutFlow(false);
                setShowPaymentModal(true);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 ${
                memberCheckoutStep === 'lookup' && memberLookupMode === 'qr' ? 'max-w-4xl' : 'max-w-lg'
              }`}
            >
               {memberCheckoutStep === 'lookup' ? (
                 <div className="p-8 pt-10">
                   <div className="text-center mb-8">
                     <h2 className="text-2xl font-black text-[#1A1A18] tracking-tight">
                       {locale === 'en' ? 'Member Check-in' : 'ตรวจสอบสมาชิก'}
                     </h2>
                     <p className="text-sm text-gray-400 font-medium mt-2">
                       {locale === 'en' ? 'Identify customer for loyalty points' : 'สะสมแต้มหรือใช้สิทธิพิเศษสำหรับสมาชิก'}
                     </p>
                   </div>

                   {/* Tab Switcher */}
                   <div className="flex justify-center gap-8 mb-8 border-b border-gray-100">
                     <button
                       type="button"
                       onClick={() => setMemberLookupMode('phone')}
                       className={`pb-4 text-sm font-bold transition-all flex items-center gap-2 relative ${
                         memberLookupMode === 'phone' ? 'text-[#1A1A18]' : 'text-gray-400 hover:text-gray-600'
                       }`}
                     >
                       <Phone size={16} />
                       {locale === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์'}
                       {memberLookupMode === 'phone' && (
                         <motion.div layoutId="memberTabCheckout" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A18]" />
                       )}
                     </button>
                     <button
                       type="button"
                       onClick={() => setMemberLookupMode('qr')}
                       className={`pb-4 text-sm font-bold transition-all flex items-center gap-2 relative ${
                         memberLookupMode === 'qr' ? 'text-[#1A1A18]' : 'text-gray-400 hover:text-gray-600'
                       }`}
                     >
                       <QrCode size={16} />
                       {locale === 'en' ? 'Scan QR' : 'คิวอาร์โค้ด'}
                       {memberLookupMode === 'qr' && (
                         <motion.div layoutId="memberTabCheckout" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A18]" />
                       )}
                     </button>
                   </div>

                   {memberLookupMode === 'phone' ? (
                     <div className="animate-in fade-in duration-300">
                   
                   <div className="relative mb-6">
                     <input
                        type="tel"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="08X-XXX-XXXX"
                        className="w-full bg-[#f8f8f8] border-2 border-transparent focus:border-[#1A1A18] focus:bg-white rounded-2xl py-5 px-6 text-2xl font-black text-center tracking-[0.2em] transition-all outline-none placeholder:text-gray-300"
                        autoFocus
                     />
                     {memberSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-20 max-h-[250px] overflow-y-auto">
                           {memberSearchResults.map((m) => (
                              <button
                                 key={m.id}
                                 onClick={() => {
                                    setSelectedCustomer(m);
                                    setMemberCheckoutStep('points');
                                    setMemberSearchResults([]);
                                 }}
                                 className="w-full text-left px-6 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors group"
                              >
                                 <div>
                                    <div className="font-black text-gray-800 text-lg group-hover:text-black transition-colors">{m.full_name || m.display_name || 'No Name'}</div>
                                    <div className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">{m.phone}</div>
                                 </div>
                                 <div className="text-[#1A1A18] font-black flex items-center gap-1 bg-gray-100 px-4 py-2 rounded-xl text-sm">
                                    {m.points || 0} PTS
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                   </div>
                   
                   <div className="flex flex-col gap-3 mt-8">
                     <button
                       onClick={handleSearchMemberFlow}
                       disabled={!memberSearchQuery.trim() || isSearchingMember}
                       className="w-full py-4 bg-[#1A1A18] hover:bg-black text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                     >
                       {isSearchingMember ? <Loader2 className="animate-spin" size={20} /> : (
                         <>
                           {locale === 'en' ? 'Search Member' : 'ค้นหาสมาชิก'}
                           <ArrowRight size={18} />
                         </>
                       )}
                     </button>
                     <button
                       onClick={() => {
                         setShowMemberCheckoutFlow(false);
                         setShowPaymentModal(false);
                       }}
                       className="w-full py-4 text-gray-400 hover:text-black font-bold rounded-2xl transition-all text-sm"
                     >
                       {locale === 'en' ? 'Skip, checkout without member' : 'ข้าม (ลูกค้าทั่วไป)'}
                     </button>
                   </div>
                     </div>
                   ) : (
                     <div className="flex flex-col md:flex-row gap-8 py-4 animate-in fade-in duration-300 items-stretch">
                       {/* Left side: Order Details */}
                       <div className="flex-1 bg-[#F8F8F8] rounded-3xl p-6 flex flex-col max-h-[60vh] overflow-hidden">
                          <h3 className="text-xl font-black mb-4">{locale === 'en' ? 'Order Details' : 'รายการสั่งซื้อ'}</h3>
                          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                             {cart.map((item, idx) => (
                               <div key={idx} className="flex justify-between items-start gap-4 pb-3 border-b border-gray-200 last:border-0">
                                 <div>
                                    <div className="font-bold text-[#1A1A18] text-sm">{item.quantity}x {getPrimaryMenuName(item)}</div>
                                    {item.selected_modifiers?.map((m: any, mIdx: number) => <div key={mIdx} className="text-xs text-gray-500">{m.name}</div>)}
                                 </div>
                                 <div className="font-black text-[#1A1A18] text-sm">฿{((getEffectiveItemUnitPrice(item) + (item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0)) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                               </div>
                             ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t-2 border-gray-200">
                             <div className="flex justify-between items-center mb-4">
                               <span className="font-black text-gray-500">{locale === 'en' ? 'Total' : 'ยอดรวมทั้งสิ้น'}</span>
                               <span className="text-2xl font-black text-[#1A1A18]">฿{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                             </div>

                             {posQrPointsEarned > 0 ? (
                               <div className="bg-emerald-50 text-emerald-600 px-4 py-4 rounded-2xl font-black flex items-center justify-between">
                                 <span>{locale === 'en' ? 'Points Earned' : 'คะแนนที่ได้รับ'}</span>
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-3xl">{posQrPointsEarned}</span>
                                    <span className="text-sm">pts</span>
                                 </div>
                               </div>
                             ) : null}
                          </div>
                       </div>
                       
                       {/* Right side: QR Code */}
                       <div className="flex-1 flex flex-col items-center justify-center">
                         <div className="p-8 bg-white border-2 border-gray-100 rounded-[2rem] shadow-sm flex items-center justify-center min-w-[320px] min-h-[320px] mb-8 relative">
                           {posQrLoyaltyToken ? (
                             <QRCodeSVG
                               value={
                                 posQrLoyaltyToken !== 'general_member_checkin'
                                   ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi'}/#?path=/member&claimToken=${posQrLoyaltyToken}&session=${qrSessionId}`
                                   : `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi'}/#?path=/member`
                               }
                               size={280}
                               level="H"
                               includeMargin={false}
                             />
                           ) : (
                             <div className="flex flex-col items-center justify-center space-y-3">
                               <Loader2 className="animate-spin text-[#1A1A18]" size={48} />
                               <span className="text-sm font-bold text-gray-500">{locale === 'en' ? 'Generating QR Code...' : 'กำลังสร้าง QR Code...'}</span>
                             </div>
                           )}
                           
                           {/* Add a scan overlay frame for aesthetic */}
                           <div className="absolute inset-0 pointer-events-none rounded-[2rem] border-[3px] border-[#1A1A18]/5"></div>
                         </div>

                         <button
                           onClick={() => {
                             setShowMemberCheckoutFlow(false);
                             setShowPaymentModal(true);
                           }}
                           className="w-full max-w-sm py-4 text-gray-400 hover:text-black font-bold rounded-2xl transition-all text-sm border-2 border-transparent hover:border-gray-200"
                         >
                           {locale === 'en' ? 'Skip to Payment' : 'ข้ามไปหน้าชำระเงิน (ไม่สะสมแต้ม)'}
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex flex-col h-full max-h-[85vh]">
                   {/* Profile Header - Horizontal compact layout */}
                   <div className="bg-white border-b border-gray-100 p-6 sm:p-8 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4">
                       <div className="relative">
                         {selectedCustomer?.customer_image || selectedCustomer?.avatar_url ? (
                           <img src={selectedCustomer?.customer_image || selectedCustomer?.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                         ) : (
                           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                             <User size={24} className="text-gray-300" />
                           </div>
                         )}
                         <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[#1A1A18] rounded-full p-1 border-2 border-white shadow-sm" title="Member">
                           <Award size={12} className="fill-[#1A1A18]" />
                         </div>
                       </div>
                       
                       <div>
                         <h3 className="text-lg font-black text-[#1A1A18] leading-tight">{selectedCustomer?.full_name || selectedCustomer?.display_name}</h3>
                         <p className="text-xs font-bold text-gray-400 tracking-widest mt-0.5 mb-1.5">{selectedCustomer?.phone}</p>
                         <div className="bg-[#1A1A18] px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                           <span className="text-yellow-400 font-black text-xs">{selectedCustomer?.points || 0}</span>
                           <span className="text-white font-bold text-[9px] tracking-widest uppercase">PTS</span>
                         </div>
                       </div>
                     </div>
                     
                     <button 
                       onClick={() => {
                           if (linkedCheckInId) {
                             supabase.from('pos_member_checkins').update({ status: 'cancelled' }).eq('id', linkedCheckInId).then(() => {});
                             setLinkedCheckInId(null);
                           }
                           setSelectedCustomer(null)
                           setMemberSearchQuery('')
                          setMemberCheckoutStep('lookup')
                       }}
                       className="text-[11px] font-bold text-gray-400 hover:text-[#1A1A18] transition-all bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl"
                     >
                       {locale === 'en' ? 'Change' : 'เปลี่ยน'}
                     </button>
                   </div>

                   <div className="p-6 sm:p-8 bg-gray-50/30 flex-1 overflow-y-auto">
                     <div className="flex items-center justify-between mb-5">
                       <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1A18]">
                         {locale === 'en' ? 'Available Coupons' : 'คูปองที่ใช้ได้'}
                       </h4>
                       <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{memberAvailableCoupons.length}</span>
                     </div>

                     {memberAvailableCoupons.length > 0 ? (
                       <div className="space-y-3 mb-6">
                         {memberAvailableCoupons.map((coupon, idx) => (
                           <div key={idx} className="bg-white border border-gray-200 hover:border-[#1A1A18] rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => {
                                 const event = new CustomEvent('applyPOSCoupon', { detail: coupon });
                                 window.dispatchEvent(event);
                                 setShowMemberCheckoutFlow(false);
                                 if (coupon.discount_type !== 'free_item') {
                                    alert(`นำคูปอง "${coupon.coupon_name || coupon.name}" ไปประยุกต์ใช้สำเร็จ!`);
                                    setShowPaymentModal(true);
                                 }
                               }}>
                             {coupon.image_url ? (
                               <img src={coupon.image_url} alt={coupon.coupon_name} className="w-14 h-14 object-cover rounded-xl" />
                             ) : (
                               <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                 <Ticket size={24} className="text-gray-400 group-hover:text-[#1A1A18] transition-colors" />
                               </div>
                             )}
                             <div className="flex-1">
                               <h4 className="font-bold text-sm text-[#1A1A18] line-clamp-1 group-hover:text-black transition-colors">{coupon.coupon_name}</h4>
                               <p className="text-[11px] font-black mt-1 uppercase tracking-widest text-orange-500">
                                 {coupon.discount_type === 'free_item' ? (locale === 'en' ? 'Free Item' : 'รับฟรี 1 รายการ') : ''}
                                 {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : ''}
                                 {coupon.discount_type === 'fixed' ? `ลด ${coupon.discount_value} บาท` : ''}
                               </p>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#1A1A18] transition-colors border border-gray-100 group-hover:border-[#1A1A18]">
                               <span className="text-gray-400 group-hover:text-white transition-colors text-sm">→</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="mb-6 flex flex-col items-center justify-center py-10 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Ticket className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-[#1A1A18] font-black text-sm mb-1">{locale === 'en' ? 'No active coupons' : 'ไม่มีคูปองที่ใช้งานได้'}</p>
                       </div>
                     )}
                   </div>
                   
                   {/* Sticky Bottom Action */}
                   <div className="p-6 sm:p-8 bg-white border-t border-gray-100 shrink-0">
                     <button
                       onClick={() => {
                         setShowMemberCheckoutFlow(false);
                         setShowPaymentModal(true);
                       }}
                       className="w-full py-4 bg-[#1A1A18] hover:bg-black text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                     >
                       <span>{locale === 'en' ? 'Skip to Payment' : 'ข้ามไปหน้าชำระเงิน'}</span>
                     </button>
                   </div>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                        onClick={() => openDeliveryPlatformModal(deliveryPlatform || activeDeliveryPlatforms[0] || 'grab')}
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
      {/* ORDER TYPE SWITCH MODAL (Bottom Sheet Slide-up) */}
      <AnimatePresence>
        {pendingOrderTypeSwitch && (
          <div className="fixed inset-0 z-[2500] flex items-end justify-center font-bold p-4">
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
              onClick={() => setPendingOrderTypeSwitch(null)}
            />
            {/* Card sliding up from bottom */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white p-6 rounded-[2rem] text-center shadow-2xl border border-neutral-100 z-10"
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
                        openDeliveryPlatformModal(deliveryPlatform || activeDeliveryPlatforms[0] || 'grab');
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
                            setShowTableModal(true);
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
                  setShowTableModal(false)
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
                  setShowTableModal(false)
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

      {/* GLOBAL PAYMENT SUCCESS MODAL - MINIMAL REDESIGN */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A18]/90 backdrop-blur-md" onClick={() => setPaymentSuccessData(null)}></div>
          <div className="relative w-full max-w-md bg-[#F4F4F0] rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
            {/* Minimalist Dark Header */}
            <div className="relative bg-[#1A1A18] px-8 pt-12 pb-10 text-center">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-[#2A2A28] text-white rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <Check size={32} strokeWidth={2.5} />
                </div>
                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">{locale === 'en' ? 'Payment Successful' : locale === 'zh' ? '支付成功' : 'ชำระเงินสำเร็จ'}</h2>
                
                {paymentSuccessData.paymentMethod === 'cash' ? (
                   <>
                     <div className="text-6xl font-black text-white tracking-tighter flex items-start justify-center">
                       <span className="text-3xl text-gray-500 font-medium mr-2 mt-1">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}</span>
                       {paymentSuccessData.change.toLocaleString()}
                     </div>
                     <div className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-[10px] font-black text-[#1A1A18] tracking-[0.2em] uppercase shadow-sm">
                       {locale === 'en' ? 'CHANGE' : locale === 'zh' ? '找零 (CHANGE)' : 'เงินทอน (CHANGE)'}
                     </div>
                   </>
                ) : (
                   <>
                     <div className="text-6xl font-black text-white tracking-tighter flex items-start justify-center">
                       <span className="text-3xl text-gray-500 font-medium mr-2 mt-1">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}</span>
                       {paymentSuccessData.total.toLocaleString()}
                     </div>
                     <div className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-[10px] font-black text-[#1A1A18] tracking-[0.2em] uppercase shadow-sm">
                       {paymentSuccessData.paymentMethod}
                     </div>
                   </>
                )}
              </div>
              
              <button onClick={() => setPaymentSuccessData(null)} className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-8 bg-[#F4F4F0]">
              {/* Story Selection */}
              {(shopSettings?.opening_hours?.show_story_selection_at_checkout) && (shopSettings?.receipt_story_mode || shopSettings?.opening_hours?.receipt_story_mode) && (shopSettings?.receipt_stories?.length > 0 || shopSettings?.opening_hours?.receipt_stories?.length > 0) && (
                <div className="mb-8 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 text-center">{locale === 'en' ? 'Story Mode Options' : locale === 'zh' ? '故事模式选项' : 'ตัวเลือกเรื่องเล่าท้ายบิล'}</label>
                  <div className="relative group">
                    <select
                      value={selectedStoryIndex}
                      onChange={(e) => setSelectedStoryIndex(Number(e.target.value))}
                      className="w-full h-14 pl-5 pr-12 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm font-bold text-[#1A1A18] outline-none hover:border-gray-200 focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                    >
                      <option value={-1}>{locale === 'en' ? '🎲 Random Chapter' : locale === 'zh' ? '🎲 随机章节' : '🎲 สุ่มตอน (Random Chapter)'}</option>
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

              {/* LOYALTY MEMBER POINTS SECTION IN SUCCESS MODAL */}
              {selectedCustomer ? (
                <div className="mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-900">{selectedCustomer.full_name || selectedCustomer.display_name || 'No Name'}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">+ {Math.floor((paymentSuccessData?.total || 0) / (Number(shopSettings?.opening_hours?.loyalty_points_per_thb) || 25))} PTS</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setMemberSearchQuery(''); }} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition-colors">
                    {locale === 'en' ? 'Change' : 'เปลี่ยน / ยกเลิก'}
                  </button>
                </div>
              ) : (
                <details className="mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden group">
                  <summary className="flex items-center justify-between p-3 cursor-pointer list-none hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-black group-open:bg-[#1A1A18] group-open:text-white transition-colors">
                        <User size={14} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-600 group-open:text-[#1A1A18]">
                        {locale === 'en' ? 'Member Points' : 'สะสมแต้มสมาชิก'}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full group-open:hidden tracking-wider">
                      {locale === 'en' ? 'EXPAND' : 'กดเพื่อเพิ่มแต้ม'}
                    </div>
                    <div className="hidden text-[10px] font-bold text-gray-400 hover:text-red-500 group-open:block tracking-widest px-2 transition-colors">
                      {locale === 'en' ? 'CLOSE' : 'ย่อเก็บ'}
                    </div>
                  </summary>

                  <div className="p-3 pt-2 border-t border-gray-50">
                    <div className="flex bg-[#F4F4F0] p-1 rounded-xl mb-3 font-bold text-[10px]">
                      <button
                        type="button"
                        onClick={() => setMemberLookupMode('phone')}
                        className={`flex-1 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          memberLookupMode === 'phone' ? 'bg-[#1A1A18] text-white shadow-sm' : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        <Phone size={12} /> {locale === 'en' ? 'Phone' : 'กรอกเบอร์'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberLookupMode('qr')}
                        className={`flex-1 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          memberLookupMode === 'qr' ? 'bg-[#1A1A18] text-white shadow-sm' : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        <QrCode size={12} /> {locale === 'en' ? 'QR Code' : 'ให้สแกน QR'}
                      </button>
                    </div>

                    {memberLookupMode === 'phone' ? (
                      <div>
                        <div className="relative mb-3">
                          <input
                            type="tel"
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="0XX-XXX-XXXX"
                            className="w-full bg-white border-2 border-gray-200 rounded-xl h-12 px-4 text-center text-sm font-black tracking-[0.2em] text-[#1A1A18] focus:border-black focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                          />
                          {memberSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-30 max-h-[160px] overflow-y-auto">
                              {memberSearchResults.map((m) => (
                                <button
                                  key={m.id}
                                  onClick={async () => {
                                    setSelectedCustomer(m);
                                    setMemberSearchResults([]);
                                    setMemberSearchQuery('');
                                    if (paymentSuccessData?.orderId && paymentSuccessData.orderId !== 'NEW') {
                                      const earnThb = Number(shopSettings?.opening_hours?.loyalty_points_per_thb) || 25;
                                      const earnedPts = Math.floor((paymentSuccessData.total || 0) / earnThb);
                                      await supabase.from('pos_orders').update({ customer_id: m.id }).eq('id', paymentSuccessData.orderId);
                                      if (earnedPts > 0) {
                                        await supabase.from('pos_members').update({ points: (m.points || 0) + earnedPts }).eq('id', m.id);
                                        await supabase.from('pos_points_history').insert([{ member_id: m.id, points: earnedPts, type: 'earn', description: `Earned from order ${paymentSuccessData.orderNumber}` }]);
                                      }
                                    }
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 transition-colors"
                                >
                                  <div>
                                    <div className="font-black text-gray-800 text-[11px] uppercase tracking-wider">{m.full_name || m.display_name || 'No Name'}</div>
                                    <div className="text-[10px] text-gray-400 font-bold tracking-widest">{m.phone}</div>
                                  </div>
                                  <div className="text-[#1A1A18] font-black text-[10px] bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">
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
                          className="w-full h-12 bg-[#1A1A18] hover:bg-black text-white font-black rounded-xl transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center disabled:opacity-50 shadow-md"
                        >
                          {isSearchingMember ? <Loader2 className="animate-spin" size={16} /> : (locale === 'en' ? 'Search Member' : 'ค้นหาสมาชิก')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-center">
                          <QRCodeSVG
                            value={`https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi'}/#?path=/member`}
                            size={110}
                            level="M"
                            includeMargin={true}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-wider">
                          {locale === 'en' ? 'Scan to collect points' : 'สแกนเพื่อสะสมแต้ม หรือรับจากใบเสร็จ'}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="mt-2">
                <details className="relative group w-full">
                  <summary className="w-full h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[#1A1A18] hover:bg-gray-50 transition-all cursor-pointer list-none [&::-webkit-details-marker]:hidden shadow-sm active:scale-95">
                    <Printer size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{locale === 'en' ? 'Print Options' : 'ตัวเลือกการพิมพ์'}</span>
                  </summary>
                  <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden z-50 border border-gray-100 animate-in slide-in-from-bottom-2 fade-in">
                    <button 
                      onClick={() => { handlePrintReceipt(); document.querySelector('details[open]')?.removeAttribute('open') }} 
                      className="w-full px-5 py-4 text-[11px] font-black tracking-widest text-[#1A1A18] text-center hover:bg-gray-50 border-b border-gray-100 uppercase transition-colors"
                    >
                      {locale === 'en' ? 'Print Receipt' : 'พิมพ์ใบเสร็จ'}
                    </button>
                    <button 
                      onClick={() => { handlePrintKitchen(); document.querySelector('details[open]')?.removeAttribute('open') }} 
                      className="w-full px-5 py-4 text-[11px] font-black tracking-widest text-gray-500 text-center hover:bg-gray-50 hover:text-black uppercase transition-colors"
                    >
                      {locale === 'en' ? 'Print Kitchen' : 'พิมพ์ใบครัว'}
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
