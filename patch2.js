const fs = require('fs');
const file = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace aspect-video with aspect-square
content = content.replace(
  /<div className="aspect-video bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">/g,
  `<div className="aspect-square bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">`
);

// Add crop button next to trash button
const trashBtnStr = `<button 
                                              onClick={() => setEditingItem({...editingItem, image_url: null})}
                                              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md shadow-xl text-red-500 hover:bg-white transition-all"
                                          >
                                              <Trash size={16} />
                                          </button>`;

const replacementStr = `<div className="absolute top-4 right-4 flex gap-2">
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
                                          </div>`;

content = content.replace(trashBtnStr, replacementStr);
fs.writeFileSync(file, content);
console.log("Patched successfully!");
