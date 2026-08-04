"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function ShiftSummaryClient({ 
  shift, 
  allShifts, 
  salesData, 
  staffData, 
  transactionData, 
  memberData,
  auditData,
  photosData
}: any) {
  const router = useRouter();
  
  const staffName = shift.profiles?.display_name || 'Staff';
  const openedAt = new Date(shift.opened_at);
  const closedAt = shift.closed_at ? new Date(shift.closed_at) : new Date();

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId && newId !== shift.id) {
      router.push(`/share/shift-summary/${newId}`);
    }
  };

  const Divider = () => (
    <div className="w-full border-b-[1.5px] border-dashed border-neutral-400 my-4" />
  );

  return (
    <div className="min-h-screen bg-[#E5E7EB] pt-24 pb-10 font-mono flex flex-col items-center relative">
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="fixed top-8 left-4 p-2 bg-white rounded-full shadow-md text-neutral-600 hover:text-neutral-900 transition-colors z-[100] flex items-center justify-center font-sans"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Selector outside the receipt */}
      <div className="w-full max-w-md px-4 mb-4">
        <select 
          className="w-full bg-white border border-neutral-300 rounded p-2 text-sm text-neutral-700 shadow-sm outline-none font-sans"
          value={shift.id}
          onChange={handleShiftChange}
        >
          {allShifts.map((s: any) => (
            <option key={s.id} value={s.id}>
              กะวันที่ {new Date(s.opened_at).toLocaleDateString('th-TH')} 
              ({new Date(s.opened_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : 'ยังไม่ปิด'})
            </option>
          ))}
        </select>
      </div>

      {/* The Receipt Container */}
      <div className="bg-white w-full max-w-md mx-auto shadow-xl text-neutral-900 pb-16 relative">
        
        {/* Zigzag Top */}
        <div className="absolute top-0 left-0 w-full h-2" style={{
          background: 'linear-gradient(45deg, transparent 33.333%, #E5E7EB 33.333%, #E5E7EB 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #E5E7EB 33.333%, #E5E7EB 66.667%, transparent 66.667%)',
          backgroundSize: '12px 24px',
          backgroundPosition: '0 -12px'
        }}></div>

        <div className="p-8 pt-10">
          {/* HEADER */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-widest mb-1">Z-REPORT</h1>
            <p className="text-xs uppercase tracking-widest text-neutral-600">รายงานสรุปยอดปิดกะ</p>
            <p className="text-xs mt-1 text-neutral-600">
              {new Date(shift.opened_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="text-xs space-y-1 mb-4 text-neutral-700">
            <div className="flex justify-between">
              <span>พนักงาน (CASHIER):</span>
              <span className="font-bold">{staffName}</span>
            </div>
            <div className="flex justify-between">
              <span>เปิดกะ (OPEN):</span>
              <span>{openedAt.toLocaleTimeString('th-TH')}</span>
            </div>
            <div className="flex justify-between">
              <span>ปิดกะ (CLOSE):</span>
              <span>{shift.closed_at ? closedAt.toLocaleTimeString('th-TH') : 'ยังไม่ปิดกะ'}</span>
            </div>
          </div>

          <Divider />

          {/* FINANCIALS */}
          <div className="text-center my-6">
            <p className="text-sm font-bold tracking-widest">ยอดขายสุทธิ (NET SALES)</p>
            <p className="text-4xl font-bold mt-2">{(salesData.netTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>

          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>เงินสด (CASH)</span>
              <span>{(salesData.cashSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span>โอนเงิน (TRANSFER)</span>
              <span>{(salesData.transferSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span>บัตรเครดิต (CREDIT CARD)</span>
              <span>{(salesData.cardSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span>เดลิเวอรี (DELIVERY)</span>
              <span>{(salesData.deliverySales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            {(salesData.otherSales > 0) && (
              <div className="flex justify-between text-neutral-500">
                <span>อื่นๆ (OTHER)</span>
                <span>{(salesData.otherSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
          </div>

          <Divider />

          {/* DRAWER & PAY IN/OUT */}
          <div className="text-sm space-y-2 font-bold mb-4">
            <div className="flex justify-between">
              <span>เงินทอนเริ่มต้น (STARTING CASH)</span>
              <span>{(salesData.startCash || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>นำเงินเข้า (PAY IN)</span>
              <span>+{(salesData.payIn || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>นำเงินออก (PAY OUT)</span>
              <span>-{(salesData.payOut || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-neutral-600 mt-2 border-t border-neutral-200 pt-2">
              <span>ควรมีเงินในลิ้นชัก (EXPECTED IN DRAWER)</span>
              <span>{(salesData.expectedCash || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div className="bg-neutral-100 p-3 flex justify-between items-center text-sm font-bold border border-neutral-300">
            <span>นับจริง (ACTUAL CASH)</span>
            <span>{(salesData.actualCash || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          
          <div className="flex justify-between mt-2 text-xs font-bold px-1">
            <span>ส่วนต่าง (DIFFERENCE)</span>
            <span>
              {salesData.diff === 0 
                ? '0.00' 
                : salesData.diff > 0 
                  ? `+${salesData.diff.toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                  : salesData.diff.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>

          <Divider />

          {/* ORDER TYPES */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">ประเภทการขาย (SALES BY TYPE)</p>
            <div className="text-xs space-y-2">
              {salesData.orderTypes && salesData.orderTypes.length > 0 ? (
                salesData.orderTypes.map((cat: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{cat.name || 'ไม่ระบุ'} <span className="text-neutral-500 text-[10px]">({cat.count} บิล)</span></span>
                    <span>{(cat.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-neutral-500">ไม่มีข้อมูล (NO DATA)</p>
              )}
            </div>
          </div>

          <Divider />

          {/* CATEGORIES */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">ยอดขายตามหมวดหมู่ (SALES BY CATEGORY)</p>
            <div className="text-xs space-y-2">
              {salesData.categories && salesData.categories.length > 0 ? (
                salesData.categories.map((cat: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate pr-4">{cat.name || 'ไม่ระบุ'}</span>
                    <span>{(cat.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-neutral-500">ไม่มีข้อมูล (NO DATA)</p>
              )}
            </div>
          </div>

          <Divider />

          {/* MEMBERSHIP & GAMIFICATION */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">ระบบสมาชิก (GAMIFICATION)</p>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span>สมาชิกใหม่ (NEW MEMBERS)</span>
                <span>{memberData?.newMembers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>แจกพอยต์ (POINTS ISSUED)</span>
                <span>{memberData?.pointsEarned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ใช้คูปอง (COUPONS REDEEMED)</span>
                <span>{memberData?.usedCoupons || 0}</span>
              </div>
            </div>
          </div>

          <Divider />

          {/* VOIDS */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">ข้อยกเว้น (EXCEPTIONS)</p>
            <div className="text-xs space-y-2">
              <div className="flex justify-between text-neutral-600">
                <span>ส่วนลด (DISCOUNTS)</span>
                <span>-{(salesData.totalDiscounts || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>บิลที่ถูกยกเลิก (VOIDED BILLS) ({salesData.voidOrders?.length || 0})</span>
                <span>
                  {salesData.voidOrders?.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
              
              {salesData.voidOrders && salesData.voidOrders.length > 0 && (
                <div className="mt-2 pl-2 border-l-2 border-neutral-300 space-y-1">
                  {salesData.voidOrders.map((o: any, i: number) => (
                    <div key={i} className="flex justify-between text-[10px] text-neutral-500">
                      <span>{o.order_number} ({o.void_reason || 'ไม่ได้ระบุเหตุผล'})</span>
                      <span>{(o.total_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Divider />

          {/* STAFF LIST */}
          <div className="mb-8">
            <p className="text-xs font-bold text-center tracking-widest mb-3">พนักงานในกะ (STAFF ON SHIFT)</p>
            {staffData && staffData.length > 0 ? (
              <div className="flex flex-col items-center gap-1">
                {staffData.map((staff: any, idx: number) => (
                  <span key={idx} className="text-xs font-bold">
                    {staff.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-center text-neutral-400">ไม่มีข้อมูลพนักงาน (NO STAFF CHECKED IN)</p>
            )}
          </div>

          <Divider />

          {/* LOW STOCK ITEMS */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">ต้องสั่งเพิ่ม (LOW STOCK)</p>
            <div className="text-xs space-y-2">
              {(() => {
                const lowStockItems: any[] = [];
                if (auditData) {
                  auditData.forEach((session: any) => {
                    session.pos_inventory_audit_details?.forEach((detail: any) => {
                      const minStock = detail.inventory_items?.min_stock_level || 0;
                      if (detail.counted_quantity <= minStock) {
                        lowStockItems.push(detail);
                      }
                    });
                  });
                }
                
                if (lowStockItems.length > 0) {
                  return lowStockItems.map((detail: any, i: number) => (
                    <div key={i} className="flex justify-between text-[10px] text-neutral-900 font-bold">
                      <span className="truncate pr-2">{detail.item_name || 'สินค้า'}</span>
                      <span>เหลือ {detail.counted_quantity} {detail.inventory_items?.unit || ''}</span>
                    </div>
                  ));
                } else {
                  return <p className="text-center text-[10px] text-neutral-500">ไม่มีสินค้าใกล้หมด (NO LOW STOCK)</p>;
                }
              })()}
            </div>
          </div>

          <Divider />

          {/* INVENTORY AUDITS (ALL) */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">สต็อคที่นับทั้งหมด (ALL AUDITS)</p>
            <div className="text-[10px] space-y-2">
              {auditData && auditData.length > 0 ? (
                auditData.map((session: any, i: number) => {
                  const staff = (staffData || []).find((s: any) => s.profile_id === session.staff_id);
                  const staffName = staff?.profiles?.display_name || 'พนักงาน';
                  
                  return (
                    <div key={i} className="mb-2">
                      <p className="font-bold text-neutral-700 mb-1">{staffName} (นับไป {session.total_items_counted} รายการ)</p>
                      <div className="space-y-1 pl-2 border-l-2 border-neutral-300">
                      {session.pos_inventory_audit_details?.map((detail: any, j: number) => (
                        <div key={j} className="flex justify-between text-[10px] text-neutral-600">
                          <span className="truncate pr-2">{detail.item_name || 'สินค้า'}</span>
                          <span className={detail.discrepancy !== 0 ? 'text-neutral-900 font-bold' : ''}>
                            {detail.counted_quantity} 
                            {detail.discrepancy !== 0 && ` (${detail.discrepancy > 0 ? '+' : ''}${detail.discrepancy})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })
              ) : (
                <p className="text-center text-neutral-500">ไม่มีข้อมูลการนับสต็อค (NO AUDITS)</p>
              )}
            </div>
          </div>

          <Divider />

          {/* CHECKOUT PHOTOS */}
          <div className="mb-4">
            <p className="text-xs font-bold text-center tracking-widest mb-3">รูปถ่ายตอนปิดกะ (CLOSING PHOTOS)</p>
            <div className="text-xs space-y-4">
              {(() => {
                const logsWithPhotos = (photosData || []).filter(
                  (log: any) => (log.checkout_photo_urls?.length > 0 || log.checkout_zone_photos?.length > 0)
                );

                if (logsWithPhotos.length > 0) {
                  return logsWithPhotos.map((log: any, i: number) => (
                    <div key={i} className="flex flex-col items-center">
                      <p className="text-[10px] text-neutral-600 mb-2">ถ่ายโดย: {log.profiles?.display_name || 'พนักงาน'} ({new Date(log.timestamp).toLocaleTimeString('th-TH')})</p>
                      
                      {/* General Checkout Photos */}
                      {log.checkout_photo_urls && log.checkout_photo_urls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2 w-full">
                          {log.checkout_photo_urls.map((url: string, j: number) => (
                            <div key={j} className="aspect-square bg-neutral-200 border border-neutral-300 relative overflow-hidden rounded-sm">
                              <img src={url} alt={`Checkout ${j}`} className="object-cover w-full h-full" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Zone Photos */}
                      {log.checkout_zone_photos && log.checkout_zone_photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 w-full">
                          {log.checkout_zone_photos.map((zonePhoto: any, j: number) => (
                            <div key={j} className="flex flex-col items-center">
                              <div className="aspect-square bg-neutral-200 border border-neutral-300 relative overflow-hidden w-full rounded-sm">
                                <img src={zonePhoto.url} alt={`Zone ${j}`} className="object-cover w-full h-full" />
                              </div>
                              <span className="text-[8px] text-neutral-500 mt-1 truncate w-full text-center">โซน {zonePhoto.zone_id.substring(0,6)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                } else {
                  return <p className="text-center text-[10px] text-neutral-500">ไม่มีรูปถ่ายปิดกะ (NO PHOTOS)</p>;
                }
              })()}
            </div>
          </div>

          {/* FOOTER */}
          <div className="text-center mt-10">
             <p className="text-xs font-bold tracking-widest">*** END OF REPORT ***</p>
             <p className="text-[10px] text-neutral-400 mt-2">พิมพ์เมื่อ (Printed): {new Date().toLocaleTimeString('th-TH')}</p>
          </div>
        </div>

        {/* Zigzag Bottom */}
        <div className="absolute bottom-0 left-0 w-full h-2" style={{
          background: 'linear-gradient(45deg, transparent 33.333%, #E5E7EB 33.333%, #E5E7EB 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #E5E7EB 33.333%, #E5E7EB 66.667%, transparent 66.667%)',
          backgroundSize: '12px 24px',
          backgroundPosition: '0 0'
        }}></div>

      </div>
    </div>
  );
}

