'use client';
import React, { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PrinterSocket } from 'custom-printer-plugin'
import { printCustomerReceipt, printKitchenTicket } from '@/lib/printerUtils'
import { printGraphicModeCustomerReceipt, printGraphicModeKitchenTicket } from '@/lib/graphicPrinter'
import { Plus, Loader2, Save, X, Settings, Clock, Bell, Info, Image as ImageIcon, Star, Gift, ChevronDown, ChevronUp, Upload, Trash2, Menu as MenuIcon, ChevronRight, ArrowLeft, ShieldCheck, QrCode, MapPin, Printer, Truck, Flag, RefreshCw, Store, Navigation, Percent, Camera, Users, Edit2, Check } from 'lucide-react'
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
  const [previewStoryIndex, setPreviewStoryIndex] = useState<number>(0)
  
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
    address: '',
    role_permissions: {
      manager: ['terminal', 'pos:access', 'pos:checkout', 'pos:void', 'pos:discount', 'pos:drawer', 'reports', 'reports:view', 'reports:sales', 'reports:profit', 'reports:export', 'menu-management', 'menu-stock-toggle', 'menu-edit-price', 'inventory', 'inventory:view', 'inventory:edit', 'inventory:audit', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history', 'modifiers', 'recipes', 'settings', 'settings:view', 'settings:manage', 'staff', 'staff:view', 'staff:manage', 'management'],
      staff: ['terminal', 'pos:access', 'pos:checkout', 'menu-management', 'menu-stock-toggle', 'inventory', 'inventory:view', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history']
    },
    custom_roles: [
      { id: 'manager', label: 'ผู้จัดการสาขา (Manager)', is_system: true },
      { id: 'staff', label: 'พนักงานทั่วไป (Staff)', is_system: true }
    ],
    printers: [],
    receipt_story_mode: false,
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
                    manager: ['terminal', 'pos:access', 'pos:checkout', 'pos:void', 'pos:discount', 'pos:drawer', 'reports', 'reports:view', 'reports:sales', 'reports:profit', 'reports:export', 'menu-management', 'menu-stock-toggle', 'menu-edit-price', 'inventory', 'inventory:view', 'inventory:edit', 'inventory:audit', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history', 'modifiers', 'recipes', 'settings', 'settings:view', 'settings:manage', 'staff', 'staff:view', 'staff:manage', 'management'],
                    staff: ['terminal', 'pos:access', 'pos:checkout', 'menu-management', 'menu-stock-toggle', 'inventory', 'inventory:view', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history']
                },
                custom_roles: data.custom_roles || [
                    { id: 'manager', label: 'ผู้จัดการสาขา (Manager)', is_system: true },
                    { id: 'staff', label: 'พนักงานทั่วไป (Staff)', is_system: true }
                ],
                printers: data.printers || [],
                receipt_header: data.opening_hours?.receipt_header || '',
                receipt_story_mode: data.opening_hours?.receipt_story_mode || false,
                receipt_stories: data.opening_hours?.receipt_stories || [],
                receipt_show_logo: data.opening_hours?.receipt_show_logo ?? true,
                receipt_font_size: data.opening_hours?.receipt_font_size || 'normal',
                receipt_payment_qr_image: data.opening_hours?.receipt_payment_qr_image || '',
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
        receipt_stories: settings.receipt_stories,
        receipt_show_logo: settings.receipt_show_logo,
        receipt_font_size: settings.receipt_font_size,
        receipt_payment_qr_image: settings.receipt_payment_qr_image,
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
    delete payload.receipt_header;
    delete payload.receipt_story_mode;
    delete payload.receipt_stories;
    delete payload.receipt_show_logo;
    delete payload.receipt_font_size;
    delete payload.receipt_payment_qr_image;
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
                    manager: ['terminal', 'pos:access', 'pos:checkout', 'pos:void', 'pos:discount', 'pos:drawer', 'reports', 'reports:view', 'reports:sales', 'reports:profit', 'reports:export', 'menu-management', 'menu-stock-toggle', 'menu-edit-price', 'inventory', 'inventory:view', 'inventory:edit', 'inventory:audit', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history', 'modifiers', 'recipes', 'settings', 'settings:view', 'settings:manage', 'staff', 'staff:view', 'staff:manage', 'management'],
                    staff: ['terminal', 'pos:access', 'pos:checkout', 'menu-management', 'menu-stock-toggle', 'inventory', 'inventory:view', 'kitchen', 'kitchen:view', 'tables', 'members', 'drawer', 'delivery', 'history']
                },
                custom_roles: data.custom_roles || [
                    { id: 'manager', label: 'ผู้จัดการสาขา (Manager)', is_system: true },
                    { id: 'staff', label: 'พนักงานทั่วไป (Staff)', is_system: true }
                ],
                printers: data.printers || [],
                receipt_header: data.opening_hours?.receipt_header || '',
                receipt_story_mode: data.opening_hours?.receipt_story_mode || false,
                receipt_stories: data.opening_hours?.receipt_stories || [],
                receipt_show_logo: data.opening_hours?.receipt_show_logo ?? true,
                receipt_font_size: data.opening_hours?.receipt_font_size || 'normal',
                receipt_payment_qr_image: data.opening_hours?.receipt_payment_qr_image || '',
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
      <main className="flex-1 overflow-y-auto bg-[#FAFAFA] border-none custom-scrollbar text-[#1A1A18]">
          {loading ? (
             <div className="h-full flex items-center justify-center opacity-10">
                 <Loader2 className="animate-spin" size={64} />
             </div>
          ) : (
            <div className="max-w-6xl mx-auto py-10 sm:py-16 px-4 sm:px-8 space-y-8 pb-40">
                
                {/* 🧧 HEADER & CRITICAL STATUS */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{locale === 'en' ? 'ตั้งค่าร้าน ' : locale === 'zh' ? 'ตั้งค่าร้าน ' : 'ตั้งค่าร้าน '}<span className="text-gray-400 font-light">| Settings</span></h1>
                        <p className="text-[13px] font-bold text-gray-500">{locale === 'en' ? 'จัดการข้อมูลร้านค้า ใบเสร็จ และอุปกรณ์สำหรับสาขา ' : locale === 'zh' ? 'จัดการข้อมูลร้านค้า ใบเสร็จ และอุปกรณ์สำหรับสาขา ' : 'จัดการข้อมูลร้านค้า ใบเสร็จ และอุปกรณ์สำหรับสาขา '}{profile?.branch_code}</p>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-3 bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <h4 className="text-[12px] font-black uppercase tracking-tight">System Status</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${settings.status === 'open' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {settings.status === 'open' ? 'ร้านเปิดให้บริการ' : 'ร้านปิดให้บริการ'}
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    const newStatus = settings.status === 'open' ? 'closed' : 'open';
                                    setSettings({ ...settings, status: newStatus, is_open: newStatus === 'open' });
                                }}
                                className={`relative w-20 h-10 rounded-full transition-colors duration-300 shadow-inner ${settings.status === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`}
                            >
                                <div className={`absolute top-1 w-8 h-8 rounded-full bg-white transition-all duration-300 shadow-md flex items-center justify-center ${settings.status === 'open' ? 'left-11' : 'left-1'}`}>
                                    <div className={`w-2 h-2 rounded-full ${settings.status === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* SIDEBAR TABS */}
                    <div className={`w-full lg:w-64 flex-shrink-0 space-y-3 ${!showMobileMenu ? 'hidden lg:block' : 'block'}`}>
                        {[
                            { id: 'general', icon: Info, label: 'ข้อมูลร้านค้า', desc: 'ข้อมูลร้าน และ เวลาทำการ' },
                            { id: 'delivery', icon: Truck, label: 'เดลิเวอรี่', desc: 'ค่าส่ง, หัก GP' },
                            { id: 'receipt', icon: Printer, label: 'ตั้งค่าใบเสร็จ', desc: 'หัวบิล, โลโก้, ท้ายบิล' },
                            { id: 'kitchen', icon: MenuIcon, label: 'ห้องครัว', desc: 'ฟอนต์, ออเดอร์' },
                            { id: 'hardware', icon: Settings, label: 'เครื่องปริ้น', desc: 'จัดการอุปกรณ์เสริม' },
                            { id: 'campaigns', icon: Flag, label: 'แคมเปญหน้าแอป', desc: 'กิจกรรมหน้าหลักลูกค้า' },
                            { id: 'advanced', icon: Star, label: 'ระบบจ่ายเงิน & สมาชิก', desc: 'QR, พอยท์สะสม' },
                            { id: 'permissions', icon: ShieldCheck, label: 'สิทธิ์การใช้งาน', desc: 'ผู้จัดการ, พนักงาน' }
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id)
                                        setShowMobileMenu(false)
                                    }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left ${isActive ? 'bg-black text-white shadow-xl shadow-black/10 scale-[1.02]' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-[13px] leading-tight truncate">{tab.label}</div>
                                        <div className={`text-[10px] font-bold tracking-tight mt-0.5 truncate ${isActive ? 'text-white/60' : 'text-gray-400'}`}>{tab.desc}</div>
                                    </div>
                                    {isActive && <ChevronRight size={16} className="opacity-50 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className={`flex-1 min-w-0 pb-20 ${showMobileMenu ? 'hidden lg:block' : 'block'}`}>
                        
                        {/* MOBILE BACK BUTTON */}
                        <div className="lg:hidden mb-6">
                            <button 
                                onClick={() => setShowMobileMenu(true)}
                                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
                            >
                                <ChevronRight size={18} className="rotate-180" /> {locale === 'en' ? 'Back' : locale === 'zh' ? '返回' : 'ย้อนกลับ'}
                            </button>
                        </div>

                        {/* TAB: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
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
                                    <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-gray-900 mb-1">
                                                {locale === 'en' ? 'Manage LIFF Banners' : 'จัดการรูปภาพแบนเนอร์ LINE LIFF'}
                                            </h4>
                                            <p className="text-[10px] font-bold text-gray-400">
                                                {locale === 'en' ? 'Images will show in a slider at the top of your LIFF menu.' : 'รูปภาพจะเลื่อนแสดงที่ด้านบนสุดของหน้าระบบสั่งอาหาร LINE LIFF'}
                                            </p>
                                            
                                            {banners && banners.length > 0 && (
                                                <div className="flex flex-wrap gap-3 mt-4">
                                                    {banners.map((banner, index) => (
                                                        <div key={banner.id} className="relative w-20 h-10 rounded-lg overflow-hidden border border-gray-200 group/thumb shadow-sm bg-white">
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
                                            <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black text-white bg-black hover:bg-gray-800 transition-all shadow-md active:scale-95 ${isUploadingBanner ? 'pointer-events-none opacity-50' : ''}`}>
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
                                    <div className="px-6 sm:px-10 pb-10 relative">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-8">
                                            <div className="relative group">
                                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                                                    {settings.logo_url ? (
                                                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                            <Store size={40} className="opacity-50" />
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                                                    <Camera size={18} />
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
                                            <div className="text-center sm:text-left flex-1 pb-2">
                                                <h3 className="text-2xl font-black">{settings.name_th || settings.name || (locale === 'en' ? 'Shop Name' : 'ชื่อร้าน')}</h3>
                                                <p className="text-sm font-bold text-gray-500 mt-1">{settings.branch_name_th || settings.branch_name || (locale === 'en' ? 'Branch' : 'สาขา')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Shop Name TH / EN */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={settings.name_th || settings.name || ''}
                                                        onChange={e => setSettings({...settings, name_th: e.target.value, name: e.target.value})}
                                                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Shop Name (Thai)' : 'ชื่อร้าน (ภาษาไทย)'}</label>
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={settings.name_en || ''}
                                                        onChange={e => setSettings({...settings, name_en: e.target.value})}
                                                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Shop Name (English)' : 'ชื่อร้าน (ภาษาอังกฤษ)'}</label>
                                                </div>
                                            </div>

                                            {/* Branch Name TH / EN */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={settings.branch_name_th || settings.branch_name || ''}
                                                        onChange={e => setSettings({...settings, branch_name_th: e.target.value, branch_name: e.target.value})}
                                                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Branch Name (Thai)' : 'ชื่อสาขา (ภาษาไทย)'}</label>
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={settings.branch_name_en || ''}
                                                        onChange={e => setSettings({...settings, branch_name_en: e.target.value})}
                                                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Branch Name (English)' : 'ชื่อสาขา (ภาษาอังกฤษ)'}</label>
                                                </div>
                                            </div>
                                            
                                            {/* Tax ID & Phone */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={settings.tax_id || ''}
                                                        onChange={e => setSettings({...settings, tax_id: e.target.value})}
                                                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Tax ID' : 'เลขประจำตัวผู้เสียภาษี'}</label>
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={settings.phone || ''}
                                                        onChange={e => setSettings({...settings, phone: e.target.value})}
                                                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer" 
                                                        placeholder=" "
                                                    />
                                                    <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์ติดต่อ'}</label>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="relative">
                                                <textarea 
                                                    value={settings.address || ''}
                                                    onChange={e => setSettings({...settings, address: e.target.value})}
                                                    className="w-full bg-transparent border border-gray-300 rounded-xl px-4 pt-6 pb-2 text-[15px] font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all peer min-h-[100px] resize-none"
                                                    placeholder=" "
                                                />
                                                <label className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 peer-focus:text-black transition-colors">{locale === 'en' ? 'Address' : 'ที่อยู่ร้าน'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Bell className="text-orange-500" size={24} /> {locale === 'en' ? ' ประกาศและข้อความหน้าร้าน                                     ' : locale === 'zh' ? ' ประกาศและข้อความหน้าร้าน                                     ' : ' ประกาศและข้อความหน้าร้าน                                     '}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-6">{locale === 'en' ? 'ข้อความที่จะแสดงในหน้าระบบสั่งอาหาร LINE LIFF' : locale === 'zh' ? 'ข้อความที่จะแสดงในหน้าระบบสั่งอาหาร LINE LIFF' : 'ข้อความที่จะแสดงในหน้าระบบสั่งอาหาร LINE LIFF'}</p>
                                    <textarea 
                                        value={settings.status_message}
                                        onChange={e => setSettings({...settings, status_message: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black min-h-[120px] resize-none transition-all"
                                    />
                                </div>

                                {/* Section: Checkout Photo Zones */}
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Camera className="text-emerald-500" size={24} /> ตั้งค่าโซนถ่ายรูปก่อนออกงาน
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-6">กำหนดโซนที่พนักงานจำเป็นต้องถ่ายรูปส่งก่อนกดลงเวลาออกงาน (ระบบจะตรวจสอบรวมกันทั้งสาขา)</p>
                                    
                                    <div className="space-y-3 mb-4">
                                        {(settings.checkout_photo_zones || []).map((zone: any, idx: number) => (
                                            <div key={zone.id || idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={zone.name}
                                                        onChange={e => {
                                                            const newZones = [...(settings.checkout_photo_zones || [])];
                                                            newZones[idx].name = e.target.value;
                                                            setSettings({...settings, checkout_photo_zones: newZones});
                                                        }}
                                                        className="w-full bg-transparent text-sm font-bold outline-none"
                                                        placeholder="ชื่อโซน เช่น บาร์น้ำ, ห้องครัว"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newZones = (settings.checkout_photo_zones || []).filter((_: any, i: number) => i !== idx);
                                                        setSettings({...settings, checkout_photo_zones: newZones});
                                                    }}
                                                    className="p-2 bg-white rounded-lg border border-gray-200 text-rose-500 hover:bg-rose-50 transition-colors"
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
                                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                    >
                                        <Plus size={16} /> เพิ่มโซนใหม่
                                    </button>
                                </div>

                                {/* Section: Opening Hours */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-[#111111]" />
                {locale === 'en' ? '                 เวลาเปิด-ปิดร้าน (Opening Hours)               ' : locale === 'zh' ? '                 เวลาเปิด-ปิดร้าน (Opening Hours)               ' : '                 เวลาเปิด-ปิดร้าน (Opening Hours)               '}</h3>
              
              <div className="space-y-4">
                {DAYS.map((day) => {
                    const { locale } = useI18n();
                  const dayData = settings.opening_hours?.[day.id] || { open: '08:00', close: '20:00', closed: false }
                  return (
                    <div key={day.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-[#F0F0F0] hover:border-[#E5E5E5] transition-colors gap-4">
                      <div className="flex items-center gap-4 min-w-[150px]">
                        <div className={`w-3 h-3 rounded-full ${dayData.closed ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-sm font-bold">{day.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            disabled={dayData.closed}
                            value={dayData.open}
                            onChange={(e) => updateOpeningHour(day.id, 'open', e.target.value)}
                            className="p-2 border border-[#E5E5E5] text-xs font-mono outline-none focus:border-[#111111] disabled:opacity-30"
                          />
                          <span className="text-[#A3A3A3]">-</span>
                          <input
                            type="time"
                            disabled={dayData.closed}
                            value={dayData.close}
                            onChange={(e) => updateOpeningHour(day.id, 'close', e.target.value)}
                            className="p-2 border border-[#E5E5E5] text-xs font-mono outline-none focus:border-[#111111] disabled:opacity-30"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={dayData.closed}
                            onChange={(e) => updateOpeningHour(day.id, 'closed', e.target.checked)}
                            className="w-4 h-4 border-[#E5E5E5] rounded focus:ring-0 text-[#111111]"
                          />
                          <span className="text-xs font-medium uppercase tracking-wider text-[#666666]">{locale === 'en' ? 'ปิดร้าน' : locale === 'zh' ? 'ปิดร้าน' : 'ปิดร้าน'}</span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            
                                {/* Section: Attendance Rules */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <Navigation className="w-6 h-6 text-[#111111]" />
                {locale === 'en' ? '                 พิกัดเช็คอินพนักงาน (Staff Geo-fencing)               ' : locale === 'zh' ? '                 พิกัดเช็คอินพนักงาน (Staff Geo-fencing)               ' : '                 พิกัดเช็คอินพนักงาน (Staff Geo-fencing)               '}</h3>
              
              <div className="max-w-md space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {locale === 'en' ? '                       พนักงานจะลงเวลาเข้างานและออกงานได้ก็ต่อเมื่อพิกัด GPS อยู่ในรัศมีที่กำหนดรอบสาขานี้เท่านั้น หากอยู่นอกระยะ ระบบจะบล็อกและแจ้งข้อความทันที                     ' : locale === 'zh' ? '                       พนักงานจะลงเวลาเข้างานและออกงานได้ก็ต่อเมื่อพิกัด GPS อยู่ในรัศมีที่กำหนดรอบสาขานี้เท่านั้น หากอยู่นอกระยะ ระบบจะบล็อกและแจ้งข้อความทันที                     ' : '                       พนักงานจะลงเวลาเข้างานและออกงานได้ก็ต่อเมื่อพิกัด GPS อยู่ในรัศมีที่กำหนดรอบสาขานี้เท่านั้น หากอยู่นอกระยะ ระบบจะบล็อกและแจ้งข้อความทันที                     '}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">{locale === 'en' ? 'รัศมีเช็คอิน (Check-in Radius in meters)' : locale === 'zh' ? 'รัศมีเช็คอิน (Check-in Radius in meters)' : 'รัศมีเช็คอิน (Check-in Radius in meters)'}</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={settings.check_in_radius}
                        onChange={(e) => setSettings({ ...settings, check_in_radius: Number(e.target.value) })}
                        className="w-32 p-4 border border-[#E5E5E5] bg-white focus:border-[#111111] outline-none text-xl font-light font-mono"
                        min={10}
                        max={1000}
                      />
                      <span className="text-sm font-medium text-[#666666]">{locale === 'en' ? 'เมตร (Meters)' : locale === 'zh' ? 'เมตร (Meters)' : 'เมตร (Meters)'}</span>
                    </div>
                    <p className="text-[10px] text-[#A3A3A3] mt-2 italic font-light">{locale === 'en' ? '* ค่าแนะนำ: 50 - 100 เมตร เพื่อความเสถียรของสัญญาณ GPS' : locale === 'zh' ? '* ค่าแนะนำ: 50 - 100 เมตร เพื่อความเสถียรของสัญญาณ GPS' : '* ค่าแนะนำ: 50 - 100 เมตร เพื่อความเสถียรของสัญญาณ GPS'}</p>
                  </div>
                </div>
              </div>
            </div>

            
                            </div>
                        )}

                        {activeTab === 'delivery' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Truck className="text-orange-500" size={24} /> {locale === 'en' ? 'ตั้งค่า GP เดลิเวอรี่' : locale === 'zh' ? '设置外卖GP' : 'ตั้งค่า GP เดลิเวอรี่'}
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'ระบุเปอร์เซ็นต์หัก GP ของแต่ละแอป' : locale === 'zh' ? '指定每个应用程序扣除的GP百分比' : 'ระบุเปอร์เซ็นต์หัก GP ของแต่ละแอป'}</p>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                        {['grab', 'lineman', 'shopee', 'foodpanda', 'robinhood'].map(platform => {
                                            const isActive = settings.active_delivery_platforms?.includes(platform) ?? true;
                                            return (
                                            <div key={platform} className={`space-y-3 ${isActive ? '' : 'opacity-50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">
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
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-black' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        step="0.1"
                                                        disabled={!isActive}
                                                        value={settings.delivery_gp?.[platform] ?? 32.1}
                                                        onChange={e => setSettings({
                                                            ...settings, 
                                                            delivery_gp: { ...settings.delivery_gp, [platform]: parseFloat(e.target.value) || 0 }
                                                        })}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-10" 
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>

                                {/* IN-HOUSE DELIVERY SETTINGS */}
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                                <MapPin className="text-emerald-500" size={24} /> {locale === 'en' ? 'In-House Delivery Settings' : locale === 'zh' ? '内部配送设置' : 'ตั้งค่าไรเดอร์ของร้าน (In-House)'}
                                            </h3>
                                            <p className="text-[12px] text-gray-500 font-bold">{locale === 'en' ? 'Configure distance-based delivery fee' : locale === 'zh' ? '配置基于距离的送货费' : 'ตั้งค่าราคาค่าส่งตามระยะทาง (Google Maps)'}</p>
                                        </div>
                                        <button
                                            onClick={() => setSettings({
                                                ...settings,
                                                inhouse_delivery_config: { ...settings.inhouse_delivery_config, enabled: !settings.inhouse_delivery_config?.enabled }
                                            })}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${settings.inhouse_delivery_config?.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${settings.inhouse_delivery_config?.enabled ? 'left-6.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className={`transition-all duration-300 ${settings.inhouse_delivery_config?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">Base Distance (ระยะเริ่มต้น)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" step="0.1"
                                                        value={settings.inhouse_delivery_config?.base_distance_km ?? 3}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, base_distance_km: parseFloat(e.target.value) || 0 }})}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-12" 
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">กม.</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-2 font-bold">ระยะทางเริ่มต้นสำหรับค่าส่งเหมาจ่าย</p>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">Base Price (ราคาเริ่มต้น)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={settings.inhouse_delivery_config?.base_price ?? 20}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, base_price: parseInt(e.target.value) || 0 }})}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-12" 
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">บาท</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">Per Km Rate (บวกกม.ละ)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={settings.inhouse_delivery_config?.per_km_rate ?? 10}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, per_km_rate: parseInt(e.target.value) || 0 }})}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-12" 
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">บาท</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-2 font-bold">ราคาบวกเพิ่มสำหรับระยะทางที่เกินจาก Base Distance</p>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">Max Distance (ส่งไกลสุด)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" step="0.1"
                                                        value={settings.inhouse_delivery_config?.max_distance_km ?? 15}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, max_distance_km: parseFloat(e.target.value) || 0 }})}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-12" 
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">กม.</span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">Free Delivery Threshold (สั่งครบ ส่งฟรี)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={settings.inhouse_delivery_config?.free_delivery_threshold ?? 500}
                                                        onChange={e => setSettings({...settings, inhouse_delivery_config: { ...settings.inhouse_delivery_config, free_delivery_threshold: parseInt(e.target.value) || 0 }})}
                                                        className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl py-3 px-4 text-[14px] font-bold outline-none focus:ring-2 focus:ring-emerald-500 pr-12" 
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black">บาท</span>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 mt-2 font-bold">หากลูกค้ามียอดสั่งซื้อถึงกำหนด ค่าจัดส่งจะเป็น 0 บาท ทันที (ใส่ 0 ถ้ายกเลิกส่งฟรี)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: RECEIPT */}
                        {activeTab === 'receipt' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Printer className="text-purple-500" size={24} /> {locale === 'en' ? ' ตั้งค่ารูปแบบใบเสร็จ                                     ' : locale === 'zh' ? ' ตั้งค่ารูปแบบใบเสร็จ                                     ' : ' ตั้งค่ารูปแบบใบเสร็จ                                     '}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'ข้อความและรายละเอียดที่จะปรากฏบนใบเสร็จที่พิมพ์ให้ลูกค้า' : locale === 'zh' ? 'ข้อความและรายละเอียดที่จะปรากฏบนใบเสร็จที่พิมพ์ให้ลูกค้า' : 'ข้อความและรายละเอียดที่จะปรากฏบนใบเสร็จที่พิมพ์ให้ลูกค้า'}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3 md:col-span-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">{locale === 'en' ? 'ข้อความหัวใบเสร็จ (Header)' : locale === 'zh' ? 'ข้อความหัวใบเสร็จ (Header)' : 'ข้อความหัวใบเสร็จ (Header)'}</label>
                                            <textarea 
                                                value={settings.receipt_header || ''}
                                                onChange={e => setSettings({...settings, receipt_header: e.target.value})}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black min-h-[100px] resize-none transition-all"
                                                placeholder={locale === 'en' ? 'ยินดีต้อนรับ / Welcome' : locale === 'zh' ? 'ยินดีต้อนรับ / Welcome' : 'ยินดีต้อนรับ / Welcome'}
                                            />
                                        </div>
                                        <div className="space-y-3 md:col-span-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">{locale === 'en' ? 'ข้อความท้ายใบเสร็จ (Footer)' : locale === 'zh' ? 'ข้อความท้ายใบเสร็จ (Footer)' : 'ข้อความท้ายใบเสร็จ (Footer)'}</label>
                                            <textarea 
                                                value={settings.receipt_footer || ''}
                                                onChange={e => setSettings({...settings, receipt_footer: e.target.value})}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black min-h-[100px] resize-none transition-all"
                                                placeholder="Thank you for your visit!"
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between bg-gray-50 p-5 rounded-xl border border-gray-100">
                                            <div>
                                                <label className="text-[13px] font-black text-gray-900 block mb-1">{locale === 'en' ? 'แสดงโลโก้ร้าน (Show Logo)' : locale === 'zh' ? 'แสดงโลโก้ร้าน (Show Logo)' : 'แสดงโลโก้ร้าน (Show Logo)'}</label>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{locale === 'en' ? 'พิมพ์โลโก้ด้านบนใบเสร็จ' : locale === 'zh' ? 'พิมพ์โลโก้ด้านบนใบเสร็จ' : 'พิมพ์โลโก้ด้านบนใบเสร็จ'}</p>
                                            </div>
                                            <button 
                                                onClick={() => setSettings({...settings, receipt_show_logo: settings.receipt_show_logo === false ? true : false})}
                                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.receipt_show_logo !== false ? 'bg-black' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.receipt_show_logo !== false ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">{locale === 'en' ? 'ขนาดตัวอักษรใบเสร็จ (Font Size)' : locale === 'zh' ? 'ขนาดตัวอักษรใบเสร็จ (Font Size)' : 'ขนาดตัวอักษรใบเสร็จ (Font Size)'}</label>
                                            <div className="flex p-1 bg-gray-100 rounded-xl">
                                                <button onClick={() => setSettings({...settings, receipt_font_size: 'normal'})} className={`flex-1 py-3 text-sm font-black rounded-lg transition-all ${(!settings.receipt_font_size || settings.receipt_font_size === 'normal') ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{locale === 'en' ? 'ขนาดปกติ' : locale === 'zh' ? 'ขนาดปกติ' : 'ขนาดปกติ'}</button>
                                                <button onClick={() => setSettings({...settings, receipt_font_size: 'large'})} className={`flex-1 py-3 text-sm font-black rounded-lg transition-all ${settings.receipt_font_size === 'large' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{locale === 'en' ? 'ขนาดใหญ่' : locale === 'zh' ? 'ขนาดใหญ่' : 'ขนาดใหญ่'}</button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <label className="text-[13px] font-black text-gray-900 block mb-1 flex items-center gap-2">
                                                        <QrCode size={16} /> QR จ่ายเงินท้ายใบเสร็จ
                                                    </label>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                        ใช้กับ LIFF ที่เลือกชำระปลายทาง / COD
                                                    </p>
                                                </div>
                                                {settings.receipt_payment_qr_image && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSettings({...settings, receipt_payment_qr_image: ''})}
                                                        className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-red-600"
                                                    >
                                                        <X size={14} /> ลบ QR
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <label className="inline-flex items-center gap-2 cursor-pointer text-[12px] font-black text-black">
                                                    <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
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
                                                <textarea
                                                    value={settings.receipt_payment_qr_image || ''}
                                                    onChange={e => setSettings({...settings, receipt_payment_qr_image: e.target.value})}
                                                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-[12px] font-mono outline-none focus:ring-2 focus:ring-emerald-400 min-h-[120px] resize-none transition-all"
                                                    placeholder="วาง data URL หรือ image URL ของ QR ที่ต้องการพิมพ์ท้ายใบเสร็จ"
                                                />
                                                {settings.receipt_payment_qr_image && (
                                                    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                                                        <div className="w-20 h-20 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                                                            <img loading="lazy"  src={settings.receipt_payment_qr_image} alt="QR preview" className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[12px] font-black text-gray-900 mb-1">ตัวอย่าง QR</div>
                                                            <div className="text-[10px] text-gray-500 font-bold break-all leading-relaxed">
                                                                ระบบจะพิมพ์ QR นี้ต่อท้ายใบเสร็จเมื่อเป็นออเดอร์ LIFF ที่เลือก COD
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Star className="text-pink-500" size={24} /> {locale === 'en' ? ' นิยายท้ายบิล (Story on Receipt)                                     ' : locale === 'zh' ? ' นิยายท้ายบิล (Story on Receipt)                                     ' : ' นิยายท้ายบิล (Story on Receipt)                                     '}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'พิมพ์เรื่องราวสั้นๆ แบบสุ่มให้ลูกค้าอ่านท้ายใบเสร็จ เพื่อสร้างความประทับใจ' : locale === 'zh' ? 'พิมพ์เรื่องราวสั้นๆ แบบสุ่มให้ลูกค้าอ่านท้ายใบเสร็จ เพื่อสร้างความประทับใจ' : 'พิมพ์เรื่องราวสั้นๆ แบบสุ่มให้ลูกค้าอ่านท้ายใบเสร็จ เพื่อสร้างความประทับใจ'}</p>
                                    
                                    <div className="flex items-center justify-between bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                                        <div>
                                            <label className="text-[13px] font-black text-gray-900 block mb-1">{locale === 'en' ? 'เปิดใช้งานนิยายท้ายบิล (Enable Story Mode)' : locale === 'zh' ? 'เปิดใช้งานนิยายท้ายบิล (Enable Story Mode)' : 'เปิดใช้งานนิยายท้ายบิล (Enable Story Mode)'}</label>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{locale === 'en' ? 'ระบบจะสุ่มตอนนิยายที่มีอยู่ไปแสดงท้ายใบเสร็จ' : locale === 'zh' ? 'ระบบจะสุ่มตอนนิยายที่มีอยู่ไปแสดงท้ายใบเสร็จ' : 'ระบบจะสุ่มตอนนิยายที่มีอยู่ไปแสดงท้ายใบเสร็จ'}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({...settings, receipt_story_mode: !settings.receipt_story_mode})}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${settings.receipt_story_mode ? 'bg-black' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.receipt_story_mode ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {settings.receipt_story_mode && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">{locale === 'en' ? 'เนื้อเรื่องทั้งหมด (' : locale === 'zh' ? 'เนื้อเรื่องทั้งหมด (' : 'เนื้อเรื่องทั้งหมด ('}{(settings.receipt_stories || []).length} {locale === 'en' ? ' ตอน)' : locale === 'zh' ? ' ตอน)' : ' ตอน)'}</label>
                                                <button 
                                                    onClick={() => {
                                                        const stories = [...(settings.receipt_stories || [])];
                                                        stories.push({ id: Date.now().toString(), title: 'บทที่ ' + (stories.length + 1), content: '' });
                                                        setSettings({...settings, receipt_stories: stories});
                                                    }}
                                                    className="text-[11px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                                >
                                                    <Plus size={14} /> {locale === 'en' ? ' เพิ่มตอนใหม่                                                 ' : locale === 'zh' ? ' เพิ่มตอนใหม่                                                 ' : ' เพิ่มตอนใหม่                                                 '}</button>
                                            </div>
                                            {(settings.receipt_stories || []).map((story: any, idx: number) => (
                                                <div key={story.id} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4 relative group">
                                                    <button 
                                                        onClick={() => {
                                                            const stories = [...(settings.receipt_stories || [])].filter((_, i) => i !== idx);
                                                            setSettings({...settings, receipt_stories: stories});
                                                        }}
                                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{locale === 'en' ? 'ชื่อตอน (Title)' : locale === 'zh' ? 'ชื่อตอน (Title)' : 'ชื่อตอน (Title)'}</label>
                                                        <input 
                                                            type="text" 
                                                            value={story.title}
                                                            onChange={e => {
                                                                const stories = [...(settings.receipt_stories || [])];
                                                                stories[idx].title = e.target.value;
                                                                setSettings({...settings, receipt_stories: stories});
                                                            }}
                                                            className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] font-bold outline-none focus:ring-1 focus:ring-black pr-10" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{locale === 'en' ? 'เนื้อหา (Content)' : locale === 'zh' ? 'เนื้อหา (Content)' : 'เนื้อหา (Content)'}</label>
                                                        <textarea 
                                                            value={story.content}
                                                            onChange={e => {
                                                                const stories = [...(settings.receipt_stories || [])];
                                                                stories[idx].content = e.target.value;
                                                                setSettings({...settings, receipt_stories: stories});
                                                            }}
                                                            className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] font-bold outline-none focus:ring-1 focus:ring-black min-h-[80px] resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!settings.receipt_stories || settings.receipt_stories.length === 0) && (
                                                <div className="py-8 text-center text-gray-400 text-[12px] font-bold border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                                    {locale === 'en' ? '                                                     ยังไม่มีตอนนิยาย กรุณาเพิ่มตอนใหม่                                                 ' : locale === 'zh' ? '                                                     ยังไม่มีตอนนิยาย กรุณาเพิ่มตอนใหม่                                                 ' : '                                                     ยังไม่มีตอนนิยาย กรุณาเพิ่มตอนใหม่                                                 '}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: KITCHEN */}
                        {activeTab === 'kitchen' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <MenuIcon className="text-orange-500" size={24} /> {locale === 'en' ? ' ตั้งค่าบิลส่งครัว                                     ' : locale === 'zh' ? ' ตั้งค่าบิลส่งครัว                                     ' : ' ตั้งค่าบิลส่งครัว                                     '}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'รูปแบบตัวอักษรและการแสดงผลสำหรับบิลที่พิมพ์เข้าห้องครัว' : locale === 'zh' ? 'รูปแบบตัวอักษรและการแสดงผลสำหรับบิลที่พิมพ์เข้าห้องครัว' : 'รูปแบบตัวอักษรและการแสดงผลสำหรับบิลที่พิมพ์เข้าห้องครัว'}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3 md:grid-cols-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">{locale === 'en' ? 'ขนาดตัวอักษรรายการอาหาร (Font Size)' : locale === 'zh' ? 'ขนาดตัวอักษรรายการอาหาร (Font Size)' : 'ขนาดตัวอักษรรายการอาหาร (Font Size)'}</label>
                                            <div className="flex flex-wrap sm:flex-nowrap p-1 bg-gray-100 rounded-xl">
                                                <button onClick={() => setSettings({...settings, kitchen_font_size: 'normal'})} className={`flex-1 min-w-[100px] py-3 text-sm font-black rounded-lg transition-all ${(!settings.kitchen_font_size || settings.kitchen_font_size === 'normal') ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{locale === 'en' ? 'normal' : locale === 'zh' ? '普通的' : 'ปกติ'}</button>
                                                <button onClick={() => setSettings({...settings, kitchen_font_size: 'large'})} className={`flex-1 min-w-[100px] py-3 text-sm font-black rounded-lg transition-all ${settings.kitchen_font_size === 'large' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{locale === 'en' ? 'ใหญ่' : locale === 'zh' ? 'ใหญ่' : 'ใหญ่'}</button>
                                                <button onClick={() => setSettings({...settings, kitchen_font_size: 'huge'})} className={`flex-1 min-w-[100px] py-3 text-sm font-black rounded-lg transition-all ${settings.kitchen_font_size === 'huge' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{locale === 'en' ? 'ใหญ่มาก (Huge)' : locale === 'zh' ? 'ใหญ่มาก (Huge)' : 'ใหญ่มาก (Huge)'}</button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-gray-50 p-5 rounded-xl border border-gray-100 md:grid-cols-2">
                                            <div>
                                                <label className="text-[13px] font-black text-gray-900 block mb-1">{locale === 'en' ? 'แสดงประเภทออเดอร์ (Order Type)' : locale === 'zh' ? 'แสดงประเภทออเดอร์ (Order Type)' : 'แสดงประเภทออเดอร์ (Order Type)'}</label>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{locale === 'en' ? 'เช่น ทานที่ร้าน, สั่งกลับบ้าน, เดลิเวอรี่' : locale === 'zh' ? 'เช่น ทานที่ร้าน, สั่งกลับบ้าน, เดลิเวอรี่' : 'เช่น ทานที่ร้าน, สั่งกลับบ้าน, เดลิเวอรี่'}</p>
                                            </div>
                                            <button 
                                                onClick={() => setSettings({...settings, kitchen_show_type: settings.kitchen_show_type === false ? true : false})}
                                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.kitchen_show_type !== false ? 'bg-black' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.kitchen_show_type !== false ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: ADVANCED */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Star className="text-yellow-500" size={24} /> {locale === 'en' ? ' ระบบสมาชิก & สะสมแต้ม                                     ' : locale === 'zh' ? ' ระบบสมาชิก & สะสมแต้ม                                     ' : ' ระบบสมาชิก & สะสมแต้ม                                     '}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'ตั้งค่าอัตราส่วนการสะสมและแลกแต้มของสมาชิกร้าน' : locale === 'zh' ? 'ตั้งค่าอัตราส่วนการสะสมและแลกแต้มของสมาชิกร้าน' : 'ตั้งค่าอัตราส่วนการสะสมและแลกแต้มของสมาชิกร้าน'}</p>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-[14px] font-black tracking-tight text-[#1A1A18] mb-1 block">
                                                    {locale === 'en' ? 'Earn Rate' : 'เงื่อนไขการได้รับแต้ม (Earn Rate)'}
                                                </label>
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {locale === 'en' ? 'THB spent to earn 1 Point' : 'ทุกๆ ยอดสั่งซื้อกี่บาท ถึงจะได้รับ 1 แต้ม'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                                <div className="relative w-24">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_earn_thb !== undefined ? settings.loyalty_earn_thb : (settings.loyalty_earn_rate || 100)}
                                                        onChange={e => setSettings({...settings, loyalty_earn_thb: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#1A1A18] focus:bg-white rounded-lg py-2 text-center text-lg font-black outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[14px] font-bold text-gray-500">{locale === 'en' ? 'THB' : 'บาท'}</span>
                                                <span className="text-[14px] font-black text-gray-300 mx-1">➜</span>
                                                <span className="text-[14px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg whitespace-nowrap">รับ</span>
                                                <div className="relative w-20">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_earn_pts !== undefined ? settings.loyalty_earn_pts : 1}
                                                        onChange={e => setSettings({...settings, loyalty_earn_pts: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#1A1A18] focus:bg-white rounded-lg py-2 text-center text-lg font-black outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[14px] font-bold text-emerald-600">{locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-[14px] font-black tracking-tight text-[#1A1A18] mb-1 block">
                                                    {locale === 'en' ? 'Redemption Rate' : 'เงื่อนไขการแลกส่วนลด (Redemption)'}
                                                </label>
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {locale === 'en' ? 'Points required for 1 THB discount' : 'ต้องใช้กี่แต้ม เพื่อแลกรับส่วนลด 1 บาท'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                                <span className="text-[14px] font-black text-orange-600 bg-orange-50 px-3 py-2 rounded-lg whitespace-nowrap">ใช้</span>
                                                <div className="relative w-24">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_redeem_pts !== undefined ? settings.loyalty_redeem_pts : 1}
                                                        onChange={e => setSettings({...settings, loyalty_redeem_pts: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#1A1A18] focus:bg-white rounded-lg py-2 text-center text-lg font-black outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[14px] font-bold text-gray-500">{locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                                <span className="text-[14px] font-black text-gray-300 mx-1">➜</span>
                                                <span className="text-[14px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg whitespace-nowrap">ลด</span>
                                                <div className="relative w-24">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_redeem_thb !== undefined ? settings.loyalty_redeem_thb : (settings.loyalty_points_per_thb || 10)}
                                                        onChange={e => setSettings({...settings, loyalty_redeem_thb: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#1A1A18] focus:bg-white rounded-lg py-2 text-center text-lg font-black outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[14px] font-bold text-emerald-600">{locale === 'en' ? 'THB' : 'บาท'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <ShieldCheck className="text-blue-500" size={24} /> {locale === 'en' ? ' ระบบสั่งอาหารผ่าน QR (QR Payment)                                     ' : locale === 'zh' ? ' ระบบสั่งอาหารผ่าน QR (QR Payment)                                     ' : ' ระบบสั่งอาหารผ่าน QR (QR Payment)                                     '}</h3>
                                    
                                    <div className="flex items-center justify-between bg-gray-50 p-5 rounded-xl border border-gray-100 mt-6">
                                        <div>
                                            <label className="text-[13px] font-black text-gray-900 block mb-1">{locale === 'en' ? 'อนุญาตให้ลูกค้าจ่ายเงินที่โต๊ะผ่านมือถือ' : locale === 'zh' ? 'อนุญาตให้ลูกค้าจ่ายเงินที่โต๊ะผ่านมือถือ' : 'อนุญาตให้ลูกค้าจ่ายเงินที่โต๊ะผ่านมือถือ'}</label>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{locale === 'en' ? 'เมื่อปิด ลูกค้าจะต้องมาจ่ายที่เคาน์เตอร์' : locale === 'zh' ? 'เมื่อปิด ลูกค้าจะต้องมาจ่ายที่เคาน์เตอร์' : 'เมื่อปิด ลูกค้าจะต้องมาจ่ายที่เคาน์เตอร์'}</p>
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
                                            className={`relative w-14 h-8 rounded-full transition-colors ${settings.opening_hours?.allow_qr_payment !== false ? 'bg-black' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.opening_hours?.allow_qr_payment !== false ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* MYSTERY BOX SETTINGS */}
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <Gift className="text-purple-500" size={24} /> กล่องสุ่มรางวัล (Mystery Box)
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">ตั้งค่าคะแนนที่ใช้เล่น และโอกาสการได้รางวัลแต่ละระดับ</p>
                                    
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4 mb-6">
                                        <div className="flex-1">
                                            <label className="text-[14px] font-black tracking-tight text-[#1A1A18] mb-1 block">
                                                คะแนนที่ต้องใช้เล่น
                                            </label>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                แต้มที่ลูกค้าจะถูกหักเมื่อกดสุ่ม
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                            <span className="text-[14px] font-black text-red-600 bg-red-50 px-3 py-2 rounded-lg whitespace-nowrap">จ่าย</span>
                                            <div className="relative w-24">
                                                <input 
                                                    type="number" 
                                                    value={settings.mystery_box_cost || 50}
                                                    onChange={e => setSettings({...settings, mystery_box_cost: parseInt(e.target.value) || 0})}
                                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#1A1A18] focus:bg-white rounded-lg py-2 text-center text-lg font-black outline-none transition-colors" 
                                                />
                                            </div>
                                            <span className="text-[14px] font-bold text-gray-500">แต้ม</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[14px] font-black tracking-tight text-[#1A1A18] block">ของรางวัลและโอกาสการได้ (รวมต้อง = 100%)</label>
                                        {(settings.mystery_box_prizes || []).map((prize: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 flex-wrap">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ประเภทรางวัล</label>
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
                                                        className="w-full bg-white border border-gray-200 focus:border-[#1A1A18] rounded-lg py-2 px-3 font-bold outline-none mb-2"
                                                    >
                                                        <option value="points">ได้คะแนน (Points)</option>
                                                        <option value="coupon">ได้คูปอง (Coupon)</option>
                                                    </select>
                                                    
                                                    {(!prize.type || prize.type === 'points') ? (
                                                        <>
                                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">แต้มที่จะได้รับ</label>
                                                            <input 
                                                                type="number" 
                                                                value={prize.points || 0}
                                                                onChange={e => {
                                                                    const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                                    newPrizes[idx].points = parseInt(e.target.value) || 0;
                                                                    setSettings({...settings, mystery_box_prizes: newPrizes});
                                                                }}
                                                                className="w-full bg-white border border-gray-200 focus:border-[#1A1A18] rounded-lg py-2 px-3 font-bold outline-none" 
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">เลือกคูปอง</label>
                                                            <select 
                                                                value={prize.coupon_name || ''}
                                                                onChange={e => {
                                                                    const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                                    newPrizes[idx].coupon_name = e.target.value;
                                                                    setSettings({...settings, mystery_box_prizes: newPrizes});
                                                                }}
                                                                className="w-full bg-white border border-gray-200 focus:border-[#1A1A18] rounded-lg py-2 px-3 font-bold outline-none" 
                                                            >
                                                                <option value="">-- เลือกคูปอง --</option>
                                                                {availableCoupons.map(c => (
                                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-[120px] self-end">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">โอกาสสุ่มได้ (%)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={prize.chance}
                                                            onChange={e => {
                                                                const newPrizes = [...(settings.mystery_box_prizes || [])];
                                                                newPrizes[idx].chance = parseInt(e.target.value) || 0;
                                                                setSettings({...settings, mystery_box_prizes: newPrizes});
                                                            }}
                                                            className="w-full bg-white border border-gray-200 focus:border-[#1A1A18] rounded-lg py-2 px-3 font-bold outline-none" 
                                                        />
                                                        <span className="text-gray-500 font-bold">%</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newPrizes = (settings.mystery_box_prizes || []).filter((_: any, i: number) => i !== idx);
                                                        setSettings({...settings, mystery_box_prizes: newPrizes});
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-4"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newPrizes = [...(settings.mystery_box_prizes || []), { type: 'points', points: 0, chance: 0 }];
                                                setSettings({...settings, mystery_box_prizes: newPrizes});
                                            }}
                                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:border-gray-300 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> เพิ่มรางวัล
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* TAB: PERMISSIONS */}
                        {activeTab === 'permissions' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <ShieldCheck className="text-red-500" size={24} /> {locale === 'en' ? ' สิทธิ์การเข้าถึง (Role Permissions)' : locale === 'zh' ? ' สิทธิ์การเข้าถึง (Role Permissions)' : ' สิทธิ์การเข้าถึง (Role Permissions)'}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'อนุญาตให้พนักงานแต่ละระดับสามารถเข้าถึงหน้าต่างต่างๆ ในแอป POS ได้' : locale === 'zh' ? 'อนุญาตให้พนักงานแต่ละระดับสามารถเข้าถึงหน้าต่างต่างๆ ในแอป POS ได้' : 'อนุญาตให้พนักงานแต่ละระดับสามารถเข้าถึงหน้าต่างต่างๆ ในแอป POS ได้'}</p>
                                    
                                    {/* Role Management UI */}
                                    <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <h4 className="text-[13px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <Users size={16} className="text-indigo-500" />
                                            จัดการตำแหน่งพนักงาน (Manage Roles)
                                        </h4>
                                        <div className="flex flex-wrap gap-3 mb-4">
                                            {(settings.custom_roles || []).map((role: any) => (
                                                <div key={role.id} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                    <span className="text-[12px] font-bold text-gray-700">{role.label}</span>
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
                                                            className="text-red-400 hover:text-red-600 ml-2"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
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
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[12px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={14} /> เพิ่มตำแหน่งใหม่
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {(settings.custom_roles || []).map((roleObj: any) => {
                                            const role = roleObj.id;
                                            return (
                                            <div key={role} className="space-y-4">
                                                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                                                    {role === 'manager' ? <Star size={16} className="text-yellow-500" /> : role === 'staff' ? <Info size={16} className="text-blue-500" /> : <Users size={16} className="text-indigo-500" />}
                                                    {editingRole === role ? (
                                                        <div className="flex items-center gap-2 w-full">
                                                            <input 
                                                                type="text"
                                                                value={editingRoleName}
                                                                onChange={(e) => setEditingRoleName(e.target.value)}
                                                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-black w-full"
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
                                                            }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100">
                                                                <Check size={14} />
                                                            </button>
                                                            <button onClick={() => setEditingRole(null)} className="p-1.5 bg-gray-50 text-gray-500 rounded-md hover:bg-gray-100">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="flex-1">{roleObj.label}</span>
                                                            <button onClick={() => {
                                                                setEditingRole(role)
                                                                setEditingRoleName(roleObj.label)
                                                            }} className="p-1 text-gray-400 hover:text-indigo-500 transition-colors">
                                                                <Edit2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </h4>
                                                <div className="space-y-6">
                                                    {permissionGroups.map((group, groupIdx) => (
                                                        <div key={groupIdx}>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">{group.groupLabel}</div>
                                                            <div className="space-y-2">
                                                                {group.options.map((opt) => {
                                                                    const isChecked = (settings.role_permissions?.[role] || []).includes(opt.id)
                                                                    return (
                                                                        <div key={opt.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group cursor-pointer"
                                                                             onClick={() => {
                                                                                 const current = settings.role_permissions?.[role] || []
                                                                                 const next = isChecked ? current.filter((c: string) => c !== opt.id) : [...current, opt.id]
                                                                                 setSettings({
                                                                                     ...settings,
                                                                                     role_permissions: { ...settings.role_permissions, [role]: next }
                                                                                 })
                                                                             }}
                                                                        >
                                                                            <button 
                                                                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${isChecked ? 'bg-black text-white' : 'bg-gray-100 border border-gray-200'}`}
                                                                            >
                                                                                {isChecked && <div className="w-2.5 h-2.5 rounded-sm bg-white" />}
                                                                            </button>
                                                                            <div>
                                                                                <div className={`text-[12px] font-black uppercase tracking-tight transition-all ${isChecked ? 'text-black' : 'text-gray-500'}`}>{opt.label}</div>
                                                                                <div className="text-[10px] text-gray-400 font-bold leading-tight mt-1 group-hover:text-gray-500">{opt.desc}</div>
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
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mt-6">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <ShieldCheck className="text-blue-500" size={24} /> {locale === 'en' ? 'รายการตรวจสอบก่อนเลิกงาน (Checkout Checklist)' : locale === 'zh' ? 'รายการตรวจสอบก่อนเลิกงาน (Checkout Checklist)' : 'รายการตรวจสอบก่อนเลิกงาน (Checkout Checklist)'}
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">
                                        {locale === 'en' ? 'ตั้งค่ารายการที่พนักงานต้องทำและกดยืนยันให้ครบก่อนลงเวลาออกงาน' : locale === 'zh' ? 'ตั้งค่ารายการที่พนักงานต้องทำและกดยืนยันให้ครบก่อนลงเวลาออกงาน' : 'ตั้งค่ารายการที่พนักงานต้องทำและกดยืนยันให้ครบก่อนลงเวลาออกงาน'}
                                    </p>

                                    <div className="space-y-4">
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
                                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-400"
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
                                                    className="w-11 h-11 flex items-center justify-center text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors shrink-0"
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
                                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest mt-4"
                                        >
                                            <Plus size={16} /> {locale === 'en' ? 'เพิ่มรายการตรวจสอบ' : locale === 'zh' ? 'เพิ่มรายการตรวจสอบ' : 'เพิ่มรายการตรวจสอบ'}
                                        </button>
                                    </div>
                                </div>

                                {/* REQUIRED AUDIT CATEGORIES SETTINGS */}
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mt-6">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <ShieldCheck className="text-purple-500" size={24} /> {locale === 'en' ? 'บังคับนับสต็อกก่อนเลิกงาน (Required Daily Audits)' : locale === 'zh' ? 'บังคับนับสต็อกก่อนเลิกงาน (Required Daily Audits)' : 'บังคับนับสต็อกก่อนเลิกงาน (Required Daily Audits)'}
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">
                                        {locale === 'en' ? 'เลือกหมวดหมู่ที่บังคับให้พนักงานต้องนับสต็อกให้เสร็จสิ้นในแต่ละวันก่อนถึงจะลงเวลาออกงานได้' : locale === 'zh' ? 'เลือกหมวดหมู่ที่บังคับให้พนักงานต้องนับสต็อกให้เสร็จสิ้นในแต่ละวันก่อนถึงจะลงเวลาออกงานได้' : 'เลือกหมวดหมู่ที่บังคับให้พนักงานต้องนับสต็อกให้เสร็จสิ้นในแต่ละวันก่อนถึงจะลงเวลาออกงานได้'}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {inventoryCategories.map((cat: any) => {
                                            const isRequired = (settings.opening_hours?.required_audit_categories || []).includes(cat.id);
                                            return (
                                                <div 
                                                    key={cat.id} 
                                                    className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                                                    onClick={() => {
                                                        const current = settings.opening_hours?.required_audit_categories || [];
                                                        const next = isRequired ? current.filter((id: string) => id !== cat.id) : [...current, cat.id];
                                                        setSettings({
                                                            ...settings,
                                                            opening_hours: { ...settings.opening_hours, required_audit_categories: next }
                                                        });
                                                    }}
                                                >
                                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isRequired ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white group-hover:border-purple-400'}`}>
                                                        {isRequired && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                                    </div>
                                                    <span className={`text-[13px] font-bold ${isRequired ? 'text-gray-900' : 'text-gray-600'}`}>{cat.name}</span>
                                                </div>
                                            );
                                        })}
                                        {inventoryCategories.length === 0 && (
                                            <div className="col-span-full text-center py-6 text-gray-400 text-[12px] font-bold">
                                                ไม่มีข้อมูลหมวดหมู่สินค้าในสต็อก
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: HARDWARE & PRINTERS */}
                        {activeTab === 'hardware' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* PRINT PREVIEWS (MOVED TOP) */}
                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                                        <ImageIcon className="text-indigo-500" size={24} /> {locale === 'en' ? ' ตัวอย่างบิล (Print Preview)                                     ' : locale === 'zh' ? ' ตัวอย่างบิล (Print Preview)                                     ' : ' ตัวอย่างบิล (Print Preview)                                     '}</h3>
                                    <p className="text-[12px] text-gray-500 font-bold mb-8">{locale === 'en' ? 'คลิกปุ่มทดสอบพิมพ์ เพื่อลองปริ้นใบเสร็จจริงกับเครื่องปริ้นที่ตั้งค่าไว้' : locale === 'zh' ? 'คลิกปุ่มทดสอบพิมพ์ เพื่อลองปริ้นใบเสร็จจริงกับเครื่องปริ้นที่ตั้งค่าไว้' : 'คลิกปุ่มทดสอบพิมพ์ เพื่อลองปริ้นใบเสร็จจริงกับเครื่องปริ้นที่ตั้งค่าไว้'}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        {/* Receipt Preview */}
                                        <div className="bg-[#111111] p-6 sm:p-8 flex flex-col items-center overflow-hidden rounded-xl shadow-xl relative group border border-black">
                                            <div className="text-[10px] font-black text-white/50 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                {locale === 'en' ? '                                                 ใบเสร็จรับเงิน (Receipt)                                             ' : locale === 'zh' ? '                                                 ใบเสร็จรับเงิน (Receipt)                                             ' : '                                                 ใบเสร็จรับเงิน (Receipt)                                             '}</div>
                                            <div id="receipt-preview-capture" className="bg-[#FDFDFB] shadow-2xl p-6 sm:p-8 w-full max-w-[300px] font-mono text-[12px] text-center text-black relative" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                                                {/* Paper edge */}
                                                <div className="absolute -top-1 inset-x-0 h-2 bg-repeat-x flex" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, #FDFDFB 5px)', backgroundSize: '10px 10px' }}></div>
                                                
                                                {settings.receipt_show_logo !== false && (
                                                    <div className="flex justify-center mb-6 mt-2">
                                                        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-[9px] font-sans font-black tracking-widest shadow-inner">LOGO</div>
                                                    </div>
                                                )}
                                                {settings.receipt_header && (
                                                    <div className="mb-6 whitespace-pre-wrap font-bold leading-tight">{settings.receipt_header}</div>
                                                )}
                                                <div className={`font-black uppercase tracking-tight mb-3 ${settings.receipt_font_size === 'large' ? 'text-[20px]' : 'text-[16px]'}`}>{settings.name || 'XYL STUDIO'}</div>
                                                {settings.branch_name && <div className="text-[10px] font-bold mb-1">{locale === 'en' ? 'สาขา: ' : locale === 'zh' ? 'สาขา: ' : 'สาขา: '}{settings.branch_name}</div>}
                                                {settings.tax_id && <div className="text-[10px] font-bold mb-1">TAX ID: {settings.tax_id}</div>}
                                                {settings.phone && <div className="text-[10px] font-bold mb-6">{locale === 'en' ? 'โทร: ' : locale === 'zh' ? 'โทร: ' : 'โทร: '}{settings.phone}</div>}
                                                
                                                <div className="border-t-[1.5px] border-dashed border-black/30 my-4"></div>
                                                
                                                <div className="text-left font-bold space-y-2">
                                                    <div className="flex justify-between text-[10px]"><span>{locale === 'en' ? 'วันที่: ' : locale === 'zh' ? 'วันที่: ' : 'วันที่: '}{new Date().toLocaleDateString('th-TH')}</span><span>{locale === 'en' ? 'คิว: 01' : locale === 'zh' ? 'คิว: 01' : 'คิว: 01'}</span></div>
                                                    <div className="text-[10px]">{locale === 'en' ? 'พนักงาน: Demo Staff' : locale === 'zh' ? 'พนักงาน: Demo Staff' : 'พนักงาน: Demo Staff'}</div>
                                                    <div className="text-[10px]">{locale === 'en' ? 'ประเภท: Dine-In' : locale === 'zh' ? 'ประเภท: Dine-In' : 'ประเภท: Dine-In'}</div>
                                                </div>
                                                
                                                <div className="border-t-[1.5px] border-dashed border-black/30 my-4"></div>
                                                
                                                <div className="space-y-3 text-left font-bold">
                                                    <div className="flex justify-between items-start">
                                                        <div><span className="mr-2">1x</span> {locale === 'en' ? ' กาแฟลาเต้ (เย็น)' : locale === 'zh' ? ' กาแฟลาเต้ (เย็น)' : ' กาแฟลาเต้ (เย็น)'}</div>
                                                        <div>120.00</div>
                                                    </div>
                                                    <div className="pl-6 text-[10px] text-gray-500 font-medium space-y-1">
                                                        <div>{locale === 'en' ? '- หวานน้อย 50%' : locale === 'zh' ? '- หวานน้อย 50%' : '- หวานน้อย 50%'}</div>
                                                        <div>{locale === 'en' ? '- เปลี่ยนนมโอ๊ต (+20)' : locale === 'zh' ? '- เปลี่ยนนมโอ๊ต (+20)' : '- เปลี่ยนนมโอ๊ต (+20)'}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="border-t-[1.5px] border-dashed border-black/30 my-4"></div>
                                                
                                                <div className="space-y-2 text-[10px] font-bold">
                                                    <div className="flex justify-between"><span>{locale === 'en' ? 'ภาษี (VAT 7%)' : locale === 'zh' ? 'ภาษี (VAT 7%)' : 'ภาษี (VAT 7%)'}</span><span>8.40</span></div>
                                                    <div className="flex justify-between text-[14px] font-black mt-2"><span>{locale === 'en' ? 'ยอดรวม (Total)' : locale === 'zh' ? 'ยอดรวม (Total)' : 'ยอดรวม (Total)'}</span><span>140.00</span></div>
                                                    <div className="flex justify-between text-gray-500 mt-2"><span>{locale === 'en' ? 'รับเงิน (CASH)' : locale === 'zh' ? 'รับเงิน (CASH)' : 'รับเงิน (CASH)'}</span><span>500.00</span></div>
                                                    <div className="flex justify-between text-gray-500"><span>{locale === 'en' ? 'เงินทอน' : locale === 'zh' ? 'เงินทอน' : 'เงินทอน'}</span><span>360.00</span></div>
                                                </div>
                                                
                                                <div className="border-t-[1.5px] border-dashed border-black/30 my-4"></div>
                                                
                                                <div className="border-t-[1.5px] border-dashed border-black/30 my-4"></div>
                                                <div className="mt-6 whitespace-pre-wrap font-bold leading-tight text-[10px] text-center">
                                                    {settings.receipt_footer || 'Thank you\nPowered by XYL STUDIO'}
                                                </div>

                                                {settings.receipt_story_mode && settings.receipt_stories?.length > 0 && (
                                                    <div className="mt-6 pt-3 border-t border-dashed border-black/30">
                                                        <div className="font-black text-[12px] mb-2 text-center">{settings.receipt_stories[previewStoryIndex]?.title}</div>
                                                        <div className="whitespace-pre-wrap text-[10px] leading-relaxed text-left">{settings.receipt_stories[previewStoryIndex]?.content}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {settings.receipt_story_mode && settings.receipt_stories?.length > 0 && (
                                                <div className="mt-6 w-full max-w-[300px]">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{locale === 'en' ? 'เลือกตอนที่ต้องการดูตัวอย่าง (Preview)' : locale === 'zh' ? 'เลือกตอนที่ต้องการดูตัวอย่าง (Preview)' : 'เลือกตอนที่ต้องการดูตัวอย่าง (Preview)'}</label>
                                                    <select 
                                                        value={previewStoryIndex}
                                                        onChange={e => setPreviewStoryIndex(Number(e.target.value))}
                                                        className="w-full bg-black text-white border border-gray-700 rounded-lg py-2 px-3 text-[11px] font-bold outline-none" 
                                                    >
                                                        {settings.receipt_stories.map((s: any, i: number) => (
                                                            <option key={s.id} value={i}>{s.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Kitchen Preview */}
                                        <div className="bg-[#111111] p-6 sm:p-8 flex flex-col items-center overflow-hidden rounded-xl shadow-xl relative group border border-black">
                                            <div className="text-[10px] font-black text-white/50 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                                {locale === 'en' ? '                                                 ใบออเดอร์ (Kitchen)                                             ' : locale === 'zh' ? '                                                 ใบออเดอร์ (Kitchen)                                             ' : '                                                 ใบออเดอร์ (Kitchen)                                             '}</div>
                                            <div id="kitchen-preview-capture" className="bg-[#FDFDFB] shadow-2xl p-6 sm:p-8 w-full max-w-[300px] font-mono text-left text-black relative" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                                                <div className="absolute -top-1 inset-x-0 h-2 bg-repeat-x flex" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, #FDFDFB 5px)', backgroundSize: '10px 10px' }}></div>
                                                
                                                <div className="text-center font-black text-[20px] mb-3 border-b-[3px] border-black pb-3 mt-2">
                                                    {locale === 'en' ? '                                                     ใบสั่งอาหาร                                                 ' : locale === 'zh' ? '                                                     ใบสั่งอาหาร                                                 ' : '                                                     ใบสั่งอาหาร                                                 '}</div>
                                                
                                                {settings.kitchen_show_type !== false && (
                                                    <div className="text-center font-black text-[16px] mb-4 bg-black text-white py-1">
                                                        {locale === 'en' ? '                                                         ทานที่ร้าน (Dine-In)                                                     ' : locale === 'zh' ? '                                                         ทานที่ร้าน (Dine-In)                                                     ' : '                                                         ทานที่ร้าน (Dine-In)                                                     '}</div>
                                                )}

                                                <div className="font-bold space-y-1 mb-4 text-[11px]">
                                                    <div className="flex justify-between"><span>{locale === 'en' ? 'โต๊ะ: T-01' : locale === 'zh' ? 'โต๊ะ: T-01' : 'โต๊ะ: T-01'}</span><span>{locale === 'en' ? 'เวลา: 12:30' : locale === 'zh' ? 'เวลา: 12:30' : 'เวลา: 12:30'}</span></div>
                                                    <div>{locale === 'en' ? 'คิว: 01' : locale === 'zh' ? 'คิว: 01' : 'คิว: 01'}</div>
                                                </div>
                                                
                                                <div className="border-t-[2px] border-dashed border-black/40 my-3"></div>
                                                
                                                <div className={`font-black space-y-3 ${settings.kitchen_font_size === 'huge' ? 'text-[24px]' : settings.kitchen_font_size === 'large' ? 'text-[18px]' : 'text-[14px]'}`}>
                                                    <div className="flex gap-3 items-start">
                                                        <span className="leading-none">1x</span>
                                                        <span className="leading-tight">{locale === 'en' ? 'ผัดไทยกุ้งสด' : locale === 'zh' ? 'ผัดไทยกุ้งสด' : 'ผัดไทยกุ้งสด'}</span>
                                                    </div>
                                                    <div className="pl-9 text-[12px] text-gray-600 font-bold space-y-1">
                                                        <div>{locale === 'en' ? '- ไม่ใส่ถั่วงอก' : locale === 'zh' ? '- ไม่ใส่ถั่วงอก' : '- ไม่ใส่ถั่วงอก'}</div>
                                                        <div>{locale === 'en' ? '- เผ็ดน้อย' : locale === 'zh' ? '- เผ็ดน้อย' : '- เผ็ดน้อย'}</div>
                                                    </div>
                                                </div>
                                                <div className="border-t-[2px] border-dashed border-black/40 my-4"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                                        <div>
                                            <h3 className="text-xl font-black flex items-center gap-3">
                                                <Settings className="text-gray-900" size={24} /> {locale === 'en' ? ' อุปกรณ์ปริ้นเตอร์ (Printers)                                             ' : locale === 'zh' ? ' อุปกรณ์ปริ้นเตอร์ (Printers)                                             ' : ' อุปกรณ์ปริ้นเตอร์ (Printers)                                             '}</h3>
                                            <p className="text-[12px] text-gray-500 font-bold mt-2">{locale === 'en' ? 'จัดการการเชื่อมต่อเครื่องพิมพ์ใบเสร็จผ่านระบบเครือข่าย (TCP/IP)' : locale === 'zh' ? 'จัดการการเชื่อมต่อเครื่องพิมพ์ใบเสร็จผ่านระบบเครือข่าย (TCP/IP)' : 'จัดการการเชื่อมต่อเครื่องพิมพ์ใบเสร็จผ่านระบบเครือข่าย (TCP/IP)'}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const p = [...(settings.printers || [])];
                                                p.push({ ip: '', type: 'receipt', name: 'Printer ' + (p.length + 1), encoding: 'text-leveling-16', categories: ['all'] });
                                                setSettings({...settings, printers: p});
                                            }}
                                            className="bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-black text-[12px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                                        >
                                            <Plus size={16} /> Add Printer
                                        </button>
                                    </div>

                                    {(settings.printers || []).map((printer: any, index: number) => (
                                        <div key={index} className="mb-8 p-6 sm:p-8 bg-gray-50 border border-gray-200 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-black/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                            
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
                                                        className="bg-transparent border-none text-xl sm:text-2xl font-black outline-none placeholder:text-gray-300 w-full"
                                                        placeholder="Printer Name"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const p = [...(settings.printers || [])].filter((_, i) => i !== index);
                                                        setSettings({...settings, printers: p});
                                                    }}
                                                    className="w-10 h-10 bg-white border border-gray-200 hover:border-red-500 hover:text-red-500 flex items-center justify-center rounded-xl transition-all shadow-sm flex-shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><MapPin size={12}/> IP Address</label>
                                                    <input 
                                                        type="text" 
                                                        value={printer.ip}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].ip = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-black transition-all" 
                                                        placeholder="192.168.1.100"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Printer size={12}/> Printer Model</label>
                                                    <select 
                                                        value={printer.model || 'xprinter-xp-n160ii'}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].model = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-black transition-all appearance-none" 
                                                    >
                                                        <option value="xprinter-xp-n160ii">Xprinter XP-N160II</option>
                                                        <option value="xprinter-xp-c300h">Xprinter XP-C300H</option>
                                                        <option value="epson-tm-t82x">Epson TM-T82X</option>
                                                        <option value="generic">Generic ESC/POS</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Settings size={12}/> {locale === 'en' ? ' การเข้ารหัสภาษาไทย' : locale === 'zh' ? ' การเข้ารหัสภาษาไทย' : ' การเข้ารหัสภาษาไทย'}</label>
                                                    <select 
                                                        value={printer.encoding || 'ku42'}
                                                        onChange={e => {
                                                            const p = [...(settings.printers || [])];
                                                            p[index].encoding = e.target.value;
                                                            setSettings({...settings, printers: p});
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-black transition-all appearance-none" 
                                                    >
                                                        <option value="ku42">ภาษาไทย (Text Mode)</option>
                                                        <option value="graphic">โหมดรูปภาพ (Graphic Mode)</option>
                                                    </select>
                                                </div>


                                                <div className="md:col-span-2 lg:col-span-3 space-y-3 mt-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{locale === 'en' ? 'หน้าที่ของเครื่องพิมพ์นี้ (Role)' : locale === 'zh' ? 'หน้าที่ของเครื่องพิมพ์นี้ (Role)' : 'หน้าที่ของเครื่องพิมพ์นี้ (Role)'}</label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {[
                                                            { id: 'receipt', label: 'ใบเสร็จ' },
                                                            { id: 'kitchen', label: 'ใบสั่งอาหาร' },
                                                            { id: 'both', label: 'ทั้งใบเสร็จและห้องครัว' }
                                                        ].map(role => (
                                                            <button 
                                                                key={role.id}
                                                                onClick={() => {
                                                                    const p = [...(settings.printers || [])];
                                                                    p[index].type = role.id;
                                                                    setSettings({...settings, printers: p});
                                                                }}
                                                                className={`px-5 py-2.5 rounded-full text-[12px] font-black transition-all ${printer.type === role.id ? 'bg-black text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                                            >
                                                                {role.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Kitchen Categories Logic */}
                                                {(printer.type === 'kitchen' || printer.type === 'both') && (
                                                    <div className="md:col-span-2 lg:col-span-3 mt-4 pt-6 border-t border-gray-200 space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{locale === 'en' ? 'พิมพ์เฉพาะหมวดหมู่อาหาร (สำหรับครัวแยก)' : locale === 'zh' ? 'พิมพ์เฉพาะหมวดหมู่อาหาร (สำหรับครัวแยก)' : 'พิมพ์เฉพาะหมวดหมู่อาหาร (สำหรับครัวแยก)'}</label>
                                                        <div className="flex flex-wrap gap-3">
                                                            <button 
                                                                onClick={() => {
                                                                    const p = [...(settings.printers || [])];
                                                                    p[index].categories = ['all'];
                                                                    setSettings({...settings, printers: p});
                                                                }}
                                                                className={`px-4 py-2 text-[11px] font-black rounded-lg border transition-all ${printer.categories?.includes('all') ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                            >
                                                                {locale === 'en' ? '                                                                 พิมพ์ทุกหมวดหมู่                                                             ' : locale === 'zh' ? '                                                                 พิมพ์ทุกหมวดหมู่                                                             ' : '                                                                 พิมพ์ทุกหมวดหมู่                                                             '}</button>
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
                                                                        className={`px-4 py-2 text-[11px] font-black rounded-lg border transition-all ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                                    >
                                                                        {c.name}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Test Buttons */}
                                                <div className="md:col-span-2 lg:col-span-3 mt-4 pt-6 border-t border-gray-200 flex flex-wrap justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleDiagnosticPrint(index)}
                                                        className="px-6 py-3 bg-red-50 border border-red-200 hover:border-red-400 text-red-600 font-black text-[12px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                                                    >
                                                        <Printer size={14} /> 🛠️ พิมพ์ค้นหา Code Page (Diagnostic)
                                                    </button>
                                                    <button 
                                                        onClick={() => handleTestPrint(index)}
                                                        className="px-6 py-3 bg-white border border-gray-300 hover:border-black text-black font-black text-[12px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                                                    >
                                                        <Printer size={14} /> {locale === 'en' ? ' ทดสอบพิมพ์ใบเสร็จ (Test Print)                                                     ' : locale === 'zh' ? ' ทดสอบพิมพ์ใบเสร็จ (Test Print)                                                     ' : ' ทดสอบพิมพ์ใบเสร็จ (Test Print)                                                     '}</button>
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                    
                                    {(!settings.printers || settings.printers.length === 0) && (
                                        <div className="py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                            <Printer size={48} className="mb-4 opacity-50" />
                                            <p className="font-bold text-sm">{locale === 'en' ? 'ยังไม่มีเครื่องปริ้นเตอร์' : locale === 'zh' ? 'ยังไม่มีเครื่องปริ้นเตอร์' : 'ยังไม่มีเครื่องปริ้นเตอร์'}</p>
                                            <p className="text-[11px] mt-1 font-medium">{locale === 'en' ? 'กดปุ่ม Add Printer ด้านบนเพื่อเพิ่มอุปกรณ์' : locale === 'zh' ? 'กดปุ่ม Add Printer ด้านบนเพื่อเพิ่มอุปกรณ์' : 'กดปุ่ม Add Printer ด้านบนเพื่อเพิ่มอุปกรณ์'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'campaigns' && <POSCampaignsTab />}

                {/* BOTTOM SAVE BUTTON */}
                <div className="fixed bottom-0 left-0 right-0 p-6 sm:p-8 bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-end gap-4 z-50">
                    <button 
                        type="button"
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                                        for (let registration of registrations) {
                                            registration.unregister();
                                        }
                                        window.location.reload();
                                    }).catch(() => {
                                        window.location.reload();
                                    });
                                } else {
                                    window.location.reload();
                                }
                            }
                        }}
                        className="w-full sm:w-48 h-16 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all"
                    >
                        <RefreshCw size={20} />
                        Reload App
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full sm:w-64 h-16 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? 'SAVING...' : 'SAVE SETTINGS'}
                    </button>
                </div>

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
          )}
      </main>
    </>
  )
}
