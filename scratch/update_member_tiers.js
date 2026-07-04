import fs from 'fs';

const filePath = 'app/liff/member/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace Title
content = content.replace(/<h1 className="text-base font-bold tracking-tight">\{dict\.title\}<\/h1>/g, '<h1 className="text-base font-bold tracking-tight uppercase tracking-widest">XYL MEMBER</h1>');

// Replace Tiers
const oldTiers = `  const getTiers = (loc: string) => [
    { name: loc === 'en' ? 'Seed' : loc === 'zh' ? '种子' : 'Seed', minPoints: 0, color: '#86efac', bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
    { name: loc === 'en' ? 'Sprout' : loc === 'zh' ? '发芽' : 'Sprout', minPoints: 500, color: '#4ade80', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🪴' },
    { name: loc === 'en' ? 'Tree' : loc === 'zh' ? '大树' : 'Tree', minPoints: 2000, color: '#22c55e', bg: 'bg-emerald-500', text: 'text-white', icon: '🌳' },
    { name: loc === 'en' ? 'Bloom' : loc === 'zh' ? '开花' : 'Bloom', minPoints: 5000, color: '#16a34a', bg: 'bg-emerald-700', text: 'text-white', icon: '🌸' }
  ];`;

const newTiers = `  const getTiers = (loc: string) => [
    { name: 'Bronze', minPoints: 0, color: '#b45309', bg: 'bg-orange-50', text: 'text-orange-700', icon: '🥉' },
    { name: 'Silver', minPoints: 500, color: '#64748b', bg: 'bg-slate-100', text: 'text-slate-700', icon: '🥈' },
    { name: 'Gold', minPoints: 2000, color: '#ca8a04', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '🥇' },
    { name: 'Platinum', minPoints: 5000, color: '#0369a1', bg: 'bg-sky-50', text: 'text-sky-700', icon: '💎' }
  ];`;

content = content.replace(oldTiers, newTiers);

fs.writeFileSync(filePath, content);
console.log('Updated app/liff/member/page.tsx');
