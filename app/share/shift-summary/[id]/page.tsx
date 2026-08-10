import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ShiftSummaryClient from './ShiftSummaryClient';

export const dynamic = 'force-dynamic';

export default async function ShiftSummaryPage({ params }: { params: { id: string } }) {
  // Use Service Role key to bypass RLS for shared view-only page
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const shiftId = params.id;

  // 1. Fetch Current Shift Data
  const { data: shift, error: shiftError } = await supabase
    .from('pos_shifts')
    .select('*, profiles(display_name)')
    .eq('id', shiftId)
    .single();

  if (shiftError || !shift) {
    return notFound();
  }

  const openedAt = new Date(shift.opened_at);
  const closedAt = shift.closed_at ? new Date(shift.closed_at) : new Date();

  // 2. Fetch All Shifts for this branch (for the selector)
  const { data: allShifts } = await supabase
    .from('pos_shifts')
    .select('id, opened_at, closed_at')
    .eq('branch_id', shift.branch_id)
    .order('opened_at', { ascending: false })
    .limit(30); // Show last 30 shifts

  const { data: orders } = await supabase
    .from('pos_orders')
    .select('*, pos_order_payments(*), profiles!pos_orders_staff_id_fkey(display_name)')
    .eq('branch_id', shift.branch_id)
    .gte('created_at', openedAt.toISOString())
    .lte('created_at', closedAt.toISOString())
    .order('created_at', { ascending: false });

  // 4. Fetch Order Items for Category Breakdown
  // Note: we fetch items directly matching the orders
  const orderIds = (orders || []).map(o => o.id);
  
  let orderItems: any[] = [];
  if (orderIds.length > 0) {
    // Supabase has a URL limit for filtering large arrays, chunking if necessary
    const { data: items } = await supabase
      .from('pos_order_items')
      .select('*, item:pos_menu_items!item_id(name, category_id)')
      .in('order_id', orderIds.slice(0, 500)); // Limit to avoid URL overflow for now
    
    orderItems = items || [];
  }

  // 5. Fetch Gamification Data (Points & Coupons)
  const { data: pointsHistory } = await supabase
    .from('pos_points_history')
    .select('*')
    .in('order_id', orderIds.slice(0, 500)); // Limit to avoid URL overflow

  let pointsEarned = 0;
  let pointsUsed = 0;
  
  (pointsHistory || []).forEach(h => {
    if (h.type === 'earn' || (h.points_change && h.points_change > 0)) {
      pointsEarned += Math.abs(Number(h.points_change || h.points || 0));
    } else if (h.type === 'redeem' || (h.points_change && h.points_change < 0)) {
      pointsUsed += Math.abs(Number(h.points_change || h.points || 0));
    }
  });

  // 6. Fetch Transactions (Pay-in/Pay-out)
  const { data: transactions } = await supabase
    .from('pos_shift_transactions')
    .select('*')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: true });

  const transactionData = transactions || [];
  const payIn = transactionData.filter((t: any) => t.type === 'pay_in').reduce((a, b) => a + Number(b.amount || 0), 0);
  const payOut = transactionData.filter((t: any) => t.type === 'pay_out').reduce((a, b) => a + Number(b.amount || 0), 0);

  // 6. Fetch Staff who clocked in today
  const startOfDay = new Date(openedAt);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(openedAt);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: attendanceData } = await supabase
    .from('attendance_logs')
    .select('profile_id, profiles(display_name)')
    .eq('type', 'check_in')
    .gte('timestamp', startOfDay.toISOString())
    .lte('timestamp', endOfDay.toISOString());

  const staffSet = new Map<string, string>();
  (attendanceData || []).forEach((log: any) => {
    if (log.profile_id && log.profiles?.display_name) {
      staffSet.set(log.profile_id, log.profiles.display_name);
    }
  });

  const staffData = Array.from(staffSet.entries()).map(([id, name]) => ({ id, name }));

  // 7. Fetch New Members from pos_members (not profiles)
  const { count: newMembersCount } = await supabase
    .from('pos_members')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', openedAt.toISOString())
    .lte('created_at', closedAt.toISOString());

  // 8. Fetch Used Coupons
  const { count: usedCouponsCount } = await supabase
    .from('pos_member_coupons')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'used')
    .gte('used_at', openedAt.toISOString())
    .lte('used_at', closedAt.toISOString());

  // 9. Process Sales Data
  let netTotal = 0;
  let totalDiscounts = 0;
  let cashSales = 0;
  let transferSales = 0;
  let cardSales = 0;
  let deliverySales = 0;
  let otherSales = 0;
  
  const typeMap = new Map<string, { total: number; count: number }>();
  
  const validOrders = (orders || []).filter((o: any) => {
    const status = String(o.status || '').toLowerCase();
    if (['cancelled', 'void', 'refunded'].includes(status)) return false;
    const hasPaymentRows = Array.isArray(o.pos_order_payments) && o.pos_order_payments.length > 0;
    return ['paid', 'completed', 'delivered'].includes(status) || Boolean(o.paid_at) || hasPaymentRows;
  });

  const voidOrders = (orders || []).filter((o: any) => {
    const status = String(o.status || '').toLowerCase();
    return ['cancelled', 'void'].includes(status);
  });

  validOrders.forEach((o: any) => {
    // Total Discounts
    totalDiscounts += Number(o.discount_amount || 0);

    let orderAmt = 0;
    const payments = o.pos_order_payments || [];
    if (payments.length > 0) {
      payments.forEach((p: any) => {
        const method = String(p.payment_method || '').toLowerCase();
        const amt = Number(p.amount || 0);
        orderAmt += amt;
        netTotal += amt;
        if (method.includes('cash')) cashSales += amt;
        else if (method.includes('transfer') || method.includes('qr') || method.includes('promptpay')) transferSales += amt;
        else if (method.includes('card') || method.includes('credit')) cardSales += amt;
        else if (method.includes('delivery') || method.includes('lineman') || method.includes('grab')) deliverySales += amt;
        else otherSales += amt;
      });
    } else {
      const method = String(o.payment_method || '').toLowerCase();
      const amt = Number(o.net_total ?? o.total_amount ?? 0);
      orderAmt += amt;
      netTotal += amt;
      if (method.includes('cash')) cashSales += amt;
      else if (method.includes('transfer') || method.includes('qr') || method.includes('promptpay')) transferSales += amt;
      else if (method.includes('card') || method.includes('credit')) cardSales += amt;
      else if (method.includes('delivery') || method.includes('lineman') || method.includes('grab')) deliverySales += amt;
      else otherSales += amt;
    }

    const orderType = String(o.order_type || 'unknown').toLowerCase();
    const current = typeMap.get(orderType) || { total: 0, count: 0 };
    typeMap.set(orderType, { 
      total: current.total + orderAmt, 
      count: current.count + 1 
    });
  });

  // Fetch categories mapping
  const { data: catData } = await supabase.from('pos_menu_categories').select('id, name');
  const catNames = new Map((catData || []).map(c => [c.id, c.name]));

  // Calculate Categories
  const categoryMap = new Map<string, number>();
  orderItems.forEach(item => {
    // Only count if order is valid
    if (validOrders.some(vo => vo.id === item.order_id)) {
       const catId = item.pos_menu_items?.category_id || 'unassigned';
       const subtotal = Number(item.subtotal || (item.unit_price * item.quantity));
       const current = categoryMap.get(catId) || 0;
       categoryMap.set(catId, current + subtotal);
    }
  });

  const categories = Array.from(categoryMap.entries()).map(([id, total]) => ({
    id,
    name: id === 'unassigned' ? 'อื่นๆ' : (catNames.get(id) || `หมวดหมู่ ${id.substring(0,6)}`),
    total
  }));

  const expectedCash = Number(shift.start_cash || 0) + cashSales + payIn - payOut;
  const actualCash = Number(shift.actual_cash || 0);
  const diff = actualCash - expectedCash;

  const orderTypes = Array.from(typeMap.entries()).map(([id, data]) => {
    const names: Record<string, string> = {
      dine_in: 'ทานที่ร้าน',
      takeaway: 'ซื้อกลับบ้าน',
      delivery: 'เดลิเวอรี'
    };
    return { id, name: names[id] || id, total: data.total, count: data.count };
  });

  const salesData = {
    netTotal,
    cashSales,
    transferSales,
    cardSales,
    deliverySales,
    otherSales,
    totalDiscounts,
    startCash: Number(shift.start_cash || 0),
    expectedCash,
    actualCash,
    diff,
    payIn,
    payOut,
    categories,
    orderTypes,
    validOrders,
    voidOrders
  };

  const memberData = {
    newMembers: newMembersCount || 0,
    pointsEarned,
    pointsUsed,
    usedCoupons: usedCouponsCount || 0
  };

  // 10. Fetch Check-out Photos (Attendance Logs)
  const { data: checkoutLogs } = await supabase
    .from('attendance_logs')
    .select('profile_id, profiles(display_name), checkout_photo_urls, checkout_zone_photos, timestamp')
    .eq('type', 'check_out')
    .gte('timestamp', openedAt.toISOString())
    .lte('timestamp', closedAt.toISOString());

  // 11. Fetch Inventory Audits
  const { data: audits } = await supabase
    .from('pos_inventory_audit_sessions')
    .select('*, pos_inventory_audit_details(*, inventory_items(min_stock_level, unit))')
    .gte('created_at', openedAt.toISOString())
    .lte('created_at', closedAt.toISOString());

  // Pass data to Client Component
  return (
    <ShiftSummaryClient 
      shift={shift} 
      allShifts={allShifts || []}
      salesData={salesData} 
      transactionData={transactionData}
      staffData={staffData}
      memberData={memberData}
      auditData={audits || []}
      photosData={checkoutLogs || []}
    />
  );
}
