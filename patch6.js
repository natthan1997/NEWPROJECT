const fs = require('fs');
const file = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const onCropCompleteFn = `
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])
`;

// Insert onCropComplete before handleConfirmCrop
content = content.replace(
  '  const handleConfirmCrop = async () => {',
  onCropCompleteFn + '\n  const handleConfirmCrop = async () => {'
);

const cropperModal = `
      {/* Image Cropper Modal */}
      {isCropping && cropImageSrc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#1A1A18]">Crop Image</h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Adjust your image to fit perfectly</p>
              </div>
              <button onClick={() => {
                setIsCropping(false)
                setCropImageSrc(null)
              }} className="p-2 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 min-h-[400px] relative bg-gray-900">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <ZoomOut size={16} className="text-gray-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-black h-1 bg-gray-200 appearance-none outline-none"
                />
                <ZoomIn size={16} className="text-gray-400" />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCropping(false)
                    setCropImageSrc(null)
                  }}
                  className="px-6 py-3 border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCrop}
                  className="px-6 py-3 bg-[#1A1A18] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors"
                >
                  Confirm Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

// Replace end of component to inject modal
content = content.replace(
  /(\s*)\)\s*}\s*<style jsx global>\{\`/g,
  `$1)}
${cropperModal}
      <style jsx global>{\``
);

fs.writeFileSync(file, content);
console.log("Patched missing cropper logic!");
