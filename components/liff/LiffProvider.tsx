'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sortMenuItemsByOrder } from '@/lib/posMenuOrder';
import XYLLoader from '@/components/loaders/XYLLoader';

declare global {
  interface Window {
    liff: any;
  }
}

interface LiffContextType {
  // Identity
  lineProfile: any;
  loading: boolean;
  error: string | null;
  phone: string;
  setPhone: (p: string) => void;
  address: string;
  setAddress: (a: string) => void;
  addressShort: string;
  setAddressShort: (a: string) => void;
  updateMemberInDB: (updates: { phone?: string; address?: string }) => Promise<void>;
  refreshHistory: () => Promise<void>;
  liff: any;

  // 🌍 Global Cached Data
  categories: any[];
  banners: any[];
  bestSellers: any[];
  shopStatus: any;
  activeOrders: any[];
  memberInfo: any;
  isDataReady: boolean;
  hasSeenLoader: boolean;
  setHasSeenLoader: (val: boolean) => void;
  refreshShopStatus: () => Promise<void>;
  refreshActiveOrders: () => Promise<void>;
  setActiveOrders: (orders: any[]) => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) throw new Error('useLiff must be used within LiffProvider');
  return context;
};

export const LiffProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();

  // --- Identity ---
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressShort, setAddressShort] = useState('');
  const initialized = useRef(false);

  // --- 🌍 Global Cached App Data ---
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [shopStatus, setShopStatus] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const dataFetched = useRef(false);

  const [posterUrlCache, setPosterUrlCache] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('xyl_poster_url') || null;
    }
    return null;
  });

  const [isPosterMinTimerActive, setIsPosterMinTimerActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPosterMinTimerActive(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const url = shopStatus?.opening_hours?.liff_splash_poster_url || shopStatus?.liff_splash_poster_url;
    if (url) {
      setPosterUrlCache(url);
      localStorage.setItem('xyl_poster_url', url);
    } else if (shopStatus) {
      setPosterUrlCache(null);
      localStorage.removeItem('xyl_poster_url');
    }
  }, [shopStatus]);

  const formatAddressShort = (addr: string) => {
    if (!addr || addr.trim() === '' || addr.trim() === ':') return 'เลือกที่อยู่จัดส่ง';
    let clean = addr
      .replace(/ตำแหน่งปัจจุบัน|พิกัด|พัดกัก|พิกัด:|พัดกัก:|Coordinates:|position:|lat:|lng:|📍/gi, '')
      .replace(/-?\d+\.\d+\s*,\s*-?\d+\.\d+/g, '')
      .replace(/[.:;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean || clean === '' || clean === ':') return 'เลือกที่อยู่จัดส่ง';
    const sub = clean.match(/(?:แขวง|ต\.)\s?([^,\s\d]+)/)?.[1];
    const dist = clean.match(/(?:เขต|อ\.)\s?([^,\s\d]+)/)?.[1];
    if (sub && dist) return `${sub}, ${dist}`;
    if (dist) return dist;
    if (sub) return sub;
    return clean.length > 25 ? clean.substring(0, 25) + '...' : clean;
  };

  // --- Fetch: App-level data (shared across all LIFF pages) ---
  const fetchCoreData = useCallback(async (userId?: string, preloadedData?: any) => {
    try {
      if (preloadedData && preloadedData.success && preloadedData.menu && Array.isArray(preloadedData.menu.categories) && preloadedData.menu.categories.length > 0) {
        if (preloadedData.banners) setBanners(preloadedData.banners);
        if (preloadedData.shopStatus) setShopStatus(preloadedData.shopStatus);
        if (preloadedData.activeOrders) setActiveOrders(preloadedData.activeOrders);
        if (preloadedData.member) setMemberInfo(preloadedData.member);
        
        const menuData = preloadedData.menu;
        setCategories(menuData.categories);
        if (menuData.items) {
          const items = menuData.items;
          const popular = items.filter((i: any) => i.is_popular || i.is_recommended).slice(0, 6);
          setBestSellers(sortMenuItemsByOrder(popular));
        }
        setIsDataReady(true);
        dataFetched.current = true;
        return;
      }

      // Fallback client-side fetching logic
      const fetchMenuCache = fetch('/api/cache/menu').then(r => r.json()).catch(() => null);
      
      const [bannerRes, statusRes, menuCache] = await Promise.all([
        supabase.from('pos_banners').select('*').eq('is_active', true).order('order_index').limit(5),
        supabase.from('pos_shop_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        fetchMenuCache
      ]);

      if (menuCache && menuCache.data) {
        if (menuCache.data.categories) setCategories(menuCache.data.categories);
        if (menuCache.data.items) {
          const items = menuCache.data.items;
          const popular = items.filter((i: any) => i.is_popular || i.is_recommended).slice(0, 6);
          setBestSellers(sortMenuItemsByOrder(popular));
        }
      }

      if (bannerRes.data) setBanners(bannerRes.data);
      if (statusRes.data) setShopStatus(statusRes.data);

      // Active orders (requires userId)
      if (userId) {
        const { data: orders } = await supabase
          .from('pos_orders')
          .select('*')
          .eq('line_user_id', userId)
          .in('status', ['pending', 'payment_pending', 'paid', 'accepted', 'preparing', 'shipping', 'out_for_delivery'])
          .order('created_at', { ascending: false })
          .limit(3);
        if (orders) setActiveOrders(orders);

        const { data: member } = await supabase
          .from('pos_members')
          .select('*')
          .eq('line_user_id', userId)
          .maybeSingle();
        if (member) setMemberInfo(member);
      }
    } catch (err) {
      console.error('Core data fetch error:', err);
    } finally {
      setIsDataReady(true);
      dataFetched.current = true;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('xyl_has_seen_loader', 'true');
      }
    }
  }, []);

  const refreshShopStatus = useCallback(async () => {
    const { data } = await supabase.from('pos_shop_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (data) setShopStatus(data);
  }, []);

  const refreshActiveOrders = useCallback(async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    const { data: orders } = await supabase
      .from('pos_orders')
      .select('*')
      .eq('line_user_id', userId)
      .in('status', ['pending', 'payment_pending', 'paid', 'accepted', 'preparing', 'shipping', 'out_for_delivery'])
      .order('created_at', { ascending: false })
      .limit(3);
    if (orders) setActiveOrders(orders);
  }, [lineProfile]);

  // --- Load from localStorage ---
  useEffect(() => {
    const savedPhone = localStorage.getItem('xylem_phone');
    const savedAddress = localStorage.getItem('xylem_address');
    if (savedPhone) setPhone(savedPhone);
    if (savedAddress) {
      setAddress(savedAddress);
      setAddressShort(formatAddressShort(savedAddress));
    }
  }, []);

  // --- Real-time member sync ---
  useEffect(() => {
    if (!memberInfo?.id) return;
    
    const channel = supabase.channel(`public:pos_members:id=eq.${memberInfo.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pos_members', filter: `id=eq.${memberInfo.id}` },
        (payload) => {
          if (payload.new) {
            setMemberInfo((prev: any) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberInfo?.id]);


  const liffIdRaw = process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi';
  const liffId = liffIdRaw.replace(/[^a-zA-Z0-9-]/g, '');

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initLiff = async () => {
      if (!liffId) {
        setError('Missing LIFF ID');
        setLoading(false);
        fetchCoreData(); // Still load UI data even without auth
        return;
      }

      try {
        if (!window.liff) {
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((res) => (script.onload = res));
        }

        const liff = (window as any).liff;

        // Clean liff.state from window.location BEFORE liff.init() runs
        // so LINE SDK does not trigger auto-login with dirty redirect_uri (which causes 400 Bad Request)
        if (typeof window !== 'undefined' && window.location.search.includes('liff.state=')) {
          try {
            const params = new URLSearchParams(window.location.search);
            const liffState = params.get('liff.state');
            if (liffState) {
              sessionStorage.setItem('liff_raw_state', liffState);
            }
            params.delete('liff.state');
            const newSearch = params.toString();
            const cleanUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
            window.history.replaceState({}, '', cleanUrl);
          } catch (e) {
            console.error('Failed to clean liff.state from URL:', e);
          }
        }

        await liff.init({ liffId: liffId.trim() });

        let userId: string | undefined;
        let initResponseData: any = null;

        const cachedUserId = localStorage.getItem('xylem_line_user_id');

        if (liff.isLoggedIn()) {
          sessionStorage.removeItem('liff_redirect_path');
          const profile = await liff.getProfile();
          setLineProfile(profile);
          localStorage.setItem('xylem_line_user_id', profile.userId);
          userId = profile.userId;

          const res = await fetch('/api/liff/member/init', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId: profile.userId, displayName: profile.displayName, avatarUrl: profile.pictureUrl })
          });
          const json = await res.json().catch(() => null);
          initResponseData = json;
          const memberData = json?.member;

          if (!cachedUserId || loading) {
            if (memberData?.phone) setPhone(memberData.phone);
            if (memberData?.address) {
              setAddress(memberData.address);
              setAddressShort(formatAddressShort(memberData.address));
            }

            if (!memberData?.address && json?.lastDeliveryAddress) {
              setAddress(json.lastDeliveryAddress);
              setAddressShort(formatAddressShort(json.lastDeliveryAddress));
            }
            fetchCoreData(userId, initResponseData);
          } else {
            // Optimistic preloaded was active, just silently sync member info update in background
            if (json?.member) setMemberInfo(json.member);
          }
        } else {
          // Guest mode or not logged in yet - load core data smoothly without forcing redirect to access.line.me
          if (!cachedUserId || loading) {
            const res = await fetch('/api/liff/member/init', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lineUserId: cachedUserId || null })
            });
            initResponseData = await res.json().catch(() => null);
            fetchCoreData(cachedUserId || undefined, initResponseData);
          }
        }
      } catch (err: any) {
        console.error('LIFF Init Error:', err);
        setError(err.message || String(err));
        if (loading) {
          fetchCoreData();
        }
      } finally {
        setLoading(false);
      }
    };

    const runOptimisticLoad = async () => {
      const cachedUserId = typeof window !== 'undefined' ? localStorage.getItem('xylem_line_user_id') : null;
      if (cachedUserId) {
        try {
          const res = await fetch('/api/liff/member/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId: cachedUserId })
          });
          const json = await res.json().catch(() => null);
          
          if (json && json.success) {
            const memberData = json.member;
            if (memberData) {
              setMemberInfo(memberData);
              if (memberData.phone) setPhone(memberData.phone);
              if (memberData.address) {
                setAddress(memberData.address);
                setAddressShort(formatAddressShort(memberData.address));
              }
            }
            if (!memberData?.address && json.lastDeliveryAddress) {
              setAddress(json.lastDeliveryAddress);
              setAddressShort(formatAddressShort(json.lastDeliveryAddress));
            }
            fetchCoreData(cachedUserId, json);
            setLoading(false);
          }
        } catch (e) {
          console.error('Optimistic Preload error:', e);
        }
      }
    };

    runOptimisticLoad();
    initLiff();
  }, [liffId]);

  const updateMemberInDB = async (updates: { phone?: string; address?: string }) => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      const { error } = await supabase.from('pos_members').update(updates).eq('line_user_id', userId);
      if (error) console.error('Database sync error:', error);
    } catch (e) {
      console.error('Critical error in updateMemberInDB:', e);
    }
  };

  const value: LiffContextType = {
    lineProfile,
    loading,
    error,
    phone,
    setPhone,
    address,
    setAddress,
    addressShort,
    setAddressShort,
    updateMemberInDB,
    refreshHistory: async () => {},
    liff: typeof window !== 'undefined' ? (window as any).liff : null,
    // 🌍 Global Cached Data
    categories,
    banners,
    bestSellers,
    shopStatus,
    activeOrders,
    memberInfo,
    isDataReady,
    hasSeenLoader: typeof window !== 'undefined' ? (sessionStorage.getItem('xyl_has_seen_loader') === 'true') : false,
    setHasSeenLoader: (val: boolean) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('xyl_has_seen_loader', val ? 'true' : 'false');
        }
    },
    refreshShopStatus,
    refreshActiveOrders,
    setActiveOrders,
  };

  const currentPoster = posterUrlCache || shopStatus?.opening_hours?.liff_splash_poster_url || shopStatus?.liff_splash_poster_url;
  const showLoader = loading || !isDataReady || (Boolean(currentPoster) && isPosterMinTimerActive);

  return (
    <LiffContext.Provider value={value}>
      {showLoader ? (
        <XYLLoader
          posterUrl={currentPoster}
          tagline="กำลังดาวน์โหลดข้อมูล..."
        />
      ) : (
        children
      )}
    </LiffContext.Provider>
  );
};
