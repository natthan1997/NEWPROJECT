'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  Package, 
  BarChart3, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  Layers,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('sales');

  // Handle LIFF path redirection
  useEffect(() => {
    const path = searchParams.get('path');
    if (path && typeof path === 'string' && path.startsWith('/')) {
      router.replace(path);
    }
  }, [searchParams, router]);

  // Demo stats data
  const stats = [
    {
      id: 'sales',
      label: 'ยอดขายวันนี้',
      value: '฿24,680',
      change: '+ 18% จากเมื่อวาน',
      color: '#D3202B',
      bg: 'bg-red-50/50'
    },
    {
      id: 'queues',
      label: 'คิวรอปัจจุบัน',
      value: '12 ออเดอร์',
      change: 'อัปเดตล่าสุดเมื่อสักครู่',
      color: '#10B981',
      bg: 'bg-emerald-50/50'
    },
    {
      id: 'stock',
      label: 'สต็อกวัตถุดิบใกล้หมด',
      value: '5 รายการ',
      change: 'ควรสั่งเพิ่มด่วน',
      color: '#F59E0B',
      bg: 'bg-amber-50/50'
    }
  ];

  // Features list
  const features = [
    {
      title: 'จัดการคิว',
      description: 'จัดการคิวลูกค้า รวดเร็ว ไม่ตกหล่น',
      icon: Ticket,
      color: 'bg-red-100 text-[#D3202B]'
    },
    {
      title: 'สต็อกวัตถุดิบ',
      description: 'เช็กสต็อกแม่นยำ ไม่พลาดวัตถุดิบสำคัญ',
      icon: Package,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      title: 'รายงานยอดขาย',
      description: 'วิเคราะห์ยอดขาย เข้าใจธุรกิจได้ง่ายขึ้น',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans antialiased text-[#1A1A18] overflow-x-hidden selection:bg-red-100 selection:text-[#D3202B]">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-red-50/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-50/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-100/40">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-red-500/10">
            <Image 
              src="/logo-red.png" 
              alt="R POS Logo" 
              fill
              sizes="36px"
              priority
              className="object-contain"
              onError={(e) => {
                // Fallback to standard logo if logo-red doesn't load
                const target = e.target as HTMLImageElement;
                target.src = '/logo.png';
              }}
            />
          </div>
          <span className="text-[20px] font-black tracking-tight text-[#1A1A18]">
            R <span className="text-[#D3202B]">POS</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">ฟีเจอร์</a>
          <a href="#solutions" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">โซลูชัน</a>
          <a href="#pricing" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">ราคา</a>
        </nav>

        <div>
          <button 
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-gray-700 hover:text-black border border-gray-200/80 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            เข้าสู่ระบบ
            <ArrowRight size={14} className="text-[#D3202B]" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-10 md:pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Heading and description */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-[#D3202B] text-[10px] font-black uppercase tracking-widest w-fit shadow-sm border border-red-100/50"
          >
            <Sparkles size={12} className="animate-pulse" />
            ระบบจัดการร้านอาหารยุคใหม่
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[44px] sm:text-[54px] lg:text-[60px] font-black tracking-tight leading-[1.08] text-[#1A1A18]"
          >
            จัดการร้าน<span className="text-[#D3202B]">ง่ายขึ้น</span><br />
            เติบโตได้<span className="text-[#D3202B]">มากขึ้น</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[15px] sm:text-[16px] text-gray-500 max-w-md font-medium leading-relaxed"
          >
            POS ครบวงจรสำหรับร้านอาหาร คาเฟ่ และร้านเครื่องดื่ม ช่วยวิเคราะห์ยอดขาย จัดการคิวพนักงาน และคุมสต็อกสินค้าอย่างเป็นระบบได้ในแอปเดียว
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <button 
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-[#D3202B] hover:bg-red-700 text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.97] transition-all flex items-center gap-2"
            >
              เริ่มต้นใช้งาน
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
            <a 
              href="#features"
              className="px-6 py-4 text-sm font-black text-gray-600 hover:text-black transition-colors flex items-center gap-1.5 hover:translate-x-1 duration-200"
            >
              ดูฟีเจอร์
              <ArrowRight size={16} className="text-[#D3202B]" />
            </a>
          </motion.div>
        </div>

        {/* Right Column: Dashboard Mockup */}
        <div className="lg:col-span-7 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
            className="w-full max-w-[620px] bg-white/95 rounded-[32px] border border-black/5 shadow-[0_24px_50px_rgba(0,0,0,0.06)] p-6 md:p-8 backdrop-blur-xl relative overflow-hidden group"
          >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none -z-10" />
            
            {/* Header row of mockup */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100/80">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-gray-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">ภาพรวมร้านวันนี้</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">LIVE</span>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
              {stats.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedMetric(item.id)}
                  className={`cursor-pointer p-4 rounded-[22px] transition-all duration-300 border ${
                    selectedMetric === item.id 
                      ? 'bg-[#FDFDFD] border-red-500/20 shadow-[0_10px_25px_rgba(211,32,43,0.05)] scale-[1.03]' 
                      : 'bg-neutral-50/50 hover:bg-neutral-50 border-transparent'
                  }`}
                >
                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center truncate">
                    {item.label}
                  </p>
                  <p className="text-[18px] md:text-[22px] font-black text-[#1A1A18] tracking-tight text-center my-1.5 leading-none">
                    {item.value}
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    {item.id === 'sales' && (
                      <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[#D3202B]">
                        <TrendingUp size={10} strokeWidth={3} />
                      </span>
                    )}
                    {item.id === 'queues' && (
                      <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Users size={10} strokeWidth={3} />
                      </span>
                    )}
                    {item.id === 'stock' && (
                      <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Package size={10} strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-[8px] md:text-[9px] font-bold text-gray-500 whitespace-nowrap truncate">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sales Chart Card */}
            <div className="bg-neutral-50/40 border border-neutral-100/60 rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1A1A18]">ยอดขาย (7 วันที่ผ่านมา)</h4>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">ช่วงเวลา 12 พ.ค. - 18 พ.ค.</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-1 rounded-lg">
                  <span>รายวัน</span>
                  <ChevronDown size={10} />
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="relative h-[160px] w-full mt-2">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="140" x2="600" y2="140" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="4" />

                  {/* Gradient Fill */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D3202B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#D3202B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area path */}
                  <path 
                    d="M 50 140 Q 120 110 160 110 T 280 80 T 400 100 T 500 50 T 550 90 L 550 200 L 50 200 Z" 
                    fill="url(#chartGradient)" 
                  />

                  {/* Main Line path */}
                  <path 
                    d="M 50 140 Q 120 110 160 110 T 280 80 T 400 100 T 500 50 T 550 90" 
                    fill="none" 
                    stroke="#D3202B" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                  />

                  {/* Pulsing Dots */}
                  <circle cx="50" cy="140" r="5" fill="#D3202B" stroke="#FFF" strokeWidth="2.5" />
                  <circle cx="160" cy="110" r="5" fill="#D3202B" stroke="#FFF" strokeWidth="2.5" />
                  <circle cx="280" cy="80" r="5" fill="#D3202B" stroke="#FFF" strokeWidth="2.5" />
                  <circle cx="400" cy="100" r="5" fill="#D3202B" stroke="#FFF" strokeWidth="2.5" />
                  
                  {/* Highlighted Top Point */}
                  <circle cx="500" cy="50" r="7" fill="#D3202B" className="animate-ping" />
                  <circle cx="500" cy="50" r="6" fill="#D3202B" stroke="#FFF" strokeWidth="3" />
                  
                  <circle cx="550" cy="90" r="5" fill="#D3202B" stroke="#FFF" strokeWidth="2.5" />
                </svg>
                
                {/* Custom tooltip hover effect on top point */}
                <div className="absolute top-2 left-[78%] bg-[#1A1A18] text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-md border border-neutral-800 -translate-x-1/2 flex flex-col items-center">
                  <span>฿39,500</span>
                  <span className="text-[7px] text-red-400 font-bold uppercase tracking-widest">สูงสุด</span>
                </div>
              </div>

              {/* Chart Dates Axis */}
              <div className="flex justify-between items-center px-4 mt-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span>12 พ.ค.</span>
                <span>13 พ.ค.</span>
                <span>14 พ.ค.</span>
                <span>15 พ.ค.</span>
                <span>16 พ.ค.</span>
                <span>17 พ.ค.</span>
                <span>18 พ.ค.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES / CAPABILITIES SHOWCASE SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-100/80 bg-neutral-50/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`p-6 rounded-[28px] border transition-all duration-300 flex items-start gap-4 ${
                  hoveredFeature === index 
                    ? 'bg-white border-red-500/10 shadow-[0_12px_30px_rgba(0,0,0,0.03)] scale-[1.02]' 
                    : 'bg-white/40 border-gray-100/50 hover:bg-white/60'
                }`}
              >
                <div className={`p-4 rounded-2xl ${feat.color} flex items-center justify-center shrink-0`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left space-y-1.5">
                  <h3 className="text-sm font-black text-[#1A1A18]">{feat.title}</h3>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">{feat.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden shadow-sm">
            <Image 
              src="/logo-red.png" 
              alt="R POS Logo" 
              fill
              sizes="28px"
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.png';
              }}
            />
          </div>
          <span className="text-sm font-black tracking-tight text-neutral-800">
            R <span className="text-[#D3202B]">POS</span>
          </span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} RUSH UP. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
