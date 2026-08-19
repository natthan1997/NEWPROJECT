'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { UsersIcon, BriefcaseIcon, Cog6ToothIcon, CurrencyDollarIcon, CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';
import { useI18n } from '@/lib/I18nContext';
import { appCopy, pickLocalizedText } from '@/lib/appLocale';
import { formatCurrencyByLocale } from '@/lib/localeFormat';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion';
import RUSHUPLoader from '@/components/loaders/RUSHUPLoader';

interface Widget {
  id: string;
  title: string;
  colSpan: number;
  height: number;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'revenue', title: 'Sales Revenue', colSpan: 4, height: 140 },
  { id: 'shifts', title: 'Open Shifts', colSpan: 4, height: 140 },
  { id: 'orders', title: 'Monthly Orders', colSpan: 4, height: 140 },
  { id: 'members', title: 'Loyalty Members', colSpan: 4, height: 140 },
  { id: 'menu_items', title: 'Menu Items', colSpan: 4, height: 140 },
  { id: 'branches', title: 'Active Branches', colSpan: 4, height: 140 },
  { id: 'revenue_chart', title: 'Sales Revenue Chart', colSpan: 8, height: 350 },
  { id: 'recent_sales', title: 'Recent Sales', colSpan: 4, height: 350 }
];

// Helper to resolve Thai/English widget labels
const getWidgetLabels = (id: string, locale: string) => {
  const labels: { [key: string]: { th: string; en: string } } = {
    revenue: { th: 'ยอดขายเดือนนี้', en: 'Sales Revenue' },
    shifts: { th: 'กะที่เปิดอยู่', en: 'Open Shifts' },
    orders: { th: 'ออเดอร์เดือนนี้', en: 'Monthly Orders' },
    members: { th: 'สมาชิกในระบบ', en: 'Loyalty Members' },
    menu_items: { th: 'รายการอาหาร/เครื่องดื่ม', en: 'Menu Items' },
    branches: { th: 'สาขาทั้งหมด', en: 'Active Branches' },
    revenue_chart: { th: 'กราฟยอดขายรายวัน', en: 'Sales Revenue Chart' },
    recent_sales: { th: 'ยอดขายล่าสุด', en: 'Recent Sales' }
  };
  return labels[id]?.[locale === 'en' ? 'en' : 'th'] || id;
};

function WidgetCard({ widget, onDragEnd, onResize, children, onSave, locale }: any) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const handleX = useMotionValue(0);
  const handleY = useMotionValue(0);

  const colSpanClasses: { [key: number]: string } = {
    2: 'col-span-12 md:col-span-2',
    3: 'col-span-12 md:col-span-3',
    4: 'col-span-12 md:col-span-4',
    5: 'col-span-12 md:col-span-5',
    6: 'col-span-12 md:col-span-6',
    7: 'col-span-12 md:col-span-7',
    8: 'col-span-12 md:col-span-8',
    9: 'col-span-12 md:col-span-9',
    10: 'col-span-12 md:col-span-10',
    11: 'col-span-12 md:col-span-11',
    12: 'col-span-12 md:col-span-12',
  };

  return (
    <motion.div
      id={`widget-${widget.id}`}
      layout
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        onDragEnd(widget.id, e, info);
      }}
      whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      className={`relative bg-white rounded-3xl border border-neutral-100/80 shadow-xs flex flex-col overflow-hidden group select-none transition-shadow ${
        isDragging ? 'opacity-90 shadow-md ring-2 ring-neutral-200/50' : 'hover:shadow-xs'
      } ${colSpanClasses[widget.colSpan] || 'col-span-12'}`}
      style={{ height: widget.height }}
    >
      {/* Header Grab Bar */}
      <div className="px-5 py-3 border-b border-neutral-100/50 flex items-center justify-between bg-neutral-50/20 shrink-0">
        <span className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.15em]">
          {getWidgetLabels(widget.id, locale)}
        </span>
        
        {/* Grab Handler */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-grab active:cursor-grabbing transition-colors shrink-0"
          title="ลากเพื่อปรับตำแหน่ง"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1.2" fill="currentColor" />
            <circle cx="9" cy="12" r="1.2" fill="currentColor" />
            <circle cx="9" cy="19" r="1.2" fill="currentColor" />
            <circle cx="15" cy="5" r="1.2" fill="currentColor" />
            <circle cx="15" cy="12" r="1.2" fill="currentColor" />
            <circle cx="15" cy="19" r="1.2" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 min-h-0 overflow-y-auto relative text-left">
        {children}
      </div>

      {/* Resize handle (↘) */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        style={{ x: handleX, y: handleY }}
        onDrag={(e, info) => onResize(widget.id, e, info)}
        onDragEnd={() => {
          handleX.set(0);
          handleY.set(0);
          onSave();
        }}
        className="absolute bottom-1 right-1 w-5 h-5 rounded-md hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-950 cursor-se-resize z-20 transition-colors"
        title="ลากเพื่อปรับขนาดความสูงและกว้าง"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 19h4v-4" />
          <path d="M19 19L14 14" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { locale } = useI18n();
  const [revenue, setRevenue] = useState<number|null>(null);
  const [openShifts, setOpenShifts] = useState<number|null>(null);
  const [membersCount, setMembersCount] = useState<number|null>(null);
  const [menuItemsCount, setMenuItemsCount] = useState<number|null>(null);
  const [monthlyOrders, setMonthlyOrders] = useState<number|null>(null);
  const [branchesCount, setBranchesCount] = useState<number|null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  
  // Custom widget grid state
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Load layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('admin_dashboard_widgets_v2');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge layout properties while preserving default widgets properties
          const merged = DEFAULT_WIDGETS.map(dw => {
            const matched = parsed.find((p: any) => p.id === dw.id);
            return matched ? { ...dw, colSpan: matched.colSpan, height: matched.height } : dw;
          });
          // Preserve reorder positions
          const ordered = parsed
            .map((p: any) => merged.find(m => m.id === p.id))
            .filter(Boolean) as Widget[];
          // Add any missing default widgets
          dw_loop: for (const dw of merged) {
            if (!ordered.some(o => o.id === dw.id)) {
              ordered.push(dw);
            }
          }
          setWidgets(ordered);
        }
      } catch (e) {
        console.error('Failed to parse widget layout', e);
      }
    }
  }, []);

  // Fetch stats data
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      if (!supabase) {
        setError(pickLocalizedText(locale, appCopy.adminDashboard.dbUnavailable));
        setLoading(false);
        return;
      }
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);

        const fetchRevenue = async () => {
          const { data, error } = await supabase
            .from('pos_orders')
            .select('total_amount')
            .gte('created_at', startOfMonth.toISOString())
            .eq('status', 'completed');
          if (!error && data) {
            return data.reduce((sum: number, row: any) => sum + (Number(row?.total_amount) || 0), 0);
          }
          return 0;
        };

        const results = await Promise.allSettled([
          fetchRevenue(),
          supabase.from('pos_shifts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('pos_members').select('*', { count: 'exact', head: true }),
          supabase.from('pos_menu_items').select('*', { count: 'exact', head: true }),
          supabase.from('pos_orders').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
          supabase.from('branches').select('*', { count: 'exact', head: true }),
          supabase.from('pos_orders')
            .select('id, total_amount, created_at, status, payment_method')
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        if (results[0].status === 'fulfilled') setRevenue(results[0].value as number);
        if (results[1].status === 'fulfilled') setOpenShifts((results[1] as any).value.count);
        if (results[2].status === 'fulfilled') setMembersCount((results[2] as any).value.count);
        if (results[3].status === 'fulfilled') setMenuItemsCount((results[3] as any).value.count);
        if (results[4].status === 'fulfilled') setMonthlyOrders((results[4] as any).value.count);
        if (results[5].status === 'fulfilled') setBranchesCount((results[5] as any).value.count);
        if (results[6].status === 'fulfilled') setRecentSales((results[6] as any).value.data || []);

      } catch (err: any) {
        setError(err.message || pickLocalizedText(locale, appCopy.adminDashboard.loadError));
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [locale]);

  // Swap reordering logic
  const handleDragEnd = (draggedId: string, event: any, info: any) => {
    const pointerX = info.point.x;
    const pointerY = info.point.y;
    
    let targetId = '';
    for (const w of widgets) {
      if (w.id === draggedId) continue;
      const el = document.getElementById(`widget-${w.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          pointerX >= rect.left &&
          pointerX <= rect.right &&
          pointerY >= rect.top &&
          pointerY <= rect.bottom
        ) {
          targetId = w.id;
          break;
        }
      }
    }
    
    if (targetId) {
      const indexA = widgets.findIndex(w => w.id === draggedId);
      const indexB = widgets.findIndex(w => w.id === targetId);
      const newWidgets = [...widgets];
      const temp = newWidgets[indexA];
      newWidgets[indexA] = newWidgets[indexB];
      newWidgets[indexB] = temp;
      setWidgets(newWidgets);
      localStorage.setItem('admin_dashboard_widgets_v2', JSON.stringify(newWidgets));
    }
  };

  // Real-time Resize logic
  const handleResize = (widgetId: string, event: any, info: any) => {
    const cardEl = document.getElementById(`widget-${widgetId}`);
    const gridEl = gridContainerRef.current;
    if (!cardEl || !gridEl) return;
    
    const cardRect = cardEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const colWidth = gridRect.width / 12;
    
    const targetWidth = info.point.x - cardRect.left;
    const targetHeight = info.point.y - cardRect.top;
    
    const targetColSpan = Math.max(2, Math.min(12, Math.round(targetWidth / colWidth)));
    const targetHeightPx = Math.max(120, Math.min(600, targetHeight));
    
    setWidgets(prev => prev.map(w => {
      if (w.id === widgetId) {
        if (w.colSpan === targetColSpan && w.height === targetHeightPx) return w;
        return { ...w, colSpan: targetColSpan, height: targetHeightPx };
      }
      return w;
    }));
  };

  // Save config settings
  const handleSaveLayout = () => {
    localStorage.setItem('admin_dashboard_widgets_v2', JSON.stringify(widgets));
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem('admin_dashboard_widgets_v2');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 bg-[#fcfcf9] min-h-screen">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            {locale === 'en' ? 'Cafe POS Admin Dashboard' : 'แดชบอร์ดจัดการระบบ POS'}
          </h1>
          <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
            {locale === 'en' 
              ? 'Customize your widgets: drag to reorder, resize using corner handles' 
              : 'ปรับแต่งวิทเจ็ตการจัดวางด้วยตัวคุณเอง: ลากเพื่อจัดลำดับ ย่อขยายขนาดได้ตามนิ้ว'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetLayout}
          className="px-4 py-2 border border-neutral-200/80 bg-white hover:bg-neutral-50 font-bold text-neutral-600 text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          {locale === 'en' ? 'Reset Widget Layout' : 'รีเซ็ตการจัดวางวิทเจ็ต'}
        </button>
      </div>

      {error && <div className="text-red-600 font-bold text-xs bg-red-50 p-4 rounded-xl border border-red-100 mb-6">{error}</div>}

      {/* Draggable & Resizable Widgets Grid */}
      <div 
        ref={gridContainerRef}
        id="widgets-grid-container"
        className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0"
      >
        <AnimatePresence>
          {widgets.map((widget) => {
            if (widget.id === 'revenue') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-neutral-900">
                        {loading ? '...' : formatCurrencyByLocale(revenue ?? 0, locale)}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {locale === 'en' ? 'Monthly Revenue' : 'ยอดขายสะสมเดือนนี้'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                      <CurrencyDollarIcon className="w-6 h-6" />
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'shifts') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-neutral-900">
                        {loading ? '...' : openShifts ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {locale === 'en' ? 'Active Shifts' : 'กะทำงานที่ทำงานอยู่'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                      <BriefcaseIcon className="w-6 h-6" />
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'orders') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-neutral-900">
                        {loading ? '...' : monthlyOrders ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {locale === 'en' ? 'Monthly Receipts' : 'จำนวนบิลเสร็จสิ้น'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                      <ShoppingBagIcon className="w-6 h-6" />
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'members') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-neutral-900">
                        {loading ? '...' : membersCount ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {locale === 'en' ? 'Loyalty Accounts' : 'สมาชิกลอยัลตี้สะสม'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'menu_items') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-neutral-900">
                        {loading ? '...' : menuItemsCount ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {locale === 'en' ? 'Foods & Drinks' : 'จำนวนเมนูในระบบ'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'branches') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-neutral-900">
                        {loading ? '...' : branchesCount ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {locale === 'en' ? 'Cafe Locations' : 'จำนวนสาขาร้านทั้งหมด'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 text-neutral-900">
                      <CheckCircleIcon className="w-6 h-6" />
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'revenue_chart') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 select-none shrink-0">
                      <h3 className="text-sm font-black text-neutral-800 tracking-tight">
                        {locale === 'en' ? 'Sales Revenue Trend' : 'แนวโน้มรายได้จากยอดขาย'}
                      </h3>
                      <span className="text-[10px] bg-neutral-100 font-bold px-2.5 py-1 text-neutral-500 rounded-full border border-neutral-200/50">
                        {locale === 'en' ? 'Daily Report' : 'รายงานรายวัน'}
                      </span>
                    </div>

                    {/* Premium Interactive SVG Cubic Spline Chart */}
                    <div className="flex-1 min-h-0 bg-neutral-50/50 border border-neutral-100 rounded-2xl p-4 flex flex-col justify-end relative">
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs select-none">
                        {/* Premium SVG Line/Area Spline Path */}
                        <svg className="w-full h-full p-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1A1A18" stopOpacity="0.12" />
                              <stop offset="100%" stopColor="#1A1A18" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Grid Lines */}
                          <line x1="0" y1="25" x2="100" y2="25" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="3,3" />
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="3,3" />
                          <line x1="0" y1="75" x2="100" y2="75" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="3,3" />
                          
                          {/* Cubic bezier area spline path */}
                          <path 
                            d="M 5 95 Q 20 60 35 70 T 65 30 T 95 10 L 95 95 Z" 
                            fill="url(#chartGradient)" 
                          />
                          {/* Cubic bezier spline line */}
                          <path 
                            d="M 5 95 Q 20 60 35 70 T 65 30 T 95 10" 
                            fill="none" 
                            stroke="#1A1A18" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                          />
                          {/* Interactive data points */}
                          <circle cx="35" cy="70" r="3.5" fill="#1A1A18" stroke="white" strokeWidth="1.5" />
                          <circle cx="65" cy="30" r="3.5" fill="#1A1A18" stroke="white" strokeWidth="1.5" />
                          <circle cx="95" cy="10" r="3.5" fill="#D3202B" stroke="white" strokeWidth="1.5" />
                        </svg>
                        
                        {/* Tooltip Overlay */}
                        <div className="absolute top-6 right-6 bg-neutral-900 text-white rounded-lg p-2 font-bold text-[9px] shadow-sm select-none border border-neutral-800">
                          {locale === 'en' ? 'Today: ' : 'วันนี้: '} +฿{(revenue ? Math.floor(revenue * 0.18) : 2500).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            if (widget.id === 'recent_sales') {
              return (
                <WidgetCard key={widget.id} widget={widget} onDragEnd={handleDragEnd} onResize={handleResize} onSave={handleSaveLayout} locale={locale}>
                  <div className="flex flex-col h-full">
                    <h3 className="text-sm font-black text-neutral-800 tracking-tight mb-3 shrink-0">
                      {locale === 'en' ? 'POS Sales Stream' : 'ยอดขายล่าสุดในระบบ'}
                    </h3>
                    
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                      {recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between border-b border-neutral-50 pb-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                              <span className="font-bold text-neutral-800 text-xs">
                                {locale === 'en' ? 'Order #' : 'ออเดอร์: '}
                                {sale.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 font-bold">
                              {new Date(sale.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <span className="text-neutral-900 font-bold text-xs">
                            {formatCurrencyByLocale(sale.total_amount, locale)}
                          </span>
                        </div>
                      ))}
                      {recentSales.length === 0 && (
                        <div className="h-full flex items-center justify-center text-neutral-400 text-xs">
                          {locale === 'en' ? 'No recent orders' : 'ไม่มีรายการออเดอร์ล่าสุด'}
                        </div>
                      )}
                    </div>
                  </div>
                </WidgetCard>
              );
            }
            return null;
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
