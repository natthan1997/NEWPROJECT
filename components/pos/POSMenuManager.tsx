'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Plus, Search, Edit3, Trash2, Filter, 
  MoreVertical, Check, X, Loader2, Image as ImageIcon,
  ChevronRight, RefreshCcw, Save, Trash, LayoutGrid,
  Menu as MenuIcon, LogOut, Settings, List, Star, ToggleRight, CheckCircle2, XCircle, Upload, AlertCircle, Crop, ZoomIn, ZoomOut, Store, ShoppingBag
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useI18n } from "@/lib/I18nContext";
import { getMenuSearchText, getPrimaryMenuName, getSecondaryMenuName } from '@/lib/posMenuLabels'
import { sortMenuItemsByOrder, withMenuSortOrder } from '@/lib/posMenuOrder'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/lib/cropImage'

const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p === 'grab') return '#00B14F';
    if (p === 'lineman') return '#06C755';
    if (p === 'shopee') return '#EE4D2D';
    if (p === 'foodpanda') return '#D70F64';
    if (p === 'robinhood') return '#8A2E8A';
    return '#8B5CF6'; // default purple
};

import POSCategoryManager from './POSCategoryManager'
import POSModifierManager from './POSModifierManager'
interface POSMenuManagerProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onShiftModalOpen?: () => void
  activeShift?: any
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings?: any
  forceViewMode?: "grid" | "table" | "stock"
  hideStockToggle?: boolean
}

const ReorderMenuItem = ({ item, locale }: { item: any, locale: string }) => {
    const controls = useDragControls()
    const itemRef = useRef<any>(null)

    const state = useRef({
      timer: null as NodeJS.Timeout | null,
      isLongPressed: false,
      isDragging: false,
      startX: 0,
      startY: 0,
      startEvent: null as TouchEvent | null
    })

    useEffect(() => {
        const el = itemRef.current
        if (!el) return

        const handleTouchStart = (e: TouchEvent) => {
            state.current.isLongPressed = false
            state.current.isDragging = false
            state.current.startX = e.touches[0].clientX
            state.current.startY = e.touches[0].clientY
            state.current.startEvent = e

            state.current.timer = setTimeout(() => {
                state.current.isLongPressed = true
                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
                
                // Pure DOM visual feedback to avoid React re-renders during FLIP!
                el.classList.remove('shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]', 'border-gray-100', 'z-10')
                el.classList.add('shadow-2xl', 'border-black/20', 'z-50')
            }, 300)
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!state.current.isLongPressed) {
                // If they haven't held for 300ms, and they moved more than 10px, it's a scroll! Cancel timer.
                const dx = Math.abs(e.touches[0].clientX - state.current.startX)
                const dy = Math.abs(e.touches[0].clientY - state.current.startY)
                if (dx > 10 || dy > 10) {
                    if (state.current.timer) clearTimeout(state.current.timer)
                }
                return
            }

            // If long pressed, we MUST prevent the browser from scrolling
            if (e.cancelable) {
                e.preventDefault()
            }

            if (!state.current.isDragging) {
                state.current.isDragging = true
                controls.start(state.current.startEvent as any || e as any)
            }
        }

        const handleTouchEnd = () => {
            if (state.current.timer) clearTimeout(state.current.timer)
            state.current.isLongPressed = false
            state.current.isDragging = false
            
            // Reset styles
            el.classList.remove('shadow-2xl', 'border-black/20', 'z-50')
            el.classList.add('shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]', 'border-gray-100', 'z-10')
        }

        el.addEventListener('touchstart', handleTouchStart, { passive: false })
        el.addEventListener('touchmove', handleTouchMove, { passive: false })
        el.addEventListener('touchend', handleTouchEnd)
        el.addEventListener('touchcancel', handleTouchEnd)

        return () => {
            el.removeEventListener('touchstart', handleTouchStart)
            el.removeEventListener('touchmove', handleTouchMove)
            el.removeEventListener('touchend', handleTouchEnd)
            el.removeEventListener('touchcancel', handleTouchEnd)
        }
    }, [controls])

    return (
        <Reorder.Item
            ref={itemRef}
            value={item.id}
            dragListener={false}
            dragControls={controls}
            onMouseDown={(e) => controls.start(e)}
            className="bg-white mb-3.5 p-3.5 rounded-[16px] flex gap-4 items-center relative transition-shadow duration-200 border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border-gray-100 z-10 cursor-grab hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] active:cursor-grabbing"
            style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'pan-y' }}
        >
            <div className="w-[72px] h-[72px] rounded-[12px] bg-gray-100 overflow-hidden shrink-0">
                {item.image_url ? (
                    <img src={item.image_url} alt={getPrimaryMenuName(item, locale) || ''} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-400" size={24} /></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-gray-800 mb-1 leading-tight">{getPrimaryMenuName(item, locale)}</h4>
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-500 mb-1">
                    <div className="flex items-center gap-1"><span className="text-black"><Store size={14}/></span> ฿{item.sale_price}</div>
                    {item.platform_prices && Object.entries(item.platform_prices).filter(([_,v]) => v).map(([platform, price]) => (
                        <div key={platform} className="flex items-center gap-1">
                            <span style={{ color: getPlatformColor(platform) }}><ShoppingBag size={14}/></span> ฿{price}
                        </div>
                    ))}
                </div>
                {item.platform_prices && Object.keys(item.platform_prices).length > 0 && (
                    <p className="text-[12px] text-gray-400">(+ อื่นๆ {Object.keys(item.platform_prices).length} ช่องทาง)</p>
                )}
            </div>
            <div className="shrink-0 flex flex-col items-end justify-center pr-2">
                <span className={"text-[12px] font-medium mb-2 " + (item.is_out_of_stock ? 'text-gray-400' : 'text-black')}>
                    {item.is_out_of_stock ? 'งดขายชั่วคราว' : 'มีจำหน่าย'}
                </span>
            </div>
        </Reorder.Item>
    )
}

const MenuReorderList = ({ 
    initialItems, 
    itemMap, 
    locale,
    onSave,
    onCancel,
    isSaving
}: { 
    initialItems: string[], 
    itemMap: Map<string, any>, 
    locale: string,
    onSave: (newOrder: string[]) => void,
    onCancel: () => void,
    isSaving: boolean
}) => {
    const [items, setItems] = useState(initialItems)

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-8 duration-300 relative z-40">
             <div className="sticky top-0 z-30 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:text-black flex items-center gap-1 font-medium transition-colors rounded-full hover:bg-gray-50">
                   <ChevronRight size={22} className="rotate-180" />
                </button>
                <h2 className="text-[17px] font-bold text-black">แก้ไขลำดับเมนู</h2>
                <div className="w-10"></div>
             </div>
             
             <div className="p-5 text-center">
                 <span className="text-[13px] font-medium text-gray-500">
                   กดค้างเพื่อลากสลับตำแหน่ง
                 </span>
             </div>
             
             <motion.div layoutScroll className="flex-1 overflow-y-auto px-4 sm:px-6 max-w-3xl mx-auto w-full pb-32 custom-scrollbar">
                 <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col">
                     {items.map(itemId => {
                         const item = itemMap.get(itemId)
                         if (!item) return null
                         return <ReorderMenuItem key={item.id} item={item} locale={locale} />
                     })}
                 </Reorder.Group>
             </motion.div>

             <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                 <div className="max-w-3xl mx-auto">
                     <button onClick={() => onSave(items)} disabled={isSaving} className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-[12px] font-bold text-[16px] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                         {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'บันทึก'}
                     </button>
                 </div>
             </div>
        </div>
    )
}

export default function POSMenuManager({ 
  profile, activeView, allowedNav, onSetView, onShiftModalOpen, activeShift, setViewExtraHeader, shopSettings, forceViewMode, hideStockToggle
}: POSMenuManagerProps) {
  const { locale } = useI18n();
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropAspect, setCropAspect] = useState<number>(1)
  const [mediaSize, setMediaSize] = useState<{width: number, height: number} | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)

  const userLevel = profile?.staff_level || 'staff'
  const userRole = profile?.role === 'admin' ? 'admin' : userLevel === 'manager' ? 'manager' : 'staff'
  const rolePerms = shopSettings?.role_permissions?.[userRole]
  const canEditMenu = profile?.role === 'admin' || !rolePerms || rolePerms.includes('menu-edit-price') || userRole === 'manager'

  const [allModifierGroups, setAllModifierGroups] = useState<any[]>([])
  const [itemModifierLinks, setItemModifierLinks] = useState<string[]>([])

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // --- Bulk Edit / Table View ---
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'stock'>(forceViewMode || 'grid')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['image_url', 'name', 'category_id', 'sale_price', 'cost_price', 'is_recommended'])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [dirtyCategoryKeys, setDirtyCategoryKeys] = useState<string[]>([])
  const [reorderDraft, setReorderDraft] = useState<Record<string, string[]>>({})
  const [stockDraft, setStockDraft] = useState<Record<string, boolean>>({})
  const reorderSnapshotRef = useRef<any[] | null>(null)
  const itemsRef = useRef<any[]>([])

  const columns = [
    { id: 'image_url', label: 'รูปภาพ' },
    { id: 'name', label: 'ชื่อเมนู' },
    { id: 'category_id', label: 'หมวดหมู่' },
    { id: 'sale_price', label: 'ราคาขาย' },
    { id: 'cost_price', label: 'ราคาต้นทุน' },
    { id: 'is_recommended', label: 'เมนูแนะนำ' },
    { id: 'is_popular', label: 'ยอดนิยม' },
    { id: 'is_online_available', label: 'สั่งผ่าน QR' },
    { id: 'is_delivery_available', label: 'Delivery' },
    { id: 'status', label: 'สถานะ' },
  ]

  const getItemOrderKey = (item: any) => item.category_id || 'uncategorized'

  const sortMenuItems = (list: any[]) => sortMenuItemsByOrder(list)

  useEffect(() => {
    if (forceViewMode) setViewMode(forceViewMode)
  }, [forceViewMode])

  const categorySections = useMemo(() => {
    const uncategorizedSection = { id: 'uncategorized', name: 'อื่นๆ (Uncategorized)' }
    return [...categories, uncategorizedSection]
  }, [categories])

  const itemMap = useMemo(() => {
    const nextMap = new Map<string, any>()
    items.forEach(item => nextMap.set(item.id, item))
    return nextMap
  }, [items])

  const buildReorderDraft = useCallback((sourceItems: any[]) => {
    const draft: Record<string, string[]> = {}
    categorySections.forEach(cat => {
      draft[cat.id] = sortMenuItems(
        sourceItems.filter(item =>
          cat.id === 'uncategorized'
            ? !item.category_id || !categories.find(c => c.id === item.category_id)
            : item.category_id === cat.id
        )
      ).map(item => item.id)
    })
    return draft
  }, [categories, categorySections])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (shopSettings) {
      fetchData()
    }
  }, [shopSettings?.branch_id])

  const handleCancelReorder = useCallback(() => {
    if (reorderSnapshotRef.current) {
      setItems(reorderSnapshotRef.current.map(item => ({ ...item })))
    }
    setReorderDraft({})
    setDirtyCategoryKeys([])
    setReorderMode(false)
  }, [])

  const handleStartReorder = useCallback(() => {
    const snapshot = itemsRef.current.map(item => ({ ...item }))
    reorderSnapshotRef.current = snapshot
    setReorderDraft(buildReorderDraft(snapshot))
    setViewMode('table')
    setDirtyCategoryKeys([])
    setReorderMode(true)
  }, [buildReorderDraft])

  const handleSaveReorder = useCallback(async () => {
    setIsSaving(true)
    try {
      const currentItems = itemsRef.current
      const nextItems = currentItems.map(item => ({ ...item }))
      const nextItemMap = new Map(nextItems.map(item => [item.id, item]))
      const updates = dirtyCategoryKeys.flatMap(categoryKey =>
        (reorderDraft[categoryKey] || []).map((itemId, index) => {
          const targetItem = nextItemMap.get(itemId)
          const nextPlatformPrices = withMenuSortOrder(targetItem?.platform_prices, index)
          if (targetItem) {
            targetItem.sort_order = index
            targetItem.platform_prices = nextPlatformPrices
          }
          return supabase.from('pos_menu_items').update({ platform_prices: nextPlatformPrices }).eq('id', itemId)
        })
      )

      await Promise.all(updates)
      setItems(sortMenuItems(nextItems))
      reorderSnapshotRef.current = null
      setReorderDraft({})
      setDirtyCategoryKeys([])
      setReorderMode(false)
    } finally {
      setIsSaving(false)
    }
  }, [dirtyCategoryKeys, reorderDraft])

  useEffect(() => {
    setViewExtraHeader(null);
    return () => setViewExtraHeader(null);
  }, [setViewExtraHeader]);
  const fetchData = async () => {
    setLoading(true)
    const branchId = shopSettings?.branch_id
    
    let catQuery = supabase.from('pos_menu_categories').select('*').order('order_index')
    let itemQuery = supabase.from('pos_menu_items').select('*, category:pos_menu_categories(name), modifiers:pos_item_modifier_links(group_id)').eq('is_active', true).order('name')
    let groupQuery = supabase.from('pos_menu_modifier_groups').select('*').order('name')

    if (branchId) {
      catQuery = catQuery.eq('branch_id', branchId)
      itemQuery = itemQuery.eq('branch_id', branchId)
      groupQuery = groupQuery.eq('branch_id', branchId)
    } else {
      catQuery = catQuery.is('branch_id', null)
      itemQuery = itemQuery.is('branch_id', null)
      groupQuery = groupQuery.is('branch_id', null)
    }

    const [catData, itemData, groupData] = await Promise.all([
      catQuery,
      itemQuery,
      groupQuery
    ])
    
    // Fetch inventory for dynamic cost calculation
    const { data: inventory } = await supabase.from('inventory_items').select('id, cost_price')
    
    if (catData.data) setCategories(catData.data)
    
    if (itemData.data) {
        if (inventory) {
            const invCostMap = new Map(inventory.map(i => [i.id, i.cost_price || 0]))
            const calculateRecipeCost = (recipe: any[]) => {
                return (recipe || []).reduce((sum, ing) => {
                    const cost = invCostMap.get(ing.ingredient_id) || 0
                    return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1))
                }, 0)
            }
            
            itemData.data.forEach(item => {
                const dynamicCost = calculateRecipeCost(item.recipe_data || [])
                if (dynamicCost > 0) {
                    item.cost_price = dynamicCost
                }
            })
        }
        setItems(sortMenuItems(itemData.data))
    }
    
    if (groupData.data) setAllModifierGroups(groupData.data)
    setLoading(false)
  }

  const fetchItemLinks = async (itemId: string) => {
    const { data } = await supabase.from('pos_item_modifier_links').select('group_id').eq('item_id', itemId)
    if (data) setItemModifierLinks(data.map(d => d.group_id))
    else setItemModifierLinks([])
  }

  const bustMenuCache = () => {
    const branchId = shopSettings?.branch_id || 'main';
    fetch(`/api/cache/menu?branchId=${branchId}&bust=true`).catch(() => {});
  }


  const handleSaveItem = async () => {
      setIsSaving(true)
      const { category, modifiers, ...cleanItem } = editingItem
      const { updated_at, ...finalItem } = cleanItem as any

      if (!finalItem.branch_id && shopSettings?.branch_id) {
          finalItem.branch_id = shopSettings.branch_id
      }

      if (!editingItem?.id) {
          const siblingCount = items.filter(item => getItemOrderKey(item) === getItemOrderKey(finalItem)).length
          finalItem.platform_prices = withMenuSortOrder(finalItem.platform_prices, siblingCount)
      }

      const { data: savedItem, error } = await supabase.from('pos_menu_items').upsert(finalItem).select().single()
      
      if (!error && savedItem) {
          // Sync Modifiers
          const itemId = savedItem.id;
          
          // Delete old links
          await supabase.from('pos_item_modifier_links').delete().eq('item_id', itemId);
          
          // Insert new links
          if (itemModifierLinks.length > 0) {
              const links = itemModifierLinks.map(groupId => ({ item_id: itemId, group_id: groupId }));
              await supabase.from('pos_item_modifier_links').insert(links);
          }

          setIsEditorOpen(false)
          fetchData()
          bustMenuCache()
      } else {
          console.error('Save failed:', error)
          alert('ไม่สามารถบันทึกข้อมูลได้: ' + (error?.message || 'Unknown error'))
      }
      setIsSaving(false)
  }

  
  const handleSaveStockDraft = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(stockDraft).map(([id, inStock]) => ({
        id,
        in_stock: inStock
      }));
      
      for (const update of updates) {
        await supabase.from('pos_menu_items').update({ in_stock: update.in_stock }).eq('id', update.id);
      }
      
      setItems(items.map(item => {
        if (stockDraft[item.id] !== undefined) {
          return { ...item, in_stock: stockDraft[item.id] };
        }
        return item;
      }));
      setStockDraft({});
      bustMenuCache();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  const handleStockDraftToggle = (id: string, currentStatus: boolean) => {
    setStockDraft(prev => {
      const next = { ...prev };
      // If toggled back to original state, remove from draft
      const originalItem = items.find(i => i.id === id);
      const originalStatus = originalItem?.in_stock !== false;
      const newStatus = !currentStatus;
      
      if (newStatus === originalStatus) {
        delete next[id];
      } else {
        next[id] = newStatus;
      }
      return next;
    });
  }

const handleBulkUpdate = async (id: string, field: string, value: any) => {
    const { error } = await supabase.from('pos_menu_items').update({ [field]: value }).eq('id', id)
    if (!error) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
        bustMenuCache()
    } else {
        fetchData()
    }
   }

  const handleModifierGroupToggle = async (itemId: string, groupId: string) => {
    const currentItem = items.find(item => item.id === itemId)
    const currentGroupIds = (currentItem?.modifiers || []).map((modifier: any) => modifier.group_id)
    const nextGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter((id: string) => id !== groupId)
      : [...currentGroupIds, groupId]

    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, modifiers: nextGroupIds.map(id => ({ group_id: id })) }
        : item
    ))

    await supabase.from('pos_item_modifier_links').delete().eq('item_id', itemId)
    if (nextGroupIds.length > 0) {
      await supabase.from('pos_item_modifier_links').insert(
        nextGroupIds.map(id => ({ item_id: itemId, group_id: id }))
      )
    }
    bustMenuCache()
  }

  const handleInlineImageUpload = async (itemId: string, file?: File) => {
    if (!file) return

    setIsSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `pos-menus/${fileName}`

      const { data: { session } } = await supabase.auth.getSession()
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'marketplace-images')
      formData.append('path', filePath)

      const uploadRes = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: formData
      })

      const uploadResult = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadResult.error || 'Failed to upload file')

      await handleBulkUpdate(itemId, 'image_url', uploadResult.publicUrl)
    } catch (error: any) {
      alert('Error uploading image: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      const objectUrl = URL.createObjectURL(file)
      setCropImageSrc(objectUrl)
      setIsCropping(true)
      setCropAspect(1) // Default back to square
      e.target.value = ''
  }


  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return

    setIsSaving(true)
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
      if (!croppedBlob) throw new Error('Failed to crop image')

      let uuid = Math.random().toString(36).substring(2, 15)
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

      let shouldUploadOriginal = true;
      let originalBlobToUpload: Blob | null = null;

      if (cropImageSrc.startsWith('http')) {
         const match = cropImageSrc.match(/\/pos-menus\/([a-zA-Z0-9]+)_(original|cropped)\./)
         if (match) {
            shouldUploadOriginal = false;
            uuid = match[1];
         } else {
            try {
               const originalRes = await fetch(cropImageSrc)
               originalBlobToUpload = await originalRes.blob()
            } catch (e) {
               console.warn("Could not fetch original image", e)
               shouldUploadOriginal = false;
            }
         }
      } else {
         const originalRes = await fetch(cropImageSrc)
         originalBlobToUpload = await originalRes.blob()
      }

      if (shouldUploadOriginal && originalBlobToUpload) {
         let originalExt = 'jpeg'
         if (originalBlobToUpload.type) {
            originalExt = originalBlobToUpload.type.split('/')[1] || 'jpeg'
         } else if (cropImageSrc.includes('.')) {
            originalExt = cropImageSrc.split('.').pop()?.split('?')[0] || 'jpeg'
         }

         const formDataOriginal = new FormData()
         formDataOriginal.append('file', originalBlobToUpload)
         formDataOriginal.append('bucket', 'marketplace-images')
         formDataOriginal.append('path', `pos-menus/${uuid}_original.${originalExt}`)

         await fetch('/api/admin/storage/upload', {
           method: 'POST',
           headers: authHeaders,
           body: formDataOriginal
         })
      }

      // Upload cropped file
      const file = new File([croppedBlob], `${uuid}_cropped.jpeg`, { type: 'image/jpeg' })
      const formDataCropped = new FormData()
      formDataCropped.append('file', file)
      formDataCropped.append('bucket', 'marketplace-images')
      formDataCropped.append('path', `pos-menus/${uuid}_cropped.jpeg`)

      const uploadRes = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formDataCropped
      })

      const uploadResult = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadResult.error || 'Failed to upload file')

      setEditingItem({ ...editingItem, image_url: uploadResult.publicUrl })
      setIsCropping(false)
      setCropImageSrc(null)
    } catch (error: any) {
      alert('Error cropping/uploading image: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
      if (!confirm('ยืนยันการลบรายการนี้?')) return
      await supabase.from('pos_menu_items').delete().eq('id', id)
      setItems(items.filter(item => item.id !== id))
      bustMenuCache()
      fetchData()
  }

  const filteredItems = useMemo(() => sortMenuItems(items.filter(item => {
      const matchesSearch = getMenuSearchText(item).includes(searchTerm.toLowerCase())
      const matchesCategory = !activeCategory || item.category_id === activeCategory
      return matchesSearch && matchesCategory
  })), [items, searchTerm, activeCategory])

  const handleGroupedItemsReorder = (categoryKey: string, reorderedIds: string[]) => {
      setReorderDraft(prev => ({ ...prev, [categoryKey]: reorderedIds }))
      setDirtyCategoryKeys(prev => (prev.includes(categoryKey) ? prev : [...prev, categoryKey]))
  }



  const [mainTab, setMainTab] = useState('items')
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [reorderCategory, setReorderCategory] = useState(null)

  useEffect(() => {
    if (mainTab === 'items' && categorySections.length > 0 && !expandedCategory) {
       setExpandedCategory(categorySections[0].id)
    }
  }, [categorySections, mainTab])

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-white relative font-noto">
        {!reorderCategory ? (
          <>
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-2 sm:px-4 flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setMainTab('categories')}
                    className={"pb-3 pt-4 text-[14px] sm:text-[15px] font-semibold whitespace-nowrap transition-colors border-b-[3px] px-2 " + (mainTab === 'categories' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600')}
                >
                    กลุ่มและหมวดหมู่
                </button>
                <button 
                    onClick={() => setMainTab('items')}
                    className={"pb-3 pt-4 text-[14px] sm:text-[15px] font-semibold whitespace-nowrap transition-colors border-b-[3px] px-2 " + (mainTab === 'items' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600')}
                >
                    เมนูอาหาร
                </button>
                <button 
                    onClick={() => setMainTab('options')}
                    className={"pb-3 pt-4 text-[14px] sm:text-[15px] font-semibold whitespace-nowrap transition-colors border-b-[3px] px-2 " + (mainTab === 'options' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600')}
                >
                    กลุ่มตัวเลือก
                </button>
            </div>

            <motion.div layoutScroll className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <div className="max-w-4xl mx-auto w-full pb-24">
                  {mainTab === 'categories' && (
                      <div className="animate-in fade-in duration-300">
                          <POSCategoryManager shopSettings={shopSettings} onCategoriesChange={() => { fetchData(); bustMenuCache(); }} />
                      </div>
                  )}

                  {mainTab === 'items' && (
                      <div className="animate-in fade-in duration-300">
                          {categorySections.map(cat => {
                              const catItems = items.filter(i => cat.id === 'uncategorized' ? (!i.category_id || !categories.find(c => c.id === i.category_id)) : i.category_id === cat.id)
                              if (catItems.length === 0 && cat.id === 'uncategorized') return null
                              const isExpanded = expandedCategory === cat.id

                              return (
                                  <div key={cat.id} className="border-b border-gray-100">
                                      <button 
                                          onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                                          className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
                                      >
                                          <div className="flex items-center gap-2">
                                              <span className="text-[15px] font-bold text-gray-800 uppercase tracking-wide">{cat.name}</span>
                                              <span className="text-[14px] text-gray-400 font-medium">({catItems.length})</span>
                                          </div>
                                          <ChevronRight size={20} className={"text-gray-400 transition-transform duration-300 " + (isExpanded ? 'rotate-90' : '')} />
                                      </button>
                                      
                                      {isExpanded && (
                                          <div className="bg-white border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                                              <div className="px-4 py-3 bg-gray-50/50 flex justify-between items-center">
                                                  <button 
                                                      onClick={() => {
                                                          handleStartReorder()
                                                          setReorderCategory(cat.id)
                                                      }} 
                                                      className="text-black hover:text-gray-600 flex items-center gap-2 text-[14px] font-medium transition-colors"
                                                  >
                                                      <List size={16} /> จัดเรียงเมนู
                                                  </button>
                                                  <button 
                                                      onClick={() => {
                                                          setEditingItem({ category_id: cat.id === 'uncategorized' ? null : cat.id, is_active: true, is_online_available: true, is_delivery_available: true, platform_prices: {} })
                                                          setIsEditorOpen(true)
                                                      }}
                                                      className="text-black hover:text-gray-600 flex items-center gap-1.5 text-[14px] font-medium transition-colors"
                                                  >
                                                      <Plus size={16} /> เพิ่ม
                                                  </button>
                                              </div>
                                              
                                              <div className="divide-y divide-gray-100">
                                                  {catItems.map(item => (
                                                      <div key={item.id} className="p-4 flex gap-4 bg-white hover:bg-gray-50 transition-colors">
                                                          <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative cursor-pointer" onClick={() => {
                                                              setEditingItem(item)
                                                              setIsEditorOpen(true)
                                                          }}>
                                                              {item.image_url ? (
                                                                  <img loading="lazy" crossOrigin="anonymous" src={item.image_url} alt={getPrimaryMenuName(item, locale) || ''} className="w-full h-full object-cover" />
                                                              ) : (
                                                                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-400" size={24} /></div>
                                                              )}
                                                              {item.is_recommended && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white"></div>}
                                                          </div>
                                                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                              <div className="flex items-start justify-between gap-4">
                                                                  <div className="cursor-pointer flex-1" onClick={() => {
                                                                      setEditingItem(item)
                                                                      setIsEditorOpen(true)
                                                                  }}>
                                                                      <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{getPrimaryMenuName(item, locale)}</h4>
                                                                      <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-500 mb-1">
                                                                          <div className="flex items-center gap-1"><span className="text-black"><Store size={14}/></span> ฿{item.sale_price}</div>
                                                                          {item.platform_prices && Object.entries(item.platform_prices).filter(([_,v]) => v).map(([platform, price]) => (
                                                                              <div key={platform} className="flex items-center gap-1">
                                                                                  <span style={{ color: getPlatformColor(platform) }}><ShoppingBag size={14}/></span> ฿{price}
                                                                              </div>
                                                                          ))}
                                                                          {item.platform_prices && Object.keys(item.platform_prices).length > 0 && (
                                                                              <span className="text-[11px] text-gray-400">(+ อื่นๆ {Object.keys(item.platform_prices).length} ช่องทาง)</span>
                                                                          )}
                                                                      </div>
                                                                      {getSecondaryMenuName(item, locale) && (
                                                                          <p className="text-[12px] text-gray-400 truncate">{getSecondaryMenuName(item, locale)}</p>
                                                                      )}
                                                                  </div>
                                                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                                      <span className={"text-[11px] font-medium " + (item.in_stock === false ? 'text-gray-400' : 'text-black')}>
                                                                          {item.in_stock === false ? 'งดขายชั่วคราว' : 'มีจำหน่าย'}
                                                                      </span>
                                                                      <button 
                                                                          onClick={async (e) => {
                                                                              e.stopPropagation();
                                                                              const newVal = item.in_stock === false ? true : false;
                                                                              setItems(items.map(i => i.id === item.id ? { ...i, in_stock: newVal } : i));
                                                                              await supabase.from('pos_menu_items').update({ in_stock: newVal }).eq('id', item.id);
                                                                              bustMenuCache();
                                                                          }}
                                                                          className={"relative w-12 h-6 rounded-full transition-colors duration-300 " + (item.in_stock !== false ? 'bg-emerald-500' : 'bg-gray-300')}
                                                                      >
                                                                          <div className={"absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm " + (item.in_stock !== false ? 'translate-x-6' : 'translate-x-0')}></div>
                                                                      </button>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )
                          })}
                          
                          <div className="p-4 mt-4">
                              <button onClick={() => {
                                  setEditingItem({ is_active: true, is_online_available: true, is_delivery_available: true, platform_prices: {} })
                                  setIsEditorOpen(true)
                              }} className="w-full bg-black hover:bg-gray-800 text-white py-3.5 rounded-[12px] font-semibold transition-colors flex items-center justify-center gap-2 text-[14px]">
                                  เพิ่มเมนู
                              </button>
                          </div>
                      </div>
                  )}

                  {mainTab === 'options' && (
                      <div className="animate-in fade-in duration-300">
                          <POSModifierManager
                              profile={profile}
                              activeView={activeView}
                              allowedNav={allowedNav}
                              onSetView={onSetView}
                              setViewExtraHeader={() => {}}
                              shopSettings={shopSettings}
                          />
                      </div>
                  )}
                </div>
            </motion.div>
          </>
        ) : (
          <MenuReorderList 
              initialItems={reorderDraft[reorderCategory] || []}
              itemMap={itemMap}
              locale={locale}
              isSaving={isSaving}
              onCancel={() => {
                  setReorderCategory(null)
              }}
              onSave={(newOrder) => {
                  handleSaveSpecificCategory(reorderCategory, newOrder)
              }}
          />
        )}
      </div>

      {/* Editor Modal Here */}
            {isEditorOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-end font-bold">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300 font-bold" onClick={() => setIsEditorOpen(false)}></div>
              <div className="relative w-full sm:max-w-xl bg-[#F5F4F0] h-full shadow-2xl flex flex-col py-10 sm:py-20 px-6 sm:px-16 animate-in slide-in-from-right duration-500 font-bold overflow-y-auto no-scrollbar">
                  <header className="mb-10 sm:mb-16 flex justify-between items-start font-bold">
                      <div className="font-bold">
                          <h2 className="font-serif-luxury text-4xl sm:text-5xl font-light tracking-tighter text-[#1A1A18] border-none font-bold">MENU ASSET</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8C8A81] mt-4 font-bold font-bold font-bold">PROPERTIES • {editingItem.id ? 'EDIT' : 'NEW entry'}</p>
                      </div>
                      <button onClick={() => setIsEditorOpen(false)} className="w-12 h-12 bg-white flex items-center justify-center font-bold font-bold"><X size={24} /></button>
                  </header>

                  <div className="space-y-8 font-bold border-none font-bold">
                      <div className="space-y-3 font-bold border-none font-bold font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold">{locale === 'en' ? 'ASSET NAME / ชื่อเมนู' : locale === 'zh' ? 'ASSET NAME / ชื่อเมนู' : 'ASSET NAME / ชื่อเมนู'}</label>
                          <input 
                              type="text"
                              value={editingItem.name}
                              onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                              className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#D3202B] font-bold text-black font-bold font-bold font-bold font-bold font-bold"
                          />
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50">English Name</label>
                              <input
                                  type="text"
                                  value={editingItem.name_en || ''}
                                  onChange={e => setEditingItem({ ...editingItem, name_en: e.target.value })}
                                  placeholder="Iced Latte"
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#D3202B] font-bold text-black"
                              />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50">Chinese Name</label>
                              <input
                                  type="text"
                                  value={editingItem.name_zh || ''}
                                  onChange={e => setEditingItem({ ...editingItem, name_zh: e.target.value })}
                                  placeholder="冰拿铁"
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#D3202B] font-bold text-black"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 font-bold border-none font-bold font-bold font-bold">
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold font-bold font-bold">SALE PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.sale_price}
                                  onChange={e => setEditingItem({...editingItem, sale_price: Number(e.target.value)})}
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none font-bold text-black font-bold font-bold font-bold border-none font-bold"
                              />
                          </div>
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">COST PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.cost_price}
                                  onChange={e => setEditingItem({...editingItem, cost_price: Number(e.target.value)})}
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none font-bold text-black font-bold font-bold border-none font-bold"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 font-bold border-none font-bold font-bold font-bold mt-6">
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('grab')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold font-bold font-bold">GRAB PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.grab || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), grab: Number(e.target.value) || null}})}
                                  className="w-full bg-[#00B14F]/10 border border-[#00B14F]/30 py-5 px-6 text-sm outline-none font-bold text-[#00B14F] placeholder:text-[#00B14F]/50 focus:border-[#00B14F]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('lineman')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">LINEMAN PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.lineman || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), lineman: Number(e.target.value) || null}})}
                                  className="w-full bg-[#00B900]/10 border border-[#00B900]/30 py-5 px-6 text-sm outline-none font-bold text-[#00B900] placeholder:text-[#00B900]/50 focus:border-[#00B900]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('shopee')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">SHOPEE PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.shopee || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), shopee: Number(e.target.value) || null}})}
                                  className="w-full bg-[#EE4D2D]/10 border border-[#EE4D2D]/30 py-5 px-6 text-sm outline-none font-bold text-[#EE4D2D] placeholder:text-[#EE4D2D]/50 focus:border-[#EE4D2D]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('foodpanda')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">FOODPANDA PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.foodpanda || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), foodpanda: Number(e.target.value) || null}})}
                                  className="w-full bg-[#D70F64]/10 border border-[#D70F64]/30 py-5 px-6 text-sm outline-none font-bold text-[#D70F64] placeholder:text-[#D70F64]/50 focus:border-[#D70F64]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('robinhood')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">ROBINHOOD PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.robinhood || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), robinhood: Number(e.target.value) || null}})}
                                  className="w-full bg-[#6023A2]/10 border border-[#6023A2]/30 py-5 px-6 text-sm outline-none font-bold text-[#6023A2] placeholder:text-[#6023A2]/50 focus:border-[#6023A2]"
                                  placeholder="Auto"
                              />
                          </div>)}
                      </div>

                      <div className="space-y-3 font-bold border-none font-bold font-bold font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">{locale === 'en' ? 'CATEGORY / หมวดหมู่' : locale === 'zh' ? 'CATEGORY / หมวดหมู่' : 'CATEGORY / หมวดหมู่'}</label>
                          <select 
                              value={editingItem.category_id || ''}
                              onChange={e => setEditingItem({...editingItem, category_id: e.target.value})}
                              className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none font-black text-black font-bold font-bold border-none font-bold font-bold"
                          >
                              <option value="">SELECT CATEGORY...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>

                      <div className="space-y-3 font-bold border-none font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold">{locale === 'en' ? 'DESCRIPTION / คำอธิบาย' : locale === 'zh' ? 'DESCRIPTION / คำอธิบาย' : 'DESCRIPTION / คำอธิบาย'}</label>
                          <textarea 
                              value={editingItem.description || ''}
                              onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                              placeholder="Describe this asset (Flavor notes, ingredients, etc.)"
                              className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#D3202B] font-bold text-black min-h-[120px] resize-none"
                          />
                      </div>

                      <div className="space-y-4 font-bold border-none font-bold pb-10">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold">{locale === 'en' ? 'MODIFIERS / ตัวเลือกเสริม' : locale === 'zh' ? 'MODIFIERS / ตัวเลือกเสริม' : 'MODIFIERS / ตัวเลือกเสริม'}</label>
                          <div className="grid grid-cols-2 gap-3">
                              {allModifierGroups.map(group => {
                                  const isActive = itemModifierLinks.includes(group.id);
                                  return (
                                      <button 
                                          key={group.id}
                                          type="button"
                                          onClick={() => setItemModifierLinks(prev => isActive ? prev.filter(id => id !== group.id) : [...prev, group.id])}
                                          className={`p-4 border text-left transition-all flex justify-between items-center group/mod ${isActive ? 'bg-[#D3202B] border-[#D3202B] text-white shadow-lg' : 'bg-white border-[#E5E5DF] text-[#1A1A18] hover:border-[#D3202B]'}`}
                                      >
                                          <div className="flex flex-col">
                                              <span className="text-[11px] font-black uppercase leading-tight">{group.name}</span>
                                              <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-emerald-400' : 'text-gray-300'}`}>
                                                  {isActive ? 'Active' : 'Not Linked'}
                                              </span>
                                          </div>
                                          <div className={`w-6 h-6 flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500 scale-110' : 'bg-gray-50 border border-gray-100 opacity-20'}`}>
                                              {isActive && <Check size={12} className="text-white" />}
                                          </div>
                                      </button>
                                  );
                              })}
                          </div>
                          {allModifierGroups.length === 0 && (
                              <div className="p-6 bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-gray-400 text-center tracking-widest">
                                  No modifier groups defined.
                              </div>
                          )}
                      </div>

                      <div className="space-y-3 font-bold border-none font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold">{locale === 'en' ? 'IMAGE / รูปภาพ' : locale === 'zh' ? 'IMAGE / รูปภาพ' : 'IMAGE / รูปภาพ'}</label>
                          <div className="flex flex-col gap-4">
                              <div className="aspect-square bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                  {editingItem.image_url ? (
                                      <>
                                          <img loading="lazy" crossOrigin="anonymous"  src={editingItem.image_url || ''} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                          <div className="absolute top-4 right-4 flex gap-2">
                                              <button 
                                                  onClick={() => {
                                                    let src = editingItem.image_url
                                                    if (src && src.includes('_cropped.')) {
                                                        src = src.replace('_cropped.', '_original.')
                                                    }
                                                    setCropImageSrc(src)
                                                    setIsCropping(true)
                                                    setCropAspect(1)
                                                  }}
                                                  className="p-2 bg-black/80 backdrop-blur-md shadow-xl text-white hover:bg-black transition-all"
                                              >
                                                  <Crop size={16} />
                                              </button>
                                              <button 
                                                  onClick={() => setEditingItem({...editingItem, image_url: null})}
                                                  className="p-2 bg-white/80 backdrop-blur-md shadow-xl text-red-500 hover:bg-white transition-all"
                                              >
                                                  <Trash size={16} />
                                              </button>
                                          </div>
                                      </>
                                  ) : (
                                      <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-100 transition-all">
                                          <ImageIcon size={48} />
                                          <span className="text-[8px] font-black uppercase tracking-widest">No Image Asset</span>
                                      </div>
                                  )}
                              </div>
                              <label className="cursor-pointer w-full h-16 border border-[#D3202B] flex items-center justify-center gap-4 hover:bg-gray-50 transition-all font-bold">
                                  <ImageIcon size={16} />
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                      {editingItem.image_url ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
                                  </span>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isSaving} />
                              </label>
                          </div>
                      </div>

                      <div className="p-6 bg-amber-50 border border-amber-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-amber-100 text-amber-600 rounded-[16px]">
                                  <Star size={20} fill="currentColor" />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900">Recommended Item</h4>
                                  <p className="text-[8px] font-bold text-amber-600/60 uppercase mt-0.5 tracking-widest">Show in Signature section on LIFF</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_recommended: !editingItem?.is_recommended})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_recommended ? 'bg-amber-400' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_recommended ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      <div className="p-6 bg-rose-50 border border-rose-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-rose-100 text-rose-600 rounded-[16px]">
                                  <Star size={20} fill="currentColor" />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-900">Popular Item</h4>
                                  <p className="text-[8px] font-bold text-rose-600/60 uppercase mt-0.5 tracking-widest">Highlight as popular menu</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_popular: !editingItem?.is_popular})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_popular ? 'bg-rose-500' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_popular ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      <div className="p-6 bg-emerald-50 border border-emerald-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-[16px]">
                                  <Check size={20} />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Available Online (QR Menu)</h4>
                                  <p className="text-[8px] font-bold text-emerald-600/60 uppercase mt-0.5 tracking-widest">Allow customers to order via QR Code</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_online_available: editingItem.is_online_available === undefined ? false : !editingItem.is_online_available})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_online_available !== false ? 'bg-emerald-500' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_online_available !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      <div className="p-6 bg-blue-50 border border-blue-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 text-blue-600 rounded-[16px]">
                                  <Check size={20} />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-900">Available for Delivery</h4>
                                  <p className="text-[8px] font-bold text-blue-600/60 uppercase mt-0.5 tracking-widest">Allow customers to order for delivery</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_delivery_available: editingItem.is_delivery_available === undefined ? false : !editingItem.is_delivery_available})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_delivery_available !== false ? 'bg-blue-500' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_delivery_available !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>
                  </div>

                  <button onClick={handleSaveItem} disabled={isSaving} className="w-full mt-auto py-8 bg-[#D3202B] text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-6 font-bold">
                     {isSaving ? <Loader2 className="animate-spin text-white font-bold font-bold font-bold" /> : (editingItem.id ? 'บันทึกการแก้ไข' : 'เพิ่มรายการเมนู')}
                  </button>
              </div>
          </div>
      )}


      <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
          .font-noto { font-family: 'Noto Sans Thai', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
    </>
  )
}
