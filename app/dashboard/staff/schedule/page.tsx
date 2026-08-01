'use client';

import { useI18n } from "@/lib/I18nContext";
import { StaffWorkCalendar } from "@/components/dashboard/StaffWorkCalendar";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export default function StaffSchedule() {
  const { locale } = useI18n();

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto min-h-screen pb-20">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/dashboard/staff" 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {locale === 'en' ? 'My Schedule' : locale === 'zh' ? '我的日程安排' : 'ปฏิทินตารางงาน'}
          </h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            ภาพรวมวันทำงานและประวัติลงเวลาของคุณ
          </p>
        </div>
      </div>

      <StaffWorkCalendar />
    </div>
  );
}