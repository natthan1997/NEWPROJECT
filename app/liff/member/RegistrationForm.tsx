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

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <div className="w-6"></div>
        <h1 className="text-[14px] font-bold tracking-[0.2em] text-gray-900 uppercase">XYL STUDIO</h1>
        <button className="text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </header>

      <main className="px-5 pt-8 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[24px] font-medium tracking-tight text-gray-900">สมัครสมาชิก</h2>
        </div>

        {/* Profile Picture */}
        <div className="mb-10 flex justify-center">
          <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            {lineProfile?.pictureUrl ? (
              <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* First Name */}
          <div>
            <label className="block text-[13px] tracking-wide text-gray-500 mb-2 uppercase">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              placeholder="First Name" 
              className="w-full bg-[#FAFAFA] border-none rounded-[12px] px-5 py-4 text-[15px] focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm" 
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-[13px] tracking-wide text-gray-500 mb-2 uppercase">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              placeholder="Last Name" 
              className="w-full bg-[#FAFAFA] border-none rounded-[12px] px-5 py-4 text-[15px] focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm" 
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[13px] tracking-wide text-gray-500 mb-2 uppercase">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-[#FAFAFA] shadow-sm rounded-[12px] px-4 py-4 text-gray-500 shrink-0">
                <span className="text-[14px]">+66</span>
                <ChevronDown size={14} />
              </div>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="Phone Number" 
                className="w-full bg-[#FAFAFA] border-none rounded-[12px] px-5 py-4 text-[15px] focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm" 
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[13px] tracking-wide text-gray-500 mb-1 uppercase">
              วันเกิด <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <input 
                type="date" 
                value={dob} 
                onChange={e => setDob(e.target.value)} 
                className="w-full bg-[#FAFAFA] border-none shadow-sm rounded-[12px] px-5 py-4 text-[15px] focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition-all text-gray-900 placeholder:text-gray-400" 
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gray-100 my-10"></div>

        {/* Gender */}
        <div className="space-y-5">
          <label className="block text-[13px] tracking-wide text-gray-500 uppercase">
            เพศ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['ชาย', 'หญิง', 'ไม่ระบุ'].map(g => {
              const isSelected = gender === g;
              return (
                <label key={g} className={`flex items-center justify-center py-3 rounded-[12px] cursor-pointer transition-all ${isSelected ? 'bg-gray-900 text-white font-medium shadow-md' : 'bg-[#FAFAFA] text-gray-500 hover:bg-gray-100'}`}>
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
        <div className="h-[1px] w-full bg-gray-100 my-10"></div>

        {/* Consent */}
        <div className="space-y-6">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className={`mt-0.5 w-[24px] h-[24px] shrink-0 rounded-[6px] border flex items-center justify-center transition-all ${consent ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
              {consent && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <div className="text-[13px] leading-[1.8] text-gray-600 select-none">
              <span>ข้าพเจ้ายอมรับ </span>
              <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-gray-900 font-medium underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900 transition-colors">ข้อกำหนดการใช้บริการ</button>
              <span> และ </span>
              <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="text-gray-900 font-medium underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900 transition-colors">นโยบายความเป็นส่วนตัว</button>
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
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-white/0 pt-10 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-[12px] font-medium text-[15px] tracking-wide flex justify-center items-center transition-all duration-300 ${
              isFormValid 
                ? 'bg-gray-900 text-white hover:bg-black hover:scale-[0.98] shadow-lg shadow-gray-900/20' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin text-gray-400" /> : 'CONFIRM REGISTRATION'}
          </button>
        </div>
      </div>
      
      {/* Policy Modals */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/40 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-[24px] rounded-t-[24px] h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-[18px]">ข้อกำหนดการใช้บริการ</h3>
              <button onClick={() => setShowTerms(false)} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 text-[14px] text-gray-600 leading-relaxed space-y-4">
              <p>ยินดีต้อนรับสู่ XYL Studio</p>
              <p>ข้อกำหนดนี้ใช้กับการสมัครสมาชิก การใช้บริการ การจองบริการดูแลสวน การสั่งซื้อสินค้าจาก XYL Studio ทั้งหมด</p>
              <h4 className="font-bold text-gray-900 mt-4">1. การเป็นสมาชิกและการให้ข้อมูล</h4>
              <p>ผู้ใช้ต้องให้ข้อมูลที่ถูกต้อง ครบถ้วน เพื่อการสะสมคะแนนและการรับสิทธิประโยชน์จาก XYL Studio</p>
              <h4 className="font-bold text-gray-900 mt-4">2. การสะสมคะแนน</h4>
              <p>คะแนนสะสมไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้ และมีอายุการใช้งานตามที่บริษัทกำหนด</p>
              <h4 className="font-bold text-gray-900 mt-4">3. การติดต่อ</h4>
              <p>การแจ้งเตือนผ่าน LINE มีวัตถุประสงค์เพื่ออำนวยความสะดวกให้แก่ท่าน ทางเราขอสงวนสิทธิ์ในการระงับบัญชีหากพบการใช้งานที่ผิดปกติ</p>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button onClick={() => setShowTerms(false)} className="w-full py-4 bg-gray-900 text-white rounded-[12px] font-medium">เข้าใจและยอมรับ</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/40 backdrop-blur-sm" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-[24px] rounded-t-[24px] h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-[18px]">นโยบายความเป็นส่วนตัว</h3>
              <button onClick={() => setShowPrivacy(false)} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 text-[14px] text-gray-600 leading-relaxed space-y-4">
              <p>ที่ XYL Studio เราให้ความสำคัญกับความเป็นส่วนตัวของข้อมูลลูกค้า</p>
              <h4 className="font-bold text-gray-900 mt-4">1. การเก็บรวบรวมข้อมูล</h4>
              <p>เราจะเก็บข้อมูลชื่อ เบอร์โทรศัพท์ วันเกิด เพศ และข้อมูลโปรไฟล์ LINE ของท่าน เพื่อใช้ในการลงทะเบียนสมาชิกและจัดการสะสมคะแนน</p>
              <h4 className="font-bold text-gray-900 mt-4">2. การนำข้อมูลไปใช้</h4>
              <p>ข้อมูลของท่านจะถูกนำไปใช้วิเคราะห์เพื่อนำเสนอสิทธิประโยชน์ และบริการที่ตรงใจท่านที่สุดจาก XYL Studio เท่านั้น</p>
              <h4 className="font-bold text-gray-900 mt-4">3. ความปลอดภัยของข้อมูล</h4>
              <p>เรามีมาตรการป้องกันและรักษาความปลอดภัยของข้อมูลส่วนบุคคลของท่าน เพื่อมิให้ข้อมูลรั่วไหลหรือถูกเข้าถึงโดยไม่ได้รับอนุญาต</p>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button onClick={() => setShowPrivacy(false)} className="w-full py-4 bg-gray-900 text-white rounded-[12px] font-medium">เข้าใจและยอมรับ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
