const fs = require('fs');
const file = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<button[\s\n]*onClick=\{\(\) => setEditingItem\(\{\.\.\.editingItem, image_url: null\}\)\}[\s\n]*className="absolute top-4 right-4 p-2 bg-white\/80 backdrop-blur-md shadow-xl text-red-500 hover:bg-white transition-all"[\s\n]*>[\s\n]*<Trash size=\{16\} \/>[\s\n]*<\/button>/;

const replacementBtn = `<div className="absolute top-4 right-4 flex gap-2">
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

if (regex.test(content)) {
    content = content.replace(regex, replacementBtn);
    fs.writeFileSync(file, content);
    console.log("Patched buttons successfully with regex!");
} else {
    console.log("Regex did not match!");
}
