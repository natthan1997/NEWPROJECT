const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/liff/member/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const modalHTML = `
      {/* 🎁 MYSTERY BOX MODAL */}
      <AnimatePresence>
        {showMysteryBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#1A1A18]/80 backdrop-blur-md" onClick={() => !isPlayingBox && mysteryBoxState !== 'opening' && setShowMysteryBox(false)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 overflow-hidden text-center shadow-2xl"
            >
              <button 
                onClick={() => setShowMysteryBox(false)} 
                disabled={mysteryBoxState === 'opening'}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30"
              >
                <X size={16} />
              </button>
              
              {mysteryBoxState === 'idle' && (
                <>
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-inner relative overflow-hidden">
                    <span className="relative z-10">🎁</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#1A1A18] tracking-tight mb-2">
                    {locale === 'en' ? 'Mystery Box' : 'กล่องสุ่มหรรษา'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    {locale === 'en' ? 'Spend 50 points to open a box and win random points back! (Up to 500 Pts)' : 'ใช้ 50 แต้ม เพื่อเปิดกล่องสุ่ม ลุ้นรับแต้มคืนสูงสุด 500 แต้ม!'}
                  </p>
                  <button
                    onClick={handlePlayMysteryBox}
                    disabled={(memberInfo?.points || 0) < 50}
                    className="w-full py-4 bg-[#1A1A18] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:bg-gray-300 shadow-xl"
                  >
                    {(memberInfo?.points || 0) < 50 ? (locale === 'en' ? 'Not enough points' : 'แต้มไม่เพียงพอ') : (locale === 'en' ? 'Open Box (50 Pts)' : 'เปิดกล่อง (50 แต้ม)')}
                  </button>
                </>
              )}
              
              {mysteryBoxState === 'opening' && (
                <div className="py-8">
                  <motion.div 
                    animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-full flex items-center justify-center text-6xl shadow-xl"
                  >
                    🎁
                  </motion.div>
                  <h3 className="text-xl font-black text-[#1A1A18] tracking-tight mt-8 animate-pulse">
                    {locale === 'en' ? 'Opening...' : 'กำลังเปิดกล่อง...'}
                  </h3>
                </div>
              )}
              
              {mysteryBoxState === 'result' && (
                <>
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-28 h-28 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 relative"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-6xl font-black"
                    >
                      {mysteryBoxResult > 50 ? '🎉' : mysteryBoxResult === 50 ? '🎁' : '😅'}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-2xl font-black text-[#1A1A18] tracking-tight mb-2">
                    {mysteryBoxResult > 50 ? (locale === 'en' ? 'JACKPOT!' : 'แจ็คพอตแตก!') : mysteryBoxResult === 50 ? (locale === 'en' ? 'Nice!' : 'ดีเลย!') : (locale === 'en' ? 'Ouch!' : 'ได้เกลือออ!')}
                  </h3>
                  <div className="text-emerald-500 font-black text-4xl mb-6 tracking-tighter">
                    +{mysteryBoxResult} <span className="text-xl">PTS</span>
                  </div>
                  <button
                    onClick={() => {
                      setMysteryBoxState('idle');
                      setShowMysteryBox(false);
                    }}
                    className="w-full py-4 bg-gray-100 text-[#1A1A18] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    {locale === 'en' ? 'Close' : 'ปิดหน้าต่าง'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace(
  /(\s*)<\/AnimatePresence>(\s*)<\/div>(\s*)(\);?\s*})\s*$/, 
  `$1</AnimatePresence>\n${modalHTML}$2</div>$3$4`
);

fs.writeFileSync(filePath, code);
console.log('Inserted Mystery Box Modal HTML');
