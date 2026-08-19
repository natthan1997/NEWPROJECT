'use client';
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Edit3, Trash2, Loader2, 
  ChevronRight, Save, LayoutGrid, X,
  Menu as MenuIcon, LogOut, Settings,
  Map, Square, Circle, Trash, Grid, MapPin,
  QrCode, Printer, Download
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Capacitor } from '@capacitor/core'
import { PrinterSocket } from 'custom-printer-plugin'
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import { useI18n } from "@/lib/I18nContext";

interface POSTableManagerProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onShiftModalOpen?: () => void
  activeShift?: any
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings?: any
  showOnlyZones?: boolean
  showOnlyGrid?: boolean
  activeZoneProps?: string
  setActiveZoneProps?: (zone: string) => void
  editingTableProps?: any
  setEditingTableProps?: (table: any) => void
  isLayoutModeProps?: boolean
  setIsLayoutModeProps?: (isLayout: boolean) => void
}

export default function POSTableManager({ 
  profile, activeView, allowedNav, onSetView, onShiftModalOpen, activeShift, setViewExtraHeader, shopSettings,
  showOnlyZones, showOnlyGrid, activeZoneProps, setActiveZoneProps,
  editingTableProps, setEditingTableProps, isLayoutModeProps, setIsLayoutModeProps
}: POSTableManagerProps) {
    const { locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null)
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTableInternalState, setEditingTableInternalState] = useState<any>(null)
  const editingTable = editingTableProps !== undefined ? editingTableProps : editingTableInternalState;
  const setEditingTable = setEditingTableProps !== undefined ? setEditingTableProps : setEditingTableInternalState;
  const [isSaving, setIsSaving] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showQrModal, setShowQrModal] = useState<any>(null)
  
  const [isCreatingZone, setIsCreatingZone] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')
  

  const [isLayoutModeInternalState, setIsLayoutModeInternalState] = useState(false)
  const isLayoutMode = isLayoutModeProps !== undefined ? isLayoutModeProps : isLayoutModeInternalState;
  const setIsLayoutMode = setIsLayoutModeProps !== undefined ? setIsLayoutModeProps : setIsLayoutModeInternalState;

  // Long press timer ref and helper functions
  const pressTimerRef = React.useRef<any>(null);
  const startPress = (table: any) => {
    if (isLayoutMode) return;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setIsLayoutMode(true);
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
         window.navigator.vibrate(50);
      }
    }, 650);
  };
  const endPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };
  const [savingLayout, setSavingLayout] = useState(false)
  const [activeZoneInternal, setActiveZoneInternal] = useState<string>('Main')
  const activeZone = activeZoneProps !== undefined ? activeZoneProps : activeZoneInternal;
  const setActiveZone = setActiveZoneProps !== undefined ? setActiveZoneProps : setActiveZoneInternal;

  const [renamingZoneText, setRenamingZoneText] = useState('')
  useEffect(() => {
     setRenamingZoneText(activeZone)
  }, [activeZone])
  const [dbZones, setDbZones] = useState<any[]>([])
  const [isShapePickerOpen, setIsShapePickerOpen] = useState(false)

  useEffect(() => {
    setViewExtraHeader(
      <div className="flex items-center justify-end flex-1 gap-2">
          {isLayoutMode ? (
            <button onClick={handleSaveLayout} disabled={savingLayout} className="h-11 px-4 lg:px-6 bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-sm font-bold transition-all rounded-xl">
                {savingLayout ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">SAVE LAYOUT</span>
            </button>
          ) : (
            <button onClick={() => setIsLayoutMode(true)} className="h-11 px-4 lg:px-6 bg-white border border-neutral-200 text-black hover:bg-neutral-50 flex items-center justify-center gap-2 shadow-sm font-bold transition-all rounded-xl">
                <Map size={16} /> <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">EDIT LAYOUT</span>
            </button>
          )}
          <button onClick={() => window.print()} className="h-11 px-4 lg:px-6 bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-2 shadow-sm font-bold transition-all rounded-xl">
              <Printer size={16} /> <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">PRINT QR</span>
          </button>
          <button onClick={() => setIsShapePickerOpen(true)} className="h-11 px-5 lg:px-8 bg-[#D3202B] text-white flex items-center justify-center gap-3 shadow-lg font-bold rounded-xl hover:bg-red-700 transition-all">
              <Plus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest font-bold hidden sm:inline">ADD TABLE</span>
          </button>
      </div>
    );
    return () => setViewExtraHeader(null);
  }, [setViewExtraHeader, isLayoutMode, savingLayout, tables]);

  const fetchTables = async () => {
    setLoading(true)
    try {
        const branchId = shopSettings?.branch_id;
        let query = supabase.from('pos_tables').select('*').order('table_number')
        if (branchId) {
            query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
        } else {
            query = query.is('branch_id', null)
        }
        const { data, error } = await query
        if (error) throw error
        if (data) {
           const formatted = data.map((t, idx) => ({
              ...t,
              position_x: t.position_x ?? (idx % 5) * 150 + 20,
              position_y: t.position_y ?? Math.floor(idx / 5) * 150 + 20
           }));
           setTables(formatted)
        }
    } catch (e) {
        console.error('Fetch Tables Error:', e)
    } finally {
        setLoading(false)
    }
  }

  const fetchZones = async () => {
      const branchId = shopSettings?.branch_id;
      let query = supabase.from('pos_zones').select('*');
      if (branchId) {
          query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
      } else {
          query = query.is('branch_id', null)
      }
      const { data, error } = await query;
      if (!error && data) setDbZones(data);
  }

  useEffect(() => {
    fetchTables()
    fetchZones()

    const channel = supabase
      .channel(`pos_tables_realtime_${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_tables' }, () => {
        if (!isLayoutMode) {
          fetchTables()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_zones' }, () => {
        fetchZones()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLayoutMode, shopSettings?.branch_id])

  const handleSaveLayout = async () => {
     setSavingLayout(true)
     try {
       const updates = tables.map(t => ({
          id: t.id,
          position_x: t.position_x,
          position_y: t.position_y,
          shape: t.shape || 'square',
       }))
       
       for (const update of updates) {
          const { error } = await supabase.from('pos_tables').update({
             position_x: Math.round(update.position_x || 0),
             position_y: Math.round(update.position_y || 0),
             shape: update.shape
          }).eq('id', update.id)
          
          if (error) {
             console.error("Supabase update error:", error)
             throw new Error(error.message)
          }
       }
       alert('บันทึกตำแหน่งและรูปแบบโต๊ะเรียบร้อยแล้ว!')
       setIsLayoutMode(false)
     } catch (e) {
       console.error(e)
       alert('Error saving layout')
     } finally {
       setSavingLayout(false)
     }
  }

  const handleDragEnd = (id: string, info: any) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          position_x: (t.position_x || 0) + info.offset.x,
          position_y: (t.position_y || 0) + info.offset.y
        }
      }
      return t
    }))
  }

  const handleDeleteTable = async (id: string) => {
    if (!confirm('ยืนยันการลบโต๊ะนี้?')) return
    await supabase.from('pos_tables').delete().eq('id', id)
    fetchTables()
  }

  const handleSaveTable = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('pos_tables').upsert(editingTable)
    if (!error) {
      setIsEditorOpen(false)
      setEditingTable(null)
      fetchTables()
    }
    setIsSaving(false)
  }

  const printTableQRCode = async (table: any) => {
    const qrUrl = `${window.location.origin}/menu/${table.table_number}`
    if (Capacitor.isNativePlatform()) {
      const { data: shopSettings } = await supabase.from('pos_shop_settings').select('printers').single()
      const printers = shopSettings?.printers || []
      const receiptPrinter = printers.find((p: any) => p.type === 'receipt')
      
      let ip = receiptPrinter?.ip
      if (!ip) {
        ip = prompt('กรุณาระบุ IP Address ของเครื่องปริ้น (เช่น 192.168.1.100):', '192.168.1.100');
        if (!ip) return;
      }
      const model = receiptPrinter?.model || 'xprinter-xp-n160ii';
      const encoder = new ReceiptPrinterEncoder({ printerModel: model as any, columns: 48 });
      let result = encoder.initialize().codepage('auto').align('center').bold(true);
      result = result.line('--- SCAN TO ORDER ---').newline();
      result = result.qrcode(qrUrl, 1, 8, 'l').newline();
      result = result.line(`Table: ${table.table_number}`).newline().newline().newline().cut();
      
      const data = result.encode();
      let hex = '';
      data.forEach(b => hex += b.toString(16).padStart(2, '0'));
      
      try {
        await PrinterSocket.send({ ipAddress: ip, port: 9100, data: hex });
        alert('สั่งปริ้น QR Code โต๊ะเรียบร้อย');
      } catch (e: any) {
        console.error(e);
        alert('Print QR error: ' + (e?.message || JSON.stringify(e)));
      }
    } else {
      window.print();
    }
  };

  const saveQrasPNG = () => {
    const canvas = document.getElementById('qr-canvas-' + showQrModal?.id) as HTMLCanvasElement;
    if (!canvas) return;
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `table_${showQrModal?.table_number}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Table ${showQrModal?.table_number} QR Code`,
          });
        } catch (err) {
          console.error("Share failed", err);
        }
      } else {
        // Fallback for desktop
        const pngUrl = URL.createObjectURL(blob);
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `table_${showQrModal?.table_number}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(pngUrl);
      }
    }, 'image/png');
  }

  const allZones = Array.from(new Set([...tables.map(t => t.zone || 'Main'), ...dbZones.map(z => z.name)]));
  if (!allZones.includes('Main')) allZones.unshift('Main');

  const submitNewZone = async () => {
      if (newZoneName && newZoneName.trim()) {
          const zoneName = newZoneName.trim();
          await supabase.from('pos_zones').insert({ name: zoneName, branch_id: shopSettings?.branch_id || null });
          fetchZones();
          setActiveZone(zoneName);
      }
      setIsCreatingZone(false);
      setNewZoneName('');
  }

  const handleAddZone = async () => {
      setIsCreatingZone(true);
  }

  const handleDeleteZone = async (zoneName: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!confirm(`ยืนยันการลบโซน "${zoneName}"?\n(โต๊ะในโซนนี้จะถูกย้ายไปโซน Main อัตโนมัติ)`)) return;
      await supabase.from('pos_zones').delete().eq('name', zoneName).eq('branch_id', shopSettings?.branch_id || null);
      await supabase.from('pos_tables').update({ zone: 'Main' }).eq('zone', zoneName);
      fetchZones();
      fetchTables();
      setActiveZone('Main');
  }

  const handleRenameZone = async (oldName: string) => {
      const newName = renamingZoneText.trim();
      if (!newName || newName === oldName || newName.toLowerCase() === 'main') return;
      
      await supabase.from('pos_zones').update({ name: newName }).eq('name', oldName).eq('branch_id', shopSettings?.branch_id || null);
      await supabase.from('pos_tables').update({ zone: newName }).eq('zone', oldName);
      
      fetchZones();
      fetchTables();
      setActiveZone(newName);
  }

  if (showOnlyZones) {
    if (editingTable) {
      return (
        <div className="h-full flex flex-col font-bold bg-white p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4 shrink-0 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ตั้งค่าข้อมูลโต๊ะ</span>
              <h3 className="text-lg font-black text-gray-900">โต๊ะ {editingTable.table_number || 'ใหม่'}</h3>
            </div>
            <button 
              onClick={() => setEditingTable(null)} 
              className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-black transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto no-scrollbar space-y-5 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">หมายเลขโต๊ะ / ชื่อโต๊ะ</label>
              <input 
                type="text" 
                value={editingTable.table_number || ''} 
                onChange={e => setEditingTable({...editingTable, table_number: e.target.value})} 
                className="w-full bg-white border border-neutral-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#D3202B] transition-all text-neutral-900 shadow-sm" 
                placeholder="เช่น A1, 01, VIP-1" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">จำนวนที่นั่ง</label>
                <input 
                  type="number" 
                  value={editingTable.capacity || 4} 
                  onChange={e => setEditingTable({...editingTable, capacity: Number(e.target.value)})} 
                  className="w-full bg-white border border-neutral-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#D3202B] transition-all text-neutral-900 shadow-sm" 
                  min="1" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">โซนบริการ</label>
                <select 
                  value={editingTable.zone || 'Main'} 
                  onChange={e => setEditingTable({...editingTable, zone: e.target.value})} 
                  className="w-full bg-white border border-neutral-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#D3202B] transition-all text-neutral-900 appearance-none shadow-sm"
                >
                  {allZones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">รูปทรงโต๊ะ (Shape)</label>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setEditingTable({...editingTable, shape: 'square'})} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all \${editingTable.shape === 'square' || !editingTable.shape ? 'border-[#D3202B] bg-red-50 text-[#D3202B] shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                  <div className="w-5 h-5 rounded border-2 border-current"></div>
                  <span className="text-[8px] font-bold">จัตุรัส</span>
                </button>
                <button onClick={() => setEditingTable({...editingTable, shape: 'rectangle'})} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all \${editingTable.shape === 'rectangle' ? 'border-[#D3202B] bg-red-50 text-[#D3202B] shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                  <div className="w-7 h-4 rounded border-2 border-current mt-0.5 mb-0.5"></div>
                  <span className="text-[8px] font-bold">ผืนผ้า(นอน)</span>
                </button>
                <button onClick={() => setEditingTable({...editingTable, shape: 'rectangle_vertical'})} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all \${editingTable.shape === 'rectangle_vertical' ? 'border-[#D3202B] bg-red-50 text-[#D3202B] shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                  <div className="w-4 h-7 rounded border-2 border-current"></div>
                  <span className="text-[8px] font-bold">ผืนผ้า(ตั้ง)</span>
                </button>
                <button onClick={() => setEditingTable({...editingTable, shape: 'circle'})} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all \${editingTable.shape === 'circle' ? 'border-[#D3202B] bg-red-50 text-[#D3202B] shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                  <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                  <span className="text-[8px] font-bold">วงกลม</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">รวมบิลกับโต๊ะ (Merge)</label>
              <select 
                value={editingTable.parent_table_id || ''} 
                onChange={e => setEditingTable({...editingTable, parent_table_id: e.target.value || null})} 
                className="w-full bg-white border border-neutral-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#D3202B] transition-all text-neutral-900 appearance-none shadow-sm"
              >
                <option value="">-- แยกบิลปกติ (ไม่รวม) --</option>
                {tables.filter(t => t.id !== editingTable.id && !t.parent_table_id).map(t => (
                  <option key={t.id} value={t.id}>รวมเข้ากับโต๊ะ {t.table_number}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center justify-between cursor-pointer bg-neutral-50 p-3 rounded-xl hover:bg-neutral-100 transition-colors">
              <div className="flex flex-col mr-4">
                <span className="text-xs font-bold text-neutral-900">สั่งอาหารผ่าน QR (24/7)</span>
                <span className="text-[9px] text-neutral-500 font-medium">ลูกค้าสั่งได้แม้จะปิดกะแล้ว</span>
              </div>
              <div className="relative shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={!!editingTable.allow_after_hours}
                  onChange={e => setEditingTable({...editingTable, allow_after_hours: e.target.checked})}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors duration-300 \${editingTable.allow_after_hours ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm \${editingTable.allow_after_hours ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-neutral-100 shrink-0">
            <button 
              onClick={() => setEditingTable(null)} 
              className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider hover:bg-neutral-50 transition-all flex items-center justify-center gap-1.5"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleSaveTable} 
              disabled={isSaving} 
              className="flex-grow-[2] py-3 rounded-xl bg-[#D3202B] text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col justify-between font-bold bg-white p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4 shrink-0">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">หมวดหมู่โต๊ะ</span>
          <h3 className="text-lg font-black text-gray-900">เลือกโซนบริการ</h3>
        </div>
        <div className="flex-grow flex flex-col min-h-0 overflow-y-auto space-y-3 custom-scrollbar py-2">
           {allZones.map(z => {
              const isActive = activeZone === z;
              return (
                <button 
                  key={z} 
                  onClick={() => setActiveZone(z)} 
                  className={`w-full px-5 py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-between border ${isActive ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-white text-neutral-500 hover:bg-neutral-100 border-neutral-200'}`}
                >
                   <span>{z}</span>
                   {isLayoutMode && z !== 'Main' ? (
                     <span onClick={(e) => handleDeleteZone(z, e)} className="p-1 -mr-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                       <X size={14} />
                     </span>
                   ) : (
                     <ChevronRight size={14} className={isActive ? 'text-red-600' : 'opacity-40'} />
                   )}
                </button>
              );
           })}
        </div>
        {!isLayoutMode && (
          <div className="mt-4 flex flex-col gap-4 shrink-0 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
            {activeZone !== 'Main' && !isCreatingZone ? (
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-[#D3202B] uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md">ตั้งค่าโซน {activeZone}</span>
                 </div>
                 <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={renamingZoneText} 
                      onChange={(e) => setRenamingZoneText(e.target.value)} 
                      onKeyDown={(e) => { if(e.key === 'Enter') handleRenameZone(activeZone); }}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-bold text-gray-900 bg-white" 
                   />
                   <button onClick={() => handleRenameZone(activeZone)} className="px-4 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-black transition-colors shadow-sm">
                     บันทึก
                   </button>
                 </div>
                 <div className="flex gap-2 mt-1">
                    <button onClick={() => handleDeleteZone(activeZone)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-white hover:bg-red-50 transition-colors border border-red-100 flex items-center justify-center gap-1.5 shadow-sm">
                      <Trash2 size={14} /> ลบโซนนี้ทิ้ง
                    </button>
                    <button onClick={() => setIsCreatingZone(true)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-1.5 shadow-sm">
                      <Plus size={14} /> โซนใหม่
                    </button>
                 </div>
              </div>
            ) : isCreatingZone ? (
              <div className="flex flex-col gap-3">
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md self-start">สร้างโซนบริการใหม่</span>
                 <input 
                    autoFocus
                    type="text" 
                    placeholder="พิมพ์ชื่อโซนใหม่..." 
                    value={newZoneName} 
                    onChange={(e) => setNewZoneName(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter') submitNewZone(); else if (e.key === 'Escape') setIsCreatingZone(false); }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-indigo-900 bg-white" 
                 />
                 <div className="flex gap-2">
                   <button onClick={() => setIsCreatingZone(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                     ยกเลิก
                   </button>
                   <button onClick={submitNewZone} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm">
                     ยืนยันสร้างโซน
                   </button>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsCreatingZone(true)} 
                className="w-full py-4 rounded-2xl font-black text-xs bg-white text-[#D3202B] hover:bg-red-50 border border-red-100 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={16} /> สร้างโซนใหม่
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-6 font-sans print:hidden bg-transparent h-full flex flex-col">

        {/* TOP BAR / ZONES */}
        {!showOnlyGrid && (
        <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar pb-1">
           {allZones.map(z => (
               <button key={z} onClick={() => setActiveZone(z)} className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${activeZone === z ? 'bg-[#D3202B] text-white shadow-md' : 'bg-white text-neutral-500 hover:bg-neutral-100 border border-neutral-200'}`}>
                  {z}
                  {isLayoutMode && z !== 'Main' && (
                      <span onClick={(e) => handleDeleteZone(z, e)} className="p-1 -mr-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                          <X size={14} />
                      </span>
                  )}
               </button>
           ))}
           {!isLayoutMode && (
               isCreatingZone ? (
                 <div className="flex items-center gap-2 p-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl shrink-0 h-[46px]">
                   <input 
                      autoFocus
                      type="text" 
                      placeholder="ชื่อโซนใหม่..." 
                      value={newZoneName} 
                      onChange={(e) => setNewZoneName(e.target.value)} 
                      onKeyDown={(e) => { if(e.key === 'Enter') submitNewZone(); else if (e.key === 'Escape') setIsCreatingZone(false); }}
                      className="w-32 px-3 py-1.5 rounded-xl text-sm border-none focus:outline-none bg-white font-bold text-indigo-900 ml-1" 
                   />
                   <button onClick={submitNewZone} className="px-3 h-full rounded-xl text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">บันทึก</button>
                   <button onClick={() => setIsCreatingZone(false)} className="px-3 h-full rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-colors bg-white mr-1">ยกเลิก</button>
                 </div>
               ) : (
                 <button onClick={() => setIsCreatingZone(true)} className="px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap bg-white text-indigo-500 hover:bg-indigo-50 border border-indigo-100 flex items-center gap-1.5 transition-colors shadow-sm shrink-0 h-[46px]">
                     <Plus size={16} /> สร้างโซน
                 </button>
               )
           )}
        </div>
        )}

        {/* 2. MAIN TABLE CANVAS (Scrollable on small devices) */}
        <div className={`flex-grow mt-2 relative w-full rounded-[2.5rem] overflow-hidden ${isLayoutMode ? 'bg-red-50/50 border border-red-100 shadow-inner' : 'bg-transparent border-none'}`}>
             {isLayoutMode && (
               <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-red-100 px-5 py-2.5 rounded-full flex items-center gap-5 shadow-xl shadow-red-500/10 z-30 font-sans">
                 <div className="flex items-center gap-2 text-gray-800 text-xs font-bold tracking-tight">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D3202B]"></span>
                   </span>
                   <span className="ml-1 text-[#D3202B] whitespace-nowrap">จัดวางตำแหน่งโต๊ะ</span>
                 </div>
                 <div className="w-px h-4 bg-gray-200"></div>
                 <div className="flex items-center gap-1.5">
                   <button 
                     onClick={() => {
                       setIsLayoutMode(false);
                       fetchTables();
                     }} 
                     className="px-4 py-2 hover:bg-red-50 text-gray-500 hover:text-[#D3202B] rounded-full text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                   >
                     ยกเลิก
                   </button>
                   <button 
                     onClick={handleSaveLayout} 
                     disabled={savingLayout} 
                     className="px-5 py-2 bg-neutral-900 hover:bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-black/20"
                   >
                     {savingLayout ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                     บันทึก
                   </button>
                 </div>
               </div>
             )}
            <div className="relative w-full h-full overflow-hidden">
               <div 
                 ref={containerRef}
                 className="relative w-full h-full"
                 style={{ backgroundImage: isLayoutMode ? 'radial-gradient(#fca5a5 1.5px, transparent 1.5px)' : 'none', backgroundSize: '32px 32px' }}>
                {loading ? (
                   <div className="absolute inset-0 flex items-center justify-center opacity-30">
                       <Loader2 className="animate-spin text-neutral-400" size={48} />
                   </div>
                ) : (
                   <>
                      <AnimatePresence>
                      {tables.filter(t => (t.zone || 'Main') === activeZone).map(table => (
                          <motion.div 
                          key={table.id} 
                          drag={isLayoutMode}
                          dragConstraints={containerRef}
                          dragMomentum={false}
                          onDragEnd={(e, info) => handleDragEnd(table.id, info)}
                          initial={{ x: table.position_x || 0, y: table.position_y || 0, opacity: 0, scale: 0.9 }}
                          animate={{ x: table.position_x || 0, y: table.position_y || 0, opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className={`absolute ${table.shape === 'rectangle' ? 'w-32 h-20 sm:w-40 sm:h-24' : (table.shape === 'rectangle_vertical' ? 'w-20 h-32 sm:w-24 sm:h-40' : 'w-20 h-20 sm:w-24 sm:h-24')} group ${isLayoutMode ? 'cursor-grab active:cursor-grabbing z-10' : 'cursor-pointer'}`}
                          onMouseDown={() => startPress(table)}
                          onTouchStart={() => startPress(table)}
                          onMouseUp={endPress}
                          onMouseLeave={endPress}
                          onTouchEnd={endPress}
                          onClick={() => {
                             if (isLayoutMode) {
                                // do nothing on click in layout mode, they just drag
                             } else {
                                if (setEditingTableProps) {
                                   setEditingTableProps(table);
                                } else {
                                   setEditingTable(table); 
                                   setIsEditorOpen(true);
                                }
                             }
                          }}
                      >
                          {/* TABLE BODY (CLEAN) */}
                          <div className={`relative w-full h-full flex flex-col items-center justify-center z-10 ${table.shape === 'circle' ? 'rounded-full' : (table.shape === 'rectangle' || table.shape === 'rectangle_vertical' ? 'rounded-[1.5rem]' : 'rounded-2xl')} ${isLayoutMode ? 'bg-white border-2 border-dashed border-neutral-300 text-black shadow-sm group-hover:border-neutral-500' : (table.status === 'occupied' ? 'bg-[#D3202B] text-white shadow-lg' : 'bg-white border border-neutral-200 text-neutral-800 shadow-sm')} transition-all`}>
                              {/* Removed red pencil icon as requested */}
                             <div className={`text-2xl sm:text-3xl font-bold tracking-tight pointer-events-none`}>{table.table_number}</div>
                             <div className="mt-1 flex flex-col items-center pointer-events-none">
                                 <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-widest ${isLayoutMode ? 'text-neutral-400' : (table.status === 'occupied' ? 'text-red-200' : 'text-neutral-500')}`}>Seats {table.capacity}</span>
                             </div>
                             
                             {table.parent_table_id && (
                                 <div className="absolute -bottom-3 bg-black border border-neutral-800 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-md whitespace-nowrap flex items-center gap-1">
                                     🔗 รวมโต๊ะ {tables.find(t => t.id === table.parent_table_id)?.table_number}
                                 </div>
                             )}
                          </div>

                          {!isLayoutMode && (
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                <button onClick={(e) => { e.stopPropagation(); setShowQrModal(table); }} className="p-2 text-neutral-500 hover:text-black bg-white shadow-md rounded-full border border-neutral-100 transition-all hover:scale-110"><QrCode size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }} className="p-2 text-red-400 hover:text-red-600 bg-white shadow-md rounded-full border border-neutral-100 transition-all hover:scale-110"><Trash size={14} /></button>
                            </div>
                          )}
                      </motion.div>
                  ))}
                  </AnimatePresence>
               </>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* TABLE EDITOR (Sleek Glassmorphic Slide-over) */}
      <AnimatePresence>
      {isEditorOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-end font-sans">
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-[#D3202B]/20 backdrop-blur-sm" 
                 onClick={() => setIsEditorOpen(false)}
              />
              <motion.div 
                 initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto no-scrollbar border-l border-neutral-200"
              >
                  <header className="p-8 pb-6 border-b border-neutral-100 flex justify-between items-start sticky top-0 z-10 bg-white">
                      <div>
                          <h2 className="text-2xl font-black tracking-tighter text-neutral-900">Table Setup</h2>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">{editingTable.table_number || 'New Table'}</p>
                      </div>
                      <button onClick={() => setIsEditorOpen(false)} className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-black transition-colors"><X size={18} /></button>
                  </header>

                  <div className="p-8 space-y-6 flex-1">
                      <div className="space-y-2">
                          <label className="text-[11px] font-medium text-neutral-600">{locale === 'en' ? 'Table Number / Name' : 'หมายเลขโต๊ะ / ชื่อโต๊ะ'}</label>
                          <input type="text" value={editingTable.table_number} onChange={e => setEditingTable({...editingTable, table_number: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-xl py-3.5 px-4 text-sm outline-none focus:border-[#D3202B] focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-900 shadow-sm" placeholder="e.g. A1, 01, VIP-1" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium text-neutral-600">Capacity (Seats)</label>
                            <input type="number" value={editingTable.capacity} onChange={e => setEditingTable({...editingTable, capacity: Number(e.target.value)})} className="w-full bg-white border border-neutral-200 rounded-xl py-3.5 px-4 text-sm outline-none focus:border-[#D3202B] focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-900 shadow-sm" min="1" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium text-neutral-600">Zone</label>
                            <select value={editingTable.zone || 'Main'} onChange={e => setEditingTable({...editingTable, zone: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-xl py-3.5 px-4 text-sm outline-none focus:border-[#D3202B] focus:ring-1 focus:ring-neutral-900 transition-all text-neutral-900 appearance-none shadow-sm">
                                {allZones.map(z => (
                                    <option key={z} value={z}>{z}</option>
                                ))}
                            </select>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                          <label className="text-[11px] font-medium text-neutral-600">รูปทรงโต๊ะ (Shape)</label>
                          <div className="grid grid-cols-4 gap-2">
                              <button onClick={() => setEditingTable({...editingTable, shape: 'square'})} className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editingTable.shape === 'square' || !editingTable.shape ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                                  <div className="w-7 h-7 rounded-lg border-[3px] border-current"></div>
                                  <span className="text-[9px] font-bold">จัตุรัส</span>
                              </button>
                              <button onClick={() => setEditingTable({...editingTable, shape: 'rectangle'})} className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editingTable.shape === 'rectangle' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                                  <div className="w-9 h-5 rounded-md border-[3px] border-current mt-1 mb-1"></div>
                                  <span className="text-[9px] font-bold">ผืนผ้า(นอน)</span>
                              </button>
                              <button onClick={() => setEditingTable({...editingTable, shape: 'rectangle_vertical'})} className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editingTable.shape === 'rectangle_vertical' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                                  <div className="w-5 h-9 rounded-md border-[3px] border-current"></div>
                                  <span className="text-[9px] font-bold">ผืนผ้า(ตั้ง)</span>
                              </button>
                              <button onClick={() => setEditingTable({...editingTable, shape: 'circle'})} className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editingTable.shape === 'circle' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}`}>
                                  <div className="w-7 h-7 rounded-full border-[3px] border-current"></div>
                                  <span className="text-[9px] font-bold">วงกลม</span>
                              </button>
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Merge With (รวมบิลกับโต๊ะ)</label>
                          <select 
                            value={editingTable.parent_table_id || ''} 
                            onChange={e => setEditingTable({...editingTable, parent_table_id: e.target.value || null})} 
                            className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl py-4 px-5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-indigo-900 appearance-none"
                          >
                              <option value="">-- ไม่รวมโต๊ะ (แยกบิลปกติ) --</option>
                              {tables.filter(t => t.id !== editingTable.id && !t.parent_table_id).map(t => (
                                  <option key={t.id} value={t.id}>รวมเข้ากับโต๊ะ {t.table_number}</option>
                              ))}
                          </select>
                          <p className="text-[11px] text-indigo-500/80 mt-2 font-medium ml-1">หากเลือกรวมโต๊ะ บิลและคิวอาหารจะถูกส่งไปที่โต๊ะหลักทั้งหมด</p>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-neutral-100">
                          <label className="flex items-center justify-between cursor-pointer group bg-neutral-50 p-4 rounded-2xl hover:bg-neutral-100 transition-colors">
                              <div className="flex flex-col mr-4">
                                  <span className="text-sm font-bold text-neutral-900">เปิดรับออเดอร์นอกเวลา (24/7)</span>
                                  <span className="text-[11px] text-neutral-500 mt-1">ลูกค้าสามารถสั่งอาหารผ่าน QR โต๊ะนี้ได้ แม้จะปิดกะไปแล้ว</span>
                              </div>
                              <div className="relative shrink-0">
                                  <input 
                                      type="checkbox" 
                                      className="sr-only" 
                                      checked={!!editingTable.allow_after_hours}
                                      onChange={e => setEditingTable({...editingTable, allow_after_hours: e.target.checked})}
                                  />
                                  <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${editingTable.allow_after_hours ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${editingTable.allow_after_hours ? 'transform translate-x-5' : ''}`}></div>
                              </div>
                          </label>
                      </div>
                  </div>

                  <div className="p-6 bg-white border-t border-neutral-100">
                    <button onClick={handleSaveTable} disabled={isSaving} className="w-full py-4 rounded-2xl bg-[#D3202B] text-white text-[12px] font-black uppercase tracking-widest transition-all hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                      {isSaving ? <Loader2 className="animate-spin text-white" size={16} /> : <Save size={16} />}
                      Save Table
                    </button>
                  </div>
              </motion.div>
          </div>
      )}
      </AnimatePresence>

      {/* VISUAL SHAPE PICKER MODAL */}
      <AnimatePresence>
      {isShapePickerOpen && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center font-sans">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#D3202B]/40 backdrop-blur-sm" onClick={() => setIsShapePickerOpen(false)} />
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                 className="relative bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4 border border-neutral-100"
              >
                  <button onClick={() => setIsShapePickerOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-black transition-colors"><X size={16} /></button>
                  <h3 className="text-xl font-black text-center mb-4 tracking-tight">เลือกทรงโต๊ะ</h3>
                  
                  <button onClick={() => { setIsShapePickerOpen(false); const t = { table_number: '', capacity: 4, zone: activeZone, shape: 'square', status: 'available', branch_id: shopSettings?.branch_id || null }; if (setEditingTableProps) { setEditingTableProps(t); } else { setEditingTable(t); setIsEditorOpen(true); } }} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-left">
                      <div className="w-12 h-12 bg-white rounded-2xl border-[3px] border-neutral-300 group-hover:border-indigo-500 shadow-sm shrink-0 transition-colors"></div>
                      <div className="flex flex-col"><span className="font-bold text-neutral-900">โต๊ะสี่เหลี่ยมจัตุรัส</span><span className="text-[10px] font-medium text-neutral-500">2-4 ที่นั่ง (มาตรฐาน)</span></div>
                  </button>
                  
                  <button onClick={() => { setIsShapePickerOpen(false); const t = { table_number: '', capacity: 6, zone: activeZone, shape: 'rectangle', status: 'available', branch_id: shopSettings?.branch_id || null }; if (setEditingTableProps) { setEditingTableProps(t); } else { setEditingTable(t); setIsEditorOpen(true); } }} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-left">
                      <div className="w-14 h-9 bg-white rounded-xl border-[3px] border-neutral-300 group-hover:border-indigo-500 shadow-sm shrink-0 transition-colors"></div>
                      <div className="flex flex-col"><span className="font-bold text-neutral-900">ผืนผ้า แนวนอน</span><span className="text-[10px] font-medium text-neutral-500">6-8 ที่นั่ง (แนวนอน)</span></div>
                  </button>

                  <button onClick={() => { setIsShapePickerOpen(false); const t = { table_number: '', capacity: 6, zone: activeZone, shape: 'rectangle_vertical', status: 'available', branch_id: shopSettings?.branch_id || null }; if (setEditingTableProps) { setEditingTableProps(t); } else { setEditingTable(t); setIsEditorOpen(true); } }} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-left">
                      <div className="w-9 h-14 mx-2 bg-white rounded-xl border-[3px] border-neutral-300 group-hover:border-indigo-500 shadow-sm shrink-0 transition-colors"></div>
                      <div className="flex flex-col"><span className="font-bold text-neutral-900">ผืนผ้า แนวตั้ง</span><span className="text-[10px] font-medium text-neutral-500">6-8 ที่นั่ง (แนวตั้ง)</span></div>
                  </button>
                  
                  <button onClick={() => { setIsShapePickerOpen(false); const t = { table_number: '', capacity: 4, zone: activeZone, shape: 'circle', status: 'available', branch_id: shopSettings?.branch_id || null }; if (setEditingTableProps) { setEditingTableProps(t); } else { setEditingTable(t); setIsEditorOpen(true); } }} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-left">
                      <div className="w-12 h-12 bg-white rounded-full border-[3px] border-neutral-300 group-hover:border-indigo-500 shadow-sm shrink-0 transition-colors"></div>
                      <div className="flex flex-col"><span className="font-bold text-neutral-900">โต๊ะกลม</span><span className="text-[10px] font-medium text-neutral-500">4-6 ที่นั่ง (โต๊ะกลม)</span></div>
                  </button>
              </motion.div>
          </div>
      )}
      </AnimatePresence>

      {/* QR MODAL (Frosted Glass) */}
      <AnimatePresence>
      {showQrModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center font-sans">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#D3202B]/40 backdrop-blur-md" onClick={() => setShowQrModal(null)} />
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 20 }} 
             animate={{ opacity: 1, scale: 1, y: 0 }} 
             exit={{ opacity: 0, scale: 0.9, y: 20 }}
             className="relative bg-white p-10 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl max-w-sm w-full mx-4 border border-white/20"
           >
              <button onClick={() => setShowQrModal(null)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-black transition-colors"><X size={16} /></button>
              
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-4">
                 <QrCode size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter mb-1 text-neutral-900">Table {showQrModal.table_number}</h3>
              <p className="text-[10px] text-neutral-400 mb-8 font-bold uppercase tracking-widest text-center">Scan to Order</p>
              
              <div className="bg-white p-5 border border-neutral-100 shadow-sm mb-8 rounded-2xl">
                 <QRCodeCanvas 
                    id={`qr-canvas-${showQrModal.id}`}
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${showQrModal.table_number}`} 
                    size={200}
                    level="L"
                 />
              </div>

              <div className="flex flex-col gap-3 w-full">
                 <button 
                    onClick={() => { printTableQRCode(showQrModal); setShowQrModal(null); }}
                    className="w-full flex items-center gap-2 px-6 py-4 bg-[#D3202B] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] justify-center transition-all active:scale-95 hover:bg-red-700 hover:shadow-lg"
                 >
                    <Printer size={16} />
                    Print QR Code
                 </button>
                 <button 
                    onClick={saveQrasPNG}
                    className="w-full flex items-center gap-2 px-6 py-4 bg-neutral-100 text-neutral-700 rounded-2xl font-black uppercase tracking-widest text-[11px] justify-center transition-all active:scale-95 hover:bg-neutral-200"
                 >
                    <Download size={16} />
                    Save as PNG
                 </button>
              </div>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* PRINT ALL QR TEMPLATE (Hidden from screen, visible on print) */}
      <div className="hidden print:block p-8">
         <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-widest">Table QR Codes</h1>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            {tables.map(table => (
               <div key={`print-${table.id}`} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 break-inside-avoid">
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Table {table.table_number}</h3>
                  <QRCodeSVG 
                     value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${table.table_number}`} 
                     size={200}
                     level="L"
                  />
                  <p className="text-xs text-gray-500 mt-4 font-bold uppercase tracking-widest text-center">Scan to Order</p>
               </div>
            ))}
         </div>
      </div>

      <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@200;300;400;500;900&family=Prompt:wght@200;300;400&display=swap');
          .font-serif-luxury { font-family: 'Cormorant Garamond', serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
