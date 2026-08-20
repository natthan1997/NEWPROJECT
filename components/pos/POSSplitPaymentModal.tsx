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
  shopSettings
}: any) {
  const { locale } = useI18n();

  const [splitMode, setSplitMode] = useState<'equal' | 'item'>('equal')
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
          totalUnits: qty,
          name: itemName,
          customer_name: item.customer_name,
          unitPrice,
          modifiersText: modText,
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

  const handleConfirmCurrentSplit = async () => {
    if (targetPartialAmount <= 0 || !paymentMethod || isSubmitting || !isCashValid) return;

    setIsSubmitting(true);
    try {
      await handleProcessPayment(paymentMethod, targetPartialAmount);

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
      setSelectedUnitKeys([]);
      setPaymentMethod(null);
      setCashReceivedInput('');
    } catch (e: any) {
      alert('Error: ' + (e?.message || e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex w-full h-full flex-col bg-white font-sans overflow-hidden">
        
        {/* HEADER */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{locale === 'en' ? 'Split Payment' : 'แยกชำระบิล'}</h2>
            <div className="flex gap-4 mt-1 text-sm font-medium text-gray-500">
              <span>{locale === 'en' ? 'Total' : 'รวม'}: ฿{cartTotal.toLocaleString()}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-900">{locale === 'en' ? 'Paid' : 'จ่ายแล้ว'}: ฿{totalOverallPaid.toLocaleString()}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-900">{locale === 'en' ? 'Left' : 'คงเหลือ'}: ฿{liveRemainingTotal.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
            <X size={24} strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          
          {/* TAB SWITCHER */}
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
                  <div className="space-y-4">
                    {unpaidUnitsList.map((unit) => {
                      const isSelected = selectedUnitKeys.includes(unit.key);
                      return (
                        <div
                          key={unit.key}
                          onClick={() => toggleUnitKey(unit.key)}
                          className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'border-black bg-black text-white' : 'border-transparent hover:bg-gray-50 bg-white'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-white' : 'border-gray-300'}`}>
                              {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                            </div>
                            <div>
                              <div className={`text-base font-medium ${isSelected ? 'text-white' : 'text-black'}`}>
                                {unit.name}
                                {unit.totalUnits > 1 && <span className="ml-2 text-xs opacity-50">({unit.unitIndex}/{unit.totalUnits})</span>}
                              </div>
                              {unit.modifiersText && (
                                <div className={`text-sm mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>{unit.modifiersText}</div>
                              )}
                            </div>
                          </div>
                          <div className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-black'}`}>
                            ฿{unit.unitPrice.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {paidUnitsList.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-400 px-4">{locale === 'en' ? 'Paid' : 'ชำระแล้ว'}</div>
                    {paidUnitsList.map((unit) => (
                      <div key={unit.key} className="flex items-center justify-between px-4 py-2 opacity-50">
                        <div className="flex items-center gap-4">
                          <Check size={20} className="text-gray-400" />
                          <div>
                            <div className="text-base text-gray-900 line-through decoration-gray-300">{unit.name}</div>
                          </div>
                        </div>
                        <div className="text-lg text-gray-900">฿{unit.unitPrice.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                    disabled={targetPartialAmount <= 0}
                    onClick={() => setPaymentMethod('cash')}
                    className={`h-16 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-black'} disabled:opacity-30`}
                  >
                    <Banknote size={20} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{locale === 'en' ? 'Cash' : 'เงินสด'}</span>
                  </button>
                  <button
                    disabled={targetPartialAmount <= 0}
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`h-16 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'promptpay' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-black'} disabled:opacity-30`}
                  >
                    <QrCode size={20} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{locale === 'en' ? 'QR' : 'สแกน'}</span>
                  </button>
                  <button
                    disabled={targetPartialAmount <= 0}
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`h-16 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'credit_card' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-black'} disabled:opacity-30`}
                  >
                    <CreditCard size={20} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{locale === 'en' ? 'Card' : 'บัตร'}</span>
                  </button>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-200">
                    <input
                      type="number"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      placeholder={locale === 'en' ? 'Received amount' : 'รับเงินมา...'}
                      className="flex-1 h-14 bg-gray-50 border-transparent rounded-2xl px-5 text-lg font-medium text-black focus:bg-white focus:border-black focus:ring-0 outline-none transition-all"
                    />
                    <button onClick={() => setCashReceivedInput(String(Math.ceil(targetPartialAmount)))} className="px-5 h-14 rounded-2xl bg-gray-100 text-sm font-medium text-black hover:bg-gray-200 transition-all">{locale === 'en' ? 'Exact' : 'พอดี'}</button>
                  </div>
                )}

                {paymentMethod && (
                  <button
                    disabled={targetPartialAmount <= 0 || isSubmitting || !isCashValid}
                    onClick={handleConfirmCurrentSplit}
                    className="w-full h-16 rounded-2xl bg-black hover:bg-[#D3202B] text-white font-medium text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    {isSubmitting ? (locale === 'en' ? 'Processing...' : 'กำลังบันทึก...') : (locale === 'en' ? 'Pay' : 'ชำระเงิน')}
                  </button>
                )}
              </div>
            )}
          </footer>
        </div>
    </div>
  )
}
