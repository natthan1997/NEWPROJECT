'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Ticket, Bell, Menu } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

export default function LiffBottomNav() {
  const pathname = usePathname();
  const { locale } = useI18n();

  const navItems = [
    {
      id: 'home',
      path: '/liff/member',
      icon: <Home size={22} strokeWidth={pathname === '/liff/member' ? 2.5 : 2} />,
      label: locale === 'en' ? 'Home' : 'หน้าหลัก'
    },
    {
      id: 'rewards',
      path: '/liff/rewards',
      icon: <Gift size={22} strokeWidth={pathname === '/liff/rewards' ? 2.5 : 2} />,
      label: locale === 'en' ? 'Rewards' : 'ของรางวัล'
    },
    {
      id: 'my-rewards',
      path: '/liff/my-rewards',
      icon: <Ticket size={22} strokeWidth={pathname === '/liff/my-rewards' ? 2.5 : 2} />,
      label: locale === 'en' ? 'My Rewards' : 'รางวัลของฉัน'
    },
    {
      id: 'history',
      path: '/liff/history',
      icon: <Bell size={22} strokeWidth={pathname === '/liff/history' ? 2.5 : 2} />,
      label: locale === 'en' ? 'History' : 'การแจ้งเตือน'
    },
    {
      id: 'menu',
      path: '/liff/menu',
      icon: <Menu size={22} strokeWidth={pathname === '/liff/menu' ? 2.5 : 2} />,
      label: locale === 'en' ? 'Menu' : 'เมนู'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Link 
              href={item.path} 
              key={item.id}
              className={`flex flex-col items-center justify-center w-16 h-12 gap-1 transition-colors ${
                isActive ? 'text-[#1A1A18]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110 transition-transform' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
