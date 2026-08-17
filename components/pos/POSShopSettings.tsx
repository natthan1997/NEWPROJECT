'use client';
import React, { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PrinterSocket } from 'custom-printer-plugin'
import { printCustomerReceipt, printKitchenTicket } from '@/lib/printerUtils'
import { printGraphicModeCustomerReceipt, printGraphicModeKitchenTicket } from '@/lib/graphicPrinter'
import { Plus, Loader2, Save, X, Settings, Clock, Bell, Info, Image as ImageIcon, Star, Gift, ChevronDown, ChevronUp, Upload, Trash2, Menu as MenuIcon, ChevronRight, ArrowLeft, ShieldCheck, QrCode, MapPin, Printer, Truck, Flag, RefreshCw, Store, Navigation, Percent, Camera, Users, Edit2, Check, Sparkles, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import POSCampaignsTab from './POSCampaignsTab'
import AddressMapInput from '@/components/AddressMapInput'
import { useI18n } from "@/lib/I18nContext";
import Cropper from 'react-easy-crop'

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file)
      } else {
        reject(new Error('Canvas is empty'))
      }
    }, 'image/jpeg')
  })
}


const permissionGroups = [
  {
    groupLabel: 'ระบบหน้าร้าน (POS Operations)',
    options: [
      { id: 'pos:access', label: 'เข้าใช้งานหน้าขาย (POS ACCESS)', desc: 'อนุญาตให้เข้าใช้งานหน้าเครื่องคิดเงิน' },
      { id: 'pos:checkout', label: 'คิดเงินลูกค้า (CHECKOUT)', desc: 'อนุญาตให้ทำรายการชำระเงิน' },
      { id: 'pos:void', label: 'ยกเลิกออเดอร์ (VOID)', desc: 'อนุญาตให้ยกเลิกหรือคืนเงินออเดอร์' },
      { id: 'pos:discount', label: 'ให้ส่วนลด (DISCOUNT)', desc: 'อนุญาตให้ใส่ส่วนลดในออเดอร์' },
      { id: 'pos:drawer', label: 'จัดการลิ้นชักเงิน (DRAWER)', desc: 'อนุญาตให้เปิดปิดลิ้นชักและดูประวัติ' },
    ]
  },
  {
    groupLabel: 'รายงาน (Reports)',
    options: [
      { id: 'reports:view', label: 'เข้าใช้งานรายงาน (REPORTS VIEW)', desc: 'อนุญาตให้เข้าดูหน้ารายงาน' },
      { id: 'reports:sales', label: 'ดูยอดขายรวม (SALES REPORT)', desc: 'ดูยอดขายหน้าร้าน (Gross Sales)' },
      { id: 'reports:profit', label: 'ดูกำไรและต้นทุน (PROFIT REPORT)', desc: 'ดูข้อมูลกำไรสุทธิและต้นทุน (Net Profit & COGS)' },
      { id: 'reports:export', label: 'ส่งออกรายงาน (EXPORT)', desc: 'อนุญาตให้ดาวน์โหลดไฟล์รายงาน' },
    ]
  },
  {
    groupLabel: 'จัดการสต็อกและหลังบ้าน (Inventory & Kitchen)',
    options: [
      { id: 'inventory:view', label: 'ดูสต็อก (INVENTORY VIEW)', desc: 'ดูข้อมูลวัตถุดิบและสต็อก' },
      { id: 'inventory:edit', label: 'แก้ไขสต็อก (INVENTORY EDIT)', desc: 'แก้ไขสต็อกสินค้าและเพิ่มวัตถุดิบใหม่' },
      { id: 'inventory:audit', label: 'นับสต็อก (INVENTORY AUDIT)', desc: 'บันทึกรายการนับสต็อกรายวัน' },
      { id: 'kitchen:view', label: 'หน้าจอครัว (KITCHEN)', desc: 'เข้าใช้งานระบบแสดงออเดอร์ในครัว (KDS)' },
    ]
  },
  {
    groupLabel: 'จัดการเมนู (Menus)',
    options: [
      { id: 'menu-management', label: 'จัดการเมนูหลัก (MENU MANAGEMENT)', desc: 'เข้าสู่หน้าจัดการเมนู หมวดหมู่ และการเรียงลำดับ' },
      { id: 'menu-stock-toggle', label: 'อัปเดตสต็อกสินค้าด่วน (STOCK TOGGLE)', desc: 'กดสลับสถานะสินค้าหมด / พร้อมขายหน้าร้าน' },
      { id: 'menu-edit-price', label: 'แก้ไขราคา & เมนู (EDIT MENU & PRICES)', desc: 'เพิ่ม/แก้ไข/ลบ รายการเมนู และปรับเปลี่ยนราคาขาย' },
      { id: 'modifiers', label: 'จัดการตัวเลือก (MODIFIERS)', desc: 'เพิ่ม/แก้ไขตัวเลือกเสริม (Modifiers) ของเมนูอาหาร' },
      { id: 'recipes', label: 'จัดการสูตรอาหาร (RECIPES)', desc: 'ผูกสูตรอาหารเข้ากับสต็อกวัตถุดิบอัตโนมัติ' },
    ]
  },
  {
    groupLabel: 'พนักงานและการตั้งค่า (Settings & Staff)',
    options: [
      { id: 'staff:view', label: 'ดูพนักงาน (STAFF VIEW)', desc: 'ดูรายชื่อพนักงาน' },
      { id: 'staff:manage', label: 'จัดการพนักงาน (STAFF MANAGE)', desc: 'จัดการข้อมูลและสิทธิ์พนักงาน' },
      { id: 'staff:shift-summary', label: 'ดูรายงานปิดกะล่าสุด (SHIFT SUMMARY)', desc: 'อนุญาตให้ดูรายงานสรุปยอดและรูปถ่ายของกะล่าสุดผ่านหน้าพนักงาน' },
      { id: 'settings:view', label: 'ดูการตั้งค่าร้าน (SETTINGS VIEW)', desc: 'เข้าดูหน้าตั้งค่าร้าน' },
      { id: 'settings:manage', label: 'แก้ไขการตั้งค่าร้าน (SETTINGS MANAGE)', desc: 'แก้ไขข้อมูลร้านค้าและโปรโมชั่น' },
      { id: 'management', label: 'จัดการระบบ (MANAGEMENT)', desc: 'การจัดการข้อมูลเชิงลึกและระบบหลังบ้านของสาขา' },
    ]
  },
  {
    groupLabel: 'แจ้งเตือนผ่านไลน์ (LINE Notifications)',
    options: [
      { id: 'line-notify-inventory', label: '[LINE] แจ้งเตือนสต๊อก (STOCK ALERT)', desc: 'รับการแจ้งเตือนเมื่อสต๊อกวัตถุดิบใกล้หมด' },
      { id: 'line-notify-inventory-audit', label: '[LINE] นับสต๊อก (AUDIT ALERT)', desc: 'รับแจ้งเตือนเมื่อมีการนับสต๊อกวัตถุดิบและสรุปผล' },
      { id: 'line-notify-zreport', label: '[LINE] ปิดกะ Z-Report (Z-REPORT)', desc: 'รับยอดสรุปการขายเมื่อพนักงานทำการปิดกะ' },
      { id: 'line-notify-checkout-photos', label: '[LINE] ลงเวลาออกงาน (CHECKOUT PHOTOS)', desc: 'รับรูปถ่ายสภาพร้านเมื่อพนักงานลงเวลาเลิกงาน' },
    ]
  },
  {
    groupLabel: 'เข้าถึงเมนูหลัก (Main Menus)',
    options: [
      { id: 'terminal', label: 'หน้าขาย POS (TERMINAL)', desc: 'เข้าใช้งานหน้าขายแบบรวมศูนย์' },
      { id: 'delivery', label: 'ศูนย์ส่งสินค้า (DELIVERY)', desc: 'จัดการออเดอร์เดลิเวอรี่และไรเดอร์' },
      { id: 'history', label: 'ประวัติการขาย (HISTORY)', desc: 'ดูบิลขายย้อนหลังและจัดการบิลที่ปิดแล้ว' },
      { id: 'tables', label: 'จัดการโต๊ะ (TABLES)', desc: 'ระบบจัดการและแสดงสถานะโต๊ะอาหารภายในร้าน' },
      { id: 'members', label: 'จัดการสมาชิก (MEMBERS)', desc: 'จัดการข้อมูลและแต้มสะสมของสมาชิก' },
      { id: 'reports', label: 'รายงาน (REPORTS)', desc: 'ดูรายงานยอดขาย' },
      { id: 'inventory', label: 'คลังสินค้า (INVENTORY)', desc: 'ระบบจัดการคลังวัตถุดิบ' },
      { id: 'kitchen', label: 'จอสั่งอาหาร (KITCHEN)', desc: 'เข้าใช้ระบบจอครัว' },
      { id: 'settings', label: 'ตั้งค่าร้าน (SETTINGS)', desc: 'จัดการวันเวลาเปิดปิดร้าน แบนเนอร์' },
      { id: 'staff', label: 'จัดการพนักงาน (STAFF)', desc: 'ระบบจัดการสิทธิ์และรายชื่อพนักงาน' },
    ]
  }
];


const DAYS = [
  { id: 'monday', label: 'วันจันทร์' },
  { id: 'tuesday', label: 'วันอังคาร' },
  { id: 'wednesday', label: 'วันพุธ' },
  { id: 'thursday', label: 'วันพฤหัสบดี' },
  { id: 'friday', label: 'วันศุกร์' },
  { id: 'saturday', label: 'วันเสาร์' },
  { id: 'sunday', label: 'วันอาทิตย์' }
];

interface POSShopSettingsProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onShiftModalOpen?: () => void
  activeShift?: any
  setViewExtraHeader: (node: React.ReactNode) => void
}

export default function POSShopSettings({ 
  profile, activeView, allowedNav, onSetView, onShiftModalOpen, activeShift, setViewExtraHeader
}: POSShopSettingsProps) {
    const { locale } = useI18n();
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>('general')
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [previewStoryIndex, setPreviewStoryIndex] = useState<number>(0)
  const [previewTab, setPreviewTab] = useState<'receipt' | 'kitchen'>('receipt')
  
  const [banners, setBanners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [inventoryCategories, setInventoryCategories] = useState<any[]>([])
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [editingRoleName, setEditingRoleName] = useState('')
  const [isUploadingPoster, setIsUploadingPoster] = useState(false)

  const handlePosterUpload = async (file: File) => {
    if (!file) return
    setIsUploadingPoster(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'pos-settings')
      formData.append('path', `liff-splash-${Date.now()}.${file.name.split('.').pop() || 'png'}`)

      const res = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()

      if (result.publicUrl) {
        setSettings((prev: any) => ({ ...prev, liff_splash_poster_url: result.publicUrl }))
        setIsUploadingPoster(false)
        return
      }
    } catch (e) {
      console.warn('R2 upload failed, falling back to canvas compression:', e)
    }

    try {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let w = img.width
          let h = img.height
          const maxDim = 1200
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w)
              w = maxDim
            } else {
              w = Math.round((w * maxDim) / h)
              h = maxDim;
            }
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82)
            setSettings((prev: any) => ({ ...prev, liff_splash_poster_url: compressedDataUrl }))
          }
          setIsUploadingPoster(false)
        }
        img.src = String(reader.result || '')
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert('อัปโหลดรูปไม่สำเร็จ: ' + err.message)
      setIsUploadingPoster(false)
    }
  }

  const [settings, setSettings] = useState<any>({
    id: null,
    branch_id: null,
    status: 'open',
    status_expiry: null,
    is_open: true,
    status_message: 'ขออภัย ขณะนี้ร้านปิดให้บริการชั่วคราว',
    opening_hours: { allow_qr_payment: true },
    loyalty_points_per_thb: 10,
    loyalty_earn_rate: 100,
    latitude: 13.7563,
    longitude: 100.5018,
    check_in_radius: 50,
    coupon_radius_meters: 500,
    address: '',
    role_permissions: {
      manager: ['terminal', 'pos:access', 'pos:checkout', 'pos:void', 'pos:discount', 'pos:drawer', 'reports', 'reports:view', 'reports:sales', 'reports:profit', 'reports:export', 'menu-management', 'menu-stock-toggle', 'menu-edit-price', 'inventory', 'inventory:view', 'inventory:edit', 'inventory:audit', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history', 'modifiers', 'recipes', 'settings', 'settings:view', 'settings:manage', 'staff', 'staff:view', 'staff:manage'],
      staff: ['terminal', 'pos:access', 'pos:checkout', 'menu-management', 'menu-stock-toggle', 'inventory', 'inventory:view', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history']
    },
    custom_roles: [
      { id: 'manager', label: 'ผู้จัดการสาขา (Manager)', is_system: true },
      { id: 'staff', label: 'พนักงานทั่วไป (Staff)', is_system: true }
    ],
    printers: [],
    receipt_story_mode: false,
    show_story_selection_at_checkout: false,
    receipt_stories: [
      { id: '1', title: 'บทที่ 1: การพบเจอ', content: 'วันนี้อากาศดีเหมือนทุกวัน แต่สายตาของผมกลับหยุดอยู่ที่โต๊ะริมหน้าต่าง... รอยยิ้มของเธอทำให้กาแฟแก้วนี้หวานขึ้นอย่างประหลาด' },
      { id: '2', title: 'บทที่ 2: แก้วที่สอง', content: '"รับเหมือนเดิมนะคะ" เธอพูดพร้อมส่งยิ้มบางๆ ผมพยักหน้า ทั้งที่ใจจริงอยากจะตอบไปว่ารับคุณด้วยได้ไหม' }
    ],
    receipt_payment_qr_image: '',
    cover_url: '',
    logo_url: '',
    name_th: '',
    name_en: '',
    branch_name_th: '',
    branch_name_en: '',
    checkout_photo_zones: [],
  })

  useEffect(() => {
    if (profile) {
      void fetchSettings()
      void fetchBanners()
    }
  }, [profile])

  useEffect(() => {
    setViewExtraHeader(null);
    return () => setViewExtraHeader(null);
  }, [setViewExtraHeader, profile]);

  const fetchSettings = async () => {
    setLoading(true)
    try {
        let branchId = null
        if (profile?.branch_code) {
            const { data: branch } = await supabase
                .from('branches')
                .select('id')
                .eq('branch_code', profile.branch_code)
                .maybeSingle()
            if (branch) branchId = branch.id
        }
        
        let data = null
        if (branchId) {
            const { data: bData } = await supabase
                .from('pos_shop_settings')
                .select('*')
                .eq('branch_id', branchId)
                .maybeSingle()
            data = bData
        } else {
            const { data: bData } = await supabase
                .from('pos_shop_settings')
                .select('*')
                .eq('id', '00000000-0000-0000-0000-000000000001')
                .maybeSingle()
            data = bData
        }
        
        if (!data) {
            const { data: globalData } = await supabase
                .from('pos_shop_settings')
                .select('*')
                .is('branch_id', null)
                .maybeSingle()
            data = globalData
        }

        if (data) {
            const effectiveStatus = data.status || (data.is_open ? 'open' : 'closed');
            setSettings({
                ...data,
                branch_id: data.branch_id || branchId,
                status: effectiveStatus,
                is_open: effectiveStatus === 'open',
                role_permissions: data.role_permissions || {
                    manager: ['terminal', 'pos:access', 'pos:checkout', 'pos:void', 'pos:discount', 'pos:drawer', 'reports', 'reports:view', 'reports:sales', 'reports:profit', 'reports:export', 'menu-management', 'menu-stock-toggle', 'menu-edit-price', 'inventory', 'inventory:view', 'inventory:edit', 'inventory:audit', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history', 'modifiers', 'recipes', 'settings', 'settings:view', 'settings:manage', 'staff', 'staff:view', 'staff:manage'],
                    staff: ['terminal', 'pos:access', 'pos:checkout', 'menu-management', 'menu-stock-toggle', 'inventory', 'inventory:view', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history']
                },
                custom_roles: data.custom_roles || [
                    { id: 'manager', label: 'ผู้จัดการสาขา (Manager)', is_system: true },
                    { id: 'staff', label: 'พนักงานทั่วไป (Staff)', is_system: true }
                ],
                printers: (data.printers && data.printers.length > 0) ? data.printers : (typeof window !== 'undefined' && localStorage.getItem('rushup_printer_ip') ? [{ ip: localStorage.getItem('rushup_printer_ip'), type: 'receipt', name: 'Printer 1', encoding: 'cp874', categories: ['all'] }] : []),
                receipt_header: data.opening_hours?.receipt_header || '',
                receipt_story_mode: data.opening_hours?.receipt_story_mode || false,
                show_story_selection_at_checkout: data.opening_hours?.show_story_selection_at_checkout ?? false,
                receipt_stories: data.opening_hours?.receipt_stories || [],
                receipt_show_logo: data.opening_hours?.receipt_show_logo ?? true,
                receipt_font_size: data.opening_hours?.receipt_font_size || 'normal',
                receipt_payment_qr_image: data.opening_hours?.receipt_payment_qr_image || '',
                receipt_footer: data.opening_hours?.receipt_footer || '',
                bill_number_format: data.opening_hours?.bill_number_format || '{Prefix}{YYMMDD}-{Queue:4}',
                order_number_format: data.opening_hours?.order_number_format || '{Queue:4}',
                hide_queue_in_pos: data.opening_hours?.hide_queue_in_pos ?? true,
                kitchen_font_size: data.opening_hours?.kitchen_font_size || 'normal',
                kitchen_show_type: data.opening_hours?.kitchen_show_type ?? true,
                liff_splash_poster_url: data.opening_hours?.liff_splash_poster_url || '',
                cover_url: data.opening_hours?.cover_url || '',
                logo_url: data.opening_hours?.logo_url || '',
                name_th: data.opening_hours?.name_th || '',
                name_en: data.opening_hours?.name_en || '',
                branch_name_th: data.opening_hours?.branch_name_th || '',
                branch_name_en: data.opening_hours?.branch_name_en || '',
                address: data.opening_hours?.address || '',
                loyalty_points_per_thb: data.opening_hours?.loyalty_points_per_thb || 10,
                loyalty_earn_rate: data.opening_hours?.loyalty_earn_rate || 100,
                loyalty_earn_thb: data.opening_hours?.loyalty_earn_thb !== undefined ? data.opening_hours.loyalty_earn_thb : (data.opening_hours?.loyalty_earn_rate || 100),
                loyalty_earn_pts: data.opening_hours?.loyalty_earn_pts !== undefined ? data.opening_hours.loyalty_earn_pts : 1,
                loyalty_redeem_pts: data.opening_hours?.loyalty_redeem_pts !== undefined ? data.opening_hours.loyalty_redeem_pts : 1,
                loyalty_redeem_thb: data.opening_hours?.loyalty_redeem_thb !== undefined ? data.opening_hours.loyalty_redeem_thb : (data.opening_hours?.loyalty_points_per_thb || 10),
                delivery_gp: data.opening_hours?.delivery_gp || { grab: 32.1, lineman: 32.1, shopee: 32.1, foodpanda: 32.1, robinhood: 0 },
                active_delivery_platforms: data.opening_hours?.active_delivery_platforms || ['grab', 'shopee', 'lineman', 'foodpanda', 'robinhood'],
                inhouse_delivery_config: data.opening_hours?.inhouse_delivery_config || { enabled: false, base_distance_km: 3, base_price: 20, per_km_rate: 10, max_distance_km: 15, free_delivery_threshold: 500 },
                mystery_box_cost: data.opening_hours?.mystery_box_cost !== undefined ? data.opening_hours.mystery_box_cost : 50,
                mystery_box_prizes: data.opening_hours?.mystery_box_prizes || [
                    { chance: 60, points: 20 },
                    { chance: 25, points: 50 },
                    { chance: 10, points: 100 },
                    { chance: 5, points: 500 }
                ],
                checkout_photo_zones: data.checkout_photo_zones || [],
            })
        } else {
            setSettings((prev: any) => ({ ...prev, branch_id: branchId }))
        }

        const { data: catData } = await supabase.from('pos_menu_categories').select('*').order('order_index')
        if (catData) setCategories(catData)
        
        const { data: couponData } = await supabase.from('pos_loyalty_coupons').select('id, name, is_active').eq('is_active', true).order('created_at', { ascending: false })
        if (couponData) setAvailableCoupons(couponData)

        const { data: invCatData } = await supabase.from('inventory_categories').select('id, name').order('order_index')
        if (invCatData) setInventoryCategories(invCatData)
    } catch (err) {
        console.error('Fetch settings error:', err)
    } finally {
        setLoading(false)
    }
  }

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('pos_banners')
      .select('*')
      .order('order_index', { ascending: true })
      
    if (data) setBanners(data)
  }

  
    const updateOpeningHour = (day: string, field: string, value: any) => {
        if (!settings) return;
        const newHours = { ...(settings.opening_hours as any) };
        newHours[day] = { ...newHours[day], [field]: value };
        setSettings({ ...settings, opening_hours: newHours });
    }

    const addDeliveryRule = () => {
        if (!settings) return;
        const rules = [...(settings.delivery_fee_rules as any[] || [])];
        rules.push({ max_dist: 5, fee: 40 });
        setSettings({ ...settings, delivery_fee_rules: rules });
    }

    const removeDeliveryRule = (index: number) => {
        if (!settings) return;
        const rules = [...(settings.delivery_fee_rules as any[] || [])];
        rules.splice(index, 1);
        setSettings({ ...settings, delivery_fee_rules: rules });
    }

    const updateDeliveryRule = (index: number, field: string, value: number) => {
        if (!settings) return;
        const rules = [...(settings.delivery_fee_rules as any[] || [])];
        rules[index] = { ...rules[index], [field]: value };
        setSettings({ ...settings, delivery_fee_rules: rules });
    }

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setShowCropModal(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleCropAndUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return

    setIsUploadingBanner(true)
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels)
      
      const fileExt = 'jpg'
      const fileName = `banner_${Date.now()}.${fileExt}`
      const filePath = `banners/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order_index || 0)) : 0

      const { data: newBanner, error: insertError } = await supabase
        .from('pos_banners')
        .insert({
          image_url: publicUrl,
          is_active: true,
          order_index: maxOrder + 1
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (newBanner) {
        setBanners([...banners, newBanner])
      }
      setShowCropModal(false)
      setSelectedImage(null)
    } catch (err: any) {
      console.error('Error uploading banner:', err)
      alert('Failed to upload banner: ' + err.message)
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      const { error } = await supabase.from('pos_banners').delete().eq('id', id)
      if (error) throw error
      setBanners(banners.filter(b => b.id !== id))
    } catch (err: any) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleCancelCrop = () => {
    setShowCropModal(false)
    setSelectedImage(null)
  }

const handleSave = async () => {
    if (!settings.branch_id && settings.id !== '00000000-0000-0000-0000-000000000001') {
        alert('ไม่พบรหัสสาขาของพนักงาน')
        return
    }
    
    setIsSaving(true)
    const payload: any = {
      ...settings,
      opening_hours: {
        ...(settings.opening_hours || {}),
        receipt_header: settings.receipt_header,
        receipt_story_mode: settings.receipt_story_mode,
        show_story_selection_at_checkout: settings.show_story_selection_at_checkout,
        receipt_stories: settings.receipt_stories,
        receipt_show_logo: settings.receipt_show_logo,
        receipt_font_size: settings.receipt_font_size,
        receipt_payment_qr_image: settings.receipt_payment_qr_image,
        receipt_footer: settings.receipt_footer,
        bill_number_format: settings.bill_number_format,
        order_number_format: settings.order_number_format,
        hide_queue_in_pos: settings.hide_queue_in_pos,
        kitchen_font_size: settings.kitchen_font_size,
        kitchen_show_type: settings.kitchen_show_type,
        liff_splash_poster_url: settings.liff_splash_poster_url,
        address: settings.address,
        loyalty_points_per_thb: settings.loyalty_points_per_thb,
        loyalty_earn_rate: settings.loyalty_earn_rate,
        loyalty_earn_thb: settings.loyalty_earn_thb,
        loyalty_earn_pts: settings.loyalty_earn_pts,
        loyalty_redeem_pts: settings.loyalty_redeem_pts,
        loyalty_redeem_thb: settings.loyalty_redeem_thb,
        delivery_gp: settings.delivery_gp,
        active_delivery_platforms: settings.active_delivery_platforms,
        inhouse_delivery_config: settings.inhouse_delivery_config,
        mystery_box_cost: settings.mystery_box_cost,
        mystery_box_prizes: settings.mystery_box_prizes,
        cover_url: settings.cover_url,
        logo_url: settings.logo_url,
        name_th: settings.name_th,
        name_en: settings.name_en,
        branch_name_en: settings.branch_name_en,
      },
      checkout_photo_zones: settings.checkout_photo_zones || [],
      is_open: settings.status === 'open',
      updated_at: new Date().toISOString()
    }

    // Strip keys that don't exist in pos_shop_settings schema
    delete payload.custom_roles;
    delete payload.receipt_header;
    delete payload.receipt_story_mode;
    delete payload.show_story_selection_at_checkout;
    delete payload.receipt_stories;
    delete payload.receipt_show_logo;
    delete payload.receipt_font_size;
    delete payload.receipt_payment_qr_image;
    delete payload.receipt_footer;
    delete payload.bill_number_format;
    delete payload.order_number_format;
    delete payload.hide_queue_in_pos;
    delete payload.kitchen_font_size;
    delete payload.kitchen_show_type;
    delete payload.liff_splash_poster_url;
    delete payload.cover_url;
    delete payload.logo_url;
    delete payload.name_th;
    delete payload.name_en;
    delete payload.branch_name_th;
    delete payload.branch_name_en;
    delete payload.loyalty_points_per_thb;
    delete payload.loyalty_earn_rate;
    delete payload.loyalty_earn_thb;
    delete payload.loyalty_earn_pts;
    delete payload.loyalty_redeem_pts;
    delete payload.loyalty_redeem_thb;
    delete payload.address;
    delete payload.delivery_gp;
    delete payload.active_delivery_platforms;
    delete payload.inhouse_delivery_config;
    delete payload.mystery_box_cost;
    delete payload.mystery_box_prizes;

    try {
        let result;
        if (settings.id) {
            result = await supabase
                .from('pos_shop_settings')
                .update(payload)
                .eq('id', settings.id)
                .select()
                .single()
        } else {
            delete payload.id;
            result = await supabase
                .from('pos_shop_settings')
                .insert(payload)
                .select()
                .single()
        }

        if (result.error) throw result.error
        
        if (result.data) {
            const data = result.data;
            const effectiveStatus = data.status || (data.is_open ? 'open' : 'closed');
            setSettings({
                ...data,
                status: effectiveStatus,
                is_open: effectiveStatus === 'open',
                role_permissions: data.role_permissions || {
                    manager: ['terminal', 'pos:access', 'pos:checkout', 'pos:void', 'pos:discount', 'pos:drawer', 'reports', 'reports:view', 'reports:sales', 'reports:profit', 'reports:export', 'menu-management', 'menu-stock-toggle', 'menu-edit-price', 'inventory', 'inventory:view', 'inventory:edit', 'inventory:audit', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history', 'modifiers', 'recipes', 'settings', 'settings:view', 'settings:manage', 'staff', 'staff:view', 'staff:manage'],
                    staff: ['terminal', 'pos:access', 'pos:checkout', 'menu-management', 'menu-stock-toggle', 'inventory', 'inventory:view', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history']
                },
                custom_roles: data.custom_roles || [
                    { id: 'manager', label: 'ผู้จัดการสาขา (Manager)', is_system: true },
                    { id: 'staff', label: 'พนักงานทั่วไป (Staff)', is_system: true }
                ],
                printers: data.printers || [],
                receipt_header: data.opening_hours?.receipt_header || '',
                receipt_story_mode: data.opening_hours?.receipt_story_mode || false,
                show_story_selection_at_checkout: data.opening_hours?.show_story_selection_at_checkout ?? false,
                receipt_stories: data.opening_hours?.receipt_stories || [],
                receipt_show_logo: data.opening_hours?.receipt_show_logo ?? true,
                receipt_font_size: data.opening_hours?.receipt_font_size || 'normal',
                receipt_payment_qr_image: data.opening_hours?.receipt_payment_qr_image || '',
                receipt_footer: data.opening_hours?.receipt_footer || '',
                bill_number_format: data.opening_hours?.bill_number_format || '{Prefix}{YYMMDD}-{Queue:4}',
                order_number_format: data.opening_hours?.order_number_format || '{Queue:4}',
                hide_queue_in_pos: data.opening_hours?.hide_queue_in_pos ?? true,
                kitchen_font_size: data.opening_hours?.kitchen_font_size || 'normal',
                kitchen_show_type: data.opening_hours?.kitchen_show_type ?? true,
                address: data.opening_hours?.address || '',
                loyalty_points_per_thb: data.opening_hours?.loyalty_points_per_thb || 10,
                loyalty_earn_rate: data.opening_hours?.loyalty_earn_rate || 100,
                loyalty_earn_thb: data.opening_hours?.loyalty_earn_thb !== undefined ? data.opening_hours.loyalty_earn_thb : (data.opening_hours?.loyalty_earn_rate || 100),
                loyalty_earn_pts: data.opening_hours?.loyalty_earn_pts !== undefined ? data.opening_hours.loyalty_earn_pts : 1,
                loyalty_redeem_pts: data.opening_hours?.loyalty_redeem_pts !== undefined ? data.opening_hours.loyalty_redeem_pts : 1,
                loyalty_redeem_thb: data.opening_hours?.loyalty_redeem_thb !== undefined ? data.opening_hours.loyalty_redeem_thb : (data.opening_hours?.loyalty_points_per_thb || 10),
                delivery_gp: data.opening_hours?.delivery_gp || { grab: 32.1, lineman: 32.1, shopee: 32.1, foodpanda: 32.1, robinhood: 0 },
                active_delivery_platforms: data.opening_hours?.active_delivery_platforms || ['grab', 'shopee', 'lineman', 'foodpanda', 'robinhood'],
                inhouse_delivery_config: data.opening_hours?.inhouse_delivery_config || { enabled: false, base_distance_km: 3, base_price: 20, per_km_rate: 10, max_distance_km: 15, free_delivery_threshold: 500 },
            })
            alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
        }
    } catch (error: any) {
        console.error('Save settings error:', error)
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message)
    } finally {
        setIsSaving(false)
    }
  };

  const handleTestPrint = async (index: number) => {
    const printer = settings.printers[index];
    if (!printer) return;
    
    setIsSaving(true);
    try {
        const dummyOrder = {
            orderNumber: 'Q-01',
            date: new Date().toLocaleString(),
            queueNumber: '01',
            orderType: 'dine_in',
            tableNumber: 'T-01',
            staffName: 'Demo Staff',
            total: 140,
            subtotal: 140,
            discount: 0,
            tax: 0,
            items: [
                {
                    name: 'กาแฟลาเต้ (เย็น)',
                    quantity: 1,
                    subtotal: 140,
                    modifiers: ['หวานน้อย 50%', 'เปลี่ยนนมโอ๊ต'],
                    selected_modifiers: [
                        { name: 'หวานน้อย 50%' },
                        { name: 'เปลี่ยนนมโอ๊ต' }
                    ]
                }
            ]
        };

        if (printer.encoding === 'graphic') {
            if (printer.type === 'kitchen') {
                await printGraphicModeKitchenTicket(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
            } else if (printer.type === 'receipt') {
                await printGraphicModeCustomerReceipt(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
            } else {
                await printGraphicModeCustomerReceipt(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
                await new Promise(r => setTimeout(r, 1000));
                await printGraphicModeKitchenTicket(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
            }
        } else {
            if (printer.type === 'kitchen') {
                await printKitchenTicket(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
            } else if (printer.type === 'receipt') {
                await printCustomerReceipt(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
            } else {
                await printCustomerReceipt(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
                await new Promise(r => setTimeout(r, 1000));
                await printKitchenTicket(printer.ip, dummyOrder, settings, printer.model, printer.encoding);
            }
        }

        alert('ส่งคำสั่งพิมพ์ทดสอบสำเร็จ');
    } catch (error) {
        console.error('Test print error:', error);
        alert('เกิดข้อผิดพลาดในการพิมพ์ทดสอบ: ' + (error as any).message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDiagnosticPrint = async (index: number) => {
    const printer = settings.printers[index];
    if (!printer) return;
    
    setIsSaving(true);
    try {
        const dummyOrder = {
            orderNumber: 'Q-01',
            date: new Date().toLocaleString(),
            queueNumber: '01',
            orderType: 'dine_in',
            tableNumber: 'T-01',
            staffName: 'Demo',
            total: 0,
            subtotal: 0,
            discount: 0,
            tax: 0,
            items: []
        };
        const { printCustomerReceipt } = await import('@/lib/printerUtils');
        await printCustomerReceipt(printer.ip, dummyOrder, settings, printer.model, 'find-thai-page');
        alert('ส่งคำสั่งพิมพ์ค้นหา Code Page สำเร็จ (กรุณาดูที่กระดาษ)');
    } catch (error: any) {
        console.error('Diagnostic print error:', error);
        alert('เกิดข้อผิดพลาดในการพิมพ์: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <main className="flex-1 flex overflow-hidden bg-white border-none text-[#1A1A18]">
            <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                
                {/* SIDEBAR TABS (iOS Style) */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key="settings-sidebar"
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`w-full md:w-[300px] lg:w-[320px] xl:w-[380px] h-full flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto custom-scrollbar ${!showMobileMenu ? 'hidden md:block' : 'block'}`}
                    >
                    
                    {/* iOS Navigation Bar for Left Pane */}
                    <div className="pt-6 pb-2 px-4 flex items-center">
                        <button 
                            onClick={() => onSetView('terminal')}
                            className="flex items-center gap-1 text-gray-900 text-[17px] hover:opacity-70 transition-opacity font-medium"
                        >
                            <ChevronRight size={24} className="rotate-180 text-gray-400" strokeWidth={2.5} />
                            <span>POS</span>
                        </button>
                    </div>

                    <div className="px-4 pb-6">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6 px-2">{locale === 'en' ? 'Settings' : locale === 'zh' ? '设置' : 'การตั้งค่า'}</h1>
                        
                        {/* Search Bar & Smart Results */}
                        <div className="relative mb-6 mx-2">
                            <div className="bg-gray-50 rounded-xl flex items-center px-4 py-2.5 border border-gray-100 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100 transition-all z-50 relative">
                                <span className="text-gray-400 font-normal text-[15px] mr-2">🔍</span>
                                <input
                                    type="text"
                                    placeholder={locale === 'en' ? 'Search settings...' : 'ค้นหาการตั้งค่า...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none w-full text-gray-700 text-[15px] placeholder:text-gray-400"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors ml-1">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Smart Search Results Dropdown */}
                            <AnimatePresence>
                                {searchQuery.trim().length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-50 overflow-hidden max-h-[300px] overflow-y-auto"
                                    >
                                        {(() => {
                                            const searchTerms = searchQuery.toLowerCase().trim();
                                            const GLOBAL_INDEX = [
                                                { id: 'setting-banners', tabId: 'general', label: 'จัดการรูปภาพแบนเนอร์ LINE LIFF', icon: Info, keywords: ['banner', 'แบนเนอร์', 'liff', 'รูป', 'หน้าแรก'] },
                                                { id: 'setting-shop-info', tabId: 'general', label: 'ประกาศและข้อความหน้าร้าน', icon: Info, keywords: ['ประกาศ', 'ข้อความ', 'info', 'ที่อยู่', 'address'] },
                                                { id: 'setting-printers', tabId: 'hardware', label: 'เครื่องพิมพ์ทั้งหมด', icon: Settings, keywords: ['printer', 'พิมพ์', 'ปริ้น', 'ใบเสร็จ'] },
                                                { id: 'setting-receipt', tabId: 'receipt', label: 'ตั้งค่าใบเสร็จ', icon: Printer, keywords: ['receipt', 'บิล', 'ใบเสร็จ', 'สลิป', 'logo', 'โลโก้'] },
                                                { id: 'setting-starting-cash', tabId: 'shift', label: 'เงินทอนเริ่มต้นอัตโนมัติ', icon: Wallet, keywords: ['shift', 'กะ', 'เงินทอน', 'เปิดกะ', 'cash'] },
                                                { id: 'setting-check-bills', tabId: 'shift', label: 'ตรวจบิลที่ค้างอยู่ก่อนปิดกะ', icon: Wallet, keywords: ['ตรวจบิล', 'ค้าง', 'ปิดกะ'] },
                                                { id: 'setting-lock-editing', tabId: 'shift', label: 'ล็อกการแก้ไขบิลข้ามกะ', icon: Wallet, keywords: ['แก้ไขบิล', 'ล็อก', 'lock'] },
                                                { id: 'setting-z-report', tabId: 'shift', label: 'ส่งอีเมลสรุปยอดกะอัตโนมัติ', icon: Wallet, keywords: ['z-report', 'อีเมล', 'สรุปยอด'] },
                                                { id: 'setting-payment', tabId: 'advanced', label: 'ตั้งค่าการชำระเงิน', icon: Star, keywords: ['payment', 'ชำระเงิน', 'จ่าย', 'พร้อมเพย์', 'qr', 'promptpay', 'โอน'] },
                                                { id: 'setting-delivery', tabId: 'delivery', label: 'เดลิเวอรี่แพลตฟอร์ม', icon: Truck, keywords: ['delivery', 'ส่ง', 'ไรเดอร์', 'lineman', 'grab', 'robinhood'] },
                                                { id: 'setting-kds', tabId: 'kitchen', label: 'จอภาพห้องครัว (KDS)', icon: MenuIcon, keywords: ['kitchen', 'ครัว', 'ทำอาหาร', 'จอครัว', 'kds'] },
                                                { id: 'setting-campaigns', tabId: 'campaigns', label: 'แคมเปญและโปรโมชั่น', icon: Flag, keywords: ['campaign', 'แคมเปญ', 'โปรโมชั่น', 'ส่วนลด', 'แบนเนอร์', 'โฆษณา'] },
                                                { id: 'setting-permissions', tabId: 'permissions', label: 'สิทธิ์การใช้งานพนักงาน', icon: ShieldCheck, keywords: ['permission', 'สิทธิ์', 'พนักงาน', 'เข้าถึง', 'รหัส', 'pin'] }
                                            ];

                                            const results = GLOBAL_INDEX.filter(item => 
                                                item.label.toLowerCase().includes(searchTerms) || 
                                                item.keywords.some(k => k.toLowerCase().includes(searchTerms))
                                            );

                                            if (results.length === 0) {
                                                return (
                                                    <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                                                        <span className="text-2xl mb-2">🔍</span>
                                                        <p className="text-xs font-medium">ไม่พบการตั้งค่าที่เกี่ยวข้อง</p>
                                                    </div>
                                                );
                                            }

                                            return results.map((result, idx) => {
                                                const Icon = result.icon;
                                                return (
                                                    <button 
                                                        key={result.id}
                                                        onClick={() => {
                                                            setActiveTab(result.tabId);
                                                            setSearchQuery('');
                                                            setShowMobileMenu(false);
                                                            
                                                            // Wait for tab to render then scroll and highlight
                                                            setTimeout(() => {
                                                                const el = document.getElementById(result.id);
                                                                if (el) {
                                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    
                                                                    // Add temporary highlight effect
                                                                    el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-50/30');
                                                                    setTimeout(() => {
                                                                        el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-50/30');
                                                                    }, 2000);
                                                                }
                                                            }, 300);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${idx !== results.length - 1 ? 'border-b border-gray-50' : ''}`}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                            <Icon size={16} strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[14px] font-semibold text-gray-900 truncate">{result.label}</span>
                                                            <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">{result.tabId}</span>
                                                        </div>
                                                        <ChevronRight size={14} className="ml-auto text-gray-300" />
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-white rounded-xl p-3 flex items-center gap-4 mb-6 mx-2 border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold shrink-0">
                                {profile?.branch_code?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[16px] font-semibold text-gray-900 truncate">{locale === 'en' ? 'Shop Settings' : 'ตั้งค่าร้านค้า'}</span>
                                <span className="text-[13px] text-gray-500 truncate">สาขา {profile?.branch_code}</span>
                            </div>
                        </div>

                        {/* Shop Status Toggle */}
                        <div className="mx-2 mb-8 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                                const newStatus = settings.status === 'open' ? 'closed' : 'open';
                                setSettings({ ...settings, status: newStatus, is_open: newStatus === 'open' });
                            }}>
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${settings.status === 'open' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                                        {locale === 'en' ? 'Shop Status' : 'สถานะร้านค้า'}
                                    </span>
                                    <span className={`text-[12px] font-medium mt-0.5 ${settings.status === 'open' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {settings.status === 'open' ? (locale === 'en' ? 'Open for orders' : 'เปิดให้บริการตามปกติ') : (locale === 'en' ? 'Temporarily closed' : 'ปิดให้บริการชั่วคราว')}
                                    </span>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.status === 'open' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.status === 'open' ? 'left-[22px]' : 'left-[2px]'}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Groups */}
                        <div className={searchQuery.trim().length > 0 ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity'}>
                            <div className="mb-8 mx-2">
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">General</div>
                                {[
                                    { id: 'general', icon: Info, label: 'ทั่วไป' },
                                    { id: 'hardware', icon: Settings, label: 'เครื่องพิมพ์' },
                                    { id: 'receipt', icon: Printer, label: 'บิล' },
                                    { id: 'shift', icon: Wallet, label: 'กะและลิ้นชัก' },
                                    { id: 'advanced', icon: Star, label: 'ตั้งค่าการชำระเงิน' },
                                    { id: 'delivery', icon: Truck, label: 'เดลิเวอรี่' }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button 
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id)
                                                setShowMobileMenu(false)
                                                setSearchQuery('')
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left mb-1 ${isActive ? 'bg-gray-100' : 'bg-transparent hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                            </div>
                                            <span className={`text-[15px] flex-1 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 font-medium'}`}>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mx-2">
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">App & System</div>
                                {[
                                    { id: 'campaigns', icon: Flag, label: 'แคมเปญหน้าแอป' },
                                    { id: 'permissions', icon: ShieldCheck, label: 'สิทธิ์การใช้งาน' }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button 
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id)
                                                setShowMobileMenu(false)
                                                setSearchQuery('')
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left mb-1 ${isActive ? 'bg-gray-100' : 'bg-transparent hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                            </div>
                                            <span className={`text-[15px] flex-1 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 font-medium'}`}>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
                </AnimatePresence>

                {/* MAIN CONTENT AREA */}
                <div className={`flex-1 h-full overflow-y-auto bg-[#F5F5F7] relative ${showMobileMenu ? 'hidden md:block' : 'block'}`}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Loader2 className="animate-spin" size={64} />
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-8 pb-40 space-y-8">
                            {/* RIGHT PANE HEADER (iOS Style) */}
                        <div className="sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-xl h-14 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6 border-b border-black/5 flex items-center justify-center relative">
                            {/* MOBILE BACK BUTTON (Left) */}
                            <div className="md:hidden absolute left-4 sm:left-8">
                                <button 
                                    onClick={() => setShowMobileMenu(true)}
                                    className="flex items-center gap-1 text-[17px] text-zinc-900 hover:opacity-80 transition-opacity"
                                >
                                    <ChevronRight size={22} className="rotate-180" strokeWidth={2.5} />
                                    <span>{locale === 'en' ? 'Settings' : 'การตั้งค่า'}</span>
                                </button>
                            </div>
                            
                            {/* TITLE (Center) */}
                            <h2 className="text-[17px] font-semibold text-black text-center px-24 truncate">
                                {[
                                    { id: 'general', label: 'ทั่วไป' },
                                    { id: 'hardware', label: 'เครื่องพิมพ์' },
                                    { id: 'receipt', label: 'บิล' },
                                    { id: 'advanced', label: 'ตั้งค่าการชำระเงิน' },
                                    { id: 'delivery', label: 'เดลิเวอรี่' },
                                    { id: 'kitchen', label: 'ห้องครัว' },
                                    { id: 'campaigns', label: 'แคมเปญหน้าแอป' },
                                    { id: 'permissions', label: 'สิทธิ์การใช้งาน' }
                                ].find(t => t.id === activeTab)?.label || 'การตั้งค่า'}
                            </h2>

                            {/* ACTIONS (Right) */}
                            <div className="absolute right-4 sm:right-8 flex items-center gap-4">
                                <button 
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Reload App"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="text-[17px] font-semibold text-zinc-900 hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 className="animate-spin" size={16} />}
                                    {isSaving ? (locale === 'en' ? 'Saving' : 'กำลังบันทึก') : (locale === 'en' ? 'Save' : 'บันทึก')}
                                </button>
                            </div>
                        </div>



                        {/* TAB: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                                    {/* Cover Photo / Banners Slider */}
                                    <div className="relative h-48 sm:h-64 bg-gray-200">
                                        {banners && banners.length > 0 ? (
                                            <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                {banners.map((banner, index) => (
                                                    <div key={banner.id} className="relative w-full h-full flex-shrink-0 snap-center">
                                                        <img src={banner.image_url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                <ImageIcon size={32} className="mb-2 opacity-50" />
                                                <span className="text-xs font-bold">{locale === 'en' ? 'No Banners' : 'ยังไม่มีรูปภาพแบนเนอร์'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Redesigned Banner Management Strip */}
                                    <div id="setting-banners" className="bg-white border-b border-black/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between transition-colors duration-1000">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
                                                {locale === 'en' ? 'Manage LIFF Banners' : 'จัดการรูปภาพแบนเนอร์ LINE LIFF'}
                                            </h4>
                                            <p className="text-[13px] text-gray-500">
                                                {locale === 'en' ? 'Images will show in a slider at the top of your LIFF menu.' : 'รูปภาพจะเลื่อนแสดงที่ด้านบนสุดของหน้าระบบสั่งอาหาร LINE LIFF'}
                                            </p>
                                            
                                            {banners && banners.length > 0 && (
                                                <div className="flex flex-wrap gap-3 mt-4">
                                                    {banners.map((banner, index) => (
                                                        <div key={banner.id} className="relative w-20 h-10 rounded-lg overflow-hidden border border-black/10 group/thumb shadow-sm bg-white">
                                                            <img src={banner.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    onClick={() => handleDeleteBanner(banner.id)}
                                                                    title={locale === 'en' ? 'Delete Banner' : 'ลบแบนเนอร์'}
                                                                    className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded-tl-md font-bold leading-tight">
                                                                #{index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-shrink-0">
                                            <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 ${isUploadingBanner ? 'pointer-events-none opacity-50' : ''}`}>
                                                {isUploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                {locale === 'en' ? 'Add Banner' : 'เพิ่มรูปแบนเนอร์'}
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleBannerFileSelect}
                                                    disabled={isUploadingBanner}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Profile Photo & Info */}
                                    <div className="px-6 sm:px-8 pb-8 relative border-b border-black/5">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 sm:-mt-16">
                                            <div className="relative group">
                                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
                                                    {settings.logo_url ? (
                                                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                            <Store size={32} className="opacity-50" />
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="absolute bottom-1 right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                                                    <Camera size={14} />
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (e) => setSettings({...settings, logo_url: e.target?.result});
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <div className="text-center sm:text-left flex-1 pb-1">
                                                <h3 className="text-[20px] font-semibold text-gray-900">{settings.name_th || settings.name || (locale === 'en' ? 'Shop Name' : 'ชื่อร้าน')}</h3>
                                                <p className="text-[14px] text-gray-500 mt-0.5">{settings.branch_name_th || settings.branch_name || (locale === 'en' ? 'Branch' : 'สาขา')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shop Info Container */}
                                    <div className="px-6 sm:px-8 py-6">
                                        <div className="space-y-4">
                                            {/* Shop Name TH / EN */}
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={settings.name_th || settings.name || ''}
                                                        onChange={e => setSettings({...settings, name_th: e.target.value, name: e.target.value})}
                                                        className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Shop Name (Thai)' : 'ชื่อร้าน (ภาษาไทย)'}</label>
                                                </div>
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={settings.name_en || ''}
                                                        onChange={e => setSettings({...settings, name_en: e.target.value})}
                                                        className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Shop Name (English)' : 'ชื่อร้าน (ภาษาอังกฤษ)'}</label>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={settings.branch_name_th || settings.branch_name || ''}
                                                        onChange={e => setSettings({...settings, branch_name_th: e.target.value, branch_name: e.target.value})}
                                                        className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Branch Name (Thai)' : 'ชื่อสาขา (ภาษาไทย)'}</label>
                                                </div>
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={settings.branch_name_en || ''}
                                                        onChange={e => setSettings({...settings, branch_name_en: e.target.value})}
                                                        className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Branch Name (English)' : 'ชื่อสาขา (ภาษาอังกฤษ)'}</label>
                                                </div>
                                            </div>
                                            
                                            {/* Tax ID & Phone */}
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={settings.tax_id || ''}
                                                        onChange={e => setSettings({...settings, tax_id: e.target.value})}
                                                        className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Tax ID' : 'เลขประจำตัวผู้เสียภาษี'}</label>
                                                </div>
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={settings.phone || ''}
                                                        onChange={e => setSettings({...settings, phone: e.target.value})}
                                                        className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์ติดต่อ'}</label>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="relative w-full">
                                                <textarea 
                                                    value={settings.address || ''}
                                                    onChange={e => setSettings({...settings, address: e.target.value})}
                                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 pt-6 pb-2 text-[15px] font-medium text-gray-900 outline-none focus:bg-gray-100 transition-colors peer min-h-[80px] resize-none"
                                                    placeholder=" "
                                                />
                                                <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-500">{locale === 'en' ? 'Address' : 'ที่อยู่ร้าน'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="setting-shop-info" className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Store Announcements' : 'ประกาศและข้อความหน้าร้าน'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">
                                        {locale === 'en' ? 'Messages to display on the LINE LIFF ordering page' : 'ข้อความที่จะแสดงในหน้าระบบสั่งอาหาร LINE LIFF'}
                                    </p>
                                    <textarea 
                                        value={settings.status_message}
                                        onChange={e => setSettings({...settings, status_message: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black min-h-[120px] resize-none transition-all"
                                    />
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-[17px] font-semibold mb-1">
                                                LIFF Splash Poster
                                            </h3>
                                            <p className="text-[13px] text-gray-500">
                                                อัปโหลดรูปโปสเตอร์โชว์ตอนโหลดเข้า LIFF
                                            </p>
                                        </div>
                                        {settings.liff_splash_poster_url && (
                                            <button
                                                type="button"
                                                onClick={() => setSettings({...settings, liff_splash_poster_url: ''})}
                                                className="text-[12px] font-medium text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                ลบรูปโปสเตอร์
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 mb-6 text-[12px] text-amber-700 flex items-start gap-2">
                                        <span className="mt-0.5">💡</span>
                                        <span>แนะนำสัดส่วนแนวตั้ง <b>9:16</b> (1080 x 1920 px) เพื่อให้พอดีกับหน้าจอมือถือ</span>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <label className="inline-flex items-center justify-center gap-2 cursor-pointer w-fit">
                                            <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D3202B] text-white hover:bg-gray-800 px-4 py-2 text-[13px] font-medium transition-colors">
                                                {isUploadingPoster ? <Loader2 size={16} className="animate-spin" /> : <Upload size={14} />}
                                                {isUploadingPoster ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={isUploadingPoster}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return
                                                    handlePosterUpload(file)
                                                    e.currentTarget.value = ''
                                                }}
                                            />
                                        </label>

                                        {!settings.liff_splash_poster_url && (
                                            <textarea
                                                value={settings.liff_splash_poster_url || ''}
                                                onChange={e => setSettings({...settings, liff_splash_poster_url: e.target.value})}
                                                className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 text-[13px] font-mono outline-none min-h-[60px] resize-none"
                                                placeholder="วาง data URL หรือ image URL ของรูปโปรโมชัน (https://...)"
                                            />
                                        )}

                                        {settings.liff_splash_poster_url && (
                                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center border border-black/5">
                                                <div className="text-[12px] font-medium text-gray-500 mb-4 self-start">ตัวอย่าง (Preview)</div>
                                                <div className="w-[200px] h-[355px] rounded-2xl border-4 border-[#D3202B] bg-black overflow-hidden shadow-lg relative">
                                                    <img loading="lazy" src={settings.liff_splash_poster_url} alt="Poster preview" className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section: Checkout Photo Zones */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">ตั้งค่าโซนถ่ายรูปก่อนออกงาน</h3>
                                    <p className="text-[13px] text-gray-500 mb-4">กำหนดโซนที่พนักงานจำเป็นต้องถ่ายรูปส่งก่อนกดลงเวลาออกงาน (ระบบจะตรวจสอบรวมกันทั้งสาขา)</p>
                                    
                                    <div className="space-y-2 mb-4">
                                        {(settings.checkout_photo_zones || []).map((zone: any, idx: number) => (
                                            <div key={zone.id || idx} className="flex items-center gap-3 bg-gray-50 p-2 pl-4 rounded-xl border border-black/5">
                                                <div className="flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={zone.name}
                                                        onChange={e => {
                                                            const newZones = [...(settings.checkout_photo_zones || [])];
                                                            newZones[idx].name = e.target.value;
                                                            setSettings({...settings, checkout_photo_zones: newZones});
                                                        }}
                                                        className="w-full bg-transparent text-[14px] outline-none"
                                                        placeholder="ชื่อโซน เช่น บาร์น้ำ, ห้องครัว"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newZones = (settings.checkout_photo_zones || []).filter((_: any, i: number) => i !== idx);
                                                        setSettings({...settings, checkout_photo_zones: newZones});
                                                    }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newZones = [...(settings.checkout_photo_zones || []), { id: crypto.randomUUID(), name: '' }];
                                            setSettings({...settings, checkout_photo_zones: newZones});
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[14px] font-medium text-gray-900 transition-colors"
                                    >
                                        <Plus size={16} /> เพิ่มโซนใหม่
                                    </button>
                                </div>

                                {/* Section: Opening Hours */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-6">{locale === 'en' ? 'Opening Hours' : 'เวลาเปิด-ปิดร้าน (Opening Hours)'}</h3>
                                    
                                    <div className="divide-y divide-black/5">
                                        {DAYS.map((day) => {
                                            const dayData = settings.opening_hours?.[day.id] || { open: '08:00', close: '20:00', closed: false }
                                            return (
                                                <div key={day.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
                                                    <div className="flex items-center gap-3 min-w-[120px]">
                                                        <div className={`w-2 h-2 rounded-full ${dayData.closed ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                        <span className="text-[15px] font-medium">{day.label}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-6">
                                                        <div className={`flex items-center gap-2 ${dayData.closed ? 'opacity-30 pointer-events-none' : ''}`}>
                                                            <input
                                                                type="time"
                                                                value={dayData.open}
                                                                onChange={(e) => updateOpeningHour(day.id, 'open', e.target.value)}
                                                                className="bg-gray-50 px-3 py-1.5 rounded-lg border-0 text-[14px] outline-none focus:bg-gray-100"
                                                            />
                                                            <span className="text-gray-400">-</span>
                                                            <input
                                                                type="time"
                                                                value={dayData.close}
                                                                onChange={(e) => updateOpeningHour(day.id, 'close', e.target.value)}
                                                                className="bg-gray-50 px-3 py-1.5 rounded-lg border-0 text-[14px] outline-none focus:bg-gray-100"
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-3 ml-2">
                                                            <span className="text-[14px] text-gray-500">{locale === 'en' ? 'Closed' : 'ปิดร้าน'}</span>
                                                            <button 
                                                                onClick={() => updateOpeningHour(day.id, 'closed', !dayData.closed)}
                                                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${dayData.closed ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                            >
                                                                <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${dayData.closed ? 'left-[22px]' : 'left-[2px]'}`}></div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

            
                                {/* Section: Attendance Rules */}
                                {/* Section: Attendance Rules */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-6">{locale === 'en' ? 'Location Settings (Geo-fencing)' : 'พิกัดเช็คอิน (Geo-fencing)'}</h3>
                                    
                                    <div className="space-y-6">
                                        <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3">
                                            <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                            <p className="text-[13px] text-gray-500 leading-relaxed">
                                                {locale === 'en' ? 'Staff can only clock in/out when their GPS location is within the specified radius around this branch.' : 'พนักงานจะลงเวลาเข้างานและออกงานได้ก็ต่อเมื่อพิกัด GPS อยู่ในรัศมีที่กำหนดรอบสาขานี้เท่านั้น หากอยู่นอกระยะ ระบบจะบล็อกและแจ้งข้อความทันที'}
                                            </p>
                                        </div>

                                        <div className="divide-y divide-black/5">
                                            {/* Staff Check-in Radius */}
                                            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Staff Check-in Radius' : 'รัศมีเช็คอินพนักงาน'}</label>
                                                    <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'Recommended: 50 - 100 meters' : 'ค่าแนะนำ: 50 - 100 เมตร เพื่อความเสถียรของ GPS'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                                                    <input
                                                        type="number"
                                                        value={settings.check_in_radius}
                                                        onChange={(e) => setSettings({ ...settings, check_in_radius: Number(e.target.value) })}
                                                        className="w-16 bg-transparent border-0 p-0 text-[15px] font-medium text-right outline-none"
                                                        min={10}
                                                        max={1000}
                                                    />
                                                    <span className="text-[13px] text-gray-500">{locale === 'en' ? 'm' : 'เมตร'}</span>
                                                </div>
                                            </div>

                                            {/* Coupon Geofencing Radius */}
                                            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[14px] font-medium text-gray-900">
                                                        {locale === 'en' ? 'Customer Coupon Radius' : 'รัศมีอนุญาตใช้งานคูปองของลูกค้า'}
                                                    </label>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Customers must be within this radius to redeem coupons.' : 'ลูกค้าจะกดใช้คูปองจากโทรศัพท์ได้ ต่อเมื่อพิกัด GPS อยู่ในรัศมีที่กำหนดรอบสาขานี้เท่านั้น'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                                                    <input
                                                        type="number"
                                                        value={settings.coupon_radius_meters ?? 500}
                                                        onChange={(e) => setSettings({ ...settings, coupon_radius_meters: Number(e.target.value) })}
                                                        className="w-16 bg-transparent border-0 p-0 text-[15px] font-medium text-right outline-none"
                                                        min={50}
                                                        max={5000}
                                                    />
                                                    <span className="text-[13px] text-gray-500">{locale === 'en' ? 'm' : 'เมตร'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

            
                            </div>
                        )}

                        {activeTab === 'delivery' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">{locale === 'en' ? 'Delivery Integrations' : 'ตั้งค่า GP เดลิเวอรี่'}</h3>
                                    <p className="text-[13px] text-gray-500 mb-6">{locale === 'en' ? 'Configure GP percentages for each delivery platform' : 'ระบุเปอร์เซ็นต์หัก GP ของแต่ละแอป'}</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {['grab', 'lineman', 'shopee', 'foodpanda', 'robinhood'].map(platform => {
                                            const isActive = settings.active_delivery_platforms?.includes(platform) ?? true;
                                            return (
                                            <div key={platform} className={`bg-gray-50 p-4 rounded-xl border border-black/5 transition-opacity ${isActive ? '' : 'opacity-50 grayscale'}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-[14px] font-semibold text-gray-900 capitalize">
                                                        {platform === 'grab' ? 'Grab' : platform === 'lineman' ? 'LINE MAN' : platform === 'shopee' ? 'ShopeeFood' : platform === 'foodpanda' ? 'Foodpanda' : 'Robinhood'}
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            let active = settings.active_delivery_platforms || ['grab', 'lineman', 'shopee', 'foodpanda', 'robinhood'];
                                                            if (active.includes(platform)) {
                                                                active = active.filter(p => p !== platform);
                                                            } else {
                                                                active = [...active, platform];
                                                            }
                                                            setSettings({...settings, active_delivery_platforms: active});
                                                        }}
                                                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                    >
                                                        <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${isActive ? 'left-[22px]' : 'left-[2px]'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        step="0.1"
                                                        disabled={!isActive}
                                                        value={settings.delivery_gp?.[platform] ?? 32.1}
                                                        onChange={e => setSettings({
                                                            ...settings, 
                                                            delivery_gp: { ...settings.delivery_gp, [platform]: parseFloat(e.target.value) || 0 }
                                                        })}
                                                        className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] font-medium text-gray-900 outline-none focus:ring-1 focus:ring-black" 
                                                    />
                                                    <span className="text-[13px] text-gray-500 font-medium">%</span>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>

                                {/* IN-HOUSE DELIVERY SETTINGS */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-black/5">
                                        <div>
                                            <h3 className="text-[17px] font-semibold mb-1">
                                                {locale === 'en' ? 'In-House Delivery Settings' : 'ตั้งค่าไรเดอร์ของร้าน (In-House)'}
                                            </h3>
                                            <p className="text-[13px] text-gray-500">{locale === 'en' ? 'Configure distance-based delivery fee' : 'ตั้งค่าราคาค่าส่งตามระยะทาง (Google Maps)'}</p>
                                        </div>
                                        <button
                                            onClick={() => setSettings({
                                                ...settings,
                                                inhouse_delivery_config: { ...settings.inhouse_delivery_config, enabled: !settings.inhouse_delivery_config?.enabled }
                                            })}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.inhouse_delivery_config?.enabled ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.inhouse_delivery_config?.enabled ? 'left-[22px]' : 'left-[2px]'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className={`transition-all duration-300 ${settings.inhouse_delivery_config?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none hidden'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
                                                <div>
                                                    <label className="text-[13px] font-medium text-gray-900 block mb-1">ระยะเริ่มต้น (Base Distance)</label>
                                                    <p className="text-[11px] text-gray-500 mb-3">ระยะทางเริ่มต้นสำหรับค่าส่งเหมาจ่าย</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" step="0.1"
                                                        value={settings.inhouse_delivery_config?.base_distance_km ?? 3}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, base_distance_km: parseFloat(e.target.value) || 0 }})}
                                                        className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] font-medium text-gray-900 outline-none" 
                                                    />
                                                    <span className="text-[13px] text-gray-500">กม.</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
                                                <div>
                                                    <label className="text-[13px] font-medium text-gray-900 block mb-1">ราคาเริ่มต้น (Base Price)</label>
                                                    <p className="text-[11px] text-gray-500 mb-3">ค่าส่งในระยะเริ่มต้น</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={settings.inhouse_delivery_config?.base_price ?? 20}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, base_price: parseInt(e.target.value) || 0 }})}
                                                        className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] font-medium text-gray-900 outline-none" 
                                                    />
                                                    <span className="text-[13px] text-gray-500">บาท</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
                                                <div>
                                                    <label className="text-[13px] font-medium text-gray-900 block mb-1">บวกเพิ่ม (Per Km Rate)</label>
                                                    <p className="text-[11px] text-gray-500 mb-3">ราคาบวกเพิ่มสำหรับระยะทางที่เกินจาก Base Distance</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={settings.inhouse_delivery_config?.per_km_rate ?? 10}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, per_km_rate: parseInt(e.target.value) || 0 }})}
                                                        className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] font-medium text-gray-900 outline-none" 
                                                    />
                                                    <span className="text-[13px] text-gray-500">บาท</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
                                                <div>
                                                    <label className="text-[13px] font-medium text-gray-900 block mb-1">ส่งไกลสุด (Max Distance)</label>
                                                    <p className="text-[11px] text-gray-500 mb-3">ระยะทางสูงสุดที่รับส่ง</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" step="0.1"
                                                        value={settings.inhouse_delivery_config?.max_distance_km ?? 15}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, max_distance_km: parseFloat(e.target.value) || 0 }})}
                                                        className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] font-medium text-gray-900 outline-none" 
                                                    />
                                                    <span className="text-[13px] text-gray-500">กม.</span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 bg-indigo-50/50 rounded-xl p-4 flex flex-col justify-between border border-indigo-100">
                                                <div>
                                                    <label className="text-[13px] font-medium text-indigo-900 block mb-1">ส่งฟรี (Free Delivery Threshold)</label>
                                                    <p className="text-[11px] text-indigo-600 mb-3">หากลูกค้ามียอดสั่งซื้อถึงกำหนด ค่าจัดส่งจะเป็น 0 บาท ทันที (ใส่ 0 ถ้ายกเลิกส่งฟรี)</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={settings.inhouse_delivery_config?.free_delivery_threshold ?? 500}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, free_delivery_threshold: parseInt(e.target.value) || 0 }})}
                                                        className="w-full max-w-[200px] bg-white border-0 rounded-lg py-2 px-3 text-[14px] font-medium text-indigo-900 outline-none" 
                                                    />
                                                    <span className="text-[13px] text-indigo-600">บาท</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: RECEIPT */}
                        {activeTab === 'receipt' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* PRINT PREVIEWS (MOVED TOP) */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Print Preview' : 'ตัวอย่างบิล (Print Preview)'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-8">
                                        {locale === 'en' ? 'Click test print to try printing a real receipt with configured printers' : 'คลิกปุ่มทดสอบพิมพ์ เพื่อลองปริ้นใบเสร็จจริงกับเครื่องปริ้นที่ตั้งค่าไว้'}
                                    </p>
                                    
                                    <div className="bg-gray-50 p-6 rounded-2xl border-0 flex flex-col items-center">
                                        <div className="flex items-center gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-black/5 w-full max-w-[400px]">
                                            <button 
                                                onClick={() => setPreviewTab('receipt')}
                                                className={`flex-1 py-2 px-4 rounded-lg text-[13px] font-bold transition-all ${previewTab === 'receipt' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                                            >
                                                {locale === 'en' ? 'Customer Receipt' : 'ใบเสร็จลูกค้า'}
                                            </button>
                                            <button 
                                                onClick={() => setPreviewTab('kitchen')}
                                                className={`flex-1 py-2 px-4 rounded-lg text-[13px] font-bold transition-all ${previewTab === 'kitchen' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                                            >
                                                {locale === 'en' ? 'Kitchen Ticket' : 'ใบสั่งครัว'}
                                            </button>
                                        </div>

                                        {previewTab === 'receipt' && (
                                        <div className="bg-[#111111] p-6 sm:p-8 flex flex-col items-center overflow-hidden rounded-2xl shadow-xl relative group border border-black/20">
                                            <div className="text-[10px] font-medium text-white/50 mb-6 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse"></div>
                                                {locale === 'en' ? 'Receipt' : 'ใบเสร็จรับเงิน (Receipt)'}
                                            </div>
                                            <div id="receipt-preview-capture" className="bg-[#FDFDFB] shadow-2xl p-6 sm:p-8 w-full max-w-[340px] font-mono text-center text-black relative">
                                                {/* Paper edge */}
                                                <div className="absolute -top-1 inset-x-0 h-2 bg-repeat-x flex" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, #FDFDFB 5px)', backgroundSize: '10px 10px' }}></div>
                                                
                                                {settings.receipt_show_logo !== false && (
                                                    <div className="flex justify-center mb-6 mt-2">
                                                        {settings.logo_url ? (
                                                            <img src={settings.logo_url} alt="Logo" className="w-14 h-14 rounded-full object-cover shadow-sm grayscale" />
                                                        ) : (
                                                            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-[9px] font-mono font-bold tracking-widest shadow-inner">LOGO</div>
                                                        )}
                                                    </div>
                                                )}
                                                {settings.receipt_header && (
                                                    <div className="mb-[14px] whitespace-pre-wrap text-[12px] font-bold leading-[1.45] text-center">{settings.receipt_header}</div>
                                                )}
                                                <div className={`font-bold text-center mb-2 leading-[1.04] ${settings.receipt_font_size === 'large' ? 'text-[20px]' : 'text-[17px]'}`}>{settings.name || 'RUSH UP'}</div>
                                                {settings.branch_name && <div className="text-[11px] font-bold mb-1 text-center">{locale === 'en' ? 'Branch: ' : 'สาขา: '}{settings.branch_name}</div>}
                                                {settings.tax_id && <div className="text-[10px] font-bold mb-1 text-center">TAX ID: {settings.tax_id}</div>}
                                                {settings.phone && <div className="text-[11px] font-bold mb-[14px] text-center">{locale === 'en' ? 'Tel: ' : 'โทร: '}{settings.phone}</div>}
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-[14px]"></div>
                                                
                                                <div className="text-center text-[10px] font-bold mb-[8px] leading-[1.25]">
                                                    {locale === 'en' ? 'Date: ' : 'วันที่: '}{new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div className="text-center font-bold text-[10px] leading-[1.25] mb-[7px]">{locale === 'en' ? 'Bill No: TAK-0001' : 'รหัสบิล: TAK-0001'}</div>
                                                <div className="text-center font-bold text-[10px] leading-[1.25] mb-[7px]">{locale === 'en' ? 'Staff: Demo Staff' : 'พนักงาน: Demo Staff'}</div>
                                                <div className="text-center font-bold text-[10px] leading-[1.25] mb-[7px]">{locale === 'en' ? 'Type: Takeaway' : 'ประเภท: สั่งกลับบ้าน (Takeaway)'}</div>
                                                
                                                <div className="my-[14px] border-[2px] border-black p-3 text-center font-bold">
                                                    <div className="text-[9px] tracking-[0.12em] mb-1.5">{locale === 'en' ? 'QUEUE' : 'คิวที่ (QUEUE)'}</div>
                                                    <div className="text-[26px] leading-[1.05]">#003</div>
                                                    <div className="text-[10px] leading-[1.05] mt-1.5">{locale === 'en' ? 'Order: 0001' : 'เลขออเดอร์: 0001'}</div>
                                                </div>
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-[14px]"></div>
                                                
                                                <div className="text-left font-bold leading-[1.38]">
                                                    <div className="flex justify-between items-start gap-3 text-[12px] font-bold leading-[1.25] mb-1">
                                                        <span><span className="mr-1">1x</span> {locale === 'en' ? 'Iced Americano' : 'อเมริกาโน่เย็น'}</span>
                                                        <span className="whitespace-nowrap">65.00</span>
                                                    </div>
                                                    <div className="pl-[26px] text-[10px] font-bold text-[#444] leading-[1.25] mb-[2px]">
                                                        {locale === 'en' ? '- Light Roast' : '- คั่วอ่อน'}
                                                    </div>
                                                    <div className="pl-[26px] text-[10px] font-bold text-[#444] leading-[1.25] mb-[2px]">
                                                        {locale === 'en' ? '- No Sweet 0%' : '- ไม่หวาน 0%'}
                                                    </div>
                                                </div>
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-[14px]"></div>
                                                
                                                <div className="font-bold text-[11px] leading-[1.35] space-y-1">
                                                    <div className="flex justify-between items-end gap-3 text-[16px] font-bold leading-[1.08] mt-[10px]"><span>{locale === 'en' ? 'Total' : 'ยอดรวม'}</span><span>65.00</span></div>
                                                </div>
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-[14px]"></div>
                                                <div className="flex justify-between text-[11px] font-bold leading-[1.35]"><span>{locale === 'en' ? 'Cash' : 'รับเงิน (cash)'}</span><span>100.00</span></div>
                                                <div className="flex justify-between text-[11.5px] font-bold leading-[1.3] mt-1"><span>{locale === 'en' ? 'Change' : 'เงินทอน'}</span><span>35.00</span></div>
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-[14px]"></div>
                                                
                                                {settings.receipt_story_mode && settings.receipt_stories?.length > 0 && (
                                                    <div className="mt-[14px] mb-[14px] pt-[12px]">
                                                        <div className="font-bold text-[10px] mb-2 text-center">{settings.receipt_stories[previewStoryIndex]?.title}</div>
                                                        <div className="whitespace-pre-wrap text-[10px] leading-[1.45] font-bold text-center">{settings.receipt_stories[previewStoryIndex]?.content}</div>
                                                    </div>
                                                )}

                                                <div className="mt-[16px] border-t-[2px] border-dashed border-black pt-[12px] text-center">
                                                    <div className="font-bold text-[10px] mb-1 leading-[1.2]">สะสมแต้ม ผ่าน LINE</div>
                                                    <div className="font-bold text-[9px] mb-2 leading-[1.2]">สแกน QR เพื่อรับแต้มสะสมจากบิลนี้</div>
                                                    <div className="font-bold text-[10px] mb-[6px]">(+2 PTS)</div>
                                                    <div className="flex justify-center">
                                                        <div className="w-[120px] h-[120px] bg-white border-[4px] border-black p-1">
                                                            <div className="w-full h-full bg-black" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 2h2v2h-2v-2zm-2 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm4 0h2v2h-2v-2zm-2-4h2v2h-2v-2z\'/%3E%3C/svg%3E")', maskSize: 'contain', maskRepeat: 'no-repeat' }}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-t-[3px] border-dashed border-black my-[14px]"></div>
                                                <div className="mt-6 whitespace-pre-wrap font-bold leading-[1.35] text-[10px] text-center">
                                                    {settings.receipt_footer || 'Thank you\nPowered by RUSH UP'}
                                                </div>
                                            </div>

                                            {settings.receipt_story_mode && settings.receipt_stories?.length > 0 && (
                                                <div className="mt-6 w-full max-w-[300px]">
                                                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest block mb-2">{locale === 'en' ? 'Select Story Preview' : 'เลือกตอนที่ต้องการดูตัวอย่าง (Preview)'}</label>
                                                    <select 
                                                        value={previewStoryIndex}
                                                        onChange={e => setPreviewStoryIndex(Number(e.target.value))}
                                                        className="w-full bg-zinc-900 text-white border-0 rounded-lg py-2 px-3 text-[11px] font-medium outline-none focus:ring-1 focus:ring-white/20 transition-all" 
                                                    >
                                                        {settings.receipt_stories.map((s: any, i: number) => (
                                                            <option key={s.id} value={i}>{s.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        )}

                                        {previewTab === 'kitchen' && (
                                        <div className="bg-[#111111] p-6 sm:p-8 flex flex-col items-center overflow-hidden rounded-2xl shadow-xl relative group border border-black/20">
                                            <div className="text-[10px] font-medium text-white/50 mb-6 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#D3202B] animate-pulse"></div>
                                                {locale === 'en' ? 'Kitchen Order' : 'ใบออเดอร์ (Kitchen)'}
                                            </div>
                                            <div id="kitchen-preview-capture" className="bg-[#FDFDFB] shadow-2xl p-6 sm:p-8 w-full max-w-[340px] font-sans text-left text-black relative">
                                                <div className="absolute -top-1 inset-x-0 h-2 bg-repeat-x flex" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, #FDFDFB 5px)', backgroundSize: '10px 10px' }}></div>
                                                
                                                <div className="text-center text-[24px] font-[900] mb-3 border-b-[3px] border-black pb-2 mt-1 leading-[1.05]">
                                                    {locale === 'en' ? 'Kitchen Order' : 'ใบสั่งอาหาร'}
                                                </div>
                                                
                                                {settings.kitchen_show_type !== false && (
                                                    <div className="text-center text-[20px] mb-3 bg-black text-white px-2 py-1 font-[900] leading-[1.1]">
                                                        {locale === 'en' ? ' Takeaway ' : ' สั่งกลับบ้าน (Takeaway) '}
                                                    </div>
                                                )}

                                                <div className="text-right mb-2 text-[15px] font-[900] leading-[1.2]">
                                                    {locale === 'en' ? 'Time: ' : 'เวลา: '}{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                
                                                <div className="border-[3px] border-black p-3 mb-3 text-center font-[900]">
                                                    <div className="text-[14px] tracking-[0.16em] mb-2">
                                                        {locale === 'en' ? 'QUEUE' : 'คิวที่ (QUEUE)'}
                                                    </div>
                                                    <div className="text-[48px] leading-[1.05] break-words">
                                                        #002
                                                    </div>
                                                    <div className="text-[16px] leading-[1.05] mt-3 font-[900]">
                                                        {locale === 'en' ? 'Order No: 7104' : 'เลขออเดอร์: 7104'}
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-2 text-[14px] font-[800]">
                                                    {locale === 'en' ? 'Bill No: TAK-627104' : 'รหัสบิล: TAK-627104'}
                                                </div>
                                                <div className="mb-2 text-[15px] font-[800]">
                                                    {locale === 'en' ? 'Type: Takeaway' : 'ประเภท: สั่งกลับบ้าน (Takeaway)'}
                                                </div>
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-3"></div>
                                                
                                                <div className="leading-[1.28]">
                                                    <div className={`flex gap-3 items-start font-[900] mb-3 ${settings.kitchen_font_size === 'huge' ? 'text-[30px]' : settings.kitchen_font_size === 'large' ? 'text-[24px]' : 'text-[20px]'}`}>
                                                        <span className="font-[900] shrink-0">1x</span>
                                                        <span>{locale === 'en' ? 'Homemade Brownie' : 'โฮมเมดบราวนี่'}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="border-t-[3px] border-dashed border-black my-4"></div>
                                                <div className="text-center text-[13px] font-[900]">
                                                    --- END ---
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">{locale === 'en' ? 'Receipt Settings' : 'ตั้งค่ารูปแบบใบเสร็จ'}</h3>
                                    <p className="text-[13px] text-gray-500 mb-6">{locale === 'en' ? 'Text and details that will appear on customer receipts' : 'ข้อความและรายละเอียดที่จะปรากฏบนใบเสร็จที่พิมพ์ให้ลูกค้า'}</p>
                                    
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl flex flex-col justify-between">
                                                <label className="text-[13px] font-medium text-gray-900 block mb-2">{locale === 'en' ? 'Header Text' : 'ข้อความหัวใบเสร็จ'}</label>
                                                <textarea 
                                                    value={settings.receipt_header || ''}
                                                    onChange={e => setSettings({...settings, receipt_header: e.target.value})}
                                                    className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] outline-none min-h-[80px] resize-none"
                                                    placeholder={locale === 'en' ? 'Welcome' : 'ยินดีต้อนรับ'}
                                                />
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl flex flex-col justify-between">
                                                <label className="text-[13px] font-medium text-gray-900 block mb-2">{locale === 'en' ? 'Footer Text' : 'ข้อความท้ายใบเสร็จ'}</label>
                                                <textarea 
                                                    value={settings.receipt_footer || ''}
                                                    onChange={e => setSettings({...settings, receipt_footer: e.target.value})}
                                                    className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[14px] outline-none min-h-[80px] resize-none"
                                                    placeholder="Thank you for your visit!"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="bg-gray-50 p-4 rounded-xl flex flex-col justify-between">
                                                <label className="text-[13px] font-medium text-gray-900 block mb-2">{locale === 'en' ? 'Bill ID Format (รหัสบิล)' : 'รูปแบบรหัสบิล'}</label>
                                                <p className="text-[11px] text-gray-500 mb-2 leading-tight">ตัวแปรที่ใช้ได้: {'{Prefix}'}, {'{YYMMDD}'}, {'{YYYYMMDD}'}, {'{Queue:4}'}</p>
                                                <input 
                                                    type="text"
                                                    value={settings.bill_number_format || '{Prefix}{YYMMDD}-{Queue:4}'}
                                                    onChange={e => setSettings({...settings, bill_number_format: e.target.value})}
                                                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-[14px] outline-none"
                                                    placeholder="{Prefix}{YYMMDD}-{Queue:4}"
                                                />
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl flex flex-col justify-between">
                                                <label className="text-[13px] font-medium text-gray-900 block mb-2">{locale === 'en' ? 'Order Number Format (เลขออเดอร์)' : 'รูปแบบเลขออเดอร์'}</label>
                                                <p className="text-[11px] text-gray-500 mb-2 leading-tight">ตัวแปรที่ใช้ได้: {'{Queue:4}'}, {'{Queue:3}'}, {'{Queue}'}</p>
                                                <input 
                                                    type="text"
                                                    value={settings.order_number_format || '{Queue:4}'}
                                                    onChange={e => setSettings({...settings, order_number_format: e.target.value})}
                                                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-[14px] outline-none"
                                                    placeholder="{Queue:4}"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="divide-y divide-black/5 border-t border-black/5 pt-4 mt-4">
                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Hide Queue Number on POS' : 'ซ่อนเลขคิวสำหรับบิลหน้าร้าน'}</label>
                                                    <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'Hide large queue box for POS orders (only show for LIFF)' : 'ปิดกล่องคิวขนาดใหญ่ หากสั่งผ่าน POS'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setSettings({...settings, hide_queue_in_pos: !settings.hide_queue_in_pos})}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.hide_queue_in_pos ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.hide_queue_in_pos ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>
                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Show Logo' : 'แสดงโลโก้ร้าน'}</label>
                                                    <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'Print logo at the top of receipt' : 'พิมพ์โลโก้ด้านบนใบเสร็จ'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setSettings({...settings, receipt_show_logo: settings.receipt_show_logo === false ? true : false})}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.receipt_show_logo !== false ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.receipt_show_logo !== false ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>

                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Font Size' : 'ขนาดตัวอักษรใบเสร็จ'}</label>
                                                </div>
                                                <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                                                    <button onClick={() => setSettings({...settings, receipt_font_size: 'normal'})} className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${(!settings.receipt_font_size || settings.receipt_font_size === 'normal') ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{locale === 'en' ? 'Normal' : 'ขนาดปกติ'}</button>
                                                    <button onClick={() => setSettings({...settings, receipt_font_size: 'large'})} className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${settings.receipt_font_size === 'large' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{locale === 'en' ? 'Large' : 'ขนาดใหญ่'}</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div>
                                                    <label className="text-[14px] font-medium text-emerald-900 flex items-center gap-2 mb-1">
                                                        <QrCode size={16} className="text-emerald-600" /> Payment QR on Receipt
                                                    </label>
                                                    <p className="text-[12px] text-emerald-600/80">
                                                        ใช้กับ LIFF ที่เลือกชำระปลายทาง / COD
                                                    </p>
                                                </div>
                                                {settings.receipt_payment_qr_image && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSettings({...settings, receipt_payment_qr_image: ''})}
                                                        className="text-[12px] font-medium text-red-500 hover:text-red-600 bg-white px-3 py-1.5 rounded-lg border border-red-100"
                                                    >
                                                        ลบ QR
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3">
                                                <label className="inline-flex items-center gap-2 cursor-pointer w-fit">
                                                    <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 px-4 py-2 text-[13px] font-medium shadow-sm hover:bg-emerald-50 transition-colors">
                                                        <Upload size={14} /> อัปโหลด QR
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (!file) return
                                                            const reader = new FileReader()
                                                            reader.onload = () => {
                                                                setSettings({
                                                                    ...settings,
                                                                    receipt_payment_qr_image: String(reader.result || ''),
                                                                })
                                                            }
                                                            reader.readAsDataURL(file)
                                                            e.currentTarget.value = ''
                                                        }}
                                                    />
                                                </label>
                                                {!settings.receipt_payment_qr_image && (
                                                    <textarea
                                                        value={settings.receipt_payment_qr_image || ''}
                                                        onChange={e => setSettings({...settings, receipt_payment_qr_image: e.target.value})}
                                                        className="w-full bg-white border-0 rounded-lg py-3 px-3 text-[12px] font-mono outline-none min-h-[80px] resize-none"
                                                        placeholder="วาง data URL หรือ image URL ของ QR ที่ต้องการพิมพ์ท้ายใบเสร็จ"
                                                    />
                                                )}
                                                {settings.receipt_payment_qr_image && (
                                                    <div className="bg-white rounded-xl p-4 flex items-center gap-4 mt-2 border border-emerald-100">
                                                        <div className="w-16 h-16 rounded-lg border border-gray-100 bg-white overflow-hidden flex items-center justify-center shrink-0">
                                                            <img loading="lazy" src={settings.receipt_payment_qr_image} alt="QR preview" className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[13px] font-medium text-gray-900 mb-0.5">ตัวอย่าง QR</div>
                                                            <div className="text-[11px] text-gray-500">
                                                                ระบบจะพิมพ์ QR นี้ต่อท้ายใบเสร็จเมื่อเป็นออเดอร์ LIFF ที่เลือก COD
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-[17px] font-semibold mb-1">
                                                {locale === 'en' ? 'Receipt Message' : 'ข้อความท้ายบิล'}
                                            </h3>
                                            <p className="text-[13px] text-gray-500">{locale === 'en' ? 'Print a custom message or short story on receipts' : 'พิมพ์ข้อความสั้นๆ ให้ลูกค้าอ่านท้ายใบเสร็จ'}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({...settings, receipt_story_mode: !settings.receipt_story_mode})}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.receipt_story_mode ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.receipt_story_mode ? 'left-[22px]' : 'left-[2px]'}`} />
                                        </button>
                                    </div>

                                    <div className={`transition-all duration-300 ${settings.receipt_story_mode ? 'opacity-100' : 'opacity-40 pointer-events-none hidden'}`}>
                                        <div className="space-y-4 border-t border-black/5 pt-4">
                                            <div className="flex items-center justify-between gap-4 py-2">
                                                <div>
                                                    <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Message Selection at Checkout' : 'เลือกข้อความหลังชำระเงิน'}</label>
                                                    <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'Allow cashier to manually select a message' : 'ให้พนักงานเลือกข้อความได้เองในหน้าต่างชำระเงินสำเร็จ'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setSettings({...settings, show_story_selection_at_checkout: !settings.show_story_selection_at_checkout})}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${settings.show_story_selection_at_checkout ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.show_story_selection_at_checkout ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-6 mb-2">
                                                <label className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Messages (' : 'ข้อความทั้งหมด ('}{(settings.receipt_stories || []).length}{locale === 'en' ? ')' : ' ข้อความ)'}</label>
                                                <button 
                                                    onClick={() => {
                                                        const stories = [...(settings.receipt_stories || [])];
                                                        stories.push({ id: Date.now().toString(), title: 'บทที่ ' + (stories.length + 1), content: '' });
                                                        setSettings({...settings, receipt_stories: stories});
                                                    }}
                                                    className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Plus size={14} /> {locale === 'en' ? 'Add Message' : 'เพิ่มข้อความใหม่'}
                                                </button>
                                            </div>

                                            {(settings.receipt_stories || []).map((story: any, idx: number) => (
                                                <div key={story.id} className="p-4 bg-gray-50 border-0 rounded-xl space-y-3 relative group">
                                                    <button 
                                                        onClick={() => {
                                                            const stories = [...(settings.receipt_stories || [])].filter((_, i) => i !== idx);
                                                            setSettings({...settings, receipt_stories: stories});
                                                        }}
                                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white p-1.5 rounded-md shadow-sm border border-gray-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div>
                                                        <label className="text-[12px] font-medium text-gray-500 block mb-1">{locale === 'en' ? 'Title' : 'ชื่อข้อความ'}</label>
                                                        <input 
                                                            type="text" 
                                                            value={story.title}
                                                            onChange={e => {
                                                                const stories = [...(settings.receipt_stories || [])];
                                                                stories[idx].title = e.target.value;
                                                                setSettings({...settings, receipt_stories: stories});
                                                            }}
                                                            className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[13px] outline-none pr-10 shadow-sm" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[12px] font-medium text-gray-500 block mb-1">{locale === 'en' ? 'Content' : 'เนื้อหา'}</label>
                                                        <textarea 
                                                            value={story.content}
                                                            onChange={e => {
                                                                const stories = [...(settings.receipt_stories || [])];
                                                                stories[idx].content = e.target.value;
                                                                setSettings({...settings, receipt_stories: stories});
                                                            }}
                                                            className="w-full bg-white border-0 rounded-lg py-2 px-3 text-[13px] outline-none min-h-[80px] resize-none shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!settings.receipt_stories || settings.receipt_stories.length === 0) && (
                                                <div className="py-8 text-center text-gray-400 text-[13px] border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                                    {locale === 'en' ? 'No messages added yet' : 'ยังไม่มีข้อความ กรุณาเพิ่มข้อความใหม่'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* KITCHEN SETTINGS SECTION */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Kitchen Settings' : 'ตั้งค่าบิลส่งครัว'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">{locale === 'en' ? 'Font size and display options for kitchen printing' : 'รูปแบบตัวอักษรและการแสดงผลสำหรับบิลที่พิมพ์เข้าห้องครัว'}</p>
                                    
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Kitchen Font Size' : 'ขนาดตัวอักษรรายการอาหาร'}</label>
                                            </div>
                                            <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                                                <button onClick={() => setSettings({...settings, kitchen_font_size: 'normal'})} className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${(!settings.kitchen_font_size || settings.kitchen_font_size === 'normal') ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{locale === 'en' ? 'Normal' : 'ปกติ'}</button>
                                                <button onClick={() => setSettings({...settings, kitchen_font_size: 'large'})} className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${settings.kitchen_font_size === 'large' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{locale === 'en' ? 'Large' : 'ใหญ่'}</button>
                                                <button onClick={() => setSettings({...settings, kitchen_font_size: 'huge'})} className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${settings.kitchen_font_size === 'huge' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{locale === 'en' ? 'Huge' : 'ใหญ่มาก'}</button>
                                            </div>
                                        </div>

                                        <div className="border-t border-black/5 pt-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Show Order Type' : 'แสดงประเภทออเดอร์'}</label>
                                                    <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'Dine-in, Takeaway, Delivery' : 'เช่น ทานที่ร้าน, สั่งกลับบ้าน, เดลิเวอรี่'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setSettings({...settings, kitchen_show_type: settings.kitchen_show_type === false ? true : false})}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${settings.kitchen_show_type !== false ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm flex items-center justify-center ${settings.kitchen_show_type !== false ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* TAB: SHIFT & DRAWER */}
                        {activeTab === 'shift' && (() => {
                            const shiftSettings = settings?.opening_hours?.shift_settings || {};
                            const updateShiftSetting = (key: string, value: any) => {
                                setSettings((prev: any) => {
                                    const opening_hours = { ...(prev.opening_hours || {}) };
                                    const shift_settings = { ...(opening_hours.shift_settings || {}) };
                                    shift_settings[key] = value;
                                    opening_hours.shift_settings = shift_settings;
                                    return { ...prev, opening_hours };
                                });
                            };

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                        <h3 className="text-[17px] font-semibold mb-1">
                                            {locale === 'en' ? 'Shift & Cash Drawer Settings' : 'ตั้งค่ากะและลิ้นชักเก็บเงิน'}
                                        </h3>
                                        <p className="text-[13px] text-gray-500 mb-6">
                                            {locale === 'en' ? 'Manage cash drawer and shift closing rules' : 'จัดการลิ้นชักเก็บเงินและเงื่อนไขการปิดกะ'}
                                        </p>

                                        <div className="space-y-0 divide-y divide-black/5 border-t border-black/5">
                                            {/* Default Start Cash */}
                                            <div className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Default Starting Cash' : 'เงินทอนเริ่มต้นอัตโนมัติ'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Set default cash amount when opening a new shift' : 'ตั้งค่าจำนวนเงินทอนตั้งต้นที่จะแสดงอัตโนมัติเมื่อเปิดกะ'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={shiftSettings.default_start_cash ?? ''}
                                                        onChange={(e) => updateShiftSetting('default_start_cash', Number(e.target.value))}
                                                        className="w-24 sm:w-32 bg-gray-50 border-0 rounded-lg py-2 px-3 text-right text-[14px] outline-none"
                                                        placeholder="2000"
                                                    />
                                                    <span className="text-[13px] font-medium text-gray-400">THB</span>
                                                </div>
                                            </div>

                                            {/* Late Grace Period */}
                                            <div className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Late Grace Period' : 'ระยะเวลาผ่อนผันมาสาย'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Minutes staff can be late without deduction' : 'จำนวนนาทีที่พนักงานสามารถเข้างานสายได้โดยไม่ถูกหักเงิน'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={shiftSettings.late_grace_period_minutes ?? 10}
                                                        onChange={(e) => updateShiftSetting('late_grace_period_minutes', Number(e.target.value))}
                                                        className="w-24 sm:w-32 bg-gray-50 border-0 rounded-lg py-2 px-3 text-right text-[14px] outline-none"
                                                        placeholder="10"
                                                    />
                                                    <span className="text-[13px] font-medium text-gray-400">{locale === 'en' ? 'Mins' : 'นาที'}</span>
                                                </div>
                                            </div>

                                            {/* Check Open Bills */}
                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Check Open Bills' : 'ตรวจบิลที่ค้างอยู่ก่อนปิดกะ'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Prevent shift closing if there are unpaid tables or orders' : 'ระบบจะเตือนและบล็อกไม่ให้ปิดกะ หากยังมีออเดอร์หรือโต๊ะที่ยังไม่ได้ชำระเงิน'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => updateShiftSetting('check_open_bills_before_close', !(shiftSettings.check_open_bills_before_close ?? true))}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${(shiftSettings.check_open_bills_before_close ?? true) ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${(shiftSettings.check_open_bills_before_close ?? true) ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>

                                            {/* Lock Edit Bills */}
                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Lock Editing in Closed Shifts' : 'ล็อกการแก้ไขบิลข้ามกะ'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Prevent editing payment methods for bills in closed shifts (Void only)' : 'ห้ามแก้ไขช่องทางชำระเงินของบิลที่อยู่ในกะที่ปิดไปแล้ว (อนุญาตให้ Void ได้อย่างเดียว)'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => updateShiftSetting('edit_bill_only_in_open_shift', !(shiftSettings.edit_bill_only_in_open_shift ?? true))}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${(shiftSettings.edit_bill_only_in_open_shift ?? true) ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${(shiftSettings.edit_bill_only_in_open_shift ?? true) ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>

                                            {/* Auto Z-Report Email */}
                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Automated Z-Report Email' : 'ส่งอีเมลสรุปยอดกะอัตโนมัติ'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Send Z-Report email to shop owners automatically upon shift closing' : 'ส่งอีเมลสรุปยอดขายเข้าอีเมลเจ้าของร้านทันทีที่ปิดกะสำเร็จ'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => updateShiftSetting('auto_email_zreport', !(shiftSettings.auto_email_zreport ?? false))}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${(shiftSettings.auto_email_zreport ?? false) ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${(shiftSettings.auto_email_zreport ?? false) ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>

                                            {/* Drawer Kick on Credit Card */}
                                            <div className="py-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Open Drawer on Credit Card' : 'ลิ้นชักเด้งเมื่อจ่ายด้วยบัตรเครดิต'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Trigger cash drawer opening for credit card payments' : 'เปิดลิ้นชักอัตโนมัติเพื่อเก็บสลิปบัตรเครดิตเมื่อลูกค้าชำระเงินด้วยบัตร'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => updateShiftSetting('drawer_kick_on_credit', !(shiftSettings.drawer_kick_on_credit ?? false))}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${(shiftSettings.drawer_kick_on_credit ?? false) ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${(shiftSettings.drawer_kick_on_credit ?? false) ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>

                                            {/* Drawer Kick on Custom Payment */}
                                            <div className="pt-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="text-[14px] font-medium text-gray-900">{locale === 'en' ? 'Open Drawer on Custom Payment' : 'ลิ้นชักเด้งเมื่อชำระวิธีอื่นๆ'}</h4>
                                                    <p className="text-[12px] text-gray-500 mt-1">
                                                        {locale === 'en' ? 'Trigger cash drawer opening for promptpay/custom payment methods' : 'เปิดลิ้นชักอัตโนมัติเมื่อชำระเงินด้วยวิธีอื่นๆ เช่น โอนเงิน, คูปอง'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => updateShiftSetting('drawer_kick_on_custom', !(shiftSettings.drawer_kick_on_custom ?? false))}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${(shiftSettings.drawer_kick_on_custom ?? false) ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${(shiftSettings.drawer_kick_on_custom ?? false) ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* TAB: ADVANCED */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Loyalty System' : 'ระบบสมาชิก & สะสมแต้ม'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">
                                        {locale === 'en' ? 'Configure earn and redeem rates for members' : 'ตั้งค่าอัตราส่วนการสะสมและแลกแต้มของสมาชิกร้าน'}
                                    </p>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-2xl border-0 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                            <div className="flex-1 w-full">
                                                <label className="text-[14px] font-medium text-gray-900 block mb-1">
                                                    {locale === 'en' ? 'Earn Rate' : 'เงื่อนไขการได้รับแต้ม (Earn Rate)'}
                                                </label>
                                                <p className="text-[12px] text-gray-500">
                                                    {locale === 'en' ? 'THB spent to earn 1 Point' : 'ทุกๆ ยอดสั่งซื้อกี่บาท ถึงจะได้รับ 1 แต้ม'}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 shrink-0 self-stretch lg:self-auto justify-center">
                                                <div className="relative w-20">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_earn_thb !== undefined ? settings.loyalty_earn_thb : (settings.loyalty_earn_rate || 100)}
                                                        onChange={e => setSettings({...settings, loyalty_earn_thb: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-transparent border-b-2 border-gray-100 hover:border-gray-200 focus:border-black rounded-none text-center text-[15px] font-medium outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[13px] font-medium text-gray-400">{locale === 'en' ? 'THB' : 'บาท'}</span>
                                                <span className="text-[14px] font-medium text-gray-300 mx-1">➜</span>
                                                <span className="text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap">รับ</span>
                                                <div className="relative w-16">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_earn_pts !== undefined ? settings.loyalty_earn_pts : 1}
                                                        onChange={e => setSettings({...settings, loyalty_earn_pts: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-transparent border-b-2 border-gray-100 hover:border-gray-200 focus:border-black rounded-none text-center text-[15px] font-medium outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[13px] font-medium text-emerald-600">{locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-2xl border-0 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                            <div className="flex-1 w-full">
                                                <label className="text-[14px] font-medium text-gray-900 block mb-1">
                                                    {locale === 'en' ? 'Redemption Rate' : 'เงื่อนไขการแลกส่วนลด (Redemption)'}
                                                </label>
                                                <p className="text-[12px] text-gray-500">
                                                    {locale === 'en' ? 'Points required for 1 THB discount' : 'ต้องใช้กี่แต้ม เพื่อแลกรับส่วนลด 1 บาท'}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 shrink-0 self-stretch lg:self-auto justify-center">
                                                <span className="text-[12px] font-medium text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap">ใช้</span>
                                                <div className="relative w-20">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_redeem_pts !== undefined ? settings.loyalty_redeem_pts : 1}
                                                        onChange={e => setSettings({...settings, loyalty_redeem_pts: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-transparent border-b-2 border-gray-100 hover:border-gray-200 focus:border-black rounded-none text-center text-[15px] font-medium outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[13px] font-medium text-gray-400">{locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                                <span className="text-[14px] font-medium text-gray-300 mx-1">➜</span>
                                                <span className="text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap">ลด</span>
                                                <div className="relative w-20">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_redeem_thb !== undefined ? settings.loyalty_redeem_thb : (settings.loyalty_points_per_thb || 10)}
                                                        onChange={e => setSettings({...settings, loyalty_redeem_thb: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-transparent border-b-2 border-gray-100 hover:border-gray-200 focus:border-black rounded-none text-center text-[15px] font-medium outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[13px] font-medium text-emerald-600">{locale === 'en' ? 'THB' : 'บาท'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-black/5 space-y-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Special Day Multiplier' : 'แคมเปญวันพิเศษทวีคูณ (Special Day Multiplier)'}</label>
                                                <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'Automatically multiply points earned on specific days' : 'คูณคะแนนสะสมให้อัตโนมัติเมื่อตรงกับวันที่กำหนด'}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const h = settings.opening_hours || {};
                                                    const isAllowed = h.loyalty_special_day_active === true;
                                                    setSettings({...settings, opening_hours: { ...h, loyalty_special_day_active: !isAllowed }});
                                                }}
                                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${settings.opening_hours?.loyalty_special_day_active ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.opening_hours?.loyalty_special_day_active ? 'left-[22px]' : 'left-[2px]'}`} />
                                            </button>
                                        </div>

                                        {settings.opening_hours?.loyalty_special_day_active && (
                                            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in zoom-in-95">
                                                <div className="flex-1 w-full">
                                                    <label className="text-[13px] font-medium text-gray-900 mb-2 block">
                                                        {locale === 'en' ? 'Day of Week' : 'เลือกวันที่จะคูณคะแนน (Day of Week)'}
                                                    </label>
                                                    <select 
                                                        value={settings.opening_hours?.loyalty_special_day_index !== undefined ? settings.opening_hours.loyalty_special_day_index : 3}
                                                        onChange={e => {
                                                            const h = settings.opening_hours || {};
                                                            setSettings({...settings, opening_hours: { ...h, loyalty_special_day_index: parseInt(e.target.value) }});
                                                        }}
                                                        className="w-full bg-white border-0 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-2.5 px-4 text-[14px] outline-none shadow-sm"
                                                    >
                                                        <option value={0}>{locale === 'en' ? 'Sunday' : 'วันอาทิตย์ (Sunday)'}</option>
                                                        <option value={1}>{locale === 'en' ? 'Monday' : 'วันจันทร์ (Monday)'}</option>
                                                        <option value={2}>{locale === 'en' ? 'Tuesday' : 'วันอังคาร (Tuesday)'}</option>
                                                        <option value={3}>{locale === 'en' ? 'Wednesday' : 'วันพุธ (Wednesday)'}</option>
                                                        <option value={4}>{locale === 'en' ? 'Thursday' : 'วันพฤหัสบดี (Thursday)'}</option>
                                                        <option value={5}>{locale === 'en' ? 'Friday' : 'วันศุกร์ (Friday)'}</option>
                                                        <option value={6}>{locale === 'en' ? 'Saturday' : 'วันเสาร์ (Saturday)'}</option>
                                                    </select>
                                                </div>
                                                <div className="w-full sm:w-auto shrink-0 flex items-end gap-3">
                                                    <div className="flex-1 sm:w-32">
                                                        <label className="text-[13px] font-medium text-gray-900 mb-2 block">
                                                            {locale === 'en' ? 'Multiplier' : 'ตัวคูณ (Multiplier)'}
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-medium text-[15px]">x</div>
                                                            <input 
                                                                type="number"
                                                                min="2"
                                                                max="10"
                                                                step="1"
                                                                value={settings.opening_hours?.loyalty_special_day_multiplier !== undefined ? settings.opening_hours.loyalty_special_day_multiplier : 2}
                                                                onChange={e => {
                                                                    const h = settings.opening_hours || {};
                                                                    setSettings({...settings, opening_hours: { ...h, loyalty_special_day_multiplier: parseFloat(e.target.value) || 2 }});
                                                                }}
                                                                className="w-full bg-white border-0 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-2.5 pl-10 pr-4 text-[14px] font-medium outline-none shadow-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'QR Payment System' : 'ระบบสั่งอาหารผ่าน QR (QR Payment)'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">
                                        {locale === 'en' ? 'Configure QR ordering and payment capabilities' : 'ตั้งค่าการสั่งอาหารและการชำระเงินผ่าน QR Code'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <label className="text-[14px] font-medium text-gray-900 block">{locale === 'en' ? 'Allow Mobile Payment at Table' : 'อนุญาตให้ลูกค้าจ่ายเงินที่โต๊ะผ่านมือถือ'}</label>
                                            <p className="text-[12px] text-gray-500 mt-1">{locale === 'en' ? 'If disabled, customers must pay at the counter' : 'เมื่อปิด ลูกค้าจะต้องมาจ่ายที่เคาน์เตอร์'}</p>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const h = settings.opening_hours || {};
                                                const isAllowed = h.allow_qr_payment !== false;
                                                const newSettings = {...settings, opening_hours: { ...h, allow_qr_payment: !isAllowed }};
                                                setSettings(newSettings);
                                                const targetId = settings.id || '00000000-0000-0000-0000-000000000001';
                                                await supabase.from('pos_shop_settings').update({ opening_hours: newSettings.opening_hours }).eq('id', targetId);
                                            }}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${settings.opening_hours?.allow_qr_payment !== false ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.opening_hours?.allow_qr_payment !== false ? 'left-[22px]' : 'left-[2px]'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* MYSTERY BOX SETTINGS */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Mystery Box' : 'กล่องสุ่มรางวัล (Mystery Box)'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">
                                        {locale === 'en' ? 'Set points required to play and prize probabilities' : 'ตั้งค่าคะแนนที่ใช้เล่น และโอกาสการได้รางวัลแต่ละระดับ'}
                                    </p>
                                    
                                    <div className="bg-gray-50 p-6 rounded-2xl border-0 flex flex-col md:flex-row items-center gap-6 mb-8">
                                        <div className="flex-1 w-full">
                                            <label className="text-[14px] font-medium text-gray-900 block mb-1">
                                                {locale === 'en' ? 'Points per Play' : 'คะแนนที่ต้องใช้เล่น'}
                                            </label>
                                            <p className="text-[12px] text-gray-500">
                                                {locale === 'en' ? 'Points deducted when customer plays' : 'แต้มที่ลูกค้าจะถูกหักเมื่อกดสุ่ม'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100">
                                            <span className="text-[12px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap">จ่าย</span>
                                            <div className="relative w-20">
                                                <input 
                                                    type="number" 
                                                    value={settings.mystery_box_cost || 50}
                                                    onChange={e => setSettings({...settings, mystery_box_cost: parseInt(e.target.value) || 0})}
                                                    className="w-full bg-transparent border-0 rounded-lg text-center text-[15px] font-medium outline-none" 
                                                />
                                            </div>
                                            <span className="text-[13px] font-medium text-gray-400">{locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[14px] font-medium text-gray-900 block mb-2">{locale === 'en' ? 'Prizes and Probabilities (Total must = 100%)' : 'ของรางวัลและโอกาสการได้ (รวมต้อง = 100%)'}</label>
                                        {(settings.mystery_box_prizes || []).map((prize: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 flex-wrap hover:border-gray-200 transition-colors">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="text-[12px] font-medium text-gray-500 block mb-1">{locale === 'en' ? 'Prize Type' : 'ประเภทรางวัล'}</label>
                                                    <select 
                                                        value={prize.type || 'points'}
                                                        onChange={e => {
                                                            const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                            newPrizes[idx].type = e.target.value;
                                                            if (e.target.value === 'coupon') {
                                                                newPrizes[idx].points = 0;
                                                            }
                                                            setSettings({...settings, mystery_box_prizes: newPrizes});
                                                        }}
                                                        className="w-full bg-gray-50 border-0 rounded-lg py-2 px-3 text-[14px] font-medium outline-none mb-3"
                                                    >
                                                        <option value="points">{locale === 'en' ? 'Points' : 'ได้คะแนน (Points)'}</option>
                                                        <option value="coupon">{locale === 'en' ? 'Coupon' : 'ได้คูปอง (Coupon)'}</option>
                                                    </select>
                                                    
                                                    {(!prize.type || prize.type === 'points') ? (
                                                        <>
                                                            <label className="text-[12px] font-medium text-gray-500 block mb-1">{locale === 'en' ? 'Points to Reward' : 'แต้มที่จะได้รับ'}</label>
                                                            <input 
                                                                type="number" 
                                                                value={prize.points || 0}
                                                                onChange={e => {
                                                                    const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                                    newPrizes[idx].points = parseInt(e.target.value) || 0;
                                                                    setSettings({...settings, mystery_box_prizes: newPrizes});
                                                                }}
                                                                className="w-full bg-gray-50 border-0 rounded-lg py-2 px-3 text-[14px] font-medium outline-none" 
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <label className="text-[12px] font-medium text-gray-500 block mb-1">{locale === 'en' ? 'Select Coupon' : 'เลือกคูปอง'}</label>
                                                            <select 
                                                                value={prize.coupon_name || ''}
                                                                onChange={e => {
                                                                    const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                                    newPrizes[idx].coupon_name = e.target.value;
                                                                    setSettings({...settings, mystery_box_prizes: newPrizes});
                                                                }}
                                                                className="w-full bg-gray-50 border-0 rounded-lg py-2 px-3 text-[14px] font-medium outline-none" 
                                                            >
                                                                <option value="">{locale === 'en' ? '-- Select Coupon --' : '-- เลือกคูปอง --'}</option>
                                                                {availableCoupons.map(c => (
                                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-[120px] self-end pb-0.5">
                                                    <label className="text-[12px] font-medium text-gray-500 block mb-1">{locale === 'en' ? 'Chance (%)' : 'โอกาสสุ่มได้ (%)'}</label>
                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg pr-3">
                                                        <input 
                                                            type="number" 
                                                            value={prize.chance}
                                                            onChange={e => {
                                                                const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                                newPrizes[idx].chance = parseInt(e.target.value) || 0;
                                                                setSettings({...settings, mystery_box_prizes: newPrizes});
                                                            }}
                                                            className="w-full bg-transparent border-0 rounded-lg py-2 pl-3 text-[14px] font-medium outline-none" 
                                                        />
                                                        <span className="text-gray-400 font-medium text-[13px]">%</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newPrizes = (settings.mystery_box_prizes || []).filter((_: any, i: number) => i !== idx);
                                                        setSettings({...settings, mystery_box_prizes: newPrizes});
                                                    }}
                                                    className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg mt-5 transition-colors self-end shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newPrizes = [...(settings.mystery_box_prizes || []), { type: 'points', points: 0, chance: 0 }];
                                                setSettings({...settings, mystery_box_prizes: newPrizes});
                                            }}
                                            className="w-full py-3.5 border border-dashed border-gray-300 rounded-xl text-[14px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-gray-50 mt-4"
                                        >
                                            <Plus size={16} /> {locale === 'en' ? 'Add Prize' : 'เพิ่มรางวัล'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: PERMISSIONS */}
                        {activeTab === 'permissions' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Role Permissions' : 'สิทธิ์การเข้าถึง (Role Permissions)'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-8">
                                        {locale === 'en' ? 'Configure access levels for different staff roles in the POS app' : 'อนุญาตให้พนักงานแต่ละระดับสามารถเข้าถึงหน้าต่างต่างๆ ในแอป POS ได้'}
                                    </p>
                                    
                                    {/* Role Management UI */}
                                    <div className="mb-10 p-6 bg-gray-50 rounded-2xl border-0 flex flex-col gap-4">
                                        <h4 className="text-[13px] font-medium text-gray-900 flex items-center gap-2">
                                            {locale === 'en' ? 'Manage Roles' : 'จัดการตำแหน่งพนักงาน (Manage Roles)'}
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {(settings.custom_roles || []).map((role: any) => (
                                                <div key={role.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                    <span className="text-[13px] font-medium text-gray-700">{role.label}</span>
                                                    {!role.is_system && (
                                                        <button 
                                                            onClick={() => {
                                                                if (window.confirm('ยืนยันการลบตำแหน่งนี้? พนักงานที่มีตำแหน่งนี้อาจไม่สามารถใช้งานระบบได้หากไม่แก้ไขตำแหน่งใหม่')) {
                                                                    setSettings({
                                                                        ...settings,
                                                                        custom_roles: settings.custom_roles.filter((r: any) => r.id !== role.id)
                                                                    })
                                                                }
                                                            }}
                                                            className="text-rose-400 hover:text-rose-600 ml-1 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex">
                                            <button 
                                                onClick={() => {
                                                    const roleName = window.prompt('ระบุชื่อตำแหน่งใหม่ (เช่น บาริสต้า, แม่บ้าน):');
                                                    if (roleName && roleName.trim()) {
                                                        const newId = roleName.trim().toLowerCase().replace(/\s+/g, '-');
                                                        if (settings.custom_roles?.find((r: any) => r.id === newId)) {
                                                            alert('มีตำแหน่งนี้อยู่แล้ว');
                                                            return;
                                                        }
                                                        setSettings({
                                                            ...settings,
                                                            custom_roles: [...(settings.custom_roles || []), { id: newId, label: roleName.trim(), is_system: false }]
                                                        })
                                                    }
                                                }}
                                                className="px-4 py-2 bg-indigo-50/50 text-indigo-600 border border-indigo-100 rounded-xl text-[13px] font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={14} /> {locale === 'en' ? 'Add New Role' : 'เพิ่มตำแหน่งใหม่'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {(settings.custom_roles || []).map((roleObj: any) => {
                                            const role = roleObj.id;
                                            return (
                                            <div key={role} className="space-y-4">
                                                <h4 className="text-[14px] font-medium text-gray-900 mb-4 pb-3 border-b border-black/5 flex items-center gap-2">
                                                    {editingRole === role ? (
                                                        <div className="flex items-center gap-2 w-full">
                                                            <input 
                                                                type="text"
                                                                value={editingRoleName}
                                                                onChange={(e) => setEditingRoleName(e.target.value)}
                                                                className="border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-[13px] font-medium w-full outline-none transition-all"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => {
                                                                if (editingRoleName.trim()) {
                                                                    setSettings({
                                                                        ...settings,
                                                                        custom_roles: settings.custom_roles?.map((r: any) => r.id === role ? { ...r, label: editingRoleName.trim() } : r)
                                                                    })
                                                                }
                                                                setEditingRole(null)
                                                            }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                                                                <Check size={14} />
                                                            </button>
                                                            <button onClick={() => setEditingRole(null)} className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="flex-1">{roleObj.label}</span>
                                                            <button onClick={() => {
                                                                setEditingRole(role)
                                                                setEditingRoleName(roleObj.label)
                                                            }} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                                                <Edit2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </h4>
                                                <div className="space-y-6">
                                                    {permissionGroups.map((group, groupIdx) => (
                                                        <div key={groupIdx}>
                                                            <div className="text-[12px] font-medium text-gray-400 mb-3 ml-2">{group.groupLabel}</div>
                                                            <div className="space-y-1">
                                                                {group.options.map((opt) => {
                                                                    const isChecked = (settings.role_permissions?.[role] || []).includes(opt.id)
                                                                    return (
                                                                        <div key={opt.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent cursor-pointer group"
                                                                             onClick={() => {
                                                                                 const current = settings.role_permissions?.[role] || []
                                                                                 const next = isChecked ? current.filter((c: string) => c !== opt.id) : [...current, opt.id]
                                                                                 setSettings({
                                                                                     ...settings,
                                                                                     role_permissions: { ...settings.role_permissions, [role]: next }
                                                                                 })
                                                                             }}
                                                                        >
                                                                            <div className="pt-0.5">
                                                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-300 group-hover:border-indigo-400'}`}>
                                                                                    {isChecked && <Check size={12} strokeWidth={3} />}
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className={`text-[13px] font-medium transition-colors ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</div>
                                                                                <div className="text-[12px] text-gray-500 mt-0.5">{opt.desc}</div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>

                                {/* CHECKLIST SETTINGS */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Checkout Checklist' : 'รายการตรวจสอบก่อนเลิกงาน (Checkout Checklist)'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">
                                        {locale === 'en' ? 'Set up tasks employees must complete and confirm before clocking out' : 'ตั้งค่ารายการที่พนักงานต้องทำและกดยืนยันให้ครบก่อนลงเวลาออกงาน'}
                                    </p>

                                    <div className="space-y-3">
                                        {(settings.opening_hours?.checkout_checklist || []).map((item: string, index: number) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const newList = [...(settings.opening_hours?.checkout_checklist || [])]
                                                        newList[index] = e.target.value
                                                        setSettings({
                                                            ...settings,
                                                            opening_hours: { ...settings.opening_hours, checkout_checklist: newList }
                                                        })
                                                    }}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                                    placeholder="เช่น ปิดเครื่องชงกาแฟ"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newList = (settings.opening_hours?.checkout_checklist || []).filter((_: any, i: number) => i !== index)
                                                        setSettings({
                                                            ...settings,
                                                            opening_hours: { ...settings.opening_hours, checkout_checklist: newList }
                                                        })
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => {
                                                const newList = [...(settings.opening_hours?.checkout_checklist || []), '']
                                                setSettings({
                                                    ...settings,
                                                    opening_hours: { ...settings.opening_hours, checkout_checklist: newList }
                                                })
                                            }}
                                            className="w-full py-3.5 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-[13px] font-medium mt-2"
                                        >
                                            <Plus size={16} /> {locale === 'en' ? 'Add Checklist Item' : 'เพิ่มรายการตรวจสอบ'}
                                        </button>
                                    </div>
                                </div>

                                {/* REQUIRED AUDIT CATEGORIES SETTINGS */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <h3 className="text-[17px] font-semibold mb-1">
                                        {locale === 'en' ? 'Required Daily Audits' : 'บังคับนับสต็อกก่อนเลิกงาน (Required Daily Audits)'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-6">
                                        {locale === 'en' ? 'Select inventory categories employees must audit daily before they can clock out' : 'เลือกหมวดหมู่ที่บังคับให้พนักงานต้องนับสต็อกให้เสร็จสิ้นในแต่ละวันก่อนถึงจะลงเวลาออกงานได้'}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {inventoryCategories.map((cat: any) => {
                                            const isRequired = (settings.opening_hours?.required_audit_categories || []).includes(cat.id);
                                            return (
                                                <div 
                                                    key={cat.id} 
                                                    className="flex items-center gap-3 cursor-pointer group p-3.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all"
                                                    onClick={() => {
                                                        const current = settings.opening_hours?.required_audit_categories || [];
                                                        const next = isRequired ? current.filter((id: string) => id !== cat.id) : [...current, cat.id];
                                                        setSettings({
                                                            ...settings,
                                                            opening_hours: { ...settings.opening_hours, required_audit_categories: next }
                                                        });
                                                    }}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isRequired ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 bg-white group-hover:border-indigo-400'}`}>
                                                        {isRequired && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <span className={`text-[13px] font-medium ${isRequired ? 'text-gray-900' : 'text-gray-600'}`}>{cat.name}</span>
                                                </div>
                                            );
                                        })}
                                        {inventoryCategories.length === 0 && (
                                            <div className="col-span-full text-center py-8 text-gray-400 text-[13px]">
                                                {locale === 'en' ? 'No inventory categories found' : 'ไม่มีข้อมูลหมวดหมู่สินค้าในสต็อก'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: HARDWARE & PRINTERS */}
                        {activeTab === 'hardware' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* Audio & Sound Settings Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-[17px] font-semibold mb-1">
                                                {locale === 'en' ? 'System Sound Effects' : 'ระบบเสียงการทำงาน (Sound Effects)'}
                                            </h3>
                                            <p className="text-[13px] text-gray-500">
                                                {locale === 'en' ? 'Enable or disable sound effects on POS terminal interactions' : 'เปิด/ปิด เสียงเอฟเฟกต์การกดปุ่มและเสียงแจ้งเตือนออเดอร์ใหม่'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const isCurrentlyMuted = localStorage.getItem('pos_mute_sounds') === 'true';
                                                const newMutedState = !isCurrentlyMuted;
                                                localStorage.setItem('pos_mute_sounds', String(newMutedState));
                                                window.dispatchEvent(new Event('pos_mute_changed'));
                                                setSettings((prev: any) => ({ ...prev, _mute_force_update: Date.now() }));
                                            }}
                                            className={`px-4 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all border shadow-sm ${
                                                (typeof window !== 'undefined' && localStorage.getItem('pos_mute_sounds') === 'true')
                                                    ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'
                                                    : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                            }`}
                                        >
                                            { (typeof window !== 'undefined' && localStorage.getItem('pos_mute_sounds') === 'true') ? '🔇 ปิดเสียงระบบอยู่' : '🔊 เปิดเสียงระบบอยู่' }
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-black/5">
                                        <div>
                                            <h3 className="text-[17px] font-semibold mb-1">
                                                {locale === 'en' ? 'Printers' : 'อุปกรณ์ปริ้นเตอร์ (Printers)'}
                                            </h3>
                                            <p className="text-[13px] text-gray-500">{locale === 'en' ? 'Manage network receipt printers (TCP/IP)' : 'จัดการการเชื่อมต่อเครื่องพิมพ์ใบเสร็จผ่านระบบเครือข่าย (TCP/IP)'}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const p = [...(settings.printers || [])];
                                                p.push({ ip: '', type: 'receipt', name: 'Printer ' + (p.length + 1), encoding: 'text-leveling-16', categories: ['all'] });
                                                setSettings({...settings, printers: p});
                                            }}
                                            className="bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-medium text-[13px] flex items-center gap-2 transition-all shadow-sm"
                                        >
                                            <Plus size={16} /> {locale === 'en' ? 'Add Printer' : 'เพิ่มเครื่องปริ้น'}
                                        </button>
                                    </div>

                                    {(settings.printers || []).map((printer: any, index: number) => (
                                        <div key={index} className="mb-6 p-6 sm:p-8 bg-gray-50 border-0 rounded-2xl relative overflow-hidden group">
                                            
                                            <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between mb-8 relative z-10">
                                                <div className="flex-1 w-full">
                                                    <input 
                                                        type="text" 
                                                        value={printer.name}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].name = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="bg-transparent border-none text-[20px] font-semibold outline-none placeholder:text-gray-300 w-full p-0"
                                                        placeholder="Printer Name"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const p = [...(settings.printers || [])].filter((_, i) => i !== index);
                                                        setSettings({...settings, printers: p});
                                                    }}
                                                    className="w-10 h-10 bg-white border border-gray-100 hover:border-rose-200 hover:bg-rose-50 text-gray-400 hover:text-rose-500 flex items-center justify-center rounded-xl transition-all shadow-sm flex-shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                                <div className="space-y-2">
                                                    <label className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5"><MapPin size={12}/> IP Address</label>
                                                    <input 
                                                        type="text" 
                                                        value={printer.ip}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].ip = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-[13px] font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" 
                                                        placeholder="192.168.1.100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5"><Printer size={12}/> Printer Model</label>
                                                    <select 
                                                        value={printer.model || 'xprinter-xp-n160ii'}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].model = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-[13px] font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" 
                                                    >
                                                        <option value="xprinter-xp-n160ii">Xprinter XP-N160II</option>
                                                        <option value="xprinter-xp-c300h">Xprinter XP-C300H</option>
                                                        <option value="epson-tm-t82x">Epson TM-T82X</option>
                                                        <option value="generic">Generic ESC/POS</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5"><Settings size={12}/> {locale === 'en' ? 'Thai Encoding' : 'การเข้ารหัสภาษาไทย'}</label>
                                                    <select 
                                                        value={printer.encoding || 'ku42'}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].encoding = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-[13px] font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" 
                                                    >
                                                        <option value="ku42">{locale === 'en' ? 'Thai (Text Mode)' : 'ภาษาไทย (Text Mode)'}</option>
                                                        <option value="graphic">{locale === 'en' ? 'Graphic Mode' : 'โหมดรูปภาพ (Graphic Mode)'}</option>
                                                    </select>
                                                </div>


                                                <div className="md:col-span-2 lg:col-span-3 space-y-3 mt-2">
                                                    <label className="text-[12px] font-medium text-gray-500">{locale === 'en' ? 'Printer Role' : 'หน้าที่ของเครื่องพิมพ์นี้ (Role)'}</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[
                                                            { id: 'receipt', label: locale === 'en' ? 'Receipt' : 'ใบเสร็จ' },
                                                            { id: 'kitchen', label: locale === 'en' ? 'Kitchen' : 'ใบสั่งอาหาร' },
                                                            { id: 'both', label: locale === 'en' ? 'Both' : 'ทั้งใบเสร็จและห้องครัว' }
                                                        ].map(role => (
                                                            <button 
                                                                key={role.id}
                                                                onClick={() => {
                                                                    const p = [...(settings.printers || [])];
                                                                    p[index].type = role.id;
                                                                    setSettings({...settings, printers: p});
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${printer.type === role.id ? 'bg-indigo-500 text-white shadow-sm border border-indigo-500' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                            >
                                                                {role.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Kitchen Categories Logic */}
                                                {(printer.type === 'kitchen' || printer.type === 'both') && (
                                                    <div className="md:col-span-2 lg:col-span-3 mt-4 pt-6 border-t border-black/5 space-y-3">
                                                        <label className="text-[12px] font-medium text-gray-500">{locale === 'en' ? 'Print Specific Categories' : 'พิมพ์เฉพาะหมวดหมู่อาหาร (สำหรับครัวแยก)'}</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    const p = [...(settings.printers || [])];
                                                                    p[index].categories = ['all'];
                                                                    setSettings({...settings, printers: p});
                                                                }}
                                                                className={`px-4 py-2 text-[13px] font-medium rounded-xl border transition-all ${printer.categories?.includes('all') ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                            >
                                                                {locale === 'en' ? 'All Categories' : 'พิมพ์ทุกหมวดหมู่'}
                                                            </button>
                                                            {categories.map((c: any) => {
                                                                const isSelected = !printer.categories?.includes('all') && printer.categories?.includes(c.id);
                                                                return (
                                                                    <button 
                                                                        key={c.id}
                                                                        onClick={() => {
                                                                            const p = [...(settings.printers || [])];
                                                                            let cats = p[index].categories || [];
                                                                            if (cats.includes('all')) cats = [];
                                                                            if (cats.includes(c.id)) {
                                                                                cats = cats.filter((id: string) => id !== c.id);
                                                                            } else {
                                                                                cats.push(c.id);
                                                                            }
                                                                            if (cats.length === 0) cats = ['all'];
                                                                            p[index].categories = cats;
                                                                            setSettings({...settings, printers: p});
                                                                        }}
                                                                        className={`px-4 py-2 text-[13px] font-medium rounded-xl border transition-all ${isSelected ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                                    >
                                                                        {c.name}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Test Buttons */}
                                                <div className="md:col-span-2 lg:col-span-3 mt-4 pt-6 border-t border-black/5 flex flex-wrap justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleDiagnosticPrint(index)}
                                                        className="px-4 py-2.5 bg-rose-50 border border-rose-100 hover:border-rose-200 text-rose-600 font-medium text-[13px] rounded-xl transition-all flex items-center gap-2"
                                                    >
                                                        <Printer size={14} /> {locale === 'en' ? 'Diagnostic Print' : 'พิมพ์ค้นหา Code Page (Diagnostic)'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleTestPrint(index)}
                                                        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 font-medium text-[13px] rounded-xl transition-all flex items-center gap-2 shadow-sm"
                                                    >
                                                        <Printer size={14} /> {locale === 'en' ? 'Test Print' : 'ทดสอบพิมพ์ใบเสร็จ'}
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                    
                                    {(!settings.printers || settings.printers.length === 0) && (
                                        <div className="py-12 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                            <Printer size={32} className="mb-4 text-gray-300" />
                                            <p className="font-medium text-[14px] text-gray-600">{locale === 'en' ? 'No printers added' : 'ยังไม่มีเครื่องปริ้นเตอร์'}</p>
                                            <p className="text-[13px] mt-1 text-gray-400">{locale === 'en' ? 'Click Add Printer to set up a new device' : 'กดปุ่ม Add Printer ด้านบนเพื่อเพิ่มอุปกรณ์'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {activeTab === 'campaigns' && <POSCampaignsTab />}



                {/* Image Crop Modal */}
                {showCropModal && selectedImage && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex flex-col justify-between p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between text-white pb-4 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-black">{locale === 'en' ? 'Crop & Adjust Banner' : 'ปรับตำแหน่งและครอบรูปแบนเนอร์'}</h3>
                                <p className="text-[10px] font-bold text-white/50">{locale === 'en' ? 'Drag to position, slide to zoom' : 'ลากรูปภาพเพื่อจัดตำแหน่ง, เลื่อนแถบด้านล่างเพื่อซูม'}</p>
                            </div>
                            <button
                                onClick={handleCancelCrop}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Crop Area Wrapper */}
                        <div className="relative flex-1 my-6 bg-black/40 rounded-3xl overflow-hidden border border-white/10">
                            <Cropper
                                image={selectedImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Footer / Controls */}
                        <div className="space-y-6 bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                            {/* Zoom Slider */}
                            <div className="flex items-center gap-4 text-white">
                                <span className="text-xs font-bold w-12 text-right">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-label="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 accent-white cursor-pointer h-1 rounded-lg"
                                />
                                <span className="text-xs font-mono w-10 text-left">{zoom.toFixed(1)}x</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={handleCancelCrop}
                                    className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition-all"
                                >
                                    {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
                                </button>
                                <button
                                    onClick={handleCropAndUpload}
                                    disabled={isUploadingBanner}
                                    className="px-8 py-3 rounded-2xl bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUploadingBanner ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            {locale === 'en' ? 'Saving Banner...' : 'กำลังบันทึกรูป...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {locale === 'en' ? 'Crop & Save' : 'ครอปและบันทึกแบนเนอร์'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                </div>
            </div>
      </main>
    </>
  )
}
