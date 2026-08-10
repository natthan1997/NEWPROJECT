'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PromoBannerSlider } from '@/components/pos/PromoBannerSlider';
import { getUserCurrentLocation, verifyUserIsAtShopLocation } from '@/lib/shopLocation';
import {
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  MapPin,
  Plus,
  PlusCircle,
  Minus,
  ShoppingCart,
  Search,
  X,
  Navigation,
  History,
  Truck,
  CheckCircle2,
  Star,
  Bell,
  Clock,
  Loader2,
  Target,
  Home as HomeIcon,
  Briefcase,
  Map as MapIcon,
  Pencil,
  Check,
  Trash2,
  ChevronLeft,
  Ticket,
  AlertCircle
} from 'lucide-react';
import XYLLoader from '@/components/loaders/XYLLoader';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useLiff } from '@/components/liff/LiffProvider';
import { BannerSkeleton, CategorySkeleton, MenuRowSkeleton } from '@/components/liff/LiffSkeleton';

import { calculateDistance, getDeliveryFee } from '@/lib/geoUtils';
import { useI18n } from "@/lib/I18nContext";
import { getMenuSearchText, getPrimaryMenuName, getSecondaryMenuName } from '@/lib/posMenuLabels'
import { sortMenuItemsByOrder } from '@/lib/posMenuOrder'

const GOOGLE_MAPS_LIBRARIES: any[] = ["places"];



const PrepIcon = ({ isActive }: { isActive: boolean }) => (
  <g>
    {isActive && <circle r="35" fill="#10B981" opacity="0.15" />}
    <g className={isActive ? "wiggle-anim" : ""}>
      <ellipse cx="0" cy="8" rx="18" ry="14" fill={isActive ? "#10B981" : "#94A3B8"} />
      <circle cx="0" cy="5" r="7.5" fill={isActive ? "#064E3B" : "#475569"} />
      <g className={isActive ? "shaker-move" : ""}>
        <path d="M-10 6 Q -8 -6, -4 -10" stroke={isActive ? "#10B981" : "#94A3B8"} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M10 6 Q 8 -6, 4 -10" stroke={isActive ? "#10B981" : "#94A3B8"} strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="-5" y="-22" width="10" height="18" rx="2" fill="#334155" />
        <rect x="-6" y="-16" width="12" height="3" fill="#475569" />
      </g>
    </g>
  </g>
);

const DeliveryIcon = ({ isActive }: { isActive: boolean }) => {
  const primary = isActive ? "#10B981" : "#94A3B8";
  const dark = isActive ? "#064E3B" : "#475569";
  return (
    <g>
      {isActive && <circle r="40" fill="#10B981" opacity="0.1" />}
      {isActive && (
        <g>
          <line x1="-45" y1="-15" x2="-25" y2="-15" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" className="speed-anim-1" />
          <line x1="-50" y1="0" x2="-30" y2="0" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" className="speed-anim-2" />
          <line x1="-45" y1="15" x2="-25" y2="15" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" className="speed-anim-3" />
        </g>
      )}
      <g className={isActive ? "wiggle-anim" : ""}>
        <rect x="-25" y="-3" width="50" height="6" rx="3" fill="#CBD5E1" opacity="0.6" />
        <rect x="18" y="-15" width="4" height="30" rx="2" fill="#1E293B" />
        <circle cx="20" cy="-15" r="2.5" fill="#000" />
        <circle cx="20" cy="15" r="2.5" fill="#000" />
        <ellipse cx="-4" cy="0" rx="18" ry="14" fill={primary} />
        <circle cx="8" cy="0" r="8" fill={dark} />
        <rect x="6" y="-4" width="6" height="2" rx="1" fill="#FFF" opacity="0.2" />
        <path d="M-4 -10 Q 15 -12, 18 -12" stroke={primary} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M-4 10 Q 15 12, 18 12" stroke={primary} strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="-22" y="-9" width="12" height="18" rx="2" fill={isActive ? "#059669" : "#475569"} />
      </g>
    </g>
  );
};

const CompletedIcon = ({ isActive }: { isActive: boolean }) => (
  <g>
    {isActive && <circle r="35" fill="#10B981" opacity="0.15" />}
    <g className={isActive ? "wiggle-anim" : ""}>
      <circle r="22" fill={isActive ? "#10B981" : "#94A3B8"} />
      <path d="M-10 0 L-2 8 L10 -8" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
);

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  sale_price: number;
  image_url?: string;
  category_id: string;
  is_recommended?: boolean;
  modifiers?: { group_id: string }[];
}

interface Category {
  id: string;
  name: string;
}

const ORDER_NOTE_LABEL = 'หมายเหตุ';
const normalizeNoteText = (value?: string | null) => String(value || '').trim();
const buildOrderItemModifiers = (selectedModifiers: any[] = [], note?: string | null) => {
  const normalizedNote = normalizeNoteText(note);
  const modifiersWithoutNote = (selectedModifiers || []).filter((modifier: any) => String(modifier?.name || '') !== ORDER_NOTE_LABEL);
  if (!normalizedNote) return modifiersWithoutNote;
  return [
    ...modifiersWithoutNote,
    { name: ORDER_NOTE_LABEL, value: normalizedNote, is_note: true },
  ];
};
const formatCartModifierLine = (modifier: any) => {
  if (!modifier) return '';
  const name = modifier.display_name || modifier.label || modifier.group_name || modifier.name || '';
  const value = modifier.value || modifier.selected_value || modifier.option_value || modifier.option_name || '';
  const price = modifier.price_adjustment && modifier.price_adjustment > 0 ? ` (+฿${modifier.price_adjustment * (modifier.qty || 1)})` : '';
  const qtyPrefix = modifier.qty > 1 ? `${modifier.qty}x ` : '';
  if (value && value !== name) return `${qtyPrefix}${name}: ${value}${price}`;
  return `${qtyPrefix}${name}${price}`;
};
const getCartModifierSummary = (item: any) =>
  buildOrderItemModifiers(item.selected_modifiers || [], item.note)
    .map(formatCartModifierLine)
    .filter(Boolean)
    .join(', ');

export default function LiffMenuPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('path');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const path = params.get('path');
    if (path && path.startsWith('/')) {
      const claimToken = params.get('claimToken');
      let target = path;
      if (claimToken && !target.includes('claimToken=')) {
        const sep = target.includes('?') ? '&' : '?';
        target += `${sep}claimToken=${claimToken}`;
      }
      router.replace(target);
    }
  }, [searchParams, router]);

  

  // 🛡️ Boutique Shared Context
  const { 
    lineProfile, 
    phone, setPhone, 
    address, setAddress, 
    addressShort, setAddressShort,
    loading: liffLoading,
    liff,
    // 🌍 Global cached data from LiffProvider
    categories: ctxCategories,
    banners: ctxBanners,
    bestSellers: ctxBestSellers,
    shopStatus: ctxShopStatus,
    activeOrders: ctxActiveOrders,
    memberInfo: ctxMemberInfo,
    isDataReady,
    hasSeenLoader,
    refreshShopStatus,
    refreshActiveOrders,
    setActiveOrders: ctxSetActiveOrders,
  } = useLiff();

  const [categories, setCategories] = useState<any[]>([]);
  const [isFetchingItems, setIsFetchingItems] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const isManualScrolling = useRef(false);
  const manualScrollTimeout = useRef<any>(null);
  const [regularItemIds, setRegularItemIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lang, setLang] = useState<'th' | 'en'>('th');

  const [cart, setCart] = useState<any[]>([]);
  const [cartShake, setCartShake] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSweetnessOpen, setIsSweetnessOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectedSweetness, setSelectedSweetness] = useState('100%');
  
  // 🎟️ Loyalty & Coupons
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<any | null>(null);
  const [memberCoupons, setMemberCoupons] = useState<any[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);
  const [tempSelectedModifiers, setTempSelectedModifiers] = useState<any[]>([]);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [errorGroupId, setErrorGroupId] = useState<string | null>(null);

  const [shakePhone, setShakePhone] = useState(false);
  const [shakeAddress, setShakeAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [tempAddressShort, setTempAddressShort] = useState('');
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [addressView, setAddressView] = useState<'list' | 'map'>('list');
  const [swipedAddressId, setSwipedAddressId] = useState<string | null>(null);
  const [recentAddresses, setRecentAddresses] = useState<any[]>([]);
  const [tempPin, setTempPin] = useState<{lat: number, lng: number} | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);



  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 18.7810, lng: 99.0927 });
  const mapRef = useRef<google.maps.Map | null>(null);

    const handleLocationMapLoad = useCallback((map: google.maps.Map) => {
      mapRef.current = map;

      if (window.google?.maps?.RenderingType?.RASTER) {
        map.setOptions({
          renderingType: window.google.maps.RenderingType.RASTER,
        });
      }
    }, []);

  const getDefaultPickupTime = useCallback(() => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + 30)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }, [])
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'th',
    region: 'th'
  });

  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other' | string>('Other');
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);

  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod');
  const [isInternalRedirectOpen, setIsInternalRedirectOpen] = useState(false);
  const [internalRedirectUrl, setInternalRedirectUrl] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkoutLockRef = useRef(false);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ average: 5.0, count: 0 });
  const [bestSellingIds, setBestSellingIds] = useState<string[]>([]);
  const [bestSellingCounts, setBestSellingCounts] = useState<Record<string, number>>({});
  const [pickupTime, setPickupTime] = useState('');
  const [showPickupTimeModal, setShowPickupTimeModal] = useState(false);
  const [pickupTimeDraft, setPickupTimeDraft] = useState('');
  const [showPreorderConfirmModal, setShowPreorderConfirmModal] = useState(false);
  const [pendingPreorderAction, setPendingPreorderAction] = useState<(() => void) | null>(null);
  const [reorderAlertMessage, setReorderAlertMessage] = useState<string | null>(null);
  
  const [shopSettings, setShopSettings] = useState<any>({
    is_open: true,
    opening_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    status_message: '● ขณะนี้ร้านปิดรับออเดอร์'
  });
  const [allShopSettings, setAllShopSettings] = useState<any[]>([]);
  const [isShopEffectivelyOpen, setIsShopEffectivelyOpen] = useState(true);
  const [isPreorderMode, setIsPreorderMode] = useState(false);
  const [preorderTime, setPreorderTime] = useState<string>('');
  const [closeMessage, setCloseMessage] = useState<string>('');
  const [openingHoursText, setOpeningHoursText] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [upsellItem, setUpsellItem] = useState<any>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string | null>(null);
  const [isAddressDetailOpen, setIsAddressDetailOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDetail, setAddressDetail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [mapSheetHeight, setMapSheetHeight] = useState(220);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const hasInitializedLocationRef = useRef(false);
  const locationSheetStartHeightRef = useRef(260);
  const LOCATION_SHEET_MIN_HEIGHT = 112;
  const LOCATION_SHEET_MAX_HEIGHT = 430;
  const LOCATION_SHEET_DEFAULT_HEIGHT = 220;
  const LOCATION_SHEET_SNAP_POINTS = [LOCATION_SHEET_MIN_HEIGHT, LOCATION_SHEET_DEFAULT_HEIGHT, LOCATION_SHEET_MAX_HEIGHT];
  const isMapSheetExpanded = mapSheetHeight > 250;


  


  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isDataReady);
  const [activeBranch, setActiveBranch] = useState<any>(null);

  const generateTimeOptions = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const tomorrowIndex = (new Date().getDay() + 1) % 7;
    const tomorrowDayName = days[tomorrowIndex];
    const tomorrowSettings = shopSettings?.opening_hours?.[tomorrowDayName];

    if (!tomorrowSettings || tomorrowSettings.closed) {
      return ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    }

    const [openH, openM] = (tomorrowSettings.open || '08:00').split(':').map(Number);
    const [closeH, closeM] = (tomorrowSettings.close || '18:00').split(':').map(Number);
    
    const options = [];
    let currentMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    while (currentMinutes <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push(timeStr);
      currentMinutes += 30;
    }

    return options;
  };

  // 🚀 Seed local states from global context immediately (no wait for DB calls)
  useEffect(() => {
    if (isDataReady) {
      if (ctxCategories.length > 0 && categories.length === 0) setCategories(ctxCategories as any);
      if (ctxBanners.length > 0 && banners.length === 0) setBanners(ctxBanners);
      if (ctxActiveOrders.length > 0 && activeOrders.length === 0) setActiveOrders(ctxActiveOrders);
      if (ctxMemberInfo && !memberInfo) setMemberInfo(ctxMemberInfo);
      if (ctxShopStatus) setShopSettings(ctxShopStatus);
      setLoading(false);
    }
  }, [isDataReady, ctxCategories, ctxBanners, ctxBestSellers, ctxActiveOrders, ctxMemberInfo, ctxShopStatus]);

  // Robust address formatter for LIFF
    const formatAddressShort = (addr: string) => {
        if (!addr || addr.trim() === '' || addr.trim() === ':') return 'เลือกที่อยู่จัดส่ง';
        
        // 1. Sanitize: Remove noise and technical data
        let clean = addr
          .replace(/ตำแหน่งปัจจุบัน|พิกัด|พัดกัก|พิกัด:|พัดกัก:|Coordinates:|position:|lat:|lng:|📍/gi, '')
          .replace(/-?\d+\.\d+\s*,\s*-?\d+\.\d+/g, '')
          .replace(/[.:;]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
    
        if (!clean || clean === '' || clean === ':') return 'เลือกที่อยู่จัดส่ง';
    
        // 2. Extract Thai Sub-district and District
        const sub = clean.match(/(?:แขวง|ต\.)\s?([^,\s\d]+)/)?.[1];
        const dist = clean.match(/(?:เขต|อ\.)\s?([^,\s\d]+)/)?.[1];
    
        if (sub && dist) return `${sub}, ${dist}`;
        if (dist) return dist;
        if (sub) return sub;
    
        // 3. Fallback: Clean string but limit
        return clean.length > 25 ? clean.substring(0, 25) + '...' : clean;
      };

  const getCurrentUserId = () => lineProfile?.userId || (typeof window !== 'undefined' ? localStorage.getItem('xylem_line_user_id') : null);

  const buildDeliveryAddress = (baseAddress: string, detail: string) => {
    return detail ? `${detail} ${baseAddress}`.trim() : baseAddress.trim();
  };

  const stripAddressDetail = (fullAddress: string, detail?: string | null) => {
    if (!detail) return fullAddress;

    const normalizedFull = fullAddress.trim();
    const normalizedDetail = detail.trim();

    if (!normalizedDetail) return normalizedFull;
    if (normalizedFull.startsWith(`${normalizedDetail} `)) {
      return normalizedFull.slice(normalizedDetail.length).trim();
    }

    if (normalizedFull.startsWith(`${normalizedDetail},`)) {
      return normalizedFull.slice(normalizedDetail.length + 1).trim();
    }

    return normalizedFull;
  };

  const applyAddressSelection = (addr: any, closeSelector = true) => {
    setAddress(addr.full_address);
    setAddressShort(formatAddressShort(addr.full_address));
    setSelectedAddressId(addr.id);

    if (addr.latitude && addr.longitude) {
      const nextPin = { lat: Number(addr.latitude), lng: Number(addr.longitude) };
      setTempPin(nextPin);
      setMapCenter(nextPin);
    }

    if (closeSelector) {
      setIsAddressSelectorOpen(false);
      setAddressView('list');
      setMapSheetHeight(LOCATION_SHEET_DEFAULT_HEIGHT);
    }
  };

  const resetAddressDraft = () => {
    setEditingAddressId(null);
    setAddressLabel('Other');
    setAddressDetail('');
    setIsPrimary(false);
    setMapSheetHeight(LOCATION_SHEET_DEFAULT_HEIGHT);
  };

  const openNewAddressFlow = (saveToBook = false) => {
    resetAddressDraft();
    setSaveToAddressBook(saveToBook);
    setAddressView('map');
    if (!tempPin) setTempPin(mapCenter);
  };

  const openEditAddressFlow = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddressLabel(addr.label || 'Other');
    setAddressDetail(addr.address_detail || '');
    setIsPrimary(Boolean(addr.is_primary));
    setTempAddress(stripAddressDetail(addr.full_address, addr.address_detail));
    setTempAddressShort(formatAddressShort(addr.full_address));

    if (addr.latitude && addr.longitude) {
      const nextPin = { lat: Number(addr.latitude), lng: Number(addr.longitude) };
      setTempPin(nextPin);
      setMapCenter(nextPin);
    }

    setAddressView('map');
    setMapSheetHeight(LOCATION_SHEET_DEFAULT_HEIGHT);
  };

  const refreshSavedAddresses = async () => {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const { data } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('line_user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setSavedAddresses(data);
      return data;
    }

    return [];
  };

  const setPrimaryAddress = async (addr: any) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsProcessing(true);

    try {
      await supabase
        .from('saved_addresses')
        .update({ is_primary: false })
        .eq('line_user_id', userId);

      await supabase
        .from('saved_addresses')
        .update({ is_primary: true })
        .eq('id', addr.id);

      await refreshSavedAddresses();
      applyAddressSelection({ ...addr, is_primary: true }, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteSavedAddress = async (addrId: string) => {
    if (!window.confirm(locale === 'en' ? 'Are you sure you want to delete this address?' : 'คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?')) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addrId);

      if (error) {
        console.error('Delete address error:', error);
        alert('ไม่สามารถลบที่อยู่ได้: ' + error.message);
        return;
      }

      if (selectedAddressId === addrId) {
        setSelectedAddressId(null);
        setAddress('เลือกที่อยู่จัดส่ง');
        setAddressShort('เลือกที่อยู่จัดส่ง');
      }

      await refreshSavedAddresses();
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Handle Redirects and Cart Open from URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId') || params.get('trackId');
    const action = params.get('action');
    const openCart = params.get('openCart');
    
    if (orderId) {
      let dest = `/liff/track/${orderId}`;
      if (action) dest += `?action=${action}`;
      router.push(dest);
    } else {
      if (openCart === '1') {
        try {
          const storedCart = localStorage.getItem('xylem_cart');
          if (storedCart) {
            setCart(JSON.parse(storedCart));
            setIsCartOpen(true);
          }
        } catch (e) {}
      }
      if (params.get('preorder') === '1') {
        setIsPreorderMode(true);
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    try {
      const storedCart = localStorage.getItem('xylem_cart');
      if (storedCart) setCart(JSON.parse(storedCart));
    } catch (e) {
      console.error('Failed to load storage:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (pendingItem || isCartOpen || isAddressSelectorOpen || isPaymentOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }
    return () => {
      if (typeof window !== 'undefined') document.body.style.overflow = 'unset';
    };
  }, [pendingItem, isCartOpen, isAddressSelectorOpen, isPaymentOpen]);

  // 📍 Automated Delivery Selection on Entry
  useEffect(() => {
    if (isMounted && isLoaded && lineProfile?.userId && !hasInitializedLocationRef.current) {
      hasInitializedLocationRef.current = true;

      const initLocation = async () => {
        const located = await detectLocation({ openMap: false, applyToCheckout: true, silent: true });
        await refreshSavedAddresses();

        if (!located) {
          const { data: primaryAddr } = await supabase
            .from('saved_addresses')
            .select('*')
            .eq('line_user_id', lineProfile.userId)
            .eq('is_primary', true)
            .maybeSingle();

          if (primaryAddr) {
            applyAddressSelection(primaryAddr, false);
          }
        }
      };

      initLocation();
    }
  }, [isMounted, isLoaded, lineProfile]);

  useEffect(() => {
    if (cart.length > 0) localStorage.setItem('xylem_cart', JSON.stringify(cart));
    else localStorage.removeItem('xylem_cart');
  }, [cart]);

  useEffect(() => {
    const memId = memberInfo?.id || ctxMemberInfo?.id;
    if (memId) {
      const fetchCoupons = async () => {
        const { data, error } = await supabase
          .from('pos_member_coupons')
          .select('*, pos_loyalty_coupons(*)')
          .eq('member_id', memId)
          .in('status', ['active', 'claiming']);
          
        if (error) {
          console.error('Error fetching member coupons:', error);
        } else if (data) {
          // Filter out coupons that are explicitly disabled for delivery
          const deliveryCoupons = data
            .filter((c: any) => c.pos_loyalty_coupons?.is_applicable_delivery !== false)
            .map((c: any) => ({
              ...c,
              ...c.pos_loyalty_coupons, // Merge loyalty coupon details (e.g. discount_type, discount_value, name)
              id: c.id, // Keep member coupon id
              coupon_id: c.coupon_id // Keep original coupon reference
            }));
          setMemberCoupons(deliveryCoupons);
        }
      };
      fetchCoupons();
    } else {
      setMemberCoupons([]);
    }
  }, [memberInfo?.id, ctxMemberInfo?.id, supabase]);

  useEffect(() => {
    const fetchCategories = async (branchId?: string) => {
      const targetBranchId = branchId || shopSettings?.branch_id;
      const url = targetBranchId ? `/api/cache/menu?branchId=${targetBranchId}` : '/api/cache/menu';

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error fetching menu cache');
        const json = await response.json();
        
        if (json.data) {
          if (json.data.categories) setCategories(json.data.categories);
          if (json.data.items) setItems(sortMenuItemsByOrder(json.data.items));
        }
      } catch (error) {
        console.error('Fetch Menu Cache Error:', error);
      } finally {
        setIsFetchingItems(false);
      }
    };

    const fetchActiveOrders = async () => {
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      if (!userId) return;

      // --- 👤 Member Sync & Loyalty ---
      const { data: member, error: memberErr } = await supabase
          .from('pos_members')
          .select('*')
          .eq('line_user_id', userId)
          .maybeSingle();

      if (member) {
          setMemberInfo(member);
      } else if (lineProfile) {
          // New Member Auto-Register
          const { data: newMember } = await supabase
              .from('pos_members')
              .insert([{ 
                  line_user_id: lineProfile.userId,
                  display_name: lineProfile.displayName,
                  avatar_url: lineProfile.pictureUrl
              }])
              .select()
              .single();
          if (newMember) setMemberInfo(newMember);
      }


      
      const { data, error } = await supabase
        .from('pos_orders')
        .select('*')
        .eq('line_user_id', userId)
        .in('status', ['pending', 'paid', 'accepted', 'preparing', 'shipping', 'out_for_delivery', 'completed', 'delivered'])
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Fetch active orders failed:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const primaryOrder = data[0];
        
        // 📊 QUEUE TRACKING LOGIC: prefer the stored queue_number so LIFF,
        // POS and kitchen tickets all show the same queue.
        let queueAhead = 0;
        if (['pending', 'paid', 'accepted', 'preparing'].includes(primaryOrder.status)) {
          const storedQueue = Number(primaryOrder.queue_number);
          if (Number.isFinite(storedQueue) && storedQueue > 0) {
            queueAhead = Math.max(0, storedQueue - 1);
          } else {
            let queueQuery = supabase
              .from('pos_orders')
              .select('*', { count: 'exact', head: true })
              .in('status', ['pending', 'paid', 'accepted', 'preparing'])
              .lt('created_at', primaryOrder.created_at);
            if (primaryOrder.shift_id) queueQuery = queueQuery.eq('shift_id', primaryOrder.shift_id);
            const { count } = await queueQuery;
            queueAhead = count || 0;
          }
        }

        const now = new Date();
        let nextCleanupDelay = 0;

        const filtered = data.filter(o => {
          if (!['completed', 'delivered'].includes(o.status)) return true;
          const updated = new Date(o.updated_at || o.created_at);
          const elapsed = now.getTime() - updated.getTime();
          const gracePeriod = 6000; // 6 seconds
          
          if (elapsed < gracePeriod) {
            // Calculate how much time is left to show this order
            const remaining = gracePeriod - elapsed;
            nextCleanupDelay = Math.max(nextCleanupDelay, remaining + 100);
            return true;
          }
          return false;
        });
        
        // ⏱️ AUTO-CLEANUP TIMER
        if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
        if (nextCleanupDelay > 0) {
          cleanupTimeoutRef.current = setTimeout(() => {
            fetchActiveOrders();
          }, nextCleanupDelay);
        }

        if (filtered.length > 0) {
           (filtered[0] as any).queue_ahead = queueAhead;
        }
        setActiveOrders(filtered);
      } else {
        setActiveOrders([]);
      }
    };

    const fetchRecentReviews = async () => {
      const { data } = await supabase
        .from('pos_orders')
        .select(`
          customer_name, 
          customer_image, 
          rating, 
          comment,
          pos_order_items (
            item:pos_menu_items!pos_order_items_item_id_fkey (name)
          )
        `)
        .gt('rating', 0)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setRecentReviews(data.slice(0, 10));
      }

      // Fetch rating stats
      const { data: statsData } = await supabase
        .from('pos_orders')
        .select('rating')
        .gt('rating', 0);
        
      if (statsData && statsData.length > 0) {
        const count = statsData.length;
        const avg = statsData.reduce((acc, curr) => acc + curr.rating, 0) / count;
        setReviewStats({ average: avg, count });
      }
    };

    const fetchBestSellers = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: sales } = await supabase
        .from('pos_order_items')
        .select('item_id, quantity, pos_orders!inner(status)')
        .gte('created_at', startOfMonth.toISOString())
        .neq('pos_orders.status', 'cancelled')
        .neq('pos_orders.status', 'void')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (sales) {
        const counts: Record<string, number> = {};
        sales.forEach(s => {
          counts[s.item_id] = (counts[s.item_id] || 0) + (s.quantity || 1);
        });
        const sortedIds = Object.keys(counts)
          .sort((a, b) => counts[b] - counts[a]);
        setBestSellingIds(sortedIds);
        setBestSellingCounts(counts);
      }
    };

    const fetchRegularItems = async () => {
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      if (!userId) return;
      try {
        const res = await fetch(`/api/liff/customer/regulars?line_user_id=${userId}`);
        const data = await res.json();
        if (data.regulars) {
          setRegularItemIds(data.regulars);
        }
      } catch (err) {
        console.error('Failed to fetch regular items:', err);
      }
    };

    const fetchLatestCompletedOrder = async () => {
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      if (!userId) return;
      try {
        const { data: recentOrders, error } = await supabase
          .from('pos_orders')
          .select(`*, items:pos_order_items(*)`)
          .eq('line_user_id', userId)
          .in('status', ['completed', 'delivered'])
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (recentOrders && recentOrders.length > 0) {
          setLatestOrders(recentOrders);
        }
      } catch (err) {
        console.error('Failed to fetch recent orders:', err);
      }
    };

    const fetchShopStatus = async () => {
      try {
        // Attempt to find the first settings record that is linked to a branch
        const { data: allSettings, error: settingsError } = await supabase
          .from('pos_shop_settings')
          .select('*, branches!branch_id(*)');
        
        if (settingsError) throw settingsError;
        if (!allSettings || allSettings.length === 0) {
            setIsShopEffectivelyOpen(false);
            setCloseMessage('● ร้านปิดให้บริการ (กรุณาติดต่อเจ้าหน้าที่)');
            setOpeningHoursText('#ef4444');
            return;
        }

        let baseSettings = allSettings.find(s => s.status !== 'closed' && s.is_open !== false);
        if (!baseSettings) {
           // Fallback to the first setting that has a branch_id to ensure menus still load when closed
           baseSettings = allSettings.find(s => s.branch_id) || allSettings[0];
        }

        const settings = {
            ...baseSettings,
            // Override with branch coordinates if available to avoid redundancy
            latitude: baseSettings.branches?.latitude || baseSettings.latitude,
            longitude: baseSettings.branches?.longitude || baseSettings.longitude
        };
        
        setAllShopSettings(allSettings.map(s => ({
            ...s,
            latitude: s.branches?.latitude || s.latitude,
            longitude: s.branches?.longitude || s.longitude
        })));
        
        if (settingsError) throw settingsError;
        
        // Default to CLOSED if no settings or error (Safety First)
        if (!settings) {
            setIsShopEffectivelyOpen(false);
            setCloseMessage('● ร้านปิดให้บริการ (กรุณาติดต่อเจ้าหน้าที่)');
            setOpeningHoursText('#ef4444');
            return;
        }
        
        setShopSettings(settings);

        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[now.getDay()];
        const daySettings = settings.opening_hours?.[dayName];
        
        let effectivelyOpen = true;
        let statusColor = '#10b981'; // Green
        let statusText = '● เปิดให้บริการ';

        // 1. Check Global Manual Toggle (is_open)
        if (settings.is_open === false) {
          effectivelyOpen = false;
          statusColor = '#ef4444';
          statusText = '● ขณะนี้ร้านปิดให้บริการ';
        } 
        // 2. Check Specific Status (Paused/Closed)
        else if (settings.status === 'paused' || settings.status === 'closed') {
          effectivelyOpen = false;
          if (settings.status_expiry) {
            const expiry = new Date(settings.status_expiry);
            if (now < expiry) {
              const timeStr = expiry.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              statusColor = settings.status === 'paused' ? '#f59e0b' : '#ef4444';
              statusText = settings.status === 'paused' ? `● หยุดรับออเดอร์ชั่วคราว (เปิด ${timeStr} น.)` : `● ร้านปิดแล้ว (เปิดอีกครั้ง ${timeStr} น.)`;
            } else {
               statusColor = '#ef4444';
               statusText = settings.status === 'paused' ? '● ขณะนี้ร้านหยุดรับออเดอร์ชั่วคราว' : '● ขณะนี้ร้านปิดให้บริการแล้ว';
            }
          } else {
            statusColor = '#ef4444';
            statusText = settings.status === 'paused' ? '● ขณะนี้ร้านหยุดรับออเดอร์ชั่วคราว' : '● ขณะนี้ร้านปิดให้บริการแล้ว';
          }
        }
        // 3. Check Opening Hours
        else if (daySettings) {
          if (daySettings.closed) {
            effectivelyOpen = false;
            statusColor = '#ef4444';
            statusText = '● วันนี้ร้านปิดให้บริการ';
          } else {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [openH, openM] = (daySettings.open || '08:00').split(':').map(Number);
            const [closeH, closeM] = (daySettings.close || '18:00').split(':').map(Number);
            const openTime = openH * 60 + openM;
            const closeTime = closeH * 60 + closeM;

            if (currentTime < openTime || currentTime > closeTime) {
              effectivelyOpen = false;
              statusColor = '#ef4444';
              const nextDayName = days[(now.getDay() + 1) % 7];
              const nextDaySettings = settings.opening_hours?.[nextDayName];
              statusText = `● ร้านปิด (เริ่มสั่งได้พรุ่งนี้ ${nextDaySettings?.open || '08:00'} น.)`;
            } else {
              statusColor = '#10b981';
              statusText = `● เปิดให้บริการ ${daySettings.open} - ${daySettings.close} น.`;
            }
          }
        }

        // 4. Check for Active Shift (Global Security Layer)
        let shiftQuery = supabase.from('pos_shifts').select('id').eq('status', 'open').limit(1);
        if (settings.branch_id) {
          shiftQuery = shiftQuery.eq('branch_id', settings.branch_id);
        }
        const { data: activeShifts, error: shiftError } = await shiftQuery;
        if (shiftError) console.error('Shift error:', shiftError);
        
        const isShiftActive = activeShifts && activeShifts.length > 0;

        if (!isShiftActive) {
            effectivelyOpen = false;
            statusColor = '#ef4444';
            statusText = statusText.includes('พรุ่งนี้') ? statusText : '● ขณะนี้ร้านปิดให้บริการ (Staff Offline)';
        }

        setIsShopEffectivelyOpen(effectivelyOpen);
        setCloseMessage(statusText);
        setOpeningHoursText(statusColor);
        return settings;
      } catch (err: any) {
        console.error('Error fetching shop status:', err);
        // Safety Fallback: Default to CLOSED on error
        setIsShopEffectivelyOpen(false);
        // Provide error detail to help debugging
        const detail = err.message || err.code || 'Unknown';
        setCloseMessage(`● ร้านปิดให้บริการชั่วคราว (Sync Error: ${detail})`);
        setOpeningHoursText('#ef4444');
      }
    };

    const fetchBanners = async () => {
      const { data } = await supabase.from('pos_banners').select('*').eq('is_active', true).order('order_index');
      if (data && data.length > 0) {
        setBanners(data);
      }
    };

    const fetchSavedAddresses = async () => {
      await refreshSavedAddresses();
    };

    const fetchMemberInfo = async () => {
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      if (!userId) return;
      
      const { data } = await supabase
        .from('pos_members')
        .select('*')
        .eq('line_user_id', userId)
        .maybeSingle();
      
      if (data) {
        setMemberInfo(data);
        if (data.phone) setPhone(data.phone);
      }
    };

    // 🔄 REAL-TIME SUBSCRIPTION: Shop Status Monitoring (Hardened Singleton)
    const channelStatus = supabase
      .channel('liff-shop-monitor')
      .on('postgres_changes', { 
         event: '*', 
         schema: 'public', 
         table: 'pos_shop_settings',
      }, (payload) => {
          console.log('🔔 [REALTIME] Shop Status Change:', payload.new);
          fetchShopStatus();
          // Safety re-fetch for race conditions
          setTimeout(fetchShopStatus, 800);
      })
      .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'pos_shifts',
      }, (payload) => {
          console.log('🔔 [REALTIME] Shift Status Change:', payload.new);
          fetchShopStatus();
          setTimeout(fetchShopStatus, 800);
      })
      .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'pos_menu_items',
      }, (payload) => {
          console.log('🔔 [REALTIME] Menu Item Change:', payload.new);
          fetchCategories();
      })
      .subscribe((status, err) => {
         console.log('📡 [REALTIME] Shop Sync Status:', status, err || '');
      });

    // 🔄 REAL-TIME SUBSCRIPTION: Personal Orders Tracking
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    let channelOrders: any = null;
    if (userId) {
      console.log('📡 [REALTIME] Monitoring orders for:', userId);
      channelOrders = supabase
        .channel(`liff-orders-sync-${userId}`)
        .on('postgres_changes', { 
           event: 'UPDATE', 
           schema: 'public', 
           table: 'pos_orders'
        }, (payload) => {
            const newOrder = payload.new as any;
            const oldOrder = payload.old as any;
           
            // Check if this update belongs to the current user
            const targetId = newOrder?.line_user_id || oldOrder?.line_user_id;
            if (targetId === userId) {
               console.log('✅ [REALTIME] Status changed (Preparing/Shipping/Ready). Refreshing...');
               fetchActiveOrders();
               fetchShopStatus(); // Updates the order status overlay
            }
        })
        .subscribe((status, err) => {
           console.log('📡 [REALTIME] Order Channel Status:', status, err || '');
        });
    }

    // --- 🚀 INITIAL DATA LOAD ---
    const loadAllData = async () => {
      setLoading(true);
      const settings = await fetchShopStatus();
      const branchId = settings?.branch_id;

      await Promise.all([
        fetchCategories(branchId),
        fetchActiveOrders(),
        fetchBanners(),
        fetchSavedAddresses(),
        fetchMemberInfo(),
        fetchRecentReviews(),
        fetchBestSellers(),
        fetchRegularItems(),
        fetchLatestCompletedOrder()
      ]);
      setLoading(false);
      // ✅ Mark as seen for this session to avoid repeated full-screen loaders when navigating back
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('xyl_has_seen_loader', 'true');
      }
    };
    
    loadAllData();

    return () => { 
      supabase.removeChannel(channelStatus); 
      if (channelOrders) supabase.removeChannel(channelOrders);
    };
  }, [supabase, lineProfile]);

  // 🛒 GLOBAL CART PERSISTENCE & AUTO-OPEN
  useEffect(() => {
    const saved = localStorage.getItem('xylem_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed);
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
    // Auto-open cart if redirected from history
    if (searchParams.get('openCart') === '1') {
      setIsCartOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('xylem_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const filteredItems = items.filter(item => {
    const matchesSearch = getMenuSearchText(item).includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const menuSections = [
    ...categories,
    { id: 'uncategorized', name: 'อื่นๆ' }
  ];

  // Scroll Spy for categories with cached offsets
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let sectionOffsets: { id: string; top: number; bottom: number }[] = [];
    
    const calculateOffsets = () => {
      const sections = document.querySelectorAll('.scroll-spy-section');
      const tempOffsets: { id: string; top: number; bottom: number }[] = [];
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const height = (section as HTMLElement).offsetHeight;
        const rawId = section.id.replace('category-', '');
        const mappedId = (rawId === 'regulars' || rawId === 'popular' || rawId === 'all') ? 'all' : rawId;
        
        tempOffsets.push({
          id: mappedId,
          top: top,
          bottom: top + height
        });
      });
      sectionOffsets = tempOffsets;
    };

    calculateOffsets();
    
    window.addEventListener('resize', calculateOffsets);
    const initTimeout = setTimeout(calculateOffsets, 500);
    const initTimeout2 = setTimeout(calculateOffsets, 1500);

    const handleScroll = () => {
      if (isManualScrolling.current) return;
      
      const scrollPosition = window.scrollY + 175; // Offset for header + tabs
      let currentActiveId = 'all';
      
      for (const section of sectionOffsets) {
        if (scrollPosition >= section.top && scrollPosition < section.bottom) {
          currentActiveId = section.id;
          break;
        }
      }

      if (window.scrollY < 100) {
        currentActiveId = 'all';
      }
      
      setActiveCategoryId((prevId) => {
        if (prevId !== currentActiveId) {
          const tab = document.getElementById(`tab-${currentActiveId}`);
          const container = document.getElementById('category-tabs-container');
          if (tab && container) {
            container.scrollTo({
              left: tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2,
              behavior: 'smooth'
            });
          }
          return currentActiveId;
        }
        return prevId;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(initTimeout);
      clearTimeout(initTimeout2);
      window.removeEventListener('resize', calculateOffsets);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [categories, items]);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => {
    const modsPrice = item.selected_modifiers?.reduce((macc: number, m: any) => macc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0;
    return acc + ((item.sale_price + modsPrice) * item.quantity);
  }, 0), [cart]);

  const couponDiscountCalc = useMemo(() => {
    if (!activeCoupon) return 0;
    
    // Check minimum spend
    if (activeCoupon.min_order_amount > 0 && cartTotal < activeCoupon.min_order_amount) {
      return 0; // Does not meet minimum spend
    }

    // Filter valid items for discount based on inclusions/exclusions
    const validItems = cart.filter(item => {
      // Excluded checks take precedence
      if (activeCoupon.excluded_items?.includes(item.id)) return false;
      if (activeCoupon.excluded_categories?.includes(item.category_id)) return false;
      
      // If applicable arrays are not empty, item must be in them
      if (activeCoupon.applicable_items?.length > 0 && !activeCoupon.applicable_items.includes(item.id)) return false;
      if (activeCoupon.applicable_categories?.length > 0 && !activeCoupon.applicable_categories.includes(item.category_id)) return false;
      
      return true;
    });

    if (validItems.length === 0) return 0;

    let discount = 0;
    
    if (activeCoupon.discount_type === 'percent') {
      const validItemsTotal = validItems.reduce((acc, item) => {
        const modsPrice = item.selected_modifiers?.reduce((macc: number, m: any) => macc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0;
        return acc + ((item.sale_price + modsPrice) * item.quantity);
      }, 0);
      discount = validItemsTotal * (activeCoupon.discount_value / 100);
    } else if (activeCoupon.discount_type === 'fixed_amount' || activeCoupon.discount_type === 'fixed') {
      discount = activeCoupon.discount_value;
    } else if (activeCoupon.discount_type === 'free_item') {
      // Since it's free item, we'll discount the lowest priced item in cart among valid items
      const minPricedItem = validItems.reduce((prev, curr) => prev.sale_price < curr.sale_price ? prev : curr);
      discount = minPricedItem.sale_price;
    }

    // Cap at max discount if specified
    if (activeCoupon.max_discount_amount && activeCoupon.max_discount_amount > 0) {
      if (discount > activeCoupon.max_discount_amount) {
        discount = activeCoupon.max_discount_amount;
      }
    }

    return discount;
  }, [activeCoupon, cartTotal, cart]);

  const totalDiscount = useMemo(() => pointsDiscount + couponDiscountCalc, [pointsDiscount, couponDiscountCalc]);

  const isFreeDelivery = useMemo(() => {
    const config = activeBranch?.inhouse_delivery_config || activeBranch?.opening_hours?.inhouse_delivery_config || shopSettings?.inhouse_delivery_config || shopSettings?.opening_hours?.inhouse_delivery_config;
    if (config?.enabled && config.free_delivery_threshold > 0) {
      return cartTotal >= config.free_delivery_threshold;
    }
    return false;
  }, [activeBranch, shopSettings, cartTotal]);

  const effectiveDeliveryFee = deliveryFee === -1 ? -1 : (isFreeDelivery ? 0 : deliveryFee);
  const grandTotal = useMemo(() => Math.max(0, cartTotal + (orderType === 'delivery' && effectiveDeliveryFee > 0 ? effectiveDeliveryFee : 0) - totalDiscount), [cartTotal, orderType, effectiveDeliveryFee, totalDiscount]);

  // 📍 Dynamic Distance-Based Delivery Fee Calculation
  useEffect(() => {
    if (orderType !== 'delivery' || !shopSettings?.latitude || !shopSettings?.longitude || !tempPin) {
      setDeliveryFee(0);
      setDeliveryDistance(null);
      return;
    }

    const calculateDynamicFee = async () => {
        const customerLat = tempPin.lat;
        const customerLng = tempPin.lng;

        let closestBranch = allShopSettings[0] || shopSettings;
        let distanceKm = Infinity;

        // Try using Google Maps API first if inhouse config is enabled
        const inhouseConfig = closestBranch?.inhouse_delivery_config || closestBranch?.opening_hours?.inhouse_delivery_config;
        if (inhouseConfig?.enabled) {
            try {
                const res = await fetch('/api/distance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originLat: closestBranch.latitude,
                        originLng: closestBranch.longitude,
                        destLat: customerLat,
                        destLng: customerLng
                    })
                });
                const data = await res.json();
                if (data.distanceKm !== undefined) {
                    distanceKm = data.distanceKm;
                }
            } catch (err) {
                console.error('Failed to get precise distance', err);
            }
        }

        // Fallback to Haversine
        if (distanceKm === Infinity) {
            let minDistance = Infinity;
            allShopSettings.forEach(branch => {
                if (branch.latitude && branch.longitude) {
                    const d = calculateDistance(branch.latitude, branch.longitude, customerLat, customerLng);
                    if (d < minDistance) {
                        minDistance = d;
                        closestBranch = branch;
                    }
                }
            });
            distanceKm = minDistance === Infinity 
                ? calculateDistance(Number(shopSettings.latitude), Number(shopSettings.longitude), Number(customerLat), Number(customerLng))
                : minDistance;
        }
            
        // Calculate Fee
        let fee = -1; // -1 means out of bounds
        if (inhouseConfig?.enabled) {
            if (distanceKm <= inhouseConfig.max_distance_km) {
                fee = inhouseConfig.base_price;
                if (distanceKm > inhouseConfig.base_distance_km) {
                    const extraKm = Math.ceil(distanceKm - inhouseConfig.base_distance_km);
                    fee += (extraKm * inhouseConfig.per_km_rate);
                }
            }
        } else {
            fee = getDeliveryFee(distanceKm, closestBranch?.delivery_fee_rules || closestBranch?.pricing_tiers || []);
        }

        setDeliveryFee(fee);
        setDeliveryDistance(distanceKm);
        setActiveBranch(closestBranch);
    };

    calculateDynamicFee();
  }, [orderType, shopSettings, tempPin, allShopSettings]);

  // 🔄 Re-fetch menus when the active branch changes (e.g. location changed)
  useEffect(() => {
    if (activeBranch?.branch_id && activeBranch.branch_id !== shopSettings?.branch_id) {
      const fetchBranchMenus = async () => {
        try {
          const response = await fetch(`/api/cache/menu?branchId=${activeBranch.branch_id}`);
          if (response.ok) {
            const json = await response.json();
            if (json.data) {
              if (json.data.categories && json.data.categories.length > 0) setCategories(json.data.categories);
              if (json.data.items && json.data.items.length > 0) setItems(sortMenuItemsByOrder(json.data.items));
            }
          }
        } catch (err) {
          console.error('Failed to fetch branch menu cache', err);
        }
      };
      fetchBranchMenus();
    }
  }, [activeBranch?.branch_id, shopSettings?.branch_id]);

  // ⚡ Upsell Selection Logic
  useEffect(() => {
    if (items.length > 0 && categories.length > 0) {
      const extras = items.filter(i => {
        const cat = categories.find(c => c.id === i.category_id);
        const name = cat?.name.toLowerCase() || '';
        return name.includes('dessert') || name.includes('snack') || name.includes('topping') || name.includes('extra');
      });
      if (extras.length > 0 && !upsellItem) {
        setUpsellItem(extras[Math.floor(Math.random() * extras.length)]);
      }
    }
  }, [items, categories, upsellItem]);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
            const newPos = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };
            setTempPin(newPos);
            setMapCenter(newPos);
            
            // Auto-reverse geocode the selected place
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: newPos }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    setTempAddress(results[0].formatted_address);
                    setTempAddressShort(formatAddressShort(results[0].formatted_address));
                } else {
                    setTempAddress(place.formatted_address || 'Selected Location');
                    setTempAddressShort(formatAddressShort(place.formatted_address || 'Selected Location'));
                }
            });
        }
    }
  };

  const t = {
    search: 'ค้นหาเมนู...',
    categories: 'หมวดหมู่',
    all: 'ทั้งหมด',
    viewOrder: 'ดูออเดอร์',
    reviewOrder: 'ตรวจสอบรายการสั่งซื้อ',
    checkout: 'ยืนยันสั่งซื้อ',
    deliveryAddress: 'ที่อยู่จัดส่ง',
    detectLocation: 'ระบุตำแหน่งปัจจุบัน',
    sweetness: 'ระดับความหวาน',
    addToCart: 'เพิ่มลงตะกร้า',
    openNow: 'เปิดให้บริการ',
    subtotal: 'ยอดรวม',
    deliveryFee: 'ค่าจัดส่ง',
    total: 'ยอดสุทธิ',
    readyIn: 'พร้องส่งภายใน 15-20 นาที',
    phoneLabel: 'เบอร์โทรศัพท์',
    notesLabel: 'หมายเหตุเพิ่มเติมอาทิเช่น บ้านเลขที่ หรือจุดสังเกต'
  };

  const handleReorderOrder = (e: React.MouseEvent, orderToReorder: any) => {
    e.stopPropagation();
    if (!orderToReorder || !orderToReorder.items) return;

    let addedCount = 0;
    let outOfStockNames: string[] = [];
    
    const processItems = () => {
       orderToReorder.items.forEach((orderItem: any) => {
          const menuItem = items.find(i => i.id === orderItem.item_id);
          if (menuItem && menuItem.in_stock !== false) {
             addToCart(menuItem, orderItem.selected_modifiers || [], orderItem.quantity || 1, true); // Use true for forcePreorder if needed, but we handle it below
             addedCount++;
          } else {
             outOfStockNames.push(menuItem ? menuItem.name : 'สินค้าบางรายการ');
          }
       });

       if (addedCount > 0) {
          if (outOfStockNames.length > 0) {
             setReorderAlertMessage(`เพิ่มรายการที่พร้อมขายลงตะกร้าแล้ว\nแต่มีรายการที่หมดและไม่ได้เพิ่ม:\n- ${outOfStockNames.join('\n- ')}`);
          }
          setIsCartOpen(true);
       } else {
          setReorderAlertMessage('ขออภัย สินค้าในออเดอร์นี้หมดหรือไม่มีจำหน่ายแล้ว');
       }
    };

    if (!isShopEffectivelyOpen && !isPreorderMode) {
       setPendingPreorderAction(() => processItems);
       setShowPreorderConfirmModal(true);
       return;
    }
    
    // Process items normally
    orderToReorder.items.forEach((orderItem: any) => {
       const menuItem = items.find(i => i.id === orderItem.item_id);
       if (menuItem && menuItem.in_stock !== false) {
          addToCart(menuItem, orderItem.selected_modifiers || [], orderItem.quantity || 1, isPreorderMode);
          addedCount++;
       } else {
          outOfStockNames.push(menuItem ? menuItem.name : 'สินค้าบางรายการ');
       }
    });
    
    if (addedCount > 0) {
      if (outOfStockNames.length > 0) {
         setReorderAlertMessage(`เพิ่มรายการที่พร้อมขายลงตะกร้าแล้ว\nแต่มีรายการที่หมดและไม่ได้เพิ่ม:\n- ${outOfStockNames.join('\n- ')}`);
      }
      setIsCartOpen(true);
    } else {
      setReorderAlertMessage('ขออภัย สินค้าในออเดอร์นี้หมดหรือไม่มีจำหน่ายแล้ว');
    }
  };

  const addToCart = async (item: MenuItem, selectedModifiers: any[] = [], quantity: number = 1, forcePreorder: boolean = false) => {
    if (!isShopEffectivelyOpen && !isPreorderMode && !forcePreorder) {
       setPendingPreorderAction(() => () => {
          addToCart(item, selectedModifiers, quantity, true);
       });
       setShowPreorderConfirmModal(true);
       return;
    }

    if (item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && selectedModifiers.length === 0 && pendingItem?.id !== item.id) {
        console.log("Fetching modifiers for item:", item.name, item.modifiers);
        const groupIds = item.modifiers.map((m: any) => m.group_id);
        const { data: groups, error: fetchError } = await supabase
            .from('pos_menu_modifier_groups')
            .select('*, options:pos_menu_modifiers(*)')
            .in('id', groupIds);
        
        if (fetchError) {
          console.error("Modifier fetch error:", fetchError);
        }

        if (groups && groups.length > 0) {
          console.log("Found groups:", groups);
          setModifierGroups(groups);
          setPendingItem(item);
          setTempSelectedModifiers([]);
          setTempQuantity(1);
          return;
        } else {
          console.warn("No groups found for modifiers:", groupIds);
        }
    }

    setCart(prev => {
      const modIds = selectedModifiers.map(m => m.id).sort();
      const uniqueKey = `${item.id}-${JSON.stringify(modIds)}`;
      
      const existingIdx = prev.findIndex(i => {
         const iModIds = (i.selected_modifiers || []).map((m: any) => m.id).sort();
         return i.id === item.id && JSON.stringify(iModIds) === JSON.stringify(modIds);
      });
      
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [...prev, { ...item, quantity: quantity, selected_modifiers: (selectedModifiers || []) }];
    });

    setCartShake(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setTimeout(() => setCartShake(false), 500);

    setPendingItem(null);
    setModifierGroups([]);
    setTempQuantity(1);
  };

  const removeFromCart = (id: string, selectedModifiers: any[] = []) => {
    setCart(prev => {
      const safeSelectedMods = (selectedModifiers || []);
      const modIds = safeSelectedMods.map(m => m.id).sort();
      
      const existingIdx = prev.findIndex(i => {
         const iModIds = (i.selected_modifiers || []).map((m: any) => m.id).sort();
         return i.id === id && JSON.stringify(iModIds) === JSON.stringify(modIds);
      });
      
      if (existingIdx === -1) return prev;
      
      const copy = [...prev];
      if (copy[existingIdx].quantity === 1) {
        return copy.filter((_, idx) => idx !== existingIdx);
      }
      copy[existingIdx].quantity -= 1;
      return copy;
    });
  };

  const removeFromCartFull = (id: string, selectedModifiers: any[] = []) => {
    setCart(prev => {
      const safeSelectedMods = (selectedModifiers || []);
      const modIds = safeSelectedMods.map(m => m.id).sort();
      return prev.filter(i => {
         const iModIds = (i.selected_modifiers || []).map((m: any) => m.id).sort();
         return !(i.id === id && JSON.stringify(iModIds) === JSON.stringify(modIds));
      });
    });
  };

  const updateCartItemNote = (id: string, selectedModifiers: any[] = [], note: string) => {
    setCart(prev =>
      prev.map(item => {
        const currentModIds = (item.selected_modifiers || []).map((m: any) => m.id).sort();
        const targetModIds = (selectedModifiers || []).map((m: any) => m.id).sort();
        if (item.id === id && JSON.stringify(currentModIds) === JSON.stringify(targetModIds)) {
          return { ...item, note };
        }
        return item;
      })
    );
  };


  const detectLocation = async ({ openMap = true, applyToCheckout = false, silent = false }: { openMap?: boolean; applyToCheckout?: boolean; silent?: boolean } = {}) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!silent) alert("เบราวเซอร์ของท่านไม่รองรับการระบุตำแหน่ง");
      return false;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Critical: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing from environment.");
      if (!silent) alert("ระบบแจ้งเตือน: ไม่พบ API Key สำหรับ Google Maps");
      return false;
    }

    setIsLocatingAddress(true);
    console.log("Starting geolocation detection...");

    return await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Location received: ${latitude}, ${longitude}`);
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, async (results, status) => {
            if (status === "OK" && results && results[0]) {
              const result = results[0];
              const specificResult = results.find(r => r.types.includes('street_address') || r.types.includes('premise')) || result;
              const finalAddr = specificResult.formatted_address;
              const short = formatAddressShort(finalAddr);
              const nextPin = { lat: latitude, lng: longitude };
              
              setTempAddress(finalAddr);
              setTempAddressShort(short);
              setTempPin(nextPin);
              setMapCenter(nextPin);

              if (applyToCheckout) {
                setAddress(finalAddr);
                setAddressShort(short);
                setSelectedAddressId(null);
              }

              if (openMap) {
                setAddressView('map');
                setMapSheetHeight(LOCATION_SHEET_DEFAULT_HEIGHT);
              }

              setIsLocatingAddress(false);
              resolve(true);
              return;
            }

            console.error("Geocoding failed:", status);
            if (!silent && status !== "REQUEST_DENIED") {
              alert(`ไม่สามารถดึงข้อมูลที่อยู่ได้: ${status}`);
            }

            setIsLocatingAddress(false);
            resolve(false);
          });
        },
        (err) => {
          console.error("Navigator Geolocation error:", err.code, err.message);

          if (!silent) {
            let msg = "ไม่สามารถเข้าถึงตำแหน่งได้";
            if (err.code === 1) msg += " (กรุณาอนุญาตสิทธิ์เข้าถึงตำแหน่ง)";
            else if (err.code === 2) msg += " (ไม่พบสัญญาณ GPS)";
            else if (err.code === 3) msg += " (หมดเวลาดึงตำแหน่ง)";
            alert(msg);
          }

          setIsLocatingAddress(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const onMapClick = (e: any) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setTempPin({ lat, lng });
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const finalAddr = results[0].formatted_address;
        setTempAddress(finalAddr);
        setTempAddressShort(formatAddressShort(finalAddr));
      }
    });
  };

  const handleLocationSheetDragStart = useCallback(() => {
    locationSheetStartHeightRef.current = mapSheetHeight;
  }, [mapSheetHeight]);

  const handleLocationSheetDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const nextHeight = locationSheetStartHeightRef.current - info.offset.y;
    const clampedHeight = Math.min(LOCATION_SHEET_MAX_HEIGHT, Math.max(LOCATION_SHEET_MIN_HEIGHT, nextHeight));
    setMapSheetHeight(clampedHeight);
  }, []);

  const handleLocationSheetDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const projectedHeight = mapSheetHeight - info.offset.y;

    if (info.velocity.y > 650) {
      setMapSheetHeight(LOCATION_SHEET_MIN_HEIGHT);
      return;
    }

    if (info.velocity.y < -650) {
      setMapSheetHeight(LOCATION_SHEET_MAX_HEIGHT);
      return;
    }

    const clampedHeight = Math.min(LOCATION_SHEET_MAX_HEIGHT, Math.max(LOCATION_SHEET_MIN_HEIGHT, projectedHeight));
    const nearestSnapPoint = LOCATION_SHEET_SNAP_POINTS.reduce((closest, current) => {
      return Math.abs(current - clampedHeight) < Math.abs(closest - clampedHeight) ? current : closest;
    }, LOCATION_SHEET_SNAP_POINTS[0]);

    setMapSheetHeight(nearestSnapPoint);
  }, [mapSheetHeight]);

  const confirmMapLocation = () => {
    if (!tempAddress) return;
    setIsAddressDetailOpen(true);
  };

  const confirmLocation = async (addr: string, short: string) => {
    setIsProcessing(true);
    const userId = getCurrentUserId();
    
    const finalFullAddr = buildDeliveryAddress(addr, addressDetail);
    const finalShort = formatAddressShort(finalFullAddr);

    console.log(`Saving location for user ${userId || 'unknown'}...`);

    if (userId && saveToAddressBook) {
       if (isPrimary) {
         await supabase
           .from('saved_addresses')
           .update({ is_primary: false })
           .eq('line_user_id', userId);
       }

       await supabase
         .from('pos_members')
         .update({
           address: finalFullAddr,
           phone: phone,
           last_location_lat: tempPin?.lat,
           last_location_lng: tempPin?.lng,
           marketing_preferences: {
             ...memberInfo?.marketing_preferences,
             last_labeled_address: addressLabel
           }
         })
         .eq('line_user_id', userId);

       const payload = {
         member_id: memberInfo?.id,
         line_user_id: userId,
         label: addressLabel,
         full_address: finalFullAddr,
         address_detail: addressDetail,
         latitude: tempPin?.lat,
         longitude: tempPin?.lng,
         is_primary: isPrimary,
       };

       const addressMutation = editingAddressId
         ? supabase.from('saved_addresses').update(payload).eq('id', editingAddressId).select().single()
         : supabase.from('saved_addresses').insert(payload).select().single();

       const { data: newAddr, error: addressError } = await addressMutation;
       
       if (addressError) {
         console.error("Address Error:", addressError);
       } else if (newAddr) {
         setSelectedAddressId(newAddr.id);
         await refreshSavedAddresses();
       }
    }

    setAddress(finalFullAddr);
    setAddressShort(finalShort);
    setIsAddressDetailOpen(false);
    setIsAddressSelectorOpen(false);
    setAddressView('list');
    resetAddressDraft();
    setIsProcessing(false);
  };

  const validateAndCheckout = () => {
    if (!phone || phone.length < 9) {
      const phoneEl = document.getElementById('phone-input');
      if (phoneEl) {
        phoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 600);
      return;
    }
    if (orderType === 'delivery' && !address) {
      setIsAddressSelectorOpen(true);
      return;
    }
    if (orderType === 'takeaway' && !pickupTime.trim()) {
      setPickupTimeDraft(getDefaultPickupTime())
      setShowPickupTimeModal(true)
      return
    }
    handleCheckout();
  };

  const buildCheckoutLockKey = () => JSON.stringify({
    userId: lineProfile?.userId || '',
    phone,
    orderType,
    pickupTime,
    address: orderType === 'delivery' ? address : '',
    notes,
    deliveryFee,
    items: cart.map((item: any) => ({
      id: item.id || item.item_id,
      quantity: item.quantity,
      price: item.sale_price,
      note: normalizeNoteText(item.note),
      modifiers: (item.selected_modifiers || []).map((mod: any) => ({
        id: mod?.id || null,
        name: mod?.name || '',
        value: mod?.value || '',
        price: Number(mod?.price_adjustment || mod?.price || 0),
        qty: mod?.qty || 1,
      })),
    })),
  })

  const handleSelectCouponWithCheck = async (coupon: any) => {
    if (orderType === 'takeaway' || orderType === 'dine_in') {
      try {
        const coords = await getUserCurrentLocation();
        const locationCheck = await verifyUserIsAtShopLocation(coords.latitude, coords.longitude, activeBranch?.branch_id || shopSettings?.branch_id);
        if (!locationCheck.isAllowed) {
          alert(locationCheck.errorMessage || 'คุณอยู่นอกพิกัดร้าน! การใช้คูปองสำหรับสั่งที่ร้านจำเป็นต้องกด ณ ตำแหน่งร้านเท่านั้น');
          return;
        }
      } catch (locErr: any) {
        alert(locErr.message || 'ไม่สามารถระบุพิกัด GPS ได้ กรุณาเปิดบริการตำแหน่งที่ตั้ง (GPS) บนมือถือเพื่อยืนยันพิกัด ณ ร้านค้าในการใช้คูปอง');
        return;
      }
    }
    setActiveCoupon(coupon);
    setIsCouponModalOpen(false);
  };

  const handleCheckout = async () => {
    if (checkoutLockRef.current || isProcessing) return;

    if (isPreorderMode && orderType === 'delivery' && !preorderTime) {
       alert('กรุณาเลือกเวลารับสินค้าสำหรับวันพรุ่งนี้ก่อนครับ');
       return;
    }

    const checkoutLockKey = buildCheckoutLockKey();
    const previousLock = typeof window !== 'undefined' ? sessionStorage.getItem('xyl_liff_checkout_lock') : null;
    if (previousLock === checkoutLockKey) return;

    checkoutLockRef.current = true;
    setIsProcessing(true); // 🛡️ Show loading state immediately to prevent double-clicks
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xyl_liff_checkout_lock', checkoutLockKey);
    }

    // 🛡️ RE-VERIFY STATUS JUST BEFORE PAYMENT
    const currentBranchId = activeBranch?.branch_id || shopSettings?.branch_id;
    let settingsQuery = supabase.from('pos_shop_settings').select('status, status_expiry, is_open, branch_id').limit(1);
    if (currentBranchId) {
      settingsQuery = settingsQuery.eq('branch_id', currentBranchId);
    }

    let shiftQuery = supabase.from('pos_shifts').select('id').eq('status', 'open').limit(1);
    if (currentBranchId) {
      shiftQuery = shiftQuery.eq('branch_id', currentBranchId);
    }

    const [{ data: currentSettingsRows }, { data: activeShifts }] = await Promise.all([
      settingsQuery,
      shiftQuery
    ]);
    const currentSettings = currentSettingsRows?.[0];

    const now = new Date();
    let effectivelyOpen = !!activeShifts?.length;

    if (currentSettings?.is_open === false) {
        effectivelyOpen = false;
    } else if (currentSettings?.status === 'paused' || currentSettings?.status === 'closed') {
        if (currentSettings.status_expiry) {
            if (now < new Date(currentSettings.status_expiry)) effectivelyOpen = false;
        } else {
            effectivelyOpen = false;
        }
    }

    if (!effectivelyOpen && !isPreorderMode) {
       alert('ขออภัย ร้านเปิดปิดรับออเดอร์กะทันหัน ไม่สามารถสั่งซื้อได้ในขณะนี้ครับ');
       setIsProcessing(false);
       setIsShopEffectivelyOpen(false);
       checkoutLockRef.current = false;
       if (typeof window !== 'undefined') sessionStorage.removeItem('xyl_liff_checkout_lock');
       return;
    }

    let isSuccess = false;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          customerName: lineProfile?.displayName,
          customerImage: lineProfile?.pictureUrl,
          lineUserId: lineProfile?.userId,
          phoneNumber: phone, 
          deliveryAddress: address, 
          latitude: tempPin?.lat,
          longitude: tempPin?.lng,
          deliveryFee: effectiveDeliveryFee, // Send dynamic fee to API
          deliveryDistance, // ADDED: Send calculated distance to API
          orderType, 
          pickupTime: orderType === 'takeaway' ? pickupTime : '',
          notes, 
          paymentMethod,
          branchId: activeBranch?.branch_id || shopSettings?.branch_id,
          isPreorder: isPreorderMode,
          preorderTime: isPreorderMode ? (orderType === 'takeaway' ? pickupTime : preorderTime) : '',
          couponId: activeCoupon?.id || null,
          discountAmount: couponDiscountCalc || 0
        })
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to checkout');
      
      const { orderId, orderNumber, deduped } = responseData;
      const calcTotal = cart.reduce((acc, it) => {
        const modsPrice = it.selected_modifiers?.reduce((macc: number, m: any) => macc + (m.price_adjustment || m.price || 0), 0) || 0;
        return acc + ((it.sale_price + modsPrice) * it.quantity);
      }, 0) + (orderType === 'delivery' && effectiveDeliveryFee > 0 ? effectiveDeliveryFee : 0);

      if (!deduped) {
        // Broadcast to POS using the same channel/event as QR table orders
        const payload = { order_id: orderId }
        await new Promise(resolve => setTimeout(resolve, 600))

        const sendRealtimeBroadcast = async (channelName: string) => {
          const channel = supabase.channel(channelName)
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              supabase.removeChannel(channel)
              resolve()
            }, 2500)

            channel.subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                await channel.send({ type: 'broadcast', event: 'qr_order_placed', payload })
                clearTimeout(timeout)
                setTimeout(() => supabase.removeChannel(channel), 3000)
                resolve()
              }
            })
          })
        }

        await Promise.all([
          sendRealtimeBroadcast('pos_qr_broadcast_print'),
          sendRealtimeBroadcast('pos_qr_broadcast_alert'),
        ])
      }

      // COD notification to customer chat
      if (lineProfile?.userId && !deduped) {
        fetch('/api/line/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: lineProfile.userId,
            type: 'flex',
            orderData: {
              status: 'pending',
              orderNumber,
              orderId,
              totalAmount: calcTotal,
              deliveryFee: orderType === 'delivery' ? (effectiveDeliveryFee > 0 ? effectiveDeliveryFee : 0) : 0,
              items: cart.map(it => {
                const modsPrice = it.selected_modifiers?.reduce((macc: number, m: any) => macc + (m.price_adjustment || m.price || 0), 0) || 0;
                return { 
                  name: it.name, 
                  quantity: it.quantity, 
                  sale_price: it.sale_price + modsPrice,
                  selected_modifiers: it.selected_modifiers || []
                }
              }),
              silent: true
            }
          })
        }).catch(err => console.error('COD Notify Error:', err));
      }

      // Do not empty cart state here to prevent UI flicker while redirecting.
      // We only clear the persistent storage so it will be empty on next visit.
      localStorage.removeItem('xylem_cart');
      if (typeof window !== 'undefined') sessionStorage.removeItem('xyl_liff_checkout_lock');
      void refreshActiveOrders()
      isSuccess = true;
      router.push(`/liff/track/${orderId}`);
    } catch (err: any) {
      if (typeof window !== 'undefined') sessionStorage.removeItem('xyl_liff_checkout_lock');
      alert(`Error: ${err.message}`);
    } finally {
      if (!isSuccess) {
        checkoutLockRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  if (redirectTo && redirectTo.startsWith('/')) {
    return <XYLLoader tagline="กำลังนำคุณไปยังหน้าสมาชิก..." />;
  }

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={locale === 'en' ? 'กำลังบันทึกประวัติการสั่งซื้อ...' : locale === 'zh' ? 'กำลังบันทึกประวัติการสั่งซื้อ...' : 'กำลังบันทึกประวัติการสั่งซื้อ...'} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcf9]">

      <header className="sticky top-0 z-[100] h-[72px] bg-white px-4 flex items-center justify-between">
        <div className="flex flex-col min-w-0 cursor-pointer max-w-[65%] select-none" onClick={() => setIsAddressSelectorOpen(true)}>
          <span className="text-[10px] font-medium text-gray-400 mb-0.5 leading-none">
            {(addressShort && addressShort !== 'เลือกที่อยู่จัดส่ง' && addressShort !== ':') ? 'จัดส่งไปที่' : 'ระบุตำแหน่ง'}
          </span>
          <div className="flex items-center gap-1">
             <h1 className="text-[13px] font-bold text-gray-900 truncate leading-tight">
               {(addressShort && addressShort !== 'เลือกที่อยู่จัดส่ง' && addressShort !== ':') ? addressShort : 'เลือกลงตำแหน่งจัดส่ง'}
             </h1>
             <ChevronDown size={12} className="text-gray-400 shrink-0" />
          </div>
        </div>
        <div className="flex items-center gap-2">
           {memberInfo?.phone ? (
             <button 
               onClick={() => router.push('/liff/member')}
               className="flex items-center gap-1.5 pl-1.5 pr-3 py-1 bg-white border border-gray-200/80 rounded-full active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
             >
               <div className="bg-gray-50 rounded-full p-1 shrink-0">
                 <Star size={10} className="fill-[#F6C144] text-[#F6C144]" />
               </div>
               <span className="text-[11px] font-bold text-gray-900 leading-none pt-0.5">{memberInfo.points || 0}</span>
             </button>
           ) : (
             <div 
               onClick={() => router.push('/liff/member')}
               className="relative flex items-center justify-center cursor-pointer active:scale-95 transition-all"
             >
               <div className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center shrink-0">
                 <div className="bg-gray-50 rounded-full p-1.5">
                   <Star size={12} className="fill-[#F6C144] text-[#F6C144]" />
                 </div>
               </div>
               <motion.span 
                 animate={{ y: [0, -3, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -bottom-3.5 text-[8.5px] font-bold text-gray-500 whitespace-nowrap tracking-tight"
               >
                 สมัครสมาชิก
               </motion.span>
             </div>
           )}
           <button onClick={() => router.push('/liff/history')} className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-90 transition-all text-gray-700 hover:bg-gray-50 shrink-0">
             {(loading || liffLoading) ? <XYLLoader mini /> : <History size={16} strokeWidth={2} />}
           </button>
        </div>
      </header>

<main className="flex-1 pb-32">
        <div className="relative w-full h-64 sm:h-[320px] bg-black overflow-hidden shrink-0">
           <PromoBannerSlider />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none"></div>
           
           {/* Shop Name and Star Rating overlay on gradient */}
           <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 flex items-end justify-between text-white z-10 pointer-events-none select-none">
                <div className="flex flex-col gap-0.5">
                     <h1 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm uppercase">
                         {shopSettings?.opening_hours?.name_th || shopSettings?.name || 'XYL STUDIO'}
                     </h1>
                     {(shopSettings?.opening_hours?.branch_name_th || shopSettings?.branch_name) && (
                         <p className="text-white/60 text-[10px] sm:text-xs font-bold tracking-widest uppercase drop-shadow-sm">
                             {shopSettings?.opening_hours?.branch_name_th || shopSettings?.branch_name}
                         </p>
                     )}
                </div>
                
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                     {reviewStats.count > 0 && (
                          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 border border-white/10 rounded-full shadow-sm">
                              <Star size={11} className="fill-[#F6C144] text-[#F6C144]" />
                              <span className="text-[11px] font-black tracking-wider leading-none pt-0.5">
                                  {reviewStats.average.toFixed(1)}
                              </span>
                              <span className="text-[9px] text-white/50 font-bold leading-none pt-0.5">
                                  ({reviewStats.count})
                              </span>
                          </div>
                     )}
                     {isMounted && (closeMessage || isPreorderMode) && (
                          <div 
                              className={`flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 border border-white/10 rounded-full shadow-sm text-[9px] font-black uppercase tracking-wider ${(!isShopEffectivelyOpen && !isPreorderMode) ? 'animate-pulse' : ''}`}
                              style={{ color: isPreorderMode ? '#f59e0b' : '#ffffff' }}
                          >
                              <span 
                                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                                  style={{ 
                                      backgroundColor: isPreorderMode 
                                          ? '#f59e0b' 
                                          : (!isShopEffectivelyOpen ? '#ef4444' : '#10b981') 
                                  }}
                              />
                              <span>
                                  {isPreorderMode ? 'Pre-Order' : closeMessage?.replace('● ', '').replace('●', '').trim()}
                              </span>
                          </div>
                     )}
                </div>
           </div>
        </div>

        <AnimatePresence>
          {activeOrders.length > 0 ? (
            <motion.div
              key={activeOrders[0].id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ 
                x: 400, 
                y: -600, 
                scale: 0.05,
                opacity: 0, 
                transition: { delay: 5, duration: 2, ease: [0.4, 0, 0.2, 1] } 
              }}
              className="px-4 mb-6 relative"
            >
              <button 
                onClick={() => router.push(`/liff/track/${activeOrders[0].id}`)}
                className="w-full bg-white border border-gray-100 p-6 rounded-none flex items-center justify-between shadow-sm active:scale-[0.98] transition-all overflow-hidden relative"
              >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 flex-shrink-0">
                      <svg viewBox="-50 -50 100 100" className="w-full h-full">
                        {['pending', 'paid', 'accepted', 'preparing'].includes(activeOrders[0].status) && (
                          <PrepIcon isActive={true} />
                        )}
                        {['shipping', 'out_for_delivery'].includes(activeOrders[0].status) && (
                          <DeliveryIcon isActive={true} />
                        )}
                        {['completed', 'delivered'].includes(activeOrders[0].status) && (
                          <CompletedIcon isActive={true} />
                        )}
                        {activeOrders[0].status === 'pending' && (
                          <circle r="40" fill="none" stroke="#F6C144" strokeWidth="4" strokeDasharray="10 15" className="animate-pulse origin-center" />
                        )}
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-emerald-500">{locale === 'en' ? 'กำลังดำเนินการ (Active Order)' : locale === 'zh' ? 'กำลังดำเนินการ (Active Order)' : 'กำลังดำเนินการ (Active Order)'}</p>
                        {activeOrders[0].status === 'pending' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-none animate-pulse" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-[13px] font-black uppercase tracking-tighter text-[#1A1A18]">{activeOrders[0].order_type === 'dine_in' && activeOrders[0].table_number ? `โต๊ะ ${activeOrders[0].table_number}` : `#${String(activeOrders[0].queue_number || 0).padStart(3, '0')}`}</h4>
                        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{activeOrders[0].order_number}</p>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest leading-relaxed">
                        {activeOrders[0].status === 'pending' ? (
                          (activeOrders[0] as any).queue_ahead > 0 
                            ? `คุณคือคิวที่ ${(activeOrders[0] as any).queue_ahead + 1} (มีออเดอร์ก่อนหน้า ${(activeOrders[0] as any).queue_ahead} คิว)`
                            : 'รอพนักงานรับออเดอร์สักครู่ (คุณคือคิวถัดไป)...'
                        ) :
                         ['paid', 'accepted', 'preparing'].includes(activeOrders[0].status) ? (
                            (activeOrders[0] as any).queue_ahead > 0
                              ? `คิวที่ ${(activeOrders[0] as any).queue_ahead + 1} • บาริสต้ากำลังเตรียมเครื่องดื่ม...`
                              : 'บาริสต้ากำลังเตรียมเครื่องดื่มเมนูพิเศษของคุณ...'
                         ) :
                         activeOrders[0].status === 'shipping' ? 'ไรเดอร์กำลังนำส่งออเดอร์ถึงคุณ...' : 
                         ['completed', 'delivered'].includes(activeOrders[0].status) ? 'จัดการส่งเรียบร้อยแล้ว (ออเดอร์ส่งถึงที่หมาย)' :
                         'กำลังดำเนินการตรวจสอบระบบ...'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                  
                  {/* Status Bar Background - Only show after staff accepts (status becomes accepted/preparing/paid/shipping) */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-1000" 
                    style={{ 
                      width: activeOrders[0].status === 'pending' ? '0%' : 
                             ['paid', 'accepted', 'preparing'].includes(activeOrders[0].status) ? '33%' : 
                             (['completed', 'delivered'].includes(activeOrders[0].status) ? '100%' : '66%'),
                      opacity: activeOrders[0].status === 'pending' ? 0 : 1
                    }} 
                  />
                </button>
              </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Category Navigation - Mockup Style */}
        {/* Category Navigation - Mockup Style */}
        <div className="sticky top-[72px] z-40 bg-white border-b border-gray-100/80 shadow-[0_8px_20px_rgba(0,0,0,0.02)] flex flex-col w-full">
            <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-10 items-end min-h-[46px]" id="category-tabs-container">
                <button 
                    id="tab-all"
                    onClick={() => {
                        if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
                        isManualScrolling.current = true;
                        setActiveCategoryId('all');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        manualScrollTimeout.current = setTimeout(() => {
                            isManualScrolling.current = false;
                        }, 800);
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeCategoryId === 'all' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
                >
                    {t.all}
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        id={`tab-${cat.id}`}
                        onClick={() => {
                            if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
                            isManualScrolling.current = true;
                            setActiveCategoryId(cat.id);
                            const el = document.getElementById(`category-${cat.id}`);
                            if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' });
                            manualScrollTimeout.current = setTimeout(() => {
                                isManualScrolling.current = false;
                            }, 800);
                        }}
                        className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeCategoryId === cat.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            
            {/* Search Bar - Mockup Style */}
            <div className="px-4 pb-3 pt-1 bg-white">
                <div className="bg-gray-50 border border-gray-100 flex items-center gap-2 px-4 py-2 rounded-full text-gray-400 focus-within:bg-white focus-within:border-gray-300 focus-within:text-gray-900 transition-all shadow-inner-sm liff-no-focus">
                    <Search size={15} strokeWidth={2.5} />
                    <input 
                      type="text" 
                      placeholder={t.search}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none focus:!border-none focus:!border-transparent focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus:!ring-transparent focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none text-xs w-full font-medium p-0 h-6 leading-none shadow-none focus:shadow-none" 
                    />
                </div>
            </div>
        </div>

              {/* ⭐ Latest Order */}
        {!searchTerm && latestOrders && latestOrders.length > 0 && (
          <section className="px-4 mb-8 pt-4">
            <h2 className="text-[14px] font-bold text-gray-900 mb-4 flex items-center gap-2">
               <History size={16} className="text-gray-500" />
               {locale === 'en' ? 'Order Again' : locale === 'zh' ? 'Order Again' : 'สั่งล่าสุดจากรายการเดิม'}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
               {latestOrders.map((order: any, idx: number) => {
                  let reorderTotal = 0;
                  const hasSomeOut = order.items.some((orderItem: any) => {
                     const mItem = items.find(it => it.id === orderItem.item_id);
                     return !mItem || mItem.in_stock === false;
                  });

                  if (!hasSomeOut) {
                      reorderTotal = order.net_total;
                  } else {
                      reorderTotal = order.items.reduce((sum: number, orderItem: any) => {
                         const mItem = items.find(it => it.id === orderItem.item_id);
                         if (mItem && mItem.in_stock !== false) {
                            let itemPrice = orderItem.total_price || orderItem.price || orderItem.subtotal;
                            if (itemPrice === undefined) {
                               let currentPrice = mItem.sale_price;
                               if (orderItem.selected_modifiers) {
                                   currentPrice += orderItem.selected_modifiers.reduce((modSum: number, mod: any) => modSum + (mod.price || 0), 0);
                               }
                               itemPrice = currentPrice * (orderItem.quantity || 1);
                            }
                            return sum + itemPrice;
                         }
                         return sum;
                      }, 0);
                  }

                  const allItemsOut = order.items.every((orderItem: any) => {
                     const mItem = items.find(it => it.id === orderItem.item_id);
                     return !mItem || mItem.in_stock === false;
                  });

                  // If literally everything is out of stock, we can still show it but grayed out
                  return (
                    <div key={idx} className={`shrink-0 w-[200px] snap-center p-3.5 bg-white border border-gray-100/80 rounded-[20px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between ${allItemsOut ? 'opacity-60 grayscale' : ''}`}>
                       <div className="flex items-start justify-between mb-3">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((orderItem: any, i: number) => {
                               const mItem = items.find(it => it.id === orderItem.item_id);
                               const isOut = !mItem || mItem.in_stock === false;
                               return (
                                 <div key={i} className={`relative w-9 h-9 rounded-full border-[2px] border-white overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${isOut ? 'bg-gray-200 opacity-60 grayscale' : 'bg-gray-50'}`} style={{ zIndex: 10 - i }}>
                                    {mItem?.image_url ? (
                                      <img src={mItem.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ShoppingCart size={12} />
                                      </div>
                                    )}
                                 </div>
                               );
                            })}
                            {order.items.length > 3 && (
                               <div className="relative w-9 h-9 rounded-full border-[2px] border-white bg-gray-50 flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.02)]" style={{ zIndex: 0 }}>
                                  <span className="text-[9px] font-bold text-gray-500">+{order.items.length - 3}</span>
                               </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={(e) => handleReorderOrder(e, order)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-full active:scale-95 transition-all shadow-sm shrink-0"
                          >
                            <Plus size={16} strokeWidth={2.5} />
                          </button>
                       </div>
                       
                       <div className="mt-1">
                          <h3 className="text-[12px] font-bold text-gray-900 line-clamp-1 mb-1">
                            {order.items.map((i: any) => items.find(it => it.id === i.item_id)?.name || '').filter(Boolean).join(', ')}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-400 font-medium">
                               {new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                            <div className="flex flex-col items-end">
                               <span className="text-[12px] font-bold text-gray-900">฿{reorderTotal}</span>
                               {reorderTotal !== order.net_total && (
                                 <span className="text-[9px] text-red-500 font-medium">ไม่รวมรายการที่หมด</span>
                               )}
                            </div>
                          </div>
                       </div>
                    </div>
                  );
               })}
               
               {/* View History Card */}
               <div className="shrink-0 w-[40%] snap-center flex items-center justify-center">
                  <button 
                    onClick={() => router.push('/liff/history')}
                    className="flex flex-col items-center justify-center gap-2 w-full h-full min-h-[140px] bg-[#f9f9f5] border border-gray-100 rounded-2xl active:scale-95 transition-all text-gray-500"
                  >
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                       <ChevronRight size={20} />
                     </div>
                     <span className="text-[11px] font-bold mt-1">ดูประวัติทั้งหมด</span>
                  </button>
               </div>
            </div>
          </section>
        )}

        {/* ⭐ Tier 1.5: Regulars (Smart Favorites) Moved to Top */}
        {!searchTerm && regularItemIds.length > 0 && (
          <section id="category-regulars" className="px-4 mb-10 pt-4 scroll-spy-section">
            <h2 className="text-[14px] font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
              {locale === 'en' ? 'Your Regulars' : locale === 'zh' ? 'Your Regulars' : 'เมนูประจำของคุณ'}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {items.filter(i => regularItemIds.includes(i.id)).slice(0, 4).map(item => {
                const cartQty = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                return (
                <div key={item.id} className={`snap-start shrink-0 w-[160px] flex flex-col group relative ${item.in_stock === false ? 'opacity-60 grayscale' : ''}`}>
                   <div className={`relative aspect-[4/5] rounded-[16px] overflow-hidden ${item.in_stock !== false ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => item.in_stock !== false && addToCart(item)}>
                     {item.image_url && <img src={item.image_url} alt={getPrimaryMenuName(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" decoding="async" />}
                     {item.in_stock === false && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none">
                           <div className="flex flex-col items-center gap-2">
                             <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg rounded-full">สินค้าหมด</span>
                           </div>
                        </div>
                     )}
                     <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-sm text-yellow-600 text-[10px] font-bold z-30 flex items-center gap-1">
                       <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                       ประจำ
                     </div>
                   </div>
                   <div className="pt-2 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-[13px] font-bold text-gray-900 line-clamp-1">{getPrimaryMenuName(item)}</h3>
                        {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                          <p className="mt-0.5 text-[11px] font-medium text-gray-500 line-clamp-1">
                            {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                          </p>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                         <span className="text-[13px] font-bold text-gray-900">฿{item.sale_price}</span>
                         {cartQty > 0 ? (
                           <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-7 h-7 flex items-center justify-center rounded-full border border-black bg-white text-black font-bold text-[12px] hover:bg-gray-50 transition-colors">
                             {cartQty}
                           </button>
                         ) : (
                           <button onClick={(e) => { e.stopPropagation(); if(item.in_stock !== false) addToCart(item); }} disabled={item.in_stock === false} className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${item.in_stock === false ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                             <Plus className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                   </div>
                </div>
              )})}
            </div>
          </section>
        )}

        {/* Banner Carousel */}
        {/* 🏆 Tier 1: Signature Series (Recommended) */}
        {!searchTerm && (
          <section className="px-4 mb-10 pt-4 scroll-spy-section" id="category-all">
            <h2 className="text-[14px] font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
              {locale === 'en' ? 'Recommended menu' : locale === 'zh' ? '推荐菜单' : 'เมนูแนะนำ'}
            </h2>
            <div className="grid grid-cols-2 gap-4 pb-4">
              {items.filter(i => i.is_recommended).slice(0, 4).map((item, index) => {
                const cartQty = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                return (
                <div key={item.id} className={`flex flex-col group relative ${item.in_stock === false ? 'opacity-60 grayscale' : ''}`}>
                   <div className={`relative aspect-[4/5] rounded-[16px] overflow-hidden ${item.in_stock !== false ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => item.in_stock !== false && addToCart(item)}>
                     {item.image_url && <img src={item.image_url} alt={getPrimaryMenuName(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" decoding="async" />}
                     {item.in_stock === false && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none">
                           <div className="flex flex-col items-center gap-2">
                             <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg rounded-full">สินค้าหมด</span>
                           </div>
                        </div>
                     )}
                     <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-sm text-blue-500 text-[10px] font-bold z-30 flex items-center gap-1">
                       <span className="text-[10px]">👍</span>
                       แนะนำ #{index + 1}
                     </div>
                   </div>
                   <div className="pt-2 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-[13px] font-bold text-gray-900 line-clamp-1">{getPrimaryMenuName(item)}</h3>
                        {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                          <p className="mt-0.5 text-[11px] font-medium text-gray-500 line-clamp-1">
                            {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                          </p>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                         <span className="text-[13px] font-bold text-gray-900">฿{item.sale_price}</span>
                         {cartQty > 0 ? (
                           <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-7 h-7 flex items-center justify-center rounded-full border border-black bg-white text-black font-bold text-[12px] hover:bg-gray-50 transition-colors">
                             {cartQty}
                           </button>
                         ) : (
                           <button onClick={(e) => { e.stopPropagation(); if(item.in_stock !== false) addToCart(item); }} disabled={item.in_stock === false} className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${item.in_stock === false ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                             <Plus className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                   </div>
                </div>
              )})}
            </div>
          </section>
        )}


        {/* 🌟 Reviews Section */}
        {recentReviews.length > 0 && !searchTerm && (
          <div className="my-8 px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star size={20} fill="#F6C144" stroke="#F6C144" />
                  <span className="text-xl font-bold text-gray-900">{reviewStats.average.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({reviewStats.count} เรตติ้ง)</span>
                </div>
                <p className="text-sm text-gray-600">
                  เสียงตอบรับจากลูกค้า <span className="text-black font-medium">ที่สั่งอาหารกับเรา</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
              {recentReviews.map((rev, idx) => (
                <div key={idx} className="flex-shrink-0 w-[85%] snap-center p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between">
                   <div>
                     <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-1">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} size={14} fill={i < rev.rating ? "#F6C144" : "none"} stroke={i < rev.rating ? "#F6C144" : "#E2E8F0"} />
                           ))}
                         </div>
                         <span className="text-[13px] text-gray-400">{rev.customer_name || 'ลูกค้าคนสำคัญ'}</span>
                     </div>
                     {rev.comment && rev.comment.trim() !== '' && (
                       <p className="text-[14px] text-gray-800 mb-4 leading-relaxed line-clamp-2">{rev.comment.trim()}</p>
                     )}
                   </div>
                   {rev.pos_order_items && rev.pos_order_items.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-auto">
                       {rev.pos_order_items.slice(0, 2).map((oi: any, i: number) => {
                         const itemName = Array.isArray(oi.item) ? oi.item[0]?.name : oi.item?.name;
                         if (!itemName) return null;
                         return (
                           <div key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-100 text-[12px] font-medium">
                             <PlusCircle size={12} className="text-gray-400" />
                             <span className="truncate max-w-[120px]">{itemName}</span>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ❤️ Tier 2: Most Loved (Best Sellers) */}
        {!searchTerm && bestSellingIds.length > 0 && (
          <section id="category-popular" className="px-4 mb-10 scroll-spy-section">
            <h2 className="text-[14px] font-bold text-gray-900 mb-4 px-1">
              {locale === 'en' ? 'Most Loved' : locale === 'zh' ? '最受欢迎' : 'เมนูยอดนิยม'}
            </h2>
            <div className="grid grid-cols-2 gap-4 pb-4">
              {bestSellingIds.filter(id => items.some(i => i.id === id)).slice(0, 4).map((id, index) => {
                const item = items.find(i => i.id === id);
                if (!item) return null;
                const cartQty = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                return (
                <div key={item.id} className={`flex flex-col group relative ${item.in_stock === false ? 'opacity-60 grayscale' : ''}`}>
                   <div className={`relative aspect-[4/5] rounded-[16px] overflow-hidden ${item.in_stock !== false ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => item.in_stock !== false && addToCart(item)}>
                     {item.image_url && <img src={item.image_url} alt={getPrimaryMenuName(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" decoding="async" />}
                     {item.in_stock === false && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none">
                           <div className="flex flex-col items-center gap-2">
                             <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg rounded-full">สินค้าหมด</span>
                           </div>
                        </div>
                     )}
                     
                     <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-sm text-red-500 text-[10px] font-bold z-30 flex items-center gap-1">
                       <span className="text-[10px]">🔥</span>
                       ขายดี #{index + 1}
                     </div>

                   </div>
                   <div className="pt-2 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-[13px] font-bold text-gray-900 line-clamp-1">{getPrimaryMenuName(item)}</h3>
                        {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                          <p className="mt-0.5 text-[11px] font-medium text-gray-500 line-clamp-1">
                            {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                          </p>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                         <span className="text-[13px] font-bold text-gray-900">฿{item.sale_price}</span>
                         {cartQty > 0 ? (
                           <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-7 h-7 flex items-center justify-center rounded-full border border-black bg-white text-black font-bold text-[12px] hover:bg-gray-50 transition-colors">
                             {cartQty}
                           </button>
                         ) : (
                           <button onClick={(e) => { e.stopPropagation(); if(item.in_stock !== false) addToCart(item); }} disabled={item.in_stock === false} className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${item.in_stock === false ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                             <Plus className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                   </div>
                </div>
              )})}
            </div>
          </section>
        )}


        {/* 📦 Full Collections: Categorized Browsing (Full-width Rows) */}
        <div className="px-4 space-y-12">
          {menuSections.map(cat => {
            const catItems = filteredItems.filter(i =>
              cat.id === 'uncategorized'
                ? !i.category_id || !categories.find(category => category.id === i.category_id)
                : i.category_id === cat.id
            );
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id} id={`category-${cat.id}`} className="scroll-spy-section pt-8 px-4">
                <div className="mb-4">
                    <h2 className="text-[16px] font-bold text-gray-900">{cat.name}</h2>
                </div>
                <div className="flex flex-col">
                  {catItems.map(item => {
                    const cartQty = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                    return (
                    <div key={item.id} className={`flex gap-4 py-4 border-b border-gray-100 last:border-b-0 ${item.in_stock === false ? 'opacity-60 grayscale' : ''}`}>
                       {/* Left: Image (if exists) */}
                       {item.image_url && (
                         <div className={`relative w-[96px] h-[96px] rounded-[12px] shrink-0 overflow-hidden ${item.in_stock !== false ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => item.in_stock !== false && addToCart(item)}>
                           <img src={item.image_url} alt={getPrimaryMenuName(item)} className="w-full h-full object-cover transition-transform duration-700" decoding="async" />
                         </div>
                       )}
                       {/* Right: Info */}
                       <div className="flex-1 flex flex-col justify-between" onClick={() => item.in_stock !== false && addToCart(item)}>
                          <div>
                            <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2">{getPrimaryMenuName(item)}</h3>
                            {item.description?.trim() ? (
                              <p className="mt-1 text-[10px] font-medium text-gray-500 leading-relaxed">
                                {item.description}
                              </p>
                            ) : getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') ? (
                              <p className="mt-1 text-[10px] font-medium text-gray-500 line-clamp-2">
                                {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                              </p>
                            ) : null}
                          </div>
                          
                          <div className="mt-2 flex items-end justify-between">
                             <span className="text-[14px] font-bold text-gray-900">
                               ฿{item.sale_price} {item.in_stock === false && <span className="text-gray-400 font-normal ml-1">หมด</span>}
                             </span>
                             {item.in_stock !== false && (
                               cartQty > 0 ? (
                                 <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-7 h-7 flex items-center justify-center rounded-full border border-black bg-white text-black font-bold text-[12px] hover:bg-gray-50 transition-colors shrink-0">
                                   {cartQty}
                                 </button>
                               ) : (
                                 <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition-colors shrink-0">
                                   <Plus className="w-4 h-4" />
                                 </button>
                               )
                             )}
                          </div>
                       </div>
                    </div>
                  )})}
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && isFetchingItems && (
            <div className="flex min-h-[220px] flex-col items-center justify-center border border-dashed border-gray-200 bg-gray-50 px-6 text-center animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">กำลังโหลดเมนู...</div>
            </div>
          )}
          {filteredItems.length === 0 && !isFetchingItems && (
            <div className="flex min-h-[220px] items-center justify-center border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">ยังไม่มีเมนูให้แสดง</div>
                <p className="mt-3 text-sm font-medium text-gray-400">ลองเปลี่ยนหมวด ค้นหาใหม่ หรือเช็กการเปิดขายของเมนู</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 🏎️ Removed Fixed Bottom Active Order Widget */}

      {/* Floating Basket Button */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-6 right-6 z-[150]">
          <motion.button 
            onClick={() => setIsCartOpen(true)} 
            animate={cartShake ? { scale: [1, 1.1, 0.95, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-black text-white px-6 py-4 rounded-none flex justify-between items-center shadow-2xl active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.viewOrder} ({cart.reduce((a,b) => a+b.quantity, 0)})</span>
            </div>
            <span className="text-sm font-black">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}{grandTotal.toLocaleString()}</span>
          </motion.button>
        </div>
      )}

      {/* 🛡️ Cart Drawer (Abbreviated) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[2000] bg-white flex flex-col">
             <header className="p-6 border-b border-gray-100 flex items-center justify-between font-bold">
                <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
                <h2 className="text-xl font-black uppercase tracking-tighter">{t.reviewOrder}</h2>
                <div className="w-6" />
             </header>

             {(() => {
                const config = activeBranch?.inhouse_delivery_config || activeBranch?.opening_hours?.inhouse_delivery_config || shopSettings?.inhouse_delivery_config || shopSettings?.opening_hours?.inhouse_delivery_config;
                const threshold = config?.enabled && config?.free_delivery_threshold > 0 ? config.free_delivery_threshold : 0;
                if (threshold > 0 && orderType === 'delivery' && effectiveDeliveryFee !== -1) {
                    const remaining = Math.max(0, threshold - cartTotal);
                    const progress = Math.min(100, (cartTotal / threshold) * 100);
                    return (
                        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 shrink-0">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[12px] font-black tracking-tight text-emerald-800">
                                    {remaining > 0 ? (locale === 'en' ? `Add ฿${remaining.toLocaleString()} more for free delivery!` : `สั่งอีก ฿${remaining.toLocaleString()} รับสิทธิ์ส่งฟรี!`) : (locale === 'en' ? 'You got Free Delivery! 🎉' : 'คุณได้รับสิทธิ์ส่งฟรี! 🎉')}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-emerald-200/50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    );
                }
                return null;
             })()}

             <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  {cart.map(item => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={`${item.id}-${JSON.stringify(item.selected_modifiers?.map((m: any) => m.id).sort())}`} 
                      className="flex items-start gap-4 pb-4 border-b border-gray-50"
                    >
                      <div className="w-16 h-16 bg-gray-50 flex-shrink-0 relative overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={getPrimaryMenuName(item)} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingCart size={24} /></div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col min-h-[64px] justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-tight text-[#1A1A18] leading-tight line-clamp-1">{getPrimaryMenuName(item)}</h4>
                             {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                                <p className="text-[8px] text-gray-500 font-semibold mt-1 leading-tight line-clamp-1">
                                    {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                                </p>
                            )}
                            {getCartModifierSummary(item) ? (
                                <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest mt-1 leading-tight">
                                    {getCartModifierSummary(item)}
                                </p>
                            ) : (
                                <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-1">No options</p>
                            )}
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => updateCartItemNote(item.id, item.selected_modifiers, e.target.value)}
                              placeholder={locale === 'en' ? 'Note to shop...' : 'โน้ตถึงร้าน / ครัว'}
                              className="mt-2 w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-[11px] font-medium text-[#1A1A18] placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                          <button onClick={() => removeFromCartFull(item.id, item.selected_modifiers)} className="text-red-400 p-1 active:scale-90 transition-all">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                           <div className="flex items-center gap-3 bg-gray-50 px-3 py-1">
                              <button onClick={() => removeFromCart(item.id, item.selected_modifiers)} className="text-gray-400 active:scale-125 transition-transform"><Minus size={10} /></button>
                              <span className="text-[11px] font-black min-w-[12px] text-center">{item.quantity}</span>
                              <button onClick={() => addToCart(item, item.selected_modifiers)} className="text-gray-900 active:scale-125 transition-transform"><Plus size={10} /></button>
                           </div>
                           <span className="text-[12px] font-black text-black">
                              {locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}{((item.sale_price + (item.selected_modifiers?.reduce((acc: number, m: any) => acc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0)) * item.quantity).toLocaleString()}
                           </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex bg-neutral-100 p-1 rounded-2xl mb-6">
                   <button 
                    onClick={() => {
                      setOrderType('delivery')
                      setPickupTime('')
                    }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${orderType === 'delivery' ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                   >
                     <Truck size={14} />
                     <span>Delivery</span>
                   </button>
                   <button 
                    onClick={() => {
                      setOrderType('takeaway')
                      setPickupTimeDraft(pickupTime || getDefaultPickupTime())
                      setShowPickupTimeModal(true)
                    }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${orderType === 'takeaway' ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                   >
                     <ShoppingBag size={14} />
                     <span>Takeaway</span>
                   </button>
                </div>

                {orderType === 'takeaway' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickupTimeDraft(pickupTime || getDefaultPickupTime())
                      setShowPickupTimeModal(true)
                    }}
                    className="mb-4 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left transition-all hover:border-amber-300 hover:bg-amber-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">เวลารับออเดอร์</div>
                        <div className="mt-1 text-sm font-black text-[#1A1A18]">
                          {pickupTime ? `รับเวลา ${pickupTime}` : 'แตะเพื่อเลือกเวลาที่จะมารับ'}
                        </div>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 shadow-sm">
                        Edit
                      </div>
                    </div>
                  </button>
                )}

                <div id="phone-input" className={`p-4 rounded-2xl border transition-all ${shakePhone ? 'animate-shake border-red-500 bg-red-50' : 'border-neutral-100 bg-white'}`}>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 block mb-1">{t.phoneLabel}</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" className="w-full bg-transparent border-none p-0 text-[18px] font-black text-[#1A1A18] focus:ring-0 placeholder:text-neutral-200" />
                </div>

                <AnimatePresence mode="wait">
                  {orderType === 'delivery' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4">
                      {/* 🚚 Clean Active Delivery Row */}
                       <div 
                         onClick={() => setIsAddressSelectorOpen(true)}
                         className="p-4 bg-white border border-neutral-100 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-neutral-50 shadow-sm shadow-neutral-100/50"
                       >
                         <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                               <MapPin size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="text-[10px] font-black tracking-[0.2em] uppercase text-neutral-400 mb-0.5">{locale === 'en' ? 'Deliver to' : 'จัดส่งที่'}</p>
                               <h3 className="text-[14px] font-black tracking-tight text-[#1A1A18] truncate">{addressShort || (locale === 'en' ? 'Select Address' : 'เลือกที่อยู่จัดส่ง')}</h3>
                            </div>
                         </div>
                         <ChevronRight size={18} className="text-neutral-300 shrink-0" />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showPickupTimeModal && (
                    <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowPickupTimeModal(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative z-[1] w-[min(100%,340px)] overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-2xl sm:w-full sm:max-w-md sm:p-6"
                      >
                        <div className="mb-4 text-center">
                          <div className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-amber-600">
                            Takeaway
                          </div>
                          <h3 className="mt-3 text-xl font-black leading-tight text-[#1A1A18] sm:text-2xl">
                            เลือกเวลาที่จะมารับ
                          </h3>
                          <p className="mt-2 text-[12px] font-bold leading-snug text-gray-500">
                            กรุณาใส่เวลารับออเดอร์ก่อนกดสั่งซื้อ
                          </p>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-center text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
                            Pickup Time
                          </label>
                          <input
                            type="time"
                            value={pickupTimeDraft}
                            onChange={(e) => setPickupTimeDraft(e.target.value)}
                            className="mx-auto block h-12 w-full max-w-[240px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center text-base font-black text-[#1A1A18] outline-none focus:border-[#1A1A18] focus:bg-white sm:h-14 sm:max-w-[280px] sm:text-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!pickupTimeDraft.trim()) return
                              setPickupTime(pickupTimeDraft.trim())
                              setShowPickupTimeModal(false)
                            }}
                            className="mx-auto block w-full max-w-[240px] rounded-2xl bg-[#1A1A18] py-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-black sm:max-w-[280px] sm:py-4 sm:text-[12px]"
                          >
                            ยืนยันเวลารับ
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPickupTimeModal(false)}
                            className="mx-auto block w-full max-w-[240px] py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 hover:text-gray-600 sm:max-w-[280px]"
                          >
                            ปิด
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                 </AnimatePresence>

                <div className="p-4 rounded-2xl border border-neutral-100 bg-white mt-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 block mb-1">{t.notesLabel}</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder={locale === 'en' ? 'e.g. Additional details' : 'รายละเอียดเพิ่มเติม...'} className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-[#1A1A18] focus:ring-0 placeholder:text-neutral-300" />
                </div>

                {/* 🍰 UPSELL: QUICK ADD */}
                {upsellItem && !cart.find(i => i.id === upsellItem.id) && (
                  <div className="mt-8 bg-[#f6f7f1] border-2 border-black p-6 flex items-center justify-between group transition-all">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 bg-white flex-shrink-0 overflow-hidden border border-black">
                         <img src={upsellItem.image_url} alt={getPrimaryMenuName(upsellItem)} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" decoding="async" />
                       </div>
                       <div>
                         <p className="text-[7px] font-black text-black uppercase tracking-[0.3em] mb-1">Recommended for you</p>
                         <h4 className="text-[11px] font-black text-black uppercase tracking-tight">{getPrimaryMenuName(upsellItem)}</h4>
                         {getSecondaryMenuName(upsellItem, locale === 'zh' ? 'zh' : 'en') && (
                           <p className="text-[8px] font-semibold text-gray-500 mt-0.5 line-clamp-1">
                             {getSecondaryMenuName(upsellItem, locale === 'zh' ? 'zh' : 'en')}
                           </p>
                         )}
                         <p className="text-[9px] font-bold text-gray-500 mt-0.5">{locale === 'en' ? '+฿' : locale === 'zh' ? '+฿' : '+฿'}{upsellItem.sale_price}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => addToCart(upsellItem)}
                      className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all border border-black"
                    >
                      ADD
                    </button>
                  </div>
                )}



                <div className="pt-10 border-t-2 border-dashed border-gray-100 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{t.subtotal}</span>
                    <span className="text-black">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{t.deliveryFee}</span>
                    <span className="text-emerald-600">{(orderType === 'delivery') ? (effectiveDeliveryFee === -1 ? 'อยู่นอกพื้นที่ให้บริการ' : effectiveDeliveryFee > 0 ? `฿${effectiveDeliveryFee.toLocaleString()}` : (
                      <span className="flex items-center gap-1">
                        {deliveryFee > 0 && <span className="line-through text-gray-300">฿{deliveryFee}</span>}
                        <span>FREE</span>
                      </span>
                    )) : 'FREE'}</span>
                  </div>

                  {/* 🧧 INTEGRATED LOYALTY SECTION - GRAB STYLE */}
                  <div className="mt-8 mx-[-24px] border-t-[8px] border-[#F5F5F5] bg-white">
                     
                     {/* Pre-order Pick-up Time Row */}
                      {isPreorderMode && orderType !== 'takeaway' && (
                        <div className="px-6 py-4 border-b border-[#F5F5F5] bg-amber-50">
                           <div className="flex flex-col gap-2">
                              <span className="text-[12px] font-black text-amber-800 uppercase tracking-wider">
                                 ⏰ สั่งล่วงหน้าสำหรับรับวันพรุ่งนี้
                              </span>
                              <div className="flex items-center gap-3">
                                 <select
                                    value={preorderTime}
                                    onChange={(e) => setPreorderTime(e.target.value)}
                                    className="flex-1 bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-[14px] focus:outline-none"
                                 >
                                    <option value="">-- เลือกเวลารับอาหารพรุ่งนี้ --</option>
                                    {generateTimeOptions().map((time) => (
                                       <option key={time} value={time}>
                                          {time} น.
                                       </option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                        </div>
                     )}
                     
                     {/* Coupon Row */}
                     <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F5] active:bg-gray-50 cursor-pointer transition-colors" onClick={() => setIsCouponModalOpen(true)}>
                        <span className="text-[14px] font-bold text-[#1A1A18]">{locale === 'en' ? 'My Coupons' : 'คูปองของฉัน'}</span>
                        <div className="flex items-center gap-2">
                           {activeCoupon ? (
                              <span className="text-[14px] font-bold text-emerald-500">
                                {activeCoupon.discount_type === 'percent' ? `ลด ${activeCoupon.discount_value}%` : 
                                 activeCoupon.discount_type === 'free_item' ? 'ฟรีสินค้า 1 รายการ' : 
                                 `-฿${activeCoupon.discount_value}`}
                              </span>
                           ) : (
                              <span className="text-[14px] font-bold text-gray-400">{locale === 'en' ? 'Select coupon' : 'เลือกคูปอง'}</span>
                           )}
                           <ChevronRight size={18} className="text-gray-400" />
                        </div>
                     </div>
                     

                     {/* Payment Method Row */}
                     <div className="flex items-center justify-between px-6 py-4 active:bg-gray-50 cursor-pointer transition-colors" onClick={() => setPaymentMethod('cod')}>
                        <span className="text-[14px] font-bold text-[#1A1A18]">{locale === 'en' ? 'Pay via' : 'ชำระเงินโดย'}</span>
                        <div className="flex items-center gap-2">
                           {paymentMethod === 'cod' && (
                              <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center mr-1">
                                 <CheckCircle2 size={12} strokeWidth={3} />
                              </div>
                           )}
                           <span className="text-[14px] font-bold text-[#1A1A18]">
                              {paymentMethod === 'cod' ? (locale === 'en' ? 'Cash on Delivery' : 'เงินสดปลายทาง') : (locale === 'en' ? 'Select Payment' : 'เลือกช่องทางชำระเงิน')}
                           </span>
                           <ChevronRight size={18} className="text-gray-400" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* 🚀 STICKY FOOTER GRAB STYLE (BLACK THEME) */}
              <div className="flex-none bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-[2100]">
                 {(!isShopEffectivelyOpen && !isPreorderMode) ? (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex flex-col gap-3">
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-loose">
                        {closeMessage || 'CLOSED • TEMP. PAUSED'}
                      </p>
                      <button
                        onClick={() => setIsPreorderMode(true)}
                        className="w-full py-3 bg-black hover:bg-neutral-900 active:scale-95 transition-all text-white text-[12px] font-black uppercase tracking-[0.1em] rounded-xl flex items-center justify-center gap-2 shadow-md shadow-black/10"
                      >
                         สั่งอาหารล่วงหน้า (รับวันพรุ่งนี้)
                      </button>
                    </div>
                  ) : (orderType === 'delivery' && effectiveDeliveryFee === -1) ? (
                   <button 
                     disabled={true}
                     className="w-full h-14 bg-red-50 text-red-400 rounded-xl flex items-center justify-center px-4 transition-all cursor-not-allowed border border-red-100"
                   >
                     <span className="text-[14px] font-black uppercase tracking-widest text-red-500">
                        {locale === 'en' ? 'Out of Delivery Area' : 'อยู่นอกพื้นที่ให้บริการ'}
                     </span>
                   </button>
                  ) : (
                   <button 
                     onClick={validateAndCheckout} 
                     disabled={isProcessing}
                     className={`w-full h-14 bg-black text-white rounded-xl flex items-center justify-between px-4 transition-all active:scale-[0.98] ${isProcessing ? 'opacity-80 cursor-not-allowed' : 'shadow-lg shadow-black/20'}`}
                   >
                     <div className="bg-white text-black font-black text-[14px] h-7 min-w-[28px] px-2 flex items-center justify-center rounded">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                     </div>
                     <span className="text-[16px] font-black text-white">
                        {isProcessing ? (locale === 'en' ? 'PROCESSING...' : 'กำลังดำเนินการ...') : (locale === 'en' ? 'Order Now' : 'สั่งเลย')}
                     </span>
                     <span className="text-[16px] font-black text-white">
                        ฿{grandTotal.toLocaleString()}
                     </span>
                   </button>
	                 )}
	              </div>
	          </motion.div>
	        )}
	      </AnimatePresence>

      {/* Payment Drawer REMOVED */}

      {/* 🍯 Sweetness Modal */}
      <AnimatePresence>
        {isSweetnessOpen && (
          <motion.div 
            key="sweetness-modal"
            className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md shadow-2xl flex items-center justify-center p-4 transition-all"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-none w-full max-w-[340px] p-8 shadow-2xl relative overflow-hidden"
            >
               <button onClick={() => { setIsSweetnessOpen(false); setPendingItem(null); }} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-none z-10 active:scale-90 transition-all text-gray-400"><X size={16}/></button>
               
               <div className="text-center mb-8 pt-4">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">CUSTOMIZE SELECTION</p>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-[#1A1A18] mb-1">{t.sweetness}</h2>
                 <div className="mt-4 rounded-none border border-gray-100 bg-gray-50 px-4 py-3">
                   <p className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-600 mb-1">SELECTED MENU</p>
                   <p className="text-[15px] sm:text-base font-black leading-snug text-[#1A1A18] break-words">
                     {pendingItem ? getPrimaryMenuName(pendingItem) : '...'}
                   </p>
                 </div>
                 <div className="w-12 h-1 bg-black mx-auto mt-6 rounded-none" />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 {['0%', '25%', '50%', '75%', '100%', '125%'].map(level => {
                    const desc = level === '0%' ? 'ไม่หวานเลย' : level === '25%' ? 'หวานน้อยมาก' : level === '50%' ? 'หวานน้อย' : level === '100%' ? 'หวานปกติ' : 'หวานมาก';
                    return (
                      <button 
                         key={level} 
                         onClick={() => addToCart(pendingItem!, [{ id: `sweetness-${level}`, name: 'Sweetness', value: level }])}
                         className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-transparent rounded-none active:scale-[0.95] transition-all hover:border-black group"
                      >
                         <span className="text-[10px] font-black uppercase text-gray-900 mb-1">{level}</span>
                      </button>
                    )
                 })}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 📍 Address Selector HUD */}
      <AnimatePresence>
        {isAddressSelectorOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[3000] bg-white flex flex-col"
          >
            {addressView === 'list' ? (
              <>
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-4 py-4 h-[72px]">
                  <button onClick={() => setIsAddressSelectorOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-95 transition-transform">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex-1 text-center">
                    <h2 className="text-[16px] font-black uppercase text-[#1A1A18] tracking-[0.1em]">{locale === 'en' ? 'Delivery Setup' : 'ตำแหน่งจัดส่ง'}</h2>
                  </div>
                  <div className="w-10 h-10 flex-none" />
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                  <div className="px-6 py-5 space-y-6 pb-28">
                    
                    {/* Active Selected Location Summary */}
                    <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        {locale === 'en' ? 'Current Delivery To' : 'จัดส่งที่อยู่นี้'}
                      </p>
                      
                      <div className="mt-2 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[16px] font-black text-black leading-snug truncate">
                            {addressShort && addressShort !== 'เลือกที่อยู่จัดส่ง' ? addressShort : 'ยังไม่ได้ระบุตำแหน่ง'}
                          </h4>
                          {address && (
                            <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed line-clamp-2">
                              {address}
                            </p>
                          )}
                          
                          {/* Inline Delivery Fee */}
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-neutral-600">
                            <Truck size={12} className="text-neutral-400" />
                            <span>{locale === 'en' ? 'Delivery Fee' : 'ค่าจัดส่ง'} :</span>
                            <span className="text-black font-black">
                              {effectiveDeliveryFee === -1 ? 'นอกพื้นที่จัดส่ง' : effectiveDeliveryFee > 0 ? `฿${effectiveDeliveryFee.toLocaleString()}` : 'ฟรี (FREE)'}
                            </span>
                          </div>
                        </div>

                        {/* Edit Pin on Map */}
                        <button
                          onClick={() => openNewAddressFlow(false)}
                          className="flex-none w-10 h-10 rounded-full bg-black text-white hover:bg-neutral-900 active:scale-95 transition-all flex items-center justify-center shadow-md shadow-black/10"
                          title={locale === 'en' ? 'Edit Pin' : 'แก้ไขตำแหน่งบนแผนที่'}
                        >
                          <MapPin size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Quick GPS Location Action */}
                    <button
                      onClick={() => detectLocation({ openMap: false, applyToCheckout: true })}
                      disabled={isLocatingAddress}
                      className="w-full h-11 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                    >
                      {isLocatingAddress ? <XYLLoader mini /> : <><Target size={14} className="text-black" /> {locale === 'en' ? 'Use Current Location' : 'ใช้ตำแหน่งปัจจุบันของคุณ'}</>}
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-neutral-100"></div>

                    {/* 🏠 Saved Addresses Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[14px] font-black tracking-tight text-black">
                          {locale === 'en' ? 'Saved Addresses' : 'ที่อยู่ของคุณ'}
                        </h3>
                        <button 
                          onClick={() => openNewAddressFlow(true)}
                          className="flex items-center gap-1 text-[11px] font-black tracking-wider text-black hover:text-neutral-600 transition-colors uppercase active:scale-95"
                        >
                          <Plus size={14} strokeWidth={3.5} />
                          {locale === 'en' ? 'Add New' : 'เพิ่มที่อยู่ใหม่'}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {savedAddresses.length > 0 ? savedAddresses.map((addr) => {
                          const { locale } = useI18n();
                          const isSelected = selectedAddressId === addr.id;

                          return (
                            <div 
                              key={addr.id} 
                              onClick={() => applyAddressSelection(addr)}
                              className="group relative py-3.5 flex items-start gap-4 cursor-pointer transition-all border-b border-neutral-100 last:border-0"
                            >
                              {/* Left Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-none transition-colors ${
                                isSelected ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-400 group-hover:bg-neutral-100'
                              }`}>
                                {addr.label === 'Home' ? <HomeIcon size={14} /> : addr.label === 'Work' ? <Briefcase size={14} /> : <MapPin size={14} />}
                              </div>

                              {/* Center Address Text */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                                    isSelected ? 'text-black' : 'text-neutral-500'
                                  }`}>
                                    {addr.label || 'Other'}
                                  </span>
                                  {addr.is_primary && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase bg-amber-50 text-amber-600 border border-amber-100">
                                      หลัก
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                                  )}
                                </div>

                                <p className={`mt-1 text-[13px] font-bold leading-tight truncate ${isSelected ? 'text-black font-black' : 'text-neutral-700'}`}>
                                  {addr.full_address}
                                </p>
                                {addr.address_detail && (
                                  <p className="mt-0.5 text-[11px] text-neutral-400 truncate">
                                    {addr.address_detail}
                                  </p>
                                )}
                              </div>

                              {/* Right Inline Action Controls */}
                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => openEditAddressFlow(addr)}
                                  className="w-7 h-7 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-all"
                                  title={locale === 'en' ? 'Edit' : 'แก้ไข'}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(locale === 'en' ? 'Delete this address?' : 'ต้องการลบที่อยู่นี้ใช่หรือไม่?')) {
                                      deleteSavedAddress(addr.id);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center active:scale-95 transition-all"
                                  title={locale === 'en' ? 'Delete' : 'ลบ'}
                                >
                                  <Trash2 size={12} />
                                </button>
                                {isSelected && (
                                  <div className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center">
                                    <Check size={12} strokeWidth={3.5} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="py-10 px-6 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-100">
                            <MapPin size={20} className="text-neutral-300 mx-auto mb-2" />
                            <p className="text-[12px] font-black tracking-tight text-neutral-800">{locale === 'en' ? 'No saved addresses' : 'ยังไม่มีที่อยู่บันทึกไว้'}</p>
                            <p className="mt-0.5 text-[10px] font-bold text-neutral-400">{locale === 'en' ? 'Add a new address to use later' : 'เพิ่มที่อยู่ใหม่เพื่อความสะดวก'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col relative bg-white">
                <header className="absolute top-12 left-4 right-4 z-[2600] pointer-events-none flex flex-col gap-3">
                   <div className="flex items-center gap-3 pointer-events-auto">
                     <button onClick={() => setAddressView('list')} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all text-black border border-neutral-100">
                       <X size={20} />
                     </button>
                     <div className="flex-1">
                       <Autocomplete 
                        onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                        onPlaceChanged={() => {
                          const place = autocompleteRef.current?.getPlace();
                          if (place?.geometry?.location) {
                            const lat = place.geometry.location.lat();
                            const lng = place.geometry.location.lng();
                            setTempPin({ lat, lng });
                            setMapCenter({ lat, lng });
                            if (place.formatted_address) {
                              setTempAddress(place.formatted_address);
                              setTempAddressShort(formatAddressShort(place.formatted_address));
                            }
                          }
                        }}
                       >
                          <div className="relative w-full shadow-lg rounded-full overflow-hidden bg-white border border-neutral-100">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input 
                              type="text" 
                              placeholder={locale === 'en' ? 'Search location...' : 'ค้นหาสถานที่ หรือระบุที่อยู่...'} 
                              className="w-full h-12 bg-transparent pl-12 pr-4 text-[14px] font-bold outline-none text-black placeholder:text-neutral-400"
                            />
                          </div>
                       </Autocomplete>
                     </div>
                   </div>
                </header>

                <div className="absolute right-4 z-[2600] pointer-events-auto transition-all" style={{ bottom: mapSheetHeight + 20 }}>
                  <button
                    onClick={() => detectLocation({ openMap: false, applyToCheckout: false })}
                    disabled={isLocatingAddress}
                    className="w-12 h-12 bg-white rounded-full shadow-lg border border-neutral-100 flex items-center justify-center text-black active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLocatingAddress ? <XYLLoader mini /> : <Target size={20} />}
                  </button>
                </div>

                <div className="flex-1">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={mapCenter}
                      zoom={17}
                      onLoad={handleLocationMapLoad}
                      onClick={onMapClick}
                      options={{
                        disableDefaultUI: true,
                        clickableIcons: false,
                        mapTypeId: 'roadmap',
                        gestureHandling: 'greedy',
                      }}
                    >
                      {tempPin && <Marker 
                        position={tempPin} 
                        draggable={true} 
                        onDragEnd={onMapClick}
                        animation={google.maps.Animation.DROP}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: '#000',
                            fillOpacity: 1,
                            strokeWeight: 4,
                            strokeColor: '#fff',
                        }}
                      />}
                    </GoogleMap>
                  ) : <div className="flex-1 flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-300" /></div>}
                </div>

                <motion.div
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.22 }}
                  dragMomentum={false}
                  onDragStart={handleLocationSheetDragStart}
                  onDrag={handleLocationSheetDrag}
                  onDragEnd={handleLocationSheetDragEnd}
                  initial={{ y: 32, opacity: 0, height: 300 }}
                  animate={{ y: 0, opacity: 1, height: mapSheetHeight }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                  className="absolute inset-x-0 bottom-0 p-6 bg-white border-t border-black/5 shadow-[0_-24px_60px_rgba(0,0,0,0.12)] z-30 overflow-hidden"
                >
                  <div className="w-full flex justify-center mb-6 cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }}>
                    <div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div>
                  </div>

                  <div className="flex items-start gap-4 mt-2">
                    <div className="w-12 h-12 bg-neutral-100 text-black rounded-full flex items-center justify-center flex-none shrink-0 mt-1">
                      <MapPin size={22} fill="currentColor" className="text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[18px] font-black tracking-tight text-black leading-snug line-clamp-2">
                        {tempAddressShort || (locale === 'en' ? 'Pin your location' : 'เลื่อนแผนที่เพื่อปักหมุด')}
                      </h3>
                      {tempAddress && tempAddress !== tempAddressShort && (
                        <p className="mt-1.5 text-[13px] font-bold text-neutral-500 leading-relaxed line-clamp-2">
                          {tempAddress}
                        </p>
                      )}
                      
                      {deliveryDistance > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase text-black">
                          <Target size={14} className="text-black" />
                          <span>{deliveryDistance.toFixed(1)} km</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isMapSheetExpanded && (effectiveDeliveryFee > 0 || isFreeDelivery) && (
                    <div className="mt-5 p-4 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-between">
                      <span className="text-[12px] font-black uppercase tracking-wider text-neutral-800">{locale === 'en' ? 'Est. Delivery Fee' : 'ค่าจัดส่งประมาณ'}</span>
                      <span className="text-[16px] font-black text-black flex items-center gap-2">
                        {effectiveDeliveryFee === -1 ? 'อยู่นอกพื้นที่' : effectiveDeliveryFee > 0 ? `฿${effectiveDeliveryFee.toLocaleString()}` : (
                           <>
                             {deliveryFee > 0 && <span className="line-through text-neutral-400 text-sm">฿{deliveryFee}</span>}
                             <span>FREE</span>
                           </>
                        )}
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={confirmMapLocation}
                    disabled={!tempAddress || isProcessing}
                    className="mt-6 w-full h-14 bg-black text-white font-black text-[14px] rounded-2xl active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <XYLLoader mini /> : <>{locale === 'en' ? 'Confirm Location' : 'ยืนยันตำแหน่งนี้'}</>}
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🏠 Address Detail Drawer */}
      <AnimatePresence>
        {isAddressDetailOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed inset-0 z-[4000] bg-white flex flex-col"
          >
             <header className="px-6 pt-6 pb-5 border-b border-black/5 flex items-center justify-between gap-4 bg-white/95 backdrop-blur-md">
                <div>
                 <p className="text-[10px] font-black tracking-[0.24em] uppercase text-black">Delivery Details</p>
                 <h2 className="mt-2 text-[28px] font-black tracking-tight text-black leading-none">{locale === 'en' ? 'Address Details' : 'รายละเอียดที่จัดส่ง'}</h2>
                </div>
               <button onClick={() => setIsAddressDetailOpen(false)} className="p-3 bg-neutral-100 rounded-full active:scale-90 transition-all text-neutral-500"><X size={20} /></button>
             </header>

             <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar bg-[#fcfcfc]">
                <section>
                   <label className="text-[12px] font-black tracking-tight text-neutral-800 mb-2 block">{locale === 'en' ? 'Building Name / Floor / Unit (Optional)' : 'ชั้น, อาคาร, ห้อง (ไม่บังคับ)'}</label>
                   <input 
                      type="text" value={addressDetail} onChange={e => setAddressDetail(e.target.value)}
                      placeholder={locale === 'en' ? 'e.g. G Tower Floor 24...' : 'เช่น อาคาร G Tower ชั้น 24...'}
                      className="w-full h-14 bg-white border border-neutral-200 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                   />
                </section>

                <section className="border border-neutral-200 rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[13px] font-black text-neutral-800">{locale === 'en' ? 'Save for next time' : 'บันทึกที่อยู่นี้ไว้ใช้ครั้งหน้า'}</p>
                      <p className="mt-1 text-[11px] font-bold text-neutral-500">{locale === 'en' ? 'Save to your address book' : 'เพิ่มลงในรายการที่อยู่ของคุณ'}</p>
                    </div>
                    <button
                      onClick={() => setSaveToAddressBook(!saveToAddressBook)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${saveToAddressBook ? 'bg-black' : 'bg-neutral-200'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${saveToAddressBook ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {saveToAddressBook && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-neutral-100 pt-4 space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block">{locale === 'en' ? 'Address Type' : 'ประเภทที่อยู่'}</label>
                          <div className="flex gap-2">
                            {[ 
                              { id: 'Home', label: 'บ้าน', icon: '🏠' }, 
                              { id: 'Work', label: 'ที่ทำงาน', icon: '🏢' }, 
                              { id: 'Other', label: 'อื่นๆ', icon: '📍' } 
                            ].map(item => (
                              <button
                                key={item.id}
                                onClick={() => setAddressLabel(item.id)}
                                className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-lg border transition-all ${
                                  addressLabel === item.id 
                                    ? 'bg-black border-black text-white' 
                                    : 'bg-white border-neutral-200 text-neutral-500'
                                }`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-black text-neutral-700">{locale === 'en' ? 'Set as primary address' : 'ตั้งเป็นที่อยู่หลัก'}</span>
                          <button
                            onClick={() => setIsPrimary(!isPrimary)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPrimary ? 'bg-black border-black text-white' : 'border-neutral-300 bg-white'}`}
                          >
                            {isPrimary && <CheckCircle2 size={14} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                 </section>

                 <section className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex gap-3">
                    <Clock size={18} className="text-black shrink-0" />
                    <div>
                       <p className="text-[11px] font-black text-neutral-800 leading-snug">{locale === 'en' ? 'Clear details help us deliver faster.' : 'ข้อมูลที่ชัดเจนช่วยให้เราส่งอาหารถึงคุณได้เร็วขึ้น'}</p>
                    </div>
                 </section>

                <section className="p-5 bg-white border border-black/5">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Selected Location</p>
                   <p className="text-[13px] font-bold text-neutral-900 leading-6">{tempAddress}</p>
                </section>
             </div>

               <div className="p-6 border-t border-black/5 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.03)]">
               <button 
                  onClick={() => confirmLocation(tempAddress, tempAddressShort)}
                  disabled={isProcessing}
                  className="w-full h-14 bg-black text-white font-black text-[11px] active:scale-[0.98] transition-all shadow-2xl uppercase tracking-[0.26em] flex items-center justify-center gap-3 disabled:bg-gray-200"
               >
                  {isProcessing ? <XYLLoader mini /> : <>{editingAddressId ? 'อัปเดตและใช้ที่อยู่นี้' : 'บันทึกและใช้ที่อยู่นี้'} <CheckCircle2 size={18} /></>}
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-12 pb-24 text-center opacity-10 pointer-events-none">
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-[#1A1A18]">
          Designed by XYL STUDIO • v1.0.32
        </p>
      </div>

      {/* Custom Styles */}
      {/* 🔮 MODIFIER MODAL */}
      <AnimatePresence>
        {pendingItem && modifierGroups.length > 0 && (
          <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm touch-none" 
              onClick={() => { setPendingItem(null); setModifierGroups([]); }}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              className="relative w-full max-w-xl bg-white flex flex-col font-bold overflow-hidden rounded-t-[24px]"
              style={{ maxHeight: '85svh' }}
            >
              <header className="flex items-center gap-4 border-b border-gray-100 bg-white px-5 py-4 sticky top-0 z-10 touch-none">
                <button onClick={() => { setPendingItem(null); setModifierGroups([]); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-black active:scale-90 transition-all">
                  <X size={18} />
                </button>
                <h2 className="text-[17px] font-bold text-black leading-tight truncate">
                  {getPrimaryMenuName(pendingItem)}
                </h2>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50 p-4 space-y-4">
                {modifierGroups.map((group, gIdx) => {
                  const minReq = group.min_selection || group.min_select || 0
                  const maxAllowed = group.max_selection || group.max_select || 99
                  const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === group.id)
                  const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0)
                  const isComplete = totalQtyInGroup >= minReq
                  const isAtMax = totalQtyInGroup >= maxAllowed
                  const isError = errorGroupId === group.id

                  return (
                    <div key={group.id} id={`modifier-group-${group.id}`} className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 ${isError ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-[16px] font-bold text-black tracking-tight leading-tight">{group.name}</h3>
                            <p className={`text-[13px] mt-1 transition-colors ${isError ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                {isError ? 'กรุณาเลือกตัวเลือกในหมวดนี้' : 
                                    minReq > 0 && maxAllowed === 1 ? 'เลือก 1 ข้อ' : 
                                    minReq > 0 ? `เลือกอย่างน้อย ${minReq} ข้อ${maxAllowed < 99 ? ` (สูงสุด ${maxAllowed})` : ''}` : 
                                    maxAllowed < 99 ? `เลือกสูงสุด ${maxAllowed} ข้อ` : 'เลือกได้ตามต้องการ'}
                            </p>
                          </div>
                          {minReq > 0 ? (
                            isComplete ? (
                              <span className="bg-[#00B14F]/10 text-[#00B14F] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 animate-in zoom-in">
                                <Check size={12} strokeWidth={3} /> ครบแล้ว
                              </span>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors ${isError ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                จำเป็น
                              </span>
                            )
                          ) : (
                            <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-[11px] font-medium shrink-0">เลือกเสริม</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {group.options?.map((opt: any, optIdx: number) => {
                          const existingOptIndex = tempSelectedModifiers.findIndex(m => m.id === opt.id)
                          const isSelected = existingOptIndex > -1
                          const optQty = isSelected ? (tempSelectedModifiers[existingOptIndex].qty || 1) : 0
                          const isDisabled = !isSelected && isAtMax && maxAllowed > 1
                          
                          return (
                            <button
                              key={opt.id}
                              disabled={isDisabled}
                              onClick={() => {
                                let nextSelected = [...tempSelectedModifiers]
                                if (isSelected) {
                                  if (maxAllowed === 1) {
                                    nextSelected.splice(existingOptIndex, 1)
                                  } else {
                                    if (!isAtMax) {
                                      nextSelected[existingOptIndex] = { ...nextSelected[existingOptIndex], qty: optQty + 1 }
                                    }
                                  }
                                } else {
                                  if (maxAllowed === 1) {
                                    nextSelected = [...nextSelected.filter(m => m.group_id !== group.id), { ...opt, qty: 1 }]
                                  } else {
                                    nextSelected = [...nextSelected, { ...opt, qty: 1 }]
                                  }
                                }
                                setTempSelectedModifiers(nextSelected)
                                if (errorGroupId === group.id) setErrorGroupId(null)
                              }}
                              className={`group relative flex items-center justify-between p-3 rounded-xl transition-all border-2 ${
                                isSelected ? 'border-black bg-gray-50 shadow-sm' : 'border-transparent hover:bg-gray-50'
                              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                                <div className={`flex items-center justify-center shrink-0 transition-all ${
                                  maxAllowed === 1 ? 'w-5 h-5 rounded-full border-2' : 'w-5 h-5 rounded border-2'
                                } ${isSelected ? 'border-black bg-black' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                                  {isSelected && (
                                    maxAllowed === 1 ? (
                                      <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-200" />
                                    ) : (
                                      <Check size={14} className="text-white animate-in zoom-in duration-200" strokeWidth={3} />
                                    )
                                  )}
                                </div>
                                <span className={`text-[15px] truncate leading-tight pt-0.5 ${isSelected ? 'text-black font-bold' : 'text-gray-700 font-medium'}`}>{opt.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {isSelected && maxAllowed > 1 && (
                                  <div className="flex items-center gap-1.5 bg-black/5 rounded-full px-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                                    <div
                                      onClick={() => {
                                        let nextSelected = [...tempSelectedModifiers]
                                        const idx = nextSelected.findIndex(m => m.id === opt.id)
                                        if (idx > -1) {
                                          if ((nextSelected[idx].qty || 1) > 1) {
                                            nextSelected[idx] = { ...nextSelected[idx], qty: nextSelected[idx].qty - 1 }
                                          } else {
                                            nextSelected.splice(idx, 1)
                                          }
                                          setTempSelectedModifiers(nextSelected)
                                        }
                                      }}
                                      className="w-6 h-6 rounded-full bg-white text-red-500 flex items-center justify-center shadow-sm cursor-pointer border border-gray-200 hover:bg-gray-50"
                                    >
                                      <Minus size={12} strokeWidth={4} />
                                    </div>
                                    <span className="text-[12px] font-bold px-1">{optQty}</span>
                                  </div>
                                )}
                                {opt.price_adjustment !== 0 && (
                                    <div className={`text-[14px] font-medium shrink-0 pt-0.5 ${isSelected ? 'text-black' : 'text-gray-500'}`}>
                                      {opt.price_adjustment * Math.max(1, optQty) > 0 ? `+฿${opt.price_adjustment * Math.max(1, optQty)}` : `-฿${Math.abs(opt.price_adjustment * Math.max(1, optQty))}`}
                                    </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <footer className="flex flex-col bg-white/90 backdrop-blur-md p-4 border-t border-gray-100 relative z-20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                {(() => {
                  const incomplete = modifierGroups.filter(g => tempSelectedModifiers.filter(m => m.group_id === g.id).reduce((sum, m) => sum + (m.qty || 1), 0) < (g.min_selection || g.min_select || 0))
                  const canConfirm = incomplete.length === 0
                  const totalPrice = (pendingItem.sale_price || 0) + tempSelectedModifiers.reduce((acc, m) => acc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0)

                  return (
                    <div className="flex w-full items-center gap-3">
                      <div className="flex items-center h-[52px] bg-gray-100 rounded-xl px-1">
                        <button onClick={() => setTempQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Minus size={18}/></button>
                        <div className="w-8 text-center font-bold text-[16px] text-black">{tempQuantity}</div>
                        <button onClick={() => setTempQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Plus size={18}/></button>
                      </div>

                      <button
                        onClick={() => {
                           if (!canConfirm) {
                             const firstIncomplete = incomplete[0].id;
                             setErrorGroupId(firstIncomplete);
                             const el = document.getElementById('modifier-group-' + firstIncomplete);
                             if (el) {
                               el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             }
                             setTimeout(() => setErrorGroupId(null), 2500);
                             return;
                           }
                           addToCart(pendingItem, tempSelectedModifiers, tempQuantity);
                           setPendingItem(null);
                           setModifierGroups([]);
                        }}
                        className={`flex-1 h-[52px] rounded-xl text-[16px] font-bold transition-all flex items-center justify-between px-5 ${
                          canConfirm ? 'bg-black text-white hover:bg-gray-900 active:scale-[0.98] shadow-md' : 'bg-black text-white hover:bg-gray-900 active:scale-[0.98] shadow-md'
                        }`}
                      >
                        <span>{locale === 'en' ? 'Add to Cart' : locale === 'zh' ? 'Add to Cart' : 'ใส่ตะกร้า'}</span>
                        <span>฿{(totalPrice * tempQuantity).toLocaleString()}</span>
                      </button>
                    </div>
                  )
                })()}
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreorderConfirmModal && (
          <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowPreorderConfirmModal(false);
                setPendingPreorderAction(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-[1] w-[min(100%,340px)] overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 animate-bounce">
                 <Clock size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-[18px] font-black text-[#1A1A18] leading-tight">
                 ขณะนี้ร้านค้าปิดให้บริการ
              </h3>
              <p className="mt-2 text-[13px] font-bold text-gray-500 leading-relaxed px-2">
                 คุณต้องการเข้าสู่โหมดสั่งอาหารล่วงหน้า เพื่อระบุเวลารับและรับอาหารในวันพรุ่งนี้หรือไม่?
              </p>
              <div className="mt-6 flex flex-col gap-2">
                 <button
                   type="button"
                   onClick={() => {
                     setIsPreorderMode(true);
                     setShowPreorderConfirmModal(false);
                     if (pendingPreorderAction) {
                        pendingPreorderAction();
                        setPendingPreorderAction(null);
                     }
                   }}
                   className="w-full rounded-2xl bg-black py-3.5 text-[13px] font-black text-white hover:bg-neutral-900 transition-all active:scale-[0.98] shadow-md shadow-black/10"
                 >
                   สั่งอาหารล่วงหน้า
                 </button>
                 <button
                   type="button"
                   onClick={() => {
                     setShowPreorderConfirmModal(false);
                     setPendingPreorderAction(null);
                   }}
                   className="w-full py-2.5 text-[12px] font-bold text-gray-400 hover:text-gray-600 transition-all"
                 >
                   ยกเลิก
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .wiggle-anim { animation: wiggle 2s infinite ease-in-out; }
        
        @keyframes shaker {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          20% { transform: translateY(-4px) rotate(-10deg); }
          40% { transform: translateY(-4px) rotate(10deg); }
          60% { transform: translateY(-4px) rotate(-10deg); }
          80% { transform: translateY(-4px) rotate(10deg); }
        }
        .shaker-move {
          animation: shaker 0.8s infinite ease-in-out;
          transform-origin: bottom center;
        }

        @keyframes speed-line {
          0% { transform: translateX(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateX(20px); opacity: 0; }
        }
        .speed-anim-1 { animation: speed-line 0.8s infinite ease-in; }
        .speed-anim-2 { animation: speed-line 0.8s infinite ease-in 0.2s; }
        .speed-anim-3 { animation: speed-line 0.8s infinite ease-in 0.4s; }

        .pac-container {
          z-index: 10000 !important;
          border-radius: 16px;
          border: none;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          margin-top: 8px;
          font-family: inherit;
          padding: 8px 0;
        }
        .pac-item {
          padding: 12px 16px;
          cursor: pointer;
          border-top: 1px solid #f8f8f8;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pac-item:first-child { border-top: none; }
        .pac-item-query { font-size: 14px; color: #1a1a1b; font-weight: 600; }
        .pac-matched { color: #10b981; }
        .pac-icon { display: none; }
      `}</style>
      
      {/* Custom Reorder Alert Modal */}
      {reorderAlertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                 <AlertCircle className="w-6 h-6 text-orange-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 mb-2">แจ้งเตือน</h3>
              <p className="text-[14px] text-gray-500 whitespace-pre-wrap mb-6 leading-relaxed">
                 {reorderAlertMessage}
              </p>
              <button 
                onClick={() => setReorderAlertMessage(null)}
                className="w-full py-3.5 bg-gray-900 text-white rounded-full font-bold text-[15px] active:scale-[0.98] transition-all"
              >
                 รับทราบ
              </button>
           </div>
        </div>
      )}
      {/* Coupon Modal (Full Screen) */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-[#F5F5F5] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="px-6 pb-4 border-b border-gray-200 bg-white pt-12 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-black text-[#1A1A18] tracking-tight">{locale === 'en' ? 'My Coupons' : 'คูปองของฉัน'}</h2>
              <p className="text-[13px] text-gray-500 mt-1">{locale === 'en' ? 'Select a coupon to apply discount' : 'เลือกคูปองเพื่อใช้เป็นส่วนลด'}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsCouponModalOpen(false);
              }}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {memberCoupons.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                   <Ticket className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-[14px] font-medium">{locale === 'en' ? 'No active coupons' : 'ไม่มีคูปองที่ใช้งานได้ในขณะนี้'}</p>
                 </div>
               ) : (
                 <>
                   {/* Remove Coupon Option */}
                   {activeCoupon && (
                     <div 
                       onClick={() => {
                         setActiveCoupon(null);
                         setIsCouponModalOpen(false);
                       }}
                       className="bg-white rounded-2xl p-4 flex items-center justify-between border border-red-100 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                     >
                       <span className="text-[14px] font-bold text-red-500">{locale === 'en' ? 'Remove Coupon' : 'ยกเลิกการใช้คูปอง'}</span>
                       <X className="w-5 h-5 text-red-500" />
                     </div>
                   )}

                   {/* Coupon List */}
                   {memberCoupons.map((coupon) => (
                     <div 
                       key={coupon.id} 
                       onClick={() => handleSelectCouponWithCheck(coupon)}
                       className={`bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer active:scale-[0.98] transition-all ${activeCoupon?.id === coupon.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-transparent'}`}
                     >
                       <div className="flex">
                         <div className="w-24 h-24 bg-orange-50 flex-shrink-0 flex flex-col items-center justify-center border-r border-dashed border-gray-200 relative">
                           {/* Semi-circles for ticket effect */}
                           <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#F5F5F5] rounded-full" />
                           <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#F5F5F5] rounded-full" />
                           
                           {coupon.pos_loyalty_coupons?.image_url ? (
                             <img src={coupon.pos_loyalty_coupons.image_url} alt="" className="w-16 h-16 object-cover rounded-full shadow-sm" />
                           ) : (
                             <Ticket className="w-8 h-8 text-orange-400" />
                           )}
                         </div>
                         <div className="p-4 flex-1 flex flex-col justify-center">
                           <h3 className="text-[14px] font-bold text-[#1A1A18] leading-tight mb-1">{coupon.coupon_name || coupon.name}</h3>
                           <div className="flex items-center gap-2">
                             <span className="text-[12px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                               {coupon.discount_type === 'percent' ? `ลด ${coupon.discount_value}%` : 
                                coupon.discount_type === 'free_item' ? 'ฟรี 1 รายการ' : 
                                `ลด ฿${coupon.discount_value}`}
                             </span>
                           </div>
                         </div>
                         <div className="p-4 flex items-center justify-center">
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${activeCoupon?.id === coupon.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200'}`}>
                             {activeCoupon?.id === coupon.id && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </>
               )}
            </div>
        </div>
      )}

    </div>
  );
}
