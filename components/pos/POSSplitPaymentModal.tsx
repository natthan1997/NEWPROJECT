import React, { useState, useMemo } from 'react'
import { 
  X, Divide, CheckSquare, Square, Banknote, QrCode, CreditCard, 
  Sparkles, Plus, Minus, CheckCircle2, Receipt, RefreshCw, Check, 
  Layers, ArrowRight, Wallet, User, CheckSquare2
} from 'lucide-react'
import { useI18n } from "@/lib/I18nContext";

export default function POSSplitPaymentModal({
  onClose,
  cart = [],
  cartTotal = 0,
  remainingTotal = 0,
  isProcessing: parentIsProcessing = false,
  handleProcessPayment,
  onFinishOrder,
  activePrintData,
  shopSettings
}: any) {
  const { locale } = useI18n();

  // Mode Selection State ('equal' | 'item')
  const [splitMode, setSplitMode] = useState<'equal' | 'item'>('equal')
  const [splitCount, setSplitCount] = useState(2)

  // Track Real-time Completed Splits inside the modal session
  const [completedSplits, setCompletedSplits] = useState<Array<{
    id: string;
    method: string;
    amount: number;
    timestamp: string;
    unitKeys: string[];
    cashReceived?: number;
    change?: number;
  }>>([])

  const [selectedUnitKeys, setSelectedUnitKeys] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'promptpay' | 'credit_card' | null>(null)
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // 1. Calculate unit price for each item including selected modifiers/options and item-level discounts
  const getItemUnitPrice = (item: any) => {
    const base = Number(item.sale_price ?? item.price ?? item.unit_price ?? 0);
    const modSum = (item.selected_modifiers || []).reduce(
      (sum: number, m: any) => sum + ((Number(m.price_adjustment) || 0) * (Number(m.qty) || 1)),
      0
    );
    const itemDiscount = (Number(item.discount_amount) || 0) / Math.max(1, Number(item.quantity) || 1);
    return Math.max(0, base + modSum - itemDiscount);
  };

  // 2. Format custom options/modifiers text to display under each item name
  const getModifiersDisplay = (item: any) => {
    const parts: string[] = [];
    const mods = item.selected_modifiers || [];
    if (mods.length > 0) {
      mods.forEach((m: any) => {
        const adj = Number(m.price_adjustment) || 0;
        const adjStr = adj > 0 ? ` (+฿${adj})` : adj < 0 ? ` (-฿${Math.abs(adj)})` : '';
        const qtyStr = (m.qty && m.qty > 1) ? ` x${m.qty}` : '';
        parts.push(`${m.name || m.title}${qtyStr}${adjStr}`);
      });
    }
    if (item.note) {
      parts.push(`📝 ${item.note}`);
    }
    return parts.join(' | ');
  };

  // 3. Unroll cart items into individual unit items so items with qty > 1 can be split unit by unit
  const splitableUnits = useMemo(() => {
    const list: Array<{
      key: string;
      itemIndex: number;
      unitIndex: number;
      totalUnits: number;
      name: string;
      customer_name?: string;
      unitPrice: number;
      modifiersText: string;
      rawItem: any;
    }> = [];

    cart.forEach((item: any, idx: number) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = getItemUnitPrice(item);
      const modText = getModifiersDisplay(item);
      const itemName = item.name || item.title || 'รายการ';

      for (let u = 0; u < qty; u++) {
        list.push({
          key: `item_${idx}_unit_${u}`,
          itemIndex: idx,
          unitIndex: u + 1,
          totalUnits: qty,
          name: itemName,
          customer_name: item.customer_name,
          unitPrice,
          modifiersText: modText,
          rawItem: item
        });
      }
    });
    return list;
  }, [cart]);

  // Set of unit keys already paid in previous internal splits
  const paidUnitKeysSet = useMemo(() => {
    const keys = new Set<string>();
    completedSplits.forEach(s => (s.unitKeys || []).forEach(k => keys.add(k)));
    return keys;
  }, [completedSplits]);

  // Separate units into Paid vs Unpaid for crystal clear UI sections
  const paidUnitsList = useMemo(() => {
    return splitableUnits.filter(u => paidUnitKeysSet.has(u.key));
  }, [splitableUnits, paidUnitKeysSet]);

  const unpaidUnitsList = useMemo(() => {
    return splitableUnits.filter(u => !paidUnitKeysSet.has(u.key));
  }, [splitableUnits, paidUnitKeysSet]);

  // Amount already paid prior to opening modal session
  const previouslyPaidAmount = Math.max(0, cartTotal - remainingTotal);

  // Live Calculations for Real-time Progress
  const totalPaidInCurrentSession = useMemo(() => {
    return completedSplits.reduce((sum, s) => sum + s.amount, 0);
  }, [completedSplits]);

  const totalOverallPaid = previouslyPaidAmount + totalPaidInCurrentSession;
  const liveRemainingTotal = Math.max(0, cartTotal - totalOverallPaid);

  // Equal Split Amount for current turn
  const equalSplitAmount = splitCount > 0 ? liveRemainingTotal / Math.max(1, splitCount) : 0;

  // Exact Sum of Selected Items in By-Item Mode (NO DIVISION RATIO! EXACT ITEM PRICE!)
  const selectedUnitsExactPrice = useMemo(() => {
    return splitableUnits
      .filter(unit => selectedUnitKeys.includes(unit.key) && !paidUnitKeysSet.has(unit.key))
      .reduce((sum, unit) => sum + unit.unitPrice, 0);
  }, [splitableUnits, selectedUnitKeys, paidUnitKeysSet]);

  // Target Payment Amount for this payment turn
  const targetPartialAmount = useMemo(() => {
    if (liveRemainingTotal <= 0) return 0;
    if (splitMode === 'equal') return Math.min(liveRemainingTotal, equalSplitAmount);
    // BY ITEM MODE: USE EXACT ITEM PRICE SUM!
    return Math.min(liveRemainingTotal, selectedUnitsExactPrice);
  }, [splitMode, equalSplitAmount, selectedUnitsExactPrice, liveRemainingTotal]);

  // Cash Change Calculation
  const numCashReceived = Number(cashReceivedInput) || 0;
  const cashChange = Math.max(0, numCashReceived - targetPartialAmount);
  const isCashValid = paymentMethod === 'cash' ? numCashReceived >= (targetPartialAmount - 0.01) : true;

  // Is Fully Completed Check
  const isFullyCompleted = liveRemainingTotal <= 0.01 || (splitMode === 'item' && unpaidUnitsList.length === 0 && (completedSplits.length > 0 || previouslyPaidAmount > 0));

  // Toggle Item Unit Selection
  const toggleUnitKey = (key: string) => {
    if (paidUnitKeysSet.has(key)) return;
    if (selectedUnitKeys.includes(key)) {
      setSelectedUnitKeys(prev => prev.filter(k => k !== key));
    } else {
      setSelectedUnitKeys(prev => [...prev, key]);
    }
  };

  const toggleSelectAllUnpaidUnits = () => {
    const selectable = unpaidUnitsList.map(u => u.key);
    if (selectedUnitKeys.length === selectable.length) {
      setSelectedUnitKeys([]);
    } else {
      setSelectedUnitKeys(selectable);
    }
  };

  // Process Continuous Partial Payment Right Inside Modal
  const handleConfirmCurrentSplit = async () => {
    if (targetPartialAmount <= 0 || !paymentMethod || isSubmitting || !isCashValid) return;

    setIsSubmitting(true);
    try {
      // Call parent handleProcessPayment
      await handleProcessPayment(paymentMethod, targetPartialAmount);

      // Record completed split internally
      const newSplitRecord = {
        id: `split_${Date.now()}`,
        method: paymentMethod,
        amount: targetPartialAmount,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        unitKeys: [...selectedUnitKeys],
        cashReceived: paymentMethod === 'cash' ? numCashReceived : undefined,
        change: paymentMethod === 'cash' ? cashChange : undefined
      };

      setCompletedSplits(prev => [...prev, newSplitRecord]);
      
      // Reset current payment controls for next split turn
      setSelectedUnitKeys([]);
      setPaymentMethod(null);
      setCashReceivedInput('');
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการชำระเงิน: ' + (e?.message || e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Dark Blur Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Premium Glass Modal Box */}
      <div className="relative flex w-full max-w-3xl flex-col bg-[#FAFAFC] font-sans shadow-2xl h-[92vh] rounded-[2.5rem] overflow-hidden border border-slate-200/60">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                ระบบแยกชำระบิล (SPLIT PAYMENT)
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                คำนวณราคาจริงตามรายการที่เลือก ไม่มีการหารเฉลี่ย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400">บิลรวม:</span>
              <span className="text-white font-black">฿{cartTotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-950/80 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <span>จ่ายแล้ว:</span>
              <span className="font-black">฿{totalOverallPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold bg-amber-950/80 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-700/50">
              <span>คงเหลือ:</span>
              <span className="font-black">฿{liveRemainingTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* FULLY COMPLETED VIEW */}
        {isFullyCompleted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in-95 duration-300 bg-white">
            <div className="h-24 w-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-100 animate-bounce">
              <CheckCircle2 size={56} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                🎉 ชำระเงินครบถ้วนเรียบร้อยแล้ว!
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
                ยอดบิลรวม ฿{cartTotal.toLocaleString()} ได้รับการชำระครบเต็มจำนวนเรียบร้อยแล้ว
              </p>
            </div>

            {/* Split Breakdown Summary Table */}
            <div className="w-full max-w-lg bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-left">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>สรุปประวัติการชำระบิลนี้:</span>
                <span className="text-slate-900 font-bold">รวม ฿{totalOverallPaid.toLocaleString()}</span>
              </div>

              {previouslyPaidAmount > 0 && (
                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-bold shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-black shrink-0">
                      0
                    </span>
                    <span className="uppercase font-black text-slate-800">
                      ชำระก่อนหน้านี้
                    </span>
                  </div>
                  <span className="font-black text-slate-800 text-base">
                    ฿{previouslyPaidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {completedSplits.map((split, idx) => (
                <div key={split.id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-bold shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="uppercase font-black text-slate-900">
                      {split.method === 'cash' ? '💵 เงินสด' : split.method === 'promptpay' ? '📲 สแกน QR' : '💳 บัตรเครดิต'}
                    </span>
                    <span className="text-slate-400 font-medium">({split.timestamp})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-base">
                      ฿{split.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    {split.change && split.change > 0 ? (
                      <span className="block text-[10px] text-slate-400 font-medium">
                        (รับ ฿{split.cashReceived} ทอน ฿{split.change})
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Final CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 w-full max-w-md">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="flex-1 h-14 rounded-2xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Receipt size={18} />
                พิมพ์ใบเสร็จ
              </button>

              <button
                onClick={onFinishOrder}
                className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <Check size={18} />
                เสร็จสิ้นเปิดบิลใหม่
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE CONTINUOUS SPLIT WORKFLOW */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* SEGMENTED TAB SWITCHER */}
            <div className="px-6 pt-5 pb-3 bg-white border-b border-slate-200/80 shrink-0">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl font-bold gap-1">
                <button
                  onClick={() => {
                    setSplitMode('equal');
                    setSelectedUnitKeys([]);
                    setPaymentMethod(null);
                  }}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                    splitMode === 'equal' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Divide size={16} />
                  {locale === 'en' ? 'Equal Split' : '👥 หารเท่ากัน (Equal Split)'}
                </button>

                <button
                  onClick={() => {
                    setSplitMode('item');
                    setSelectedUnitKeys([]);
                    setPaymentMethod(null);
                  }}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                    splitMode === 'item' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <CheckSquare size={16} />
                  {locale === 'en' ? 'By Item & Options' : '🛍️ เลือกตามรายการสินค้า (ราคาจริง)'}
                </button>
              </div>
            </div>

            {/* SCROLLABLE MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar bg-[#FAFAFC]">

              {/* EQUAL SPLIT MODE */}
              {splitMode === 'equal' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                      จำนวนคนหารจ่ายสำหรับยอดคงเหลือ
                    </span>

                    <div className="flex items-center gap-8 my-2">
                      <button
                        onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                        className="h-14 w-14 rounded-2xl border-2 border-slate-900 flex items-center justify-center text-2xl font-black text-slate-900 hover:bg-slate-900 hover:text-white active:scale-95 transition-all shadow-sm"
                      >
                        <Minus size={20} />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-5xl sm:text-6xl font-black text-slate-900 leading-none">
                          {splitCount}
                        </span>
                        <span className="text-xs font-bold text-slate-400 mt-1">คน</span>
                      </div>

                      <button
                        onClick={() => setSplitCount(splitCount + 1)}
                        className="h-14 w-14 rounded-2xl border-2 border-slate-900 flex items-center justify-center text-2xl font-black text-slate-900 hover:bg-slate-900 hover:text-white active:scale-95 transition-all shadow-sm"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100 w-full flex items-center justify-around text-center">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400">ยอดคงเหลือบิล</div>
                        <div className="text-base font-black text-slate-800">
                          ฿{liveRemainingTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="w-[1px] h-8 bg-slate-200"></div>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600">เฉลี่ยต่องวดนี้</div>
                        <div className="text-lg font-black text-emerald-600">
                          ฿{equalSplitAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BY ITEM SPLIT MODE */}
              {splitMode === 'item' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* SECTION 1: UNPAID ITEMS (รายการที่ต้องเลือกชำระ) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        📋 รายการที่ยังไม่ได้ชำระ ({unpaidUnitsList.length} ชิ้น)
                      </span>

                      <button
                        onClick={toggleSelectAllUnpaidUnits}
                        className="text-xs font-bold text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 px-3 py-1 rounded-full transition-all"
                      >
                        {selectedUnitKeys.length === unpaidUnitsList.length && unpaidUnitsList.length > 0 ? 'ล้างการเลือก' : 'เลือกทั้งหมดที่เหลือ'}
                      </button>
                    </div>

                    {unpaidUnitsList.length === 0 ? (
                      <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800 font-bold text-xs">
                        ✓ รายการสินค้าทั้งหมดถูกชำระเงินเรียบร้อยแล้ว
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unpaidUnitsList.map((unit) => {
                          const isSelected = selectedUnitKeys.includes(unit.key);

                          return (
                            <div
                              key={unit.key}
                              onClick={() => toggleUnitKey(unit.key)}
                              className={`w-full flex items-start justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                                isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-md scale-[1.01]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900 shadow-sm'
                              }`}
                            >
                              <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-4">
                                <div className="mt-0.5 shrink-0">
                                  {isSelected ? (
                                    <CheckSquare size={22} className="text-amber-400" />
                                  ) : (
                                    <Square size={22} className="text-slate-300" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-black break-words leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                      {unit.name}
                                    </span>

                                    {unit.totalUnits > 1 && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                        isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        ชิ้นที่ {unit.unitIndex}/{unit.totalUnits}
                                      </span>
                                    )}
                                  </div>

                                  {/* Custom Options / Modifiers Display */}
                                  {unit.modifiersText ? (
                                    <p className={`text-xs font-medium px-2.5 py-1 rounded-lg mt-1.5 inline-block break-words border ${
                                      isSelected 
                                        ? 'bg-slate-800/90 text-amber-300 border-slate-700' 
                                        : 'bg-amber-50 text-amber-900 border-amber-200/60'
                                    }`}>
                                      ✨ {unit.modifiersText}
                                    </p>
                                  ) : null}

                                  {unit.customer_name && (
                                    <div className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                      👤 {unit.customer_name}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-base font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  ฿{unit.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: ALREADY PAID ITEMS (รายการที่ชำระเงินแล้ว) */}
                  {paidUnitsList.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 px-1">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        รายการที่ชำระเงินเรียบร้อยแล้ว ({paidUnitsList.length} ชิ้น):
                      </span>

                      <div className="space-y-2 opacity-85">
                        {paidUnitsList.map((unit) => (
                          <div
                            key={unit.key}
                            className="w-full flex items-start justify-between p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 text-left"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black break-words leading-tight text-emerald-950">
                                    {unit.name}
                                  </span>
                                  {unit.totalUnits > 1 && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                                      ชิ้นที่ {unit.unitIndex}/{unit.totalUnits}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                                    ✓ ชำระแล้ว
                                  </span>
                                </div>
                                {unit.modifiersText ? (
                                  <p className="text-[11px] font-medium text-emerald-800 mt-1">
                                    ✨ {unit.modifiersText}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-emerald-900">
                                ฿{unit.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* COMPLETED SPLITS HISTORY SUMMARY */}
              {completedSplits.length > 0 && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 text-xs font-bold space-y-2 border border-slate-800">
                  <div className="font-black uppercase text-[11px] tracking-wider flex items-center justify-between text-amber-400">
                    <span>ประวัติชำระในรอบนี้ ({completedSplits.length} งวด):</span>
                    <span>รวม ฿{totalPaidInCurrentSession.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  {completedSplits.map((split, i) => (
                    <div key={split.id} className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-slate-200">
                      <span>งวดที่ {i + 1}: {split.method === 'cash' ? '💵 เงินสด' : split.method === 'promptpay' ? '📲 สแกน QR' : '💳 บัตรเครดิต'} ({split.timestamp})</span>
                      <span className="font-black text-emerald-400">฿{split.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INLINE PAYMENT PANEL FOOTER */}
            <footer className="border-t border-slate-200 bg-white p-5 space-y-4 shrink-0 shadow-lg">
              
              {/* Payment Summary Display */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    ยอดชำระงวดนี้ (ราคาจริงตามรายการ)
                  </span>
                  <span className="text-xs font-bold text-slate-600 mt-0.5 block">
                    {splitMode === 'item' ? `เลือกแล้ว ${selectedUnitKeys.length} ชิ้น (ราคารวมตรงตามชิ้น)` : `แบ่งชำระ 1 ใน ${splitCount} ส่วน`}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    ฿{targetPartialAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  disabled={targetPartialAmount <= 0}
                  onClick={() => setPaymentMethod('cash')}
                  className={`h-14 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-40`}
                >
                  <Banknote size={18} className="mb-0.5" />
                  <span className="text-[10px] font-black tracking-wider">เงินสด (CASH)</span>
                </button>

                <button
                  disabled={targetPartialAmount <= 0}
                  onClick={() => setPaymentMethod('promptpay')}
                  className={`h-14 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    paymentMethod === 'promptpay'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-40`}
                >
                  <QrCode size={18} className="mb-0.5" />
                  <span className="text-[10px] font-black tracking-wider">สแกน QR</span>
                </button>

                <button
                  disabled={targetPartialAmount <= 0}
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`h-14 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-40`}
                >
                  <CreditCard size={18} className="mb-0.5" />
                  <span className="text-[10px] font-black tracking-wider">บัตรเครดิต</span>
                </button>
              </div>

              {/* INLINE CASH CALCULATOR (WHEN CASH METHOD IS SELECTED) */}
              {paymentMethod === 'cash' && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">ระบุจำนวนเงินที่รับมา (Received Cash):</span>
                    {numCashReceived > 0 && (
                      <span className={`text-xs font-black ${cashChange >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {cashChange >= 0 ? `เงินทอน: ฿${cashChange.toLocaleString()}` : `ยังขาด: ฿${Math.abs(cashChange).toLocaleString()}`}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      placeholder={`฿ ${Math.ceil(targetPartialAmount)}`}
                      className="flex-1 h-12 bg-white border border-amber-300 rounded-xl px-4 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    {/* Quick Banknote Buttons */}
                    <button
                      onClick={() => setCashReceivedInput(String(Math.ceil(targetPartialAmount)))}
                      className="px-3 h-12 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all"
                    >
                      พอดี
                    </button>
                    <button
                      onClick={() => setCashReceivedInput(String((Number(cashReceivedInput) || 0) + 100))}
                      className="px-3 h-12 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => setCashReceivedInput(String((Number(cashReceivedInput) || 0) + 500))}
                      className="px-3 h-12 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all"
                    >
                      +500
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION CONFIRM BUTTON */}
              {paymentMethod && (
                <button
                  disabled={targetPartialAmount <= 0 || isSubmitting || !isCashValid}
                  onClick={handleConfirmCurrentSplit}
                  className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      กำลังบันทึกชำระเงิน...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      ยืนยันชำระงวดนี้ (฿{targetPartialAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                    </>
                  )}
                </button>
              )}

            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
