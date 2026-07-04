const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSShopSettings.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const target = `<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">{locale === 'en' ? 'เงินกี่บาท ได้ 1 พอยท์ (Earn Rate)' : locale === 'zh' ? 'เงินกี่บาท ได้ 1 พอยท์ (Earn Rate)' : 'เงินกี่บาท ได้ 1 พอยท์ (Earn Rate)'}</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={settings.loyalty_earn_rate || 100}
                                                    onChange={e => setSettings({...settings, loyalty_earn_rate: parseInt(e.target.value) || 0})}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-16" 
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">{locale === 'en' ? 'baht' : locale === 'zh' ? '铢' : 'บาท'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">{locale === 'en' ? '1 พอยท์ ลดได้กี่บาท (Value)' : locale === 'zh' ? '1 พอยท์ ลดได้กี่บาท (Value)' : '1 พอยท์ ลดได้กี่บาท (Value)'}</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={settings.loyalty_points_per_thb || 10}
                                                    onChange={e => setSettings({...settings, loyalty_points_per_thb: parseInt(e.target.value) || 0})}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-black pr-16" 
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">{locale === 'en' ? 'baht' : locale === 'zh' ? '铢' : 'บาท'}</span>
                                            </div>
                                        </div>
                                    </div>`;

const replacement = `<div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-[14px] font-black tracking-tight text-[#1A1A18] mb-1 block">
                                                    {locale === 'en' ? 'Earn Rate' : 'อัตราการให้แต้ม (Earn Rate)'}
                                                </label>
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {locale === 'en' ? 'How many THB equals 1 Point' : 'ลูกค้าซื้อกี่บาท ถึงจะได้ 1 แต้ม'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-32">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_earn_rate || 0}
                                                        onChange={e => setSettings({...settings, loyalty_earn_rate: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-white border-2 border-gray-200 focus:border-[#1A1A18] rounded-xl py-3 text-center text-xl font-black outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[16px] font-black text-gray-400 tracking-widest">{locale === 'en' ? 'THB' : 'บาท'}</span>
                                                <span className="text-[16px] font-black text-[#1A1A18] mx-2">=</span>
                                                <span className="text-[16px] font-black text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl">1 {locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-[14px] font-black tracking-tight text-[#1A1A18] mb-1 block">
                                                    {locale === 'en' ? 'Redemption Value' : 'มูลค่าของแต้ม (Redemption)'}
                                                </label>
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {locale === 'en' ? 'How much discount for 1 Point' : 'ใช้ 1 แต้ม แลกส่วนลดได้กี่บาท'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[16px] font-black text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl">1 {locale === 'en' ? 'PT' : 'แต้ม'}</span>
                                                <span className="text-[16px] font-black text-[#1A1A18] mx-2">=</span>
                                                <div className="relative w-32">
                                                    <input 
                                                        type="number" 
                                                        value={settings.loyalty_points_per_thb || 0}
                                                        onChange={e => setSettings({...settings, loyalty_points_per_thb: parseInt(e.target.value) || 0})}
                                                        className="w-full bg-white border-2 border-gray-200 focus:border-[#1A1A18] rounded-xl py-3 text-center text-xl font-black outline-none transition-colors" 
                                                    />
                                                </div>
                                                <span className="text-[16px] font-black text-gray-400 tracking-widest">{locale === 'en' ? 'THB' : 'บาท'}</span>
                                            </div>
                                        </div>
                                    </div>`;

code = code.replace(target, replacement);
fs.writeFileSync(filePath, code);
