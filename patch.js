const fs = require('fs');
const file = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  `Menu as MenuIcon, LogOut, Settings, List, Star, ToggleRight, CheckCircle2, XCircle, Upload, AlertCircle\n} from 'lucide-react'`,
  `Menu as MenuIcon, LogOut, Settings, List, Star, ToggleRight, CheckCircle2, XCircle, Upload, AlertCircle, Crop\n} from 'lucide-react'`
);
content = content.replace(
  `import { sortMenuItemsByOrder, withMenuSortOrder } from '@/lib/posMenuOrder'`,
  `import { sortMenuItemsByOrder, withMenuSortOrder } from '@/lib/posMenuOrder'\nimport Cropper from 'react-easy-crop'\nimport getCroppedImg from '@/lib/cropImage'`
);

// 2. States
content = content.replace(
  `const [editingItem, setEditingItem] = useState<any>(null)\n  const [isSaving, setIsSaving] = useState(false)`,
  `const [editingItem, setEditingItem] = useState<any>(null)\n  const [isSaving, setIsSaving] = useState(false)\n\n  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)\n  const [crop, setCrop] = useState({ x: 0, y: 0 })\n  const [zoom, setZoom] = useState(1)\n  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)\n  const [isCropping, setIsCropping] = useState(false)`
);

// 3. handleImageUpload
content = content.replace(
  `  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      setIsSaving(true)
      try {
          const fileExt = file.name.split('.').pop()
          const fileName = \`\${Math.random()}.\${fileExt}\`
          const filePath = \`pos-menus/\${fileName}\`
          
          const { data: { session } } = await supabase.auth.getSession()
          
          const formData = new FormData()
          formData.append('file', file)
          formData.append('bucket', 'marketplace-images')
          formData.append('path', filePath)

          const uploadRes = await fetch('/api/admin/storage/upload', {
            method: 'POST',
            headers: {
              ...(session?.access_token ? { Authorization: \`Bearer \${session.access_token}\` } : {})
            },
            body: formData
          })

          const uploadResult = await uploadRes.json()
          if (!uploadRes.ok) throw new Error(uploadResult.error || 'Failed to upload file')
              
          setEditingItem({ ...editingItem, image_url: uploadResult.publicUrl })
      } catch (error: any) {
          alert('Error uploading image: ' + error.message)
      } finally {
          setIsSaving(false)
      }
  }`,
  `  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      const objectUrl = URL.createObjectURL(file)
      setCropImageSrc(objectUrl)
      setIsCropping(true)
      e.target.value = ''
  }

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return

    setIsSaving(true)
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
      const fileExt = 'jpeg'
      const fileName = \`\${Math.random()}.\${fileExt}\`
      const filePath = \`pos-menus/\${fileName}\`

      const file = new File([croppedBlob], fileName, { type: 'image/jpeg' })
      const { data: { session } } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'marketplace-images')
      formData.append('path', filePath)

      const uploadRes = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: \`Bearer \${session.access_token}\` } : {})
        },
        body: formData
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
  }`
);

// 4. UI update
content = content.replace(
  `<div className="aspect-video bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                  {editingItem.image_url ? (
                                      <>
                                          <img loading="lazy" crossOrigin="anonymous"  src={editingItem.image_url || ''} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                          <button 
                                              onClick={() => setEditingItem({...editingItem, image_url: null})}
                                              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md shadow-xl text-red-500 hover:bg-white transition-all"
                                          >
                                              <Trash size={16} />
                                          </button>
                                      </>`,
  `<div className="aspect-square bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                  {editingItem.image_url ? (
                                      <>
                                          <img loading="lazy" crossOrigin="anonymous"  src={editingItem.image_url || ''} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                          <div className="absolute top-4 right-4 flex gap-2">
                                              <button 
                                                  onClick={() => {
                                                    setCropImageSrc(editingItem.image_url)
                                                    setIsCropping(true)
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
                                      </>`
);

// 5. Cropper Modal
const cropperModal = `
      {/* Image Cropper Modal */}
      <AnimatePresence>
        {isCropping && cropImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#111111] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h3 className="text-sm font-bold tracking-[0.12em] text-white uppercase">{locale === 'en' ? 'Crop Image' : locale === 'zh' ? '裁剪图片' : 'จัดตำแหน่งรูปภาพ'}</h3>
                <button
                  onClick={() => {
                    setIsCropping(false)
                    setCropImageSrc(null)
                  }}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative h-[400px] w-full bg-black">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  onZoomChange={setZoom}
                  classes={{
                    containerClassName: "cropper-container",
                    mediaClassName: "cropper-media"
                  }}
                />
              </div>

              <div className="border-t border-white/10 px-6 py-4 pb-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-white/50">ZOOM</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 w-full appearance-none rounded-full bg-white/20 outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
                <button
                  onClick={handleConfirmCrop}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-black transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Crop size={16} />}
                  {isSaving ? 'กำลังอัปโหลด...' : (locale === 'en' ? 'Confirm & Upload' : locale === 'zh' ? '确认并上传' : 'ยืนยันและอัปโหลด')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

content = content.replace(
  `          </div>
        </div>
      )}
    </div>
  )
}`,
  `          </div>
        </div>
      )}
${cropperModal}
    </div>
  )
}`
);

fs.writeFileSync(file, content);
console.log('Patched');
