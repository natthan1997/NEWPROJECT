import React, { useState, useMemo } from 'react'
import { X, Divide, CheckSquare, Square, Banknote, QrCode, CreditCard, Sparkles, Plus, Minus } from 'lucide-react'
import { useI18n } from "@/lib/I18nContext";

export default function POSSplitPaymentModal({
  onClose,
  cart = [],
  cartTotal = 0,
  remainingTotal = 0,
  handleProcessPayment,
  isProcessing
}: any) {
  const { locale } = useI18n();
  const [splitMode, setSplitMode] = useState<'equal' | 'item'>('equal')
  const [splitCount, setSplitCount] = useState(2)
  const [selectedUnitKeys, setSelectedUnitKeys] = useState<string[]>([])

  // Calculate unit price for each item including selected modifiers/options and item-level discounts
  const getItemUnitPrice = (item: any) => {
    const base = Number(item.sale_price ?? item.price ?? item.unit_price ?? 0);
    const modSum = (item.selected_modifiers || []).reduce(
      (sum: number, m: any) => sum + ((Number(m.price_adjustment) || 0) * (Number(m.qty) || 1)),
      0
    );
    const itemDiscount = (Number(item.discount_amount) || 0) / Math.max(1, Number(item.quantity) || 1);
    return Math.max(0, base + modSum - itemDiscount);
  };

  // Format custom options/modifiers text to display under each item name
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

  // Unroll cart items into individual unit items so items with qty > 1 can be split unit by unit
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

  // Equal Split Amount
  const equalSplitAmount = splitCount > 0 ? remainingTotal / splitCount : 0

  // Item Split Amount Calculation
  const selectedUnitsSubtotal = useMemo(() => {
    return splitableUnits
      .filter(unit => selectedUnitKeys.includes(unit.key))
      .reduce((sum, unit) => sum + unit.unitPrice, 0);
  }, [splitableUnits, selectedUnitKeys]);

  const allUnitsSubtotal = useMemo(() => {
    return splitableUnits.reduce((sum, unit) => sum + unit.unitPrice, 0);
  }, [splitableUnits]);

  const calculateItemSplitTotal = () => {
    if (remainingTotal === 0 || allUnitsSubtotal === 0) return 0;
    // Calculate proportional amount of final remaining total
    return (selectedUnitsSubtotal / allUnitsSubtotal) * remainingTotal;
  };

  const finalSplitTotal = splitMode === 'equal' ? equalSplitAmount : calculateItemSplitTotal();

  const toggleUnitKey = (key: string) => {
    if (selectedUnitKeys.includes(key)) {
      setSelectedUnitKeys(prev => prev.filter(k => k !== key));
    } else {
      setSelectedUnitKeys(prev => [...prev, key]);
    }
  };

  const toggleSelectAllUnits = () => {
    if (selectedUnitKeys.length === splitableUnits.length) {
      setSelectedUnitKeys([]);
    } else {
      setSelectedUnitKeys(splitableUnits.map(u => u.key));
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative flex w-full max-w-2xl flex-col bg-[#FDFDFB] font-bold shadow-2xl animate-in zoom-in-95 duration-200 h-[85vh] rounded-3xl overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              {locale === 'en' ? 'Split Bill' : 'ระบบหารจ่าย / แยกจ่ายชำระ'}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              {locale === 'en' ? 'Choose equal division or select specific items with options' : 'เลือกหารเท่ากัน หรือเลือกรายการพร้อมตัวเลือกปรับแต่ง'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </header>

        {/* Tab Controls */}
        <div className="p-6 bg-white border-b border-gray-100 pb-4">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl font-bold gap-1">
            <button
              onClick={() => setSplitMode('equal')}
              className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                splitMode === 'equal' ? 'bg-[#1A1A18] text-white shadow-md' : 'text-gray-500 hover:text-black'
              }`}
            >
              <Divide size={16} />
              {locale === 'en' ? 'Equal Split' : 'หารเท่ากัน'}
            </button>
            <button
              onClick={() => setSplitMode('item')}
              className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                splitMode === 'item' ? 'bg-[#1A1A18] text-white shadow-md' : 'text-gray-500 hover:text-black'
              }`}
            >
              <CheckSquare size={16} />
              {locale === 'en' ? 'By Item & Options' : 'เลือกรายรายการ & ตัวเลือก'}
            </button>
          </div>
        </div>
        
        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar bg-gray-50/40">
          
          {/* EQUAL SPLIT MODE */}
          {splitMode === 'equal' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300 py-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-white shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {locale === 'en' ? 'Number of People' : 'จำนวนคนหารจ่าย'}
                </span>
                <div className="flex items-center gap-8">
                  <button 
                    onClick={() => setSplitCount(Math.max(2, splitCount - 1))} 
                    className="h-14 w-14 rounded-2xl border-2 border-black flex items-center justify-center text-2xl hover:bg-black hover:text-white active:scale-95 transition-all shadow-sm"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-6xl font-black text-black leading-none">{splitCount}</span>
                    <span className="text-xs text-gray-400 font-medium mt-1">คน</span>
                  </div>
                  <button 
                    onClick={() => setSplitCount(splitCount + 1)} 
                    className="h-14 w-14 rounded-2xl border-2 border-black flex items-center justify-center text-2xl hover:bg-black hover:text-white active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 w-full flex justify-around text-center">
                  <div>
                    <div className="text-[11px] font-bold text-gray-400">ยอดรวมทั้งหมด</div>
                    <div className="text-lg font-black text-black">฿{remainingTotal.toLocaleString()}</div>
                  </div>
                  <div className="w-[1px] h-8 bg-gray-200"></div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600">เฉลี่ยต่อคน</div>
                    <div className="text-lg font-black text-emerald-600">฿{equalSplitAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ITEM SPLIT MODE */}
          {splitMode === 'item' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-400">
                  {locale === 'en' ? 'Select items for this payment' : 'แตะเลือกรายการที่จะจ่ายในบิลนี้ (ดึงตัวเลือกครบถ้วน)'}
                </span>
                <button
                  onClick={toggleSelectAllUnits}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-all"
                >
                  {selectedUnitKeys.length === splitableUnits.length ? 'ล้างการเลือก' : 'เลือกทั้งหมด'}
                </button>
              </div>

              <div className="space-y-2.5">
                {splitableUnits.map((unit) => {
                  const isSelected = selectedUnitKeys.includes(unit.key);
                  return (
                    <button
                      key={unit.key}
                      onClick={() => toggleUnitKey(unit.key)}
                      className={`w-full flex items-start justify-between p-4 rounded-2xl border transition-all text-left ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                          : 'border-gray-200/80 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-4">
                        <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-300'}`}>
                          {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-black break-words leading-tight">
                              {unit.name}
                            </span>
                            {unit.totalUnits > 1 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                                ชิ้นที่ {unit.unitIndex}/{unit.totalUnits}
                              </span>
                            )}
                          </div>

                          {/* Custom Options / Modifiers display */}
                          {unit.modifiersText ? (
                            <p className="text-xs font-medium text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg mt-1.5 inline-block break-words border border-amber-100/60">
                              ✨ {unit.modifiersText}
                            </p>
                          ) : null}

                          {unit.customer_name && (
                            <div className="text-[10px] font-bold text-emerald-600 mt-1">
                              👤 {unit.customer_name}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-black">
                          ฿{unit.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Payment Actions */}
        <footer className="border-t border-gray-100 bg-white p-6">
          <div className="flex items-end justify-between mb-5">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {locale === 'en' ? 'Selected Amount' : 'ยอดชำระงวดนี้'}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5">
                {locale === 'en' ? 'Remaining total: ฿' : 'จากยอดคงเหลือทั้งหมด: ฿'}{remainingTotal.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl lg:text-4xl font-black text-black tracking-tight">
                ฿{finalSplitTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <button 
              disabled={isProcessing || finalSplitTotal <= 0} 
              onClick={() => handleProcessPayment('cash', finalSplitTotal)} 
              className="h-16 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-black hover:text-white transition-all group disabled:opacity-40 active:scale-95 shadow-sm"
            >
              <Banknote size={20} className="text-gray-500 group-hover:text-white mb-1 transition-colors" />
              <span className="text-[11px] font-black tracking-wider">เงินสด (CASH)</span>
            </button>
            <button 
              disabled={isProcessing || finalSplitTotal <= 0} 
              onClick={() => handleProcessPayment('promptpay', finalSplitTotal)} 
              className="h-16 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-black hover:text-white transition-all group disabled:opacity-40 active:scale-95 shadow-sm"
            >
              <QrCode size={20} className="text-gray-500 group-hover:text-white mb-1 transition-colors" />
              <span className="text-[11px] font-black tracking-wider">สแกน QR</span>
            </button>
            <button 
              disabled={isProcessing || finalSplitTotal <= 0} 
              onClick={() => handleProcessPayment('credit_card', finalSplitTotal)} 
              className="h-16 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-black hover:text-white transition-all group disabled:opacity-40 active:scale-95 shadow-sm"
            >
              <CreditCard size={20} className="text-gray-500 group-hover:text-white mb-1 transition-colors" />
              <span className="text-[11px] font-black tracking-wider">บัตรเครดิต</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
