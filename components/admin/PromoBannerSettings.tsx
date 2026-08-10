'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useI18n } from '@/lib/I18nContext'
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PromoBannerSettings() {
  const { locale } = useI18n()
  const [banners, setBanners] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('pos_banners')
      .select('*')
      .order('order_index', { ascending: true })
    if (data) setBanners(data)
    setIsLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `banner_${Date.now()}.${fileExt}`
      const filePath = `banners/${fileName}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('images')
        .upload(filePath, file)

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
    } catch (err: any) {
      console.error('Error uploading banner:', err)
      alert('Failed to upload banner: ' + err.message)
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    
    try {
      const { error } = await supabase
        .from('pos_banners')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      setBanners(banners.filter(b => b.id !== id))
    } catch (err: any) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const moveBanner = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === banners.length - 1) return

    const newBanners = [...banners]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap order_index
    const tempOrder = newBanners[index].order_index
    newBanners[index].order_index = newBanners[swapIndex].order_index
    newBanners[swapIndex].order_index = tempOrder

    // Swap positions in array
    const temp = newBanners[index]
    newBanners[index] = newBanners[swapIndex]
    newBanners[swapIndex] = temp

    setBanners(newBanners)

    // Update DB
    await Promise.all([
      supabase.from('pos_banners').update({ order_index: newBanners[index].order_index }).eq('id', newBanners[index].id),
      supabase.from('pos_banners').update({ order_index: newBanners[swapIndex].order_index }).eq('id', newBanners[swapIndex].id)
    ])
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setBanners(banners.map(b => b.id === id ? { ...b, is_active: newStatus } : b))
    await supabase.from('pos_banners').update({ is_active: newStatus }).eq('id', id)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">{locale === 'en' ? 'Promo Banners' : locale === 'zh' ? 'Promo Banners' : 'แบนเนอร์โปรโมชั่น'}</h2>
          <p className="text-sm text-gray-500 mt-1">{locale === 'en' ? 'Manage banners shown in LIFF menu' : locale === 'zh' ? 'Manage banners shown in LIFF menu' : 'จัดการรูปภาพแบนเนอร์ที่จะแสดงในหน้าสั่งอาหาร (LIFF)'}</p>
        </div>
        
        <div>
          <input 
            type="file" 
            id="banner-upload" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label 
            htmlFor="banner-upload"
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all shadow-md cursor-pointer ${isUploading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800 active:scale-95'}`}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isUploading ? (locale === 'en' ? 'Uploading...' : 'กำลังอัปโหลด...') : (locale === 'en' ? 'Add Banner' : 'เพิ่มแบนเนอร์')}
          </label>
        </div>
      </div>

      {banners.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <ImageIcon className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{locale === 'en' ? 'No banners yet' : 'ยังไม่มีแบนเนอร์'}</h3>
          <p className="text-sm text-gray-500 max-w-sm">{locale === 'en' ? 'Upload images to display them at the top of your menu.' : 'อัปโหลดรูปภาพเพื่อนำไปแสดงด้านบนของหน้าเมนูอาหาร'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group flex flex-col"
              >
                <div className="relative aspect-[16/7] bg-gray-100 w-full overflow-hidden">
                  <img src={banner.image_url} alt="Banner" className={`w-full h-full object-cover transition-all ${!banner.is_active ? 'opacity-50 grayscale' : ''}`} />
                  
                  {/* Status badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <button 
                      onClick={() => toggleActive(banner.id, banner.is_active)}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm transition-colors ${banner.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}
                    >
                      {banner.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-4 flex-1 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">Order: {banner.order_index}</span>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => moveBanner(index, 'up')}
                        disabled={index === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveBanner(index, 'down')}
                        disabled={index === banners.length - 1}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowDown size={14} />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      
                      <button 
                        onClick={() => handleDelete(banner.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
