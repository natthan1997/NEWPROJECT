const fs = require('fs');

const pagePath = './app/dashboard/admin/pos-settings/page.tsx';
const posSettingsPath = './components/pos/POSShopSettings.tsx';

let pageContent = fs.readFileSync(pagePath, 'utf8');
let posContent = fs.readFileSync(posSettingsPath, 'utf8');

// 1. Extract functions
const updateOpeningHourMatch = pageContent.match(/const updateOpeningHour = \([\s\S]*?\}\n/);
const addDeliveryRuleMatch = pageContent.match(/const addDeliveryRule = \([\s\S]*?\}\n/);
const removeDeliveryRuleMatch = pageContent.match(/const removeDeliveryRule = \([\s\S]*?\}\n/);
const updateDeliveryRuleMatch = pageContent.match(/const updateDeliveryRule = \([\s\S]*?\}\n/);

const functionsToInject = [
    updateOpeningHourMatch?.[0] || '',
    addDeliveryRuleMatch?.[0] || '',
    removeDeliveryRuleMatch?.[0] || '',
    updateDeliveryRuleMatch?.[0] || ''
].join('\n  ');

// 2. Extract sections
const shopStatusMatch = pageContent.match(/\{\/\* Section: Shop Status \*\/\}[\s\S]*?(?=\{\/\* Section: Opening Hours \*\/})/);
const openingHoursMatch = pageContent.match(/\{\/\* Section: Opening Hours \*\/\}[\s\S]*?(?=\{\/\* Section: Attendance Rules \*\/})/);
const attendanceRulesMatch = pageContent.match(/\{\/\* Section: Attendance Rules \*\/\}[\s\S]*?(?=\{\/\* Section: Delivery Rules \*\/})/);
const deliveryRulesMatch = pageContent.match(/\{\/\* Section: Delivery Rules \*\/\}[\s\S]*?(?=\{\/\* Section: Delivery GP Rules \*\/})/);
const deliveryGPRulesMatch = pageContent.match(/\{\/\* Section: Delivery GP Rules \*\/\}[\s\S]*?(?=<div className="w-full h-8" ><\/div>|<\/div>\n        \)\}\n      <\/div>)/); // rough end match

// Transform extracted sections to use POSShopSettings layout
let shopStatusJSX = shopStatusMatch?.[0] || '';
let openingHoursJSX = openingHoursMatch?.[0] || '';
let attendanceJSX = attendanceRulesMatch?.[0] || '';
let deliveryRulesJSX = deliveryRulesMatch?.[0] || '';
let deliveryGPJSX = deliveryGPRulesMatch?.[0] || '';

// Remove <section> wrappers as POSShopSettings uses <div className="bg-white rounded-3xl p-8...">
const replaceSectionWrapper = (str) => {
    str = str.replace(/<section className="bg-white border border-\[#E5E5E5\] p-8 md:p-10">/, '<div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">');
    str = str.replace(/<\/section>/g, '</div>');
    return str;
};

shopStatusJSX = replaceSectionWrapper(shopStatusJSX);
openingHoursJSX = replaceSectionWrapper(openingHoursJSX);
attendanceJSX = replaceSectionWrapper(attendanceJSX);
deliveryRulesJSX = replaceSectionWrapper(deliveryRulesJSX);
deliveryGPJSX = replaceSectionWrapper(deliveryGPJSX);

// Replace branches.find(...) with just settings.branch_id for geo-fencing (or hide branch info)
shopStatusJSX = shopStatusJSX.replace(/<div className="bg-\[#F5F5F5\] p-6 border-l-4 border-\[#111111\]">[\s\S]*?<\/div>\s*<\/div>/, '</div>');

// Remove h2 classes and replace with POSShopSettings h3 style
const replaceH2 = (str) => {
    return str.replace(/<h2 className="text-xl font-medium mb-8 flex items-center gap-3">/, '<h3 className="text-xl font-black mb-8 flex items-center gap-3">')
              .replace(/<h2 className="text-xl font-medium flex items-center gap-3">/, '<h3 className="text-xl font-black flex items-center gap-3">')
              .replace(/<\/h2>/g, '</h3>');
};

shopStatusJSX = replaceH2(shopStatusJSX);
openingHoursJSX = replaceH2(openingHoursJSX);
attendanceJSX = replaceH2(attendanceJSX);
deliveryRulesJSX = replaceH2(deliveryRulesJSX);
deliveryGPJSX = replaceH2(deliveryGPJSX);

// Inject tabs definition
const newTabs = `
                            { id: 'general', icon: Info, label: 'ข้อมูลร้านค้า', desc: 'ที่อยู่, แจ้งเตือน' },
                            { id: 'operational', icon: Clock, label: 'การจัดการร้าน', desc: 'เปิด/ปิดร้าน, เวลาทำการ' },
                            { id: 'delivery', icon: Truck, label: 'เดลิเวอรี่', desc: 'ค่าส่ง, หัก GP' },
                            { id: 'receipt', icon: Printer, label: 'ตั้งค่าใบเสร็จ', desc: 'หัวบิล, โลโก้, ท้ายบิล' },
`;
posContent = posContent.replace(/\{\s*id:\s*'general'[\s\S]*?\{\s*id:\s*'receipt'/m, newTabs.trim());


// Inject imports
const importsToAdd = `import { Store, Clock, Navigation, Truck, Percent, Trash2, Plus } from 'lucide-react'
import { DAYS } from '@/lib/utils'
`;
posContent = posContent.replace(/import {([^}]+)} from 'lucide-react'/, (match, p1) => {
    const existing = p1.split(',').map(s => s.trim());
    const newIcons = ['Store', 'Clock', 'Navigation', 'Truck', 'Percent', 'Trash2', 'Plus'];
    newIcons.forEach(i => {
        if (!existing.includes(i)) existing.push(i);
    });
    return `import { ${existing.join(', ')} } from 'lucide-react'`;
});

if (!posContent.includes("import { DAYS }")) {
    posContent = posContent.replace(/import { useState, useEffect } from 'react'/, `import { useState, useEffect } from 'react'\nimport { DAYS } from '@/lib/utils'`);
}

// Inject functions before handleSaveSettings
posContent = posContent.replace(/const handleSaveSettings = async \(\) => \{/, `${functionsToInject}\n\n  const handleSaveSettings = async () => {`);

// Inject new tab content
const newTabContent = `
                        {activeTab === 'operational' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                ${shopStatusJSX}
                                ${openingHoursJSX}
                                ${attendanceJSX}
                            </div>
                        )}

                        {activeTab === 'delivery' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                ${deliveryRulesJSX}
                                ${deliveryGPJSX}
                            </div>
                        )}
`;

// Insert after general tab content
posContent = posContent.replace(/(\{\/\* ---------------------------------------------------------------- \*\/}\s*\{\/\* RECEIPT TAB \*\/})/, `${newTabContent}\n                        $1`);

fs.writeFileSync(posSettingsPath, posContent);
console.log('POSShopSettings.tsx updated successfully.');

// Rewrite page.tsx
const newPageContent = `'use client'

import { useI18n } from '@/lib/i18n'
import { Store, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/auth'

export default function PosSettingsPage() {
  const { locale } = useI18n()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const p = await getUserProfile()
      setProfile(p)
    }
    init()
  }, [])

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100"
      >
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-black mb-4">
          {locale === 'en' ? 'Settings Moved' : locale === 'zh' ? 'Settings Moved' : 'ย้ายการตั้งค่าแล้ว'}
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {locale === 'en' 
            ? 'The POS & Operational Settings have been consolidated into the POS system to prevent redundancy and keep all settings in one place.' 
            : locale === 'zh' 
            ? 'The POS & Operational Settings have been consolidated into the POS system to prevent redundancy and keep all settings in one place.' 
            : 'การตั้งค่าร้านและเดลิเวอรี่ทั้งหมด ได้ถูกย้ายไปรวมไว้ในหน้าต่าง "ตั้งค่า" ของระบบ POS แล้ว เพื่อลดความซ้ำซ้อนและให้พนักงานจัดการจบได้ในที่เดียว'}
        </p>

        <Link 
          href="/dashboard/pos"
          className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full"
        >
          {locale === 'en' ? 'Open POS System' : locale === 'zh' ? 'Open POS System' : 'เข้าสู่ระบบ POS'}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  )
}
`;

fs.writeFileSync(pagePath, newPageContent);
console.log('page.tsx updated successfully.');
