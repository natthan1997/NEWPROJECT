const fs = require('fs');

const pagePath = './scratch/old_page.tsx';
const posSettingsPath = './components/pos/POSShopSettings.tsx';

let pageContent = fs.readFileSync(pagePath, 'utf8');
let posContent = fs.readFileSync(posSettingsPath, 'utf8');

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

// Insert before {/* TAB: RECEIPT */}
posContent = posContent.replace(/(\{\/\* TAB: RECEIPT \*\/})/, `${newTabContent}\n                        $1`);

fs.writeFileSync(posSettingsPath, posContent);
console.log('POSShopSettings.tsx injected successfully.');
