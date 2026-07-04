const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/liff/menu/points/claim/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add phone state
code = code.replace(
  /const \[showPopup, setShowPopup\] = useState\(false\)/,
  `const [showPopup, setShowPopup] = useState(false)\n    const [requirePhone, setRequirePhone] = useState(false)\n    const [phone, setPhone] = useState('')`
);

// 2. Modify handleClaim
const handleClaimTarget = `const handleClaim = async () => {
        try {
            const res = await fetch('/api/liff/points/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    lineUserId: lineProfile.userId,
                    displayName: lineProfile.displayName,
                    avatarUrl: lineProfile.pictureUrl
                })
            })

            const data = await res.json()
            if (data.success) {
                setStatus('success')
                setPointsAdded(data.pointsAdded)
                setMessage(data.message || 'ยินดีด้วย! คุณได้รับแต้มสะสมแล้ว')
                setShowPopup(true)
                
                // 🕒 AUTO-CLOSE LIFF WINDOW after 3 seconds
                setTimeout(() => {
                    handleClose()
                }, 3500)
            } else {
                setStatus('error')
                setMessage(data.error || 'ไม่สามารถรับแต้มได้ในขณะนี้')
            }
        } catch (err) {
            console.error('Claim Error:', err)
            setStatus('error')
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
        }
    }`;

const handleClaimReplacement = `const handleClaim = async (phoneToSubmit?: string) => {
        try {
            setStatus('loading');
            setMessage('กำลังตรวจสอบสิทธิ์ของคุณ...');
            const res = await fetch('/api/liff/points/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    lineUserId: lineProfile.userId,
                    displayName: lineProfile.displayName,
                    avatarUrl: lineProfile.pictureUrl,
                    phone: phoneToSubmit || undefined
                })
            })

            const data = await res.json()
            if (data.success) {
                setRequirePhone(false)
                setStatus('success')
                setPointsAdded(data.pointsAdded)
                setMessage(data.message || 'ยินดีด้วย! คุณได้รับแต้มสะสมแล้ว')
                setShowPopup(true)
                
                // 🕒 AUTO-CLOSE LIFF WINDOW after 3 seconds
                setTimeout(() => {
                    handleClose()
                }, 3500)
            } else if (data.requirePhone) {
                setRequirePhone(true)
                setStatus('success') // Just to hide error overlay
            } else {
                setStatus('error')
                setMessage(data.error || 'ไม่สามารถรับแต้มได้ในขณะนี้')
            }
        } catch (err) {
            console.error('Claim Error:', err)
            setStatus('error')
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
        }
    }`;
code = code.replace(handleClaimTarget, handleClaimReplacement);

// 3. Add Phone Form inside UI
const uiTarget = `                    {status === 'success' && !showPopup && (
                        <div className="flex flex-col items-center space-y-8 py-6 animate-in zoom-in duration-500">
                            <CheckCircle2 size={64} className="text-emerald-500" />
                            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Claim Completed</p>
                        </div>
                    )}`;

const uiReplacement = `                    {status === 'success' && !showPopup && !requirePhone && (
                        <div className="flex flex-col items-center space-y-8 py-6 animate-in zoom-in duration-500">
                            <CheckCircle2 size={64} className="text-emerald-500" />
                            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Claim Completed</p>
                        </div>
                    )}

                    {requirePhone && (
                        <div className="flex flex-col items-center space-y-6 py-4 animate-in fade-in duration-500 w-full">
                            <div className="text-center space-y-2">
                                <p className="text-lg font-black text-[#1A1A18] uppercase tracking-tighter">Register to Claim</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {locale === 'en' ? 'Please enter your phone number to register and claim your points' : 'กรุณากรอกเบอร์โทรศัพท์เพื่อสมัครสมาชิกและรับแต้ม'}
                                </p>
                            </div>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="08x-xxx-xxxx"
                                className="w-full h-14 border-2 border-gray-200 focus:border-[#1A1A18] outline-none text-center text-xl font-black rounded-none transition-all tracking-[0.2em]"
                            />
                            <button 
                                onClick={() => {
                                    if (phone.length >= 9) {
                                        handleClaim(phone);
                                    } else {
                                        alert(locale === 'en' ? 'Invalid phone number' : 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
                                    }
                                }}
                                disabled={phone.length < 9}
                                className="w-full h-14 bg-[#1A1A18] text-white flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl disabled:opacity-50"
                            >
                                {locale === 'en' ? 'Register & Claim' : 'ลงทะเบียนและรับแต้ม'} <ArrowRight size={16} />
                            </button>
                        </div>
                    )}`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync(filePath, code);
