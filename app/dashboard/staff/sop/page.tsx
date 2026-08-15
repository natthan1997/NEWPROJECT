'use client';

import React from 'react';
import { BookOpen, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import SOPStaticContent from '@/components/pos/SOPStaticContent';

export default function StaffSOPPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F0] text-[#4A2C11] font-sans pb-16">
            
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E5DF] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/staff" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-[#4A2C11]" />
                    </Link>
                    <div>
                        <h1 className="text-[18px] font-black text-[#4A2C11] leading-tight">คู่มือพนักงาน (SOP)</h1>
                        <p className="text-[11px] font-medium text-gray-500">มาตรฐานการบริการและกฎระเบียบภายใน</p>
                    </div>
                </div>
                <BookOpen size={24} className="text-[#965A27] opacity-20 absolute right-6" />
            </div>

            <div className="mt-6 px-4">
                <SOPStaticContent />
            </div>
        </div>
    );
}
