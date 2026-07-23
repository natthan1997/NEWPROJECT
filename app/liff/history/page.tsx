'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  History, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import { HistoryListSkeleton } from '@/components/liff/LiffSkeleton';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";

export default function LiffHistoryPage() {
    const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, phone, loading: liffLoading, hasSeenLoader } = useLiff();
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const uniqueMonths = React.useMemo(() => {
    const monthsMap = new Map<string, string>();
    pastOrders.forEach(order => {
      if (!order.created_at) return;
      const date = new Date(order.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      const label = date.toLocaleDateString(locale === 'en' ? 'en-US' : 'th-TH', {
        month: 'short',
        year: 'numeric'
      });
      monthsMap.set(key, label);
    });
    const sortedKeys = Array.from(monthsMap.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(key => ({
      key,
      label: monthsMap.get(key) || ''
    }));
  }, [pastOrders, locale]);

  const filteredOrders = React.useMemo(() => {
    if (selectedMonth === 'all') {
      if (uniqueMonths.length > 0) {
        const firstKey = uniqueMonths[0].key;
        return pastOrders.filter(order => {
          if (!order.created_at) return false;
          const date = new Date(order.created_at);
          const year = date.getFullYear();
          const month = date.getMonth();
          const key = `${year}-${String(month + 1).padStart(2, '0')}`;
          return key === firstKey;
        });
      }
      return pastOrders;
    }
    return pastOrders.filter(order => {
      if (!order.created_at) return false;
      const date = new Date(order.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [pastOrders, selectedMonth, uniqueMonths]);
  const formatModifierLabel = (modifier: any) => {
    if (!modifier) return '';
    const name = modifier.display_name || modifier.label || modifier.group_name || modifier.name || '';
    const value = modifier.value || modifier.selected_value || modifier.option_value || modifier.option_name || '';
    if ((modifier.is_note || name === 'หมายเหตุ') && value) return `หมายเหตุ: ${value}`;
    if (value && value !== name) return `${name}: ${value}`;
    return name;
  };

  const fetchHistory = async () => {
    const currentUserId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    
    if (!currentUserId && !phone) {
      setFetchLoading(false);
      return;
    }
    
    try {
      setFetchLoading(true);
      // Step 1: Fetch Orders
      let query = supabase.from('pos_orders').select('*');
      if (currentUserId && phone) {
        query = query.or(`line_user_id.eq.${currentUserId},reference_name.eq.${phone}`);
      } else if (currentUserId) {
        query = query.eq('line_user_id', currentUserId);
      } else if (phone) {
        query = query.eq('reference_name', phone);
      }
      
      const { data: orders, error: ordersError } = await query.order('created_at', { ascending: false }).limit(20);
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) {
        setPastOrders([]);
        return;
      }

      // Step 2: Fetch Items
      const orderIds = orders.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('pos_order_items')
        .select(`*, pos_menu_items!item_id(*)`)
        .in('order_id', orderIds);
      
      const mappedOrders = orders.map(order => ({
        ...order,
        order_items: items?.filter(item => item.order_id === order.id) || []
      }));

      setPastOrders(mappedOrders);
    } catch (err) {
      console.error('History fetch failed:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount — userId will be in localStorage even if liff is still hydrating
    fetchHistory();
  }, [lineProfile, phone]);

  useEffect(() => {
    if (uniqueMonths.length > 0 && selectedMonth === 'all') {
      setSelectedMonth(uniqueMonths[0].key);
    }
  }, [uniqueMonths, selectedMonth]);

  const handleReorder = async (items: any[]) => {
    if (!items || items.length === 0) return;
    
    // 🛡️ CHECK SHOP STATUS FIRST
    const { data: settings } = await supabase.from('pos_shop_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    const { data: activeShifts } = await supabase.from('pos_shifts').select('id').eq('status', 'open').limit(1);
    
    let isOpen = true;
    if (settings && !settings.is_open) isOpen = false;
    if (!activeShifts || activeShifts.length === 0) isOpen = false;
    if (settings) {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const daySettings = settings.opening_hours[days[now.getDay()]];
        if (daySettings.closed) isOpen = false;
        else {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [openH, openM] = daySettings.open.split(':').map(Number);
            const [closeH, closeM] = daySettings.close.split(':').map(Number);
            const openTime = openH * 60 + openM;
            const closeTime = closeH * 60 + closeM;
            if (currentTime < openTime || currentTime > closeTime) isOpen = false;
        }
    }

    let isPreorderRedirect = false;
    if (!isOpen) {
        const confirmPreorder = confirm(
            'ขณะนี้ร้านปิดให้บริการสั่งด่วน คุณต้องการเลือกเป็นสั่งซื้อล่วงหน้า (Pre-order) หรือไม่?'
        );
        if (!confirmPreorder) return;
        isPreorderRedirect = true;
    }

    const cartItems = items.map(item => ({
      id: item.pos_menu_items.id,
      name: item.pos_menu_items.name,
      sale_price: item.pos_menu_items.sale_price,
      quantity: item.quantity,
      selected_modifiers: item.selected_modifiers || [],
      sweetness: '100%', // Default sweetness for reorder
    }));
    localStorage.setItem('xylem_cart', JSON.stringify(cartItems));
    router.push(`/liff/menu?openCart=1${isPreorderRedirect ? '&preorder=1' : ''}&t=${Date.now()}`); // Add timestamp to force update/effect
  };

  // Removed blocking loader for instant transition
  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={locale === 'en' ? 'กำลังบันทึกประวัติการสั่งซื้อ...' : locale === 'zh' ? 'กำลังบันทึกประวัติการสั่งซื้อ...' : 'กำลังบันทึกประวัติการสั่งซื้อ...'} />;

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* 🏛️ Boutique Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-4 py-4 h-[72px]">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[16px] font-black uppercase text-[#1A1A18] tracking-[0.1em]">{locale === 'en' ? 'Order History' : 'ประวัติการสั่งซื้อ'}</h1>
        </div>
        <div className="w-10 h-10 flex-none" />
      </header>
      <main className="px-6 py-6">
        {/* Header with Title and Month Dropdown */}
        {!fetchLoading && pastOrders.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[12px] font-black uppercase text-neutral-400 tracking-[0.15em]">
              {locale === 'en' ? 'Order List' : 'รายการสั่งซื้อ'}
            </h2>
            {uniqueMonths.length > 0 && (
              <div className="relative flex items-center select-none liff-no-focus">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-transparent text-neutral-800 text-[12px] font-black uppercase tracking-wider pl-1 pr-6 py-1 cursor-pointer focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus:!ring-transparent focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none transition-all duration-200 border-none outline-none shadow-none focus:shadow-none"
                >
                  {uniqueMonths.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400">
                  <ChevronDown size={12} />
                </div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {fetchLoading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <HistoryListSkeleton />
            </motion.div>
          ) : pastOrders.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag size={24} className="text-neutral-300" />
              </div>
              <h2 className="text-[13px] font-black uppercase text-neutral-400 tracking-wider mb-2">{locale === 'en' ? 'No Order History' : 'ไม่พบประวัติการสั่งซื้อ'}</h2>
              <p className="text-[10px] text-neutral-400 leading-relaxed px-12">{locale === 'en' ? 'Once you place an order, your items will be listed here.' : 'เมื่อคุณสั่งออเดอร์เรียบร้อยแล้ว รายการอาหารและเครื่องดื่มของคุณจะปรากฏที่นี่'}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="divide-y divide-neutral-100"
            >
              {filteredOrders.map((order, idx) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="py-5"
                  >
                    {/* Collapsed Card Header */}
                    <div 
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="flex justify-between items-center cursor-pointer select-none gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <p className="text-[14px] font-black uppercase tracking-tight text-black">
                            {order.order_type === 'dine_in' && order.table_number ? `โต๊ะ ${order.table_number}` : `#${String(order.queue_number || 0).padStart(3, '0')}`}
                          </p>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            order.status === 'completed' || order.status === 'delivered' ? 'bg-neutral-100 text-neutral-500' : 
                            order.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {order.status === 'completed' || order.status === 'delivered' ? 'สำเร็จ' : 
                             order.status === 'cancelled' ? 'ยกเลิก' : 'กำลังเตรียม'}
                          </span>
                          
                          {/* Order Type Label */}
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-neutral-50 text-neutral-400">
                            {order.order_type === 'dine_in' ? 'ทานที่ร้าน' : order.order_type === 'delivery' ? 'จัดส่ง' : 'กลับบ้าน'}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400">
                          {new Date(order.created_at).toLocaleDateString('th-TH', { 
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[14px] font-black tracking-tight text-black">
                            {locale === 'en' ? '฿' : '฿'}{order.total_amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-neutral-400">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Row */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mt-4 pt-4 border-t border-neutral-100"
                        >
                          {/* Order Items List */}
                          <div className="space-y-2 mb-5">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-start py-1 text-[12px]">
                                <div className="flex min-w-0 items-start gap-2.5">
                                  <span className="text-[11px] font-black text-neutral-300">{item.quantity}x</span>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-neutral-800 uppercase tracking-tight leading-tight">{item.pos_menu_items?.name}</h4>
                                    {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                                      <p className="mt-0.5 text-[10px] font-semibold text-neutral-400 leading-snug">
                                        {item.selected_modifiers.map((modifier: any) => formatModifierLabel(modifier)).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="font-black text-neutral-900 ml-4">{locale === 'en' ? '฿' : '฿'}{item.subtotal?.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          {/* Order actions and total summary */}
                          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase text-neutral-400 tracking-wider leading-none mb-1">{locale === 'en' ? 'Order Total' : 'ยอดชำระสุทธิ'}</span>
                              <span className="text-[16px] font-black tracking-tight text-black">{locale === 'en' ? '฿' : '฿'}{order.total_amount?.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex gap-2">
                              {/* Track order */}
                              <button
                                onClick={() => router.push(`/liff/track/${order.id}`)}
                                className="h-10 px-4 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                ติดตามออเดอร์
                              </button>
                              
                              {/* Reorder */}
                              <button
                                onClick={() => handleReorder(order.order_items)}
                                className="h-10 px-4 bg-black hover:bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                {locale === 'en' ? 'Reorder' : 'สั่งเมนูเดิม'}<ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>



      <div className="py-12 pb-24 text-center opacity-25 pointer-events-none">
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-[#1A1A18]">
          Designed by XYL STUDIO • v1.0.33
        </p>
      </div>
    </div>
  );
}
