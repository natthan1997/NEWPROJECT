const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/PointGenerator.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Add useEffect to imports
code = code.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect } from 'react';");

// Add state and useEffect for real-time polling
const target1 = `  const [loading, setLoading] = useState(false);`;
const replacement1 = `  const [loading, setLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    if (!token) {
        setIsClaimed(false);
        return;
    }

    // Poll every 1.5s to see if token is used
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('pos_qr_reward_tokens')
          .select('is_used')
          .eq('token', token)
          .single();
          
        if (!error && data && data.is_used) {
           setIsClaimed(true);
           clearInterval(interval);
           // Auto close after 2.5 seconds
           setTimeout(() => {
              if (onClose) onClose();
           }, 2500);
        }
      } catch (err) {
        // ignore network error during polling
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [token, onClose]);`;

code = code.replace(target1, replacement1);

// Update UI to show Success when claimed
const uiTarget = `             <div className="text-center mb-6">
                 <div className="inline-flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-[15px] mb-4">
                   <CheckCircle2 size={20} />
                   <span>{locale === 'en' ? 'Ready for customer to scan' : 'พร้อมให้ลูกค้าสแกน'}</span>
                 </div>`;

const uiReplacement = `             <div className="text-center mb-6">
                 {isClaimed ? (
                   <div className="inline-flex items-center justify-center gap-2 text-white bg-emerald-500 px-6 py-2.5 rounded-full font-bold text-[16px] mb-4 animate-in zoom-in duration-300 shadow-lg">
                     <CheckCircle2 size={24} />
                     <span>{locale === 'en' ? 'Points Claimed Successfully!' : 'ลูกค้ารับแต้มเรียบร้อยแล้ว!'}</span>
                   </div>
                 ) : (
                   <div className="inline-flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-[15px] mb-4">
                     <RefreshCcw size={16} className="animate-spin opacity-50" />
                     <span>{locale === 'en' ? 'Waiting for customer to scan...' : 'รอให้ลูกค้าสแกน...'}</span>
                   </div>
                 )}`;

code = code.replace(uiTarget, uiReplacement);

// Make the QR Code green/success when claimed
const qrTarget = `              {/* QR Code */}
              {token && (
                <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-100 mb-8 w-[240px] h-[240px]">
                   <img src={qrUrl!} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              )}`;

const qrReplacement = `              {/* QR Code */}
              {token && (
                <div className={\`bg-white p-6 rounded-[24px] shadow-xl border-4 transition-all duration-500 mb-8 w-[240px] h-[240px] relative \${isClaimed ? 'border-emerald-500 scale-105' : 'border-transparent'}\`}>
                   <img src={qrUrl!} alt="QR Code" className={\`w-full h-full object-contain transition-opacity duration-500 \${isClaimed ? 'opacity-20' : 'opacity-100'}\`} />
                   {isClaimed && (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <CheckCircle2 size={80} className="text-emerald-500 animate-in zoom-in duration-500 delay-150" />
                     </div>
                   )}
                </div>
              )}`;

code = code.replace(qrTarget, qrReplacement);

// Hide back button when claimed
const backBtnTarget = `                <button 
                  onClick={resetGenerator}
                  className="w-full h-[56px] bg-white text-gray-800 border-2 border-gray-200 rounded-[16px] font-black uppercase tracking-widest text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                >
                  <ArrowLeft size={18} /> {locale === 'en' ? 'Back' : 'กลับไปทำรายการใหม่'}
                </button>`;

const backBtnReplacement = `                {!isClaimed && (
                  <button 
                    onClick={resetGenerator}
                    className="w-full h-[56px] bg-white text-gray-800 border-2 border-gray-200 rounded-[16px] font-black uppercase tracking-widest text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                  >
                    <ArrowLeft size={18} /> {locale === 'en' ? 'Back' : 'กลับไปทำรายการใหม่'}
                  </button>
                )}`;
code = code.replace(backBtnTarget, backBtnReplacement);

fs.writeFileSync(filePath, code);
