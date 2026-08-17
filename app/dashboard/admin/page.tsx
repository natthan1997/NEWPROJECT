'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '../../../components/StatCard';
import { UsersIcon, BriefcaseIcon, Cog6ToothIcon, CurrencyDollarIcon, CheckCircleIcon, CalendarIcon, BellIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';
import { useI18n } from '@/lib/I18nContext';
import { appCopy, pickLocalizedText } from '@/lib/appLocale';
import { formatCurrencyByLocale } from '@/lib/localeFormat';

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
            .limit(5)
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

  return (
    <div className="max-w-7xl mx-auto py-6 px-2 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {locale === 'en' ? 'Cafe POS Admin Dashboard' : locale === 'zh' ? '咖啡厅收银台管理仪表板' : 'แดชบอร์ดจัดการระบบ POS'}
        </h1>
        <p className="text-gray-500 text-lg">
          {locale === 'en' ? 'Manage your cafe revenue, loyalty members, branches, and shifts.' : locale === 'zh' ? '管理您的咖啡厅收入，会员，分店和班次。' : 'จัดการยอดขาย สมาชิก โปรโมชั่น และพนักงานในร้านคาเฟ่ของคุณ'}
        </p>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard icon={<CurrencyDollarIcon className="w-7 h-7" />} value={loading ? '...' : formatCurrencyByLocale(revenue ?? 0, locale)} label={locale === 'en' ? 'Sales Revenue' : 'ยอดขายเดือนนี้'} subtext="POS Revenue" loading={loading} />
        <StatCard icon={<BriefcaseIcon className="w-7 h-7" />} value={loading ? '...' : openShifts ?? 0} label={locale === 'en' ? 'Open Shifts' : 'กะที่เปิดอยู่'} subtext="Active Staff Shifts" loading={loading} />
        <StatCard icon={<ShoppingBagIcon className="w-7 h-7" />} value={loading ? '...' : monthlyOrders ?? 0} label={locale === 'en' ? 'Monthly Orders' : 'ออเดอร์เดือนนี้'} subtext="POS Completed Orders" loading={loading} />
        <StatCard icon={<UsersIcon className="w-7 h-7" />} value={loading ? '...' : membersCount ?? 0} label={locale === 'en' ? 'Loyalty Members' : 'สมาชิกในระบบ'} subtext="Cafe Club Members" loading={loading} />
        <StatCard icon={<Cog6ToothIcon className="w-7 h-7" />} value={loading ? '...' : menuItemsCount ?? 0} label={locale === 'en' ? 'Menu Items' : 'รายการอาหาร/เครื่องดื่ม'} subtext="Active Menu Items" loading={loading} />
        <StatCard icon={<CheckCircleIcon className="w-7 h-7" />} value={loading ? '...' : branchesCount ?? 0} label={locale === 'en' ? 'Active Branches' : 'สาขาทั้งหมด'} subtext="Active Cafe Outlets" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-xl p-6 min-h-[220px] flex flex-col border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{locale === 'en' ? 'Sales Revenue Chart' : 'กราฟยอดขายตามช่วงเวลา'}</h2>
          <div className="flex-1 flex items-center justify-center text-gray-400">
            {locale === 'en' ? 'Interactive charts are loaded in the sales report screen' : 'เปิดดูรายงานสรุปยอดขายแบบละเอียดในเมนูเครื่องรับเงิน'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 min-h-[220px] flex flex-col border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{locale === 'en' ? 'Recent Sales' : 'ยอดขายล่าสุด'}</h2>
          <ul className="flex-1 space-y-4">
            {recentSales.map((sale) => (
              <li key={sale.id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                <div>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 align-middle"></span>
                  <span className="font-medium text-gray-800 text-sm">{locale === 'en' ? 'Order #' : 'ออเดอร์: '}{sale.id.slice(0, 8)}</span>
                  <div className="text-[10px] text-gray-400">{new Date(sale.created_at).toLocaleString('th-TH')}</div>
                </div>
                <span className="text-gray-900 font-semibold text-sm">{formatCurrencyByLocale(sale.total_amount, locale)}</span>
              </li>
            ))}
            {recentSales.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">{locale === 'en' ? 'No recent orders' : 'ไม่มีรายการออเดอร์ล่าสุด'}</div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}