import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTableManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /<p className="text-xs text-indigo-500 mt-2 font-medium">หากเลือกรวมโต๊ะ บิลและคิวอาหารจะถูกส่งไปที่โต๊ะหลักทั้งหมด<\/p>\s*<\/div>/;

const newToggle = `<p className="text-xs text-indigo-500 mt-2 font-medium">หากเลือกรวมโต๊ะ บิลและคิวอาหารจะถูกส่งไปที่โต๊ะหลักทั้งหมด</p>
                      </div>
                      
                      <div className="space-y-3 mt-6 pt-6 border-t border-gray-100">
                          <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative">
                                  <input 
                                      type="checkbox" 
                                      className="sr-only" 
                                      checked={!!editingTable.allow_after_hours}
                                      onChange={e => setEditingTable({...editingTable, allow_after_hours: e.target.checked})}
                                  />
                                  <div className={\`block w-10 h-6 rounded-full transition-colors \${editingTable.allow_after_hours ? 'bg-emerald-500' : 'bg-gray-200'}\`}></div>
                                  <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${editingTable.allow_after_hours ? 'transform translate-x-4' : ''}\`}></div>
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-900 group-hover:text-black">เปิดรับออเดอร์นอกเวลา (24/7)</span>
                                  <span className="text-xs text-gray-500 font-medium">ลูกค้าสามารถสั่งอาหารผ่าน QR โต๊ะนี้ได้ แม้จะปิดกะไปแล้ว</span>
                              </div>
                          </label>
                      </div>`;

content = content.replace(targetRegex, newToggle);
fs.writeFileSync(filePath, content);
console.log("Updated POSTableManager.tsx");
