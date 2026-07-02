import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/dashboard/delivery/DeliveryManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the main wrapper backgrounds
content = content.replace(
  'className={`flex flex-col overflow-hidden font-sans ${isDrawer ? \'h-full bg-white\' : \'h-[calc(100vh-120px)] bg-[#F8F9FA]\'}`}',
  'className={`flex flex-col overflow-hidden font-sans ${isDrawer ? \'h-full bg-[#F5F5F7]\' : \'h-[calc(100vh-120px)] bg-[#F5F5F7]\'}`}'
);

content = content.replace(
  'className={`flex-none border-b border-gray-100 z-10 ${isDrawer ? \'px-8 pt-16 pb-8 bg-[#FDFDFB]\' : \'p-6 bg-white\'}`}',
  'className={`flex-none border-b border-gray-200/50 z-10 ${isDrawer ? \'px-6 pt-12 pb-6 bg-[#F5F5F7]\' : \'px-8 py-6 bg-white shadow-sm\'}`}'
);

content = content.replace(
  'className={`flex-1 overflow-y-auto custom-scrollbar ${isDrawer ? \'p-6 pb-24 bg-[#FDFDFB] flex flex-col gap-6\' : \'p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#F0F2F5]\'}`}',
  'className={`flex-1 overflow-y-auto custom-scrollbar ${isDrawer ? \'p-4 pb-24 flex flex-col gap-4\' : \'p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\'}`}'
);

fs.writeFileSync(filePath, content);
console.log('Updated container backgrounds');
