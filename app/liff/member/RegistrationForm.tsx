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
  const [favoriteMenu, setFavoriteMenu] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || phone.length < 9 || !dob || !gender || favoriteMenu.length === 0 || !consent) {
      return;
    }
    onSubmit({
      firstName,
      lastName,
      phone,
      dateOfBirth: dob,
      gender,
      favoriteMenu,
      pdpaConsent: consent
    });
  };

  const isFormValid = firstName.trim() && lastName.trim() && phone.length >= 9 && dob && gender && favoriteMenu.length > 0 && consent;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <div className="w-6"></div>
        <h1 className="text-[16px] font-bold tracking-widest text-gray-900 uppercase">XYL STUDIO</h1>
        <button className="text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </header>

      <main className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-bold text-gray-900">สมัครสมาชิก</h2>
          <div className="flex items-center gap-2 text-[14px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span>🇹🇭</span>
            <span>TH</span>
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Profile Picture */}
        <div className="mb-8">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {lineProfile?.pictureUrl ? (
              <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* First Name */}
          <div>
            <label className="block text-[14px] font-medium text-gray-900 mb-2">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              placeholder="ชื่อ" 
              className="w-full bg-white border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all placeholder:text-gray-400" 
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-[14px] font-medium text-gray-900 mb-2">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              placeholder="นามสกุล" 
              className="w-full bg-white border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all placeholder:text-gray-400" 
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[14px] font-medium text-gray-900 mb-2">
              หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[8px] px-4 py-3 text-gray-500 shrink-0">
                <span>+66</span>
                <ChevronDown size={16} />
              </div>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="หมายเลขโทรศัพท์" 
                className="w-full bg-white border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all placeholder:text-gray-400" 
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[14px] font-medium text-gray-900 mb-1">
              วันเกิด <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-gray-500 mb-2 leading-relaxed">
              ผู้ใช้งาน LINE ในประเทศไทยต้องมีอายุไม่ต่ำกว่า 11 ปี เราไม่อนุญาตให้ผู้ใช้งานที่มีอายุต่ำกว่า 11 ปีตอบแบบฟอร์มนี้
            </p>
            <div className="relative">
              <input 
                type="date" 
                value={dob} 
                onChange={e => setDob(e.target.value)} 
                className="w-full bg-white border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-gray-900" 
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 w-[calc(100%+40px)] -ml-5 bg-gray-50 my-8"></div>

        {/* Gender */}
        <div className="space-y-4">
          <label className="block text-[14px] font-medium text-gray-900">
            เพศ <span className="text-red-500">*</span>
          </label>
          <div className="space-y-4">
            {['ชาย', 'หญิง', 'ไม่ระบุ'].map(g => (
              <label key={g} className="flex items-center gap-3 cursor-pointer">
                <div className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center ${gender === g ? 'border-gray-900' : 'border-gray-300'}`}>
                  {gender === g && <div className="w-[12px] h-[12px] bg-gray-900 rounded-full"></div>}
                </div>
                <span className="text-[15px] text-gray-800">{g}</span>
                <input 
                  type="radio" 
                  name="gender" 
                  value={g} 
                  checked={gender === g} 
                  onChange={() => setGender(g)} 
                  className="hidden" 
                />
              </label>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 w-[calc(100%+40px)] -ml-5 bg-gray-50 my-8"></div>

        {/* Favorite Menu */}
        <div className="space-y-4">
          <label className="block text-[14px] font-medium text-gray-900">
            เมนูที่ลูกค้าชื่นชอบ <span className="text-red-500">*</span>
          </label>
          <div className="space-y-4">
            {['Coffee', 'Non-coffee'].map(menu => {
              const isChecked = favoriteMenu.includes(menu);
              return (
                <label key={menu} className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-[22px] h-[22px] rounded-[4px] border flex items-center justify-center ${isChecked ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}`}>
                    {isChecked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span className="text-[15px] text-gray-800">{menu}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setFavoriteMenu(favoriteMenu.filter(m => m !== menu));
                      } else {
                        setFavoriteMenu([...favoriteMenu, menu]);
                      }
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 w-[calc(100%+40px)] -ml-5 bg-gray-50 my-8"></div>

        {/* Consent */}
        <div className="space-y-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className={`mt-0.5 w-[22px] h-[22px] shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${consent ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}`}>
              {consent && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <div className="text-[14px] leading-relaxed text-gray-700 select-none">
              <span>ข้าพเจ้ายอมรับ </span>
              <span className="text-gray-900 font-bold underline decoration-gray-300 underline-offset-2">ข้อกำหนดการใช้บริการ XYL Studio</span>
              <span> และรับทราบ </span>
              <span className="text-gray-900 font-bold underline decoration-gray-300 underline-offset-2">นโยบายความเป็นส่วนตัว</span>
              <span> และตกลงเพิ่มบัญชีทางการ XYL Studio ("ร้านค้า") เป็นเพื่อน หรือยกเลิกการปิดกั้นบัญชีทางการร้านโดยอัตโนมัติ เพื่อการใช้สะสมแต้มกับร้านค้า</span>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={consent}
              onChange={() => setConsent(!consent)}
            />
          </label>

          <p className="text-[12px] text-gray-500 leading-[1.6]">
            ข้อปฏิเสธความรับผิด: ในการส่งแบบฟอร์มนี้ (แบบฟอร์มลงทะเบียน) ข้าพเจ้ารับทราบว่าข้อมูลตัวบ่งชี้ภายในที่กำหนดโดย LINE ของข้าพเจ้าและข้อมูลโปรไฟล์ LINE จะถูกแบ่งปันให้แก่ร้านค้า XYL Studio เพื่อวัตถุประสงค์ในการลงทะเบียนสมาชิกของร้านค้า XYL Studio
            <br/><br/>
            นอกจากนี้ ข้าพเจ้ารับทราบว่าข้อมูลส่วนบุคคลของข้าพเจ้า (เช่น ชื่อ นามสกุล เบอร์โทรศัพท์มือถือ อีเมล์ วันเดือนปีเกิด เพศ และที่อยู่) ที่ถูกเก็บรวบรวมอาจถูกเก็บรักษาโดย XYL Studio ได้ แม้ว่าข้าพเจ้าจะบล็อกบัญชีทางการนี้แล้วก็ตาม
          </p>
        </div>
      </main>

      {/* Submit Button Area - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3.5 rounded-[8px] font-medium text-[16px] flex justify-center items-center transition-colors ${
              isFormValid 
                ? 'bg-gray-900 text-white hover:bg-black' 
                : 'bg-[#E6E6E6] text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin text-gray-400" /> : 'สมัครสมาชิก'}
          </button>
        </div>
      </div>
      
    </div>
  );
}
