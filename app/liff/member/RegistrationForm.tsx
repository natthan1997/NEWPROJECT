'use client';
import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface RegistrationFormProps {
  lineProfile: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export default function RegistrationForm({ lineProfile, onSubmit, isSubmitting }: RegistrationFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [consent, setConsent] = useState(false);

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || phone.length < 9 || !dob || !gender || !consent) {
      return;
    }
    onSubmit({
      firstName,
      lastName,
      phone,
      dateOfBirth: dob,
      gender,
      pdpaConsent: consent
    });
  };

  const isFormValid = firstName.trim() && lastName.trim() && phone.length >= 9 && dob && gender && consent;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#222] px-5 py-4 flex items-center justify-between">
        <div className="w-6"></div>
        <h1 className="text-[14px] font-bold tracking-[0.2em] text-white uppercase">XYL STUDIO</h1>
        <button className="text-[#666]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </header>

      <main className="px-5 pt-8 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[24px] font-medium tracking-tight text-white">สมัครสมาชิก</h2>
          <div className="flex items-center gap-2 text-[12px] font-medium tracking-wider text-[#888] bg-[#141414] px-3 py-1.5 rounded-full border border-[#222]">
            <span>TH</span>
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Profile Picture */}
        <div className="mb-10 flex justify-center">
          <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#141414] border border-[#333] shadow-xl">
            {lineProfile?.pictureUrl ? (
              <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#444]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* First Name */}
          <div>
            <label className="block text-[13px] tracking-wide text-[#888] mb-2 uppercase">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              placeholder="First Name" 
              className="w-full bg-[#141414] border border-[#222] rounded-[12px] px-5 py-4 text-[15px] focus:bg-[#1A1A1A] focus:border-[#444] focus:ring-1 focus:ring-[#444] outline-none transition-all placeholder:text-[#555] text-white" 
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-[13px] tracking-wide text-[#888] mb-2 uppercase">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              placeholder="Last Name" 
              className="w-full bg-[#141414] border border-[#222] rounded-[12px] px-5 py-4 text-[15px] focus:bg-[#1A1A1A] focus:border-[#444] focus:ring-1 focus:ring-[#444] outline-none transition-all placeholder:text-[#555] text-white" 
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[13px] tracking-wide text-[#888] mb-2 uppercase">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-[#141414] border border-[#222] rounded-[12px] px-4 py-4 text-[#888] shrink-0">
                <span className="text-[14px]">+66</span>
                <ChevronDown size={14} />
              </div>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="Phone Number" 
                className="w-full bg-[#141414] border border-[#222] rounded-[12px] px-5 py-4 text-[15px] focus:bg-[#1A1A1A] focus:border-[#444] focus:ring-1 focus:ring-[#444] outline-none transition-all placeholder:text-[#555] text-white" 
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[13px] tracking-wide text-[#888] mb-1 uppercase">
              วันเกิด <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <input 
                type="date" 
                value={dob} 
                onChange={e => setDob(e.target.value)} 
                className="w-full bg-[#141414] border border-[#222] rounded-[12px] px-5 py-4 text-[15px] focus:bg-[#1A1A1A] focus:border-[#444] focus:ring-1 focus:ring-[#444] outline-none transition-all text-white placeholder:text-[#555]" 
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#222] my-10"></div>

        {/* Gender */}
        <div className="space-y-5">
          <label className="block text-[13px] tracking-wide text-[#888] uppercase">
            เพศ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['ชาย', 'หญิง', 'ไม่ระบุ'].map(g => {
              const isSelected = gender === g;
              return (
                <label key={g} className={`flex items-center justify-center py-3 rounded-[12px] border cursor-pointer transition-all ${isSelected ? 'bg-white border-white text-black font-medium' : 'bg-[#141414] border-[#222] text-[#888] hover:border-[#444]'}`}>
                  <span className="text-[14px]">{g}</span>
                  <input 
                    type="radio" 
                    name="gender" 
                    value={g} 
                    checked={isSelected} 
                    onChange={() => setGender(g)} 
                    className="hidden" 
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#222] my-10"></div>

        {/* Consent */}
        <div className="space-y-6">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className={`mt-0.5 w-[24px] h-[24px] shrink-0 rounded-[6px] border flex items-center justify-center transition-all ${consent ? 'bg-white border-white' : 'border-[#444] bg-[#141414] group-hover:border-[#666]'}`}>
              {consent && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <div className="text-[13px] leading-[1.8] text-[#aaa] select-none">
              <span>ข้าพเจ้ายอมรับ </span>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-white font-medium underline decoration-[#444] underline-offset-4 hover:decoration-white transition-colors">ข้อกำหนดการใช้บริการ</a>
              <span> และ </span>
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-white font-medium underline decoration-[#444] underline-offset-4 hover:decoration-white transition-colors">นโยบายความเป็นส่วนตัว</a>
              <span> ของ XYL Studio และตกลงเพิ่มบัญชีทางการเป็นเพื่อน เพื่อสะสมแต้ม</span>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={consent}
              onChange={() => setConsent(!consent)}
            />
          </label>
        </div>
      </main>

      {/* Submit Button Area - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pt-10 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-[12px] font-medium text-[15px] tracking-wide flex justify-center items-center transition-all duration-300 ${
              isFormValid 
                ? 'bg-white text-black hover:bg-gray-200 hover:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                : 'bg-[#1A1A1A] text-[#444] border border-[#222] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin text-[#888]" /> : 'CONFIRM REGISTRATION'}
          </button>
        </div>
      </div>
      
    </div>
  );
}
