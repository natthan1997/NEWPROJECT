import React, { useState, useMemo } from 'react'
import { 
  X, Check, Minus, Plus, Banknote, QrCode, CreditCard
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
  shopSettings,
  fixedMode
}: any) {
  const { locale } = useI18n();

  const [splitMode, setSplitMode] = useState<'equal' | 'item'>(fixedMode || 'equal')
  const [splitCount, setSplitCount] = useState(2)

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

  const getItemUnitPrice = (item: any) => {
    const base = Number(item.sale_price ?? item.price ?? item.unit_price ?? 0);
    const modSum = (item.selected_modifiers || []).reduce(
      (sum: number, m: any) => sum + ((Number(m.price_adjustment) || 0) * (Number(m.qty) || 1)),
      0
    );
    const itemDiscount = (Number(item.discount_amount) || 0) / Math.max(1, Number(item.quantity) || 1);
    return Math.max(0, base + modSum - itemDiscount);
  };

  const getModifiersDisplay = (item: any) => {
    const parts: string[] = [];
    const mods = item.selected_modifiers || [];
    if (mods.length > 0) {
      mods.forEach((m: any) => {
        parts.push(m.name || m.title);
      });
    }
    if (item.note) parts.push(item.note);
    return parts.join(', ');
  };

  const splitableUnits = useMemo(() => {
    const list: any[] = [];
    cart.forEach((item: any, idx: number) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = getItemUnitPrice(item);
      const modText = getModifiersDisplay(item);
      const itemName = item.name || item.title || 'Item';

      for (let u = 0; u < qty; u++) {
        list.push({
          key: `item_${idx}_unit_${u}`,
          itemIndex: idx,
          unitIndex: u + 1,
          name: itemName,
          customer_name: item.customer_name,
          unitPrice,
          modifiersText: modText,
          image_url: item.image_url,
        });
      }
    });
    return list;
  }, [cart]);

  const paidUnitKeysSet = useMemo(() => {
    const keys = new Set<string>();
    completedSplits.forEach(s => (s.unitKeys || []).forEach(k => keys.add(k)));
    return keys;
  }, [completedSplits]);

  const paidUnitsList = useMemo(() => {
    return splitableUnits.filter(u => paidUnitKeysSet.has(u.key));
  }, [splitableUnits, paidUnitKeysSet]);

  const unpaidUnitsList = useMemo(() => {
    return splitableUnits.filter(u => !paidUnitKeysSet.has(u.key));
  }, [splitableUnits, paidUnitKeysSet]);

  const totalOverallPaid = Math.max(0, cartTotal - remainingTotal);
  const liveRemainingTotal = Math.max(0, remainingTotal);

  const equalSplitAmount = splitCount > 0 ? liveRemainingTotal / Math.max(1, splitCount) : 0;

  const selectedUnitsExactPrice = useMemo(() => {
    return splitableUnits
      .filter(unit => selectedUnitKeys.includes(unit.key) && !paidUnitKeysSet.has(unit.key))
      .reduce((sum, unit) => sum + unit.unitPrice, 0);
  }, [splitableUnits, selectedUnitKeys, paidUnitKeysSet]);

  const targetPartialAmount = useMemo(() => {
    if (liveRemainingTotal <= 0) return 0;
    if (splitMode === 'equal') return Math.min(liveRemainingTotal, equalSplitAmount);
    return Math.min(liveRemainingTotal, selectedUnitsExactPrice);
  }, [splitMode, equalSplitAmount, selectedUnitsExactPrice, liveRemainingTotal]);

  const numCashReceived = Number(cashReceivedInput) || 0;
  const cashChange = Math.max(0, numCashReceived - targetPartialAmount);
  const isCashValid = paymentMethod === 'cash' ? numCashReceived >= (targetPartialAmount - 0.01) : true;

  const isFullyCompleted = liveRemainingTotal <= 0.01 || (splitMode === 'item' && unpaidUnitsList.length === 0 && (completedSplits.length > 0 || totalOverallPaid > 0));

  const toggleUnitKey = (key: string) => {
    if (paidUnitKeysSet.has(key)) return;
    if (selectedUnitKeys.includes(key)) {
      setSelectedUnitKeys(prev => prev.filter(k => k !== key));
    } else {
      setSelectedUnitKeys(prev => [...prev, key]);
    }
  };

  const handleConfirmCurrentSplit = async (method: 'cash' | 'promptpay' | 'credit_card') => {
    if (targetPartialAmount <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    setPaymentMethod(method);
    try {
      const success = await handleProcessPayment(method, targetPartialAmount, method === 'cash' ? numCashReceived || targetPartialAmount : undefined);
      if (!success) {
        return;
      }

      const newSplitRecord = {
        id: `split_${Date.now()}`,
        method: method,
        amount: targetPartialAmount,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        unitKeys: [...selectedUnitKeys],
        cashReceived: method === 'cash' ? numCashReceived || targetPartialAmount : undefined,
        change: method === 'cash' ? cashChange : undefined
      };

      setCompletedSplits(prev => [...prev, newSplitRecord]);
      setSelectedUnitKeys([]);
      setPaymentMethod(null);
      setCashReceivedInput('');
    } catch (e: any) {
      alert('Error: ' + (e?.message || e));
      setPaymentMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex w-full h-full flex-col bg-white font-sans overflow-hidden">
        
        {/* SINGLE HEADER */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0 w-full">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{locale === 'en' ? 'Split Payment' : 'แยกชำระบิล'}</h2>
          <button onClick={onClose} className="p-2 text-red-500 hover:text-white transition-colors rounded-full hover:bg-red-500 bg-red-50">
            <X size={24} strokeWidth={2} />
          </button>
        </header>

        {/* 2-COLUMN BODY */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full">
            
            {/* LEFT COLUMN: Checklist */}
            <div className="flex-1 flex flex-col min-h-0 h-full">

          
          {/* TAB SWITCHER */}
          {!fixedMode && (
            <div className="px-8 py-4 bg-white border-b border-gray-100 shrink-0">
              <div className="flex bg-gray-100/80 p-1 rounded-xl font-medium">
                <button
                  onClick={() => { setSplitMode('equal'); setSelectedUnitKeys([]); setPaymentMethod(null); }}
                  className={`flex-1 h-10 rounded-lg text-sm transition-all ${splitMode === 'equal' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {locale === 'en' ? 'Equal Split' : 'หารเท่ากัน'}
                </button>
                <button
                  onClick={() => { setSplitMode('item'); setSelectedUnitKeys([]); setPaymentMethod(null); }}
                  className={`flex-1 h-10 rounded-lg text-sm transition-all ${splitMode === 'item' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {locale === 'en' ? 'By Item' : 'เลือกรายการ'}
                </button>
              </div>
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">

            {/* EQUAL SPLIT */}
            {splitMode === 'equal' && (
              <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in fade-in duration-200">
                <div className="text-center space-y-8">
                  <div className="text-sm font-medium text-gray-400">{locale === 'en' ? 'Divide remaining balance into' : 'จำนวนคนหารจ่าย'}</div>
                  
                  <div className="flex items-center gap-12">
                    <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-black transition-all">
                      <Minus size={24} strokeWidth={1.5} />
                    </button>
                    <div className="text-7xl font-light text-black tracking-tighter">
                      {splitCount}
                    </div>
                    <button onClick={() => setSplitCount(splitCount + 1)} className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-black transition-all">
                      <Plus size={24} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">{locale === 'en' ? 'Amount per person' : 'ยอดชำระต่อคน'}</div>
                  <div className="text-4xl font-medium text-black tracking-tight">
                    ฿{equalSplitAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* ITEM SPLIT */}
            {splitMode === 'item' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {unpaidUnitsList.length > 0 && (
                  <div className="flex flex-col">
                    {unpaidUnitsList.map((unit) => {
                      const isSelected = selectedUnitKeys.includes(unit.key);
                      return (
                        <div
                          key={unit.key}
                          onClick={() => toggleUnitKey(unit.key)}
                          className={`group flex items-center gap-4 py-4 px-2 cursor-pointer transition-all border-b border-gray-100 last:border-0 ${isSelected ? 'bg-gray-50/50' : 'hover:bg-gray-50 bg-white'}`}
                        >
                          {/* Checkbox */}
                          <div className={`shrink-0 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>

                          {/* Thumbnail */}
                          <div className={`relative h-12 w-12 shrink-0 overflow-hidden bg-white rounded-lg border ${isSelected ? 'border-gray-700' : 'border-gray-100'}`}>
                            {unit.image_url ? (
                              <img loading="lazy" crossOrigin="anonymous" src={unit.image_url} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-300">
                                <span className="text-[8px] uppercase font-bold tracking-wider">NO IMG</span>
                              </div>
                            )}
                          </div>

                          {/* Center: Details */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-[14px] font-bold leading-tight truncate ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                              {unit.name}
                              {unit.totalUnits > 1 && <span className="ml-2 text-[10px] font-bold opacity-70">({unit.unitIndex}/{unit.totalUnits})</span>}
                            </div>
                            {unit.modifiersText && (
                              <div className="text-[11px] mt-0.5 line-clamp-1 text-gray-500">{unit.modifiersText}</div>
                            )}
                          </div>

                          {/* Right: Price */}
                          <div className={`text-[15px] font-black shrink-0 ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                            ฿{unit.unitPrice.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {paidUnitsList.length > 0 && (
                  <div className="flex flex-col pt-6 border-t border-gray-100">
                    <div className="text-sm font-bold text-gray-400 px-2 pb-2">{locale === 'en' ? 'Paid' : 'ชำระแล้ว'}</div>
                    {paidUnitsList.map((unit) => (
                      <div key={unit.key} className="flex items-center gap-4 px-2 py-4 border-b border-gray-100 last:border-0 opacity-50 grayscale">
                        <Check size={20} className="text-gray-400 shrink-0" />
                        
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-gray-50 rounded-lg border border-gray-200">
                          {unit.image_url ? (
                            <img loading="lazy" crossOrigin="anonymous" src={unit.image_url} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300 bg-white"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-gray-900 line-through decoration-gray-400 truncate">{unit.name}</div>
                        </div>
                        <div className="text-[14px] font-black text-gray-900">฿{unit.unitPrice.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Summary and Controls */}
        <div className="w-full lg:w-[380px] xl:w-[450px] flex flex-col min-h-0 shrink-0 h-full bg-white relative">


          <div className="flex-1 p-8 space-y-6 overflow-y-auto">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between text-[15px] font-medium text-gray-500">
                <span>{locale === 'en' ? 'Total' : 'รวม'}</span>
                <span>฿{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[15px] font-medium text-gray-500">
                <span>{locale === 'en' ? 'Paid' : 'จ่ายแล้ว'}</span>
                <span>฿{totalOverallPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-100">
                <span>{locale === 'en' ? 'Left' : 'คงเหลือ'}</span>
                <span>฿{liveRemainingTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <footer className="border-t border-gray-100 bg-white px-8 py-6 shrink-0">
            {isFullyCompleted ? (
              <div className="flex flex-col md:flex-row gap-4 animate-in fade-in duration-300">
                <button onClick={() => { if (typeof window !== 'undefined') window.print(); }} className="flex-1 h-14 rounded-2xl border border-gray-200 text-black hover:bg-gray-50 font-medium text-sm transition-all flex items-center justify-center gap-2">
                  {locale === 'en' ? 'Print Receipt' : 'พิมพ์ใบเสร็จ'}
                </button>
                <button onClick={onFinishOrder} className="flex-1 h-14 rounded-2xl bg-black text-white hover:bg-[#D3202B] font-medium text-sm transition-all flex items-center justify-center gap-2">
                  {locale === 'en' ? 'Finish Order' : 'เสร็จสิ้นบิล'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-end justify-between px-2">
                  <div className="text-sm text-gray-500 font-medium">{locale === 'en' ? 'Payment' : 'ยอดชำระ'}</div>
                  <div className="text-4xl font-semibold tracking-tighter text-black">
                    ฿{targetPartialAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    disabled={targetPartialAmount <= 0 || isSubmitting}
                    onClick={() => handleConfirmCurrentSplit('cash')}
                    className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40 disabled:hover:translate-y-0`}
                  >
                    {paymentMethod === 'cash' ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Banknote size={24} strokeWidth={1.5} />}
                    <span className="text-xs font-bold">{locale === 'en' ? 'Cash' : 'เงินสด'}</span>
                  </button>
                  <button
                    disabled={targetPartialAmount <= 0 || isSubmitting}
                    onClick={() => handleConfirmCurrentSplit('promptpay')}
                    className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'promptpay' ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40 disabled:hover:translate-y-0`}
                  >
                    {paymentMethod === 'promptpay' ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <QrCode size={24} strokeWidth={1.5} />}
                    <span className="text-xs font-bold">{locale === 'en' ? 'QR' : 'สแกน'}</span>
                  </button>
                  <button
                    disabled={targetPartialAmount <= 0 || isSubmitting}
                    onClick={() => handleConfirmCurrentSplit('credit_card')}
                    className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'credit_card' ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'} disabled:opacity-40 disabled:hover:translate-y-0`}
                  >
                    {paymentMethod === 'credit_card' ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CreditCard size={24} strokeWidth={1.5} />}
                    <span className="text-xs font-bold">{locale === 'en' ? 'Card' : 'บัตร'}</span>
                  </button>
                </div>
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  )
}
