const fs = require('fs');
const { execSync } = require('child_process');

// Read from git to get the original file back
const original = execSync('git show HEAD:app/liff/member/page.tsx').toString();

const returnIndex = original.indexOf('\n  return (\n    <div');
if (returnIndex === -1) {
  console.error("Could not find '\\n  return (\\n    <div'");
  process.exit(1);
}

// Add the 'return (' back because we indexOf included it... actually we can just slice up to returnIndex
// because newJSX starts with '  return ('
const beforeReturn = original.substring(0, returnIndex + 1); // keep the \n

const newJSX = `  return (
    <div className="min-h-screen bg-gray-50 text-[#1A1A18] font-sans overflow-x-hidden pb-24 selection:bg-gray-200">
      
      {/* 📱 Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-900 bg-gray-100/50 hover:bg-gray-200/50 rounded-full transition-colors backdrop-blur-sm">
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[16px] font-black tracking-tight text-gray-900">{dict.title}</h1>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest" style={{ color: currentTier.textHex }}>{currentTier.name}</span>
        </div>
        
        {/* Redeemable Points on Top Right */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 px-3 py-1.5 rounded-full flex items-center gap-1.5 -mr-2 shadow-md"
        >
          <Sparkles size={12} className="text-amber-400" />
          <span className="text-[13px] font-black text-white tracking-wide">
            {(memberInfo?.points || 0).toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-gray-300 uppercase">PTS</span>
        </motion.div>
      </header>

      <main className="space-y-6">
        
        {/* 🟡 HERO SECTION: Profile & Points Bar */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white px-5 pt-8 pb-10 rounded-b-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-b border-gray-100 relative overflow-hidden"
        >
          {/* Subtle background glow based on tier */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200px] rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: currentTier.barHex || currentTier.bgHex }}></div>

          {/* Profile & Name */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-white relative bg-gray-50"
            >
              {lineProfile?.pictureUrl ? (
                <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={32} className="text-gray-300" />
                </div>
              )}
              {/* Tier Badge Indicator on Avatar */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: currentTier.textHex || '#1A1A18' }}>
                {currentTier.name[0]}
              </div>
            </motion.div>
            
            <h2 className="text-[24px] font-black text-gray-900 leading-tight tracking-tight mb-1">
              {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Valued Member'}
            </h2>
            {memberInfo?.phone && (
              <p className="text-[13px] text-gray-500 font-bold tracking-widest font-mono">
                {memberInfo.phone.replace(/(\\d{3})(\\d{3})(\\d{4})/, '$1-$2-$3')}
              </p>
            )}
          </div>

          {/* Linear Progress Bar ("หลอดคะแนน") */}
          <div className="relative z-10 w-full max-w-sm mx-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[12px] font-black text-gray-900 uppercase tracking-widest">
                {currentTier.name}
              </span>
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                {nextTier ? nextTier.name : 'MAX'}
              </span>
            </div>

            {/* The Bar */}
            <div className="h-4 w-full bg-gray-100 rounded-full relative overflow-visible shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: \`\${progressPercent}%\` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ backgroundColor: currentTier.textHex || '#1A1A18' }}
              />
              
              {/* Points Indicator moving along the bar */}
              <motion.div 
                initial={{ left: 0, opacity: 0 }}
                animate={{ left: \`\${progressPercent}%\`, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className="absolute top-1/2 -translate-y-1/2 -ml-[10px] w-5 h-5 bg-white border-2 rounded-full shadow-md flex items-center justify-center z-10"
                style={{ borderColor: currentTier.textHex || '#1A1A18' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTier.textHex || '#1A1A18' }}></div>
              </motion.div>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-[14px] font-medium text-gray-500">
                {nextTier ? (
                  <>
                    <span className="text-[18px] font-black text-gray-900 mr-1">{(nextTier.minPoints - totalAccumulated).toLocaleString()}</span> 
                    {locale === 'en' ? 'pts to' : 'แต้มเพื่ออัปเกรดเป็น'} 
                    <span className="font-bold ml-1 text-gray-900">{nextTier.name}</span>
                  </>
                ) : (
                  <span className="text-[16px] font-black text-gray-900">{locale === 'en' ? 'Maximum Tier Reached' : 'คุณอยู่ระดับสูงสุดแล้ว'}</span>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ⚡️ Quick Actions (Benefits & Badges) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-5 grid grid-cols-2 gap-3"
        >
          <button 
            onClick={() => setShowBenefits(true)}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100 hover:border-gray-200 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
              <Info size={18} />
            </div>
            <span className="text-[13px] font-bold text-gray-800">{dict.benefitsTitle}</span>
          </button>
          
          <button 
            onClick={() => setShowCatalog(true)}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100 hover:border-gray-200 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner bg-gradient-to-br from-gray-900 to-gray-700 text-amber-300">
              <User size={18} />
            </div>
            <span className="text-[13px] font-bold text-gray-800">ฉายาของฉัน</span>
          </button>
        </motion.section>

        {/* 📢 Special Campaigns / Gamification Banners */}
        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="space-y-3 pt-2"
        >
          <div className="flex items-center justify-between px-6">
            <h3 className="text-[15px] font-bold text-gray-900">{locale === 'en' ? 'Special Campaigns' : 'แคมเปญพิเศษ'}</h3>
          </div>
          
          <div 
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-5" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{\`div::-webkit-scrollbar { display: none; }\`}</style>
            
            {!memberInfo?.phone && (
              <div 
                onClick={() => setShowPhoneModal(true)}
                className="min-w-[280px] snap-center bg-gray-900 rounded-3xl p-5 flex flex-col justify-between shadow-xl shadow-gray-900/10 relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900 bg-white px-2.5 py-1 rounded-md mb-3 inline-block shadow-sm">
                    {locale === 'en' ? 'Action Required' : 'ภารกิจ'}
                  </span>
                  <h4 className="text-[16px] font-bold text-white leading-tight mb-1">{locale === 'en' ? 'Link your phone' : 'เชื่อมต่อเบอร์โทรศัพท์'}</h4>
                  <p className="text-[13px] text-gray-400">{locale === 'en' ? 'To earn points from store' : 'เพื่อสะสมแต้มจากการสั่งหน้าร้าน'}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            )}

            {campaigns.map((camp) => (
              <div 
                key={camp.id} 
                onClick={() => { if (camp.title.includes('กล่องสุ่ม')) setShowMysteryBox(true); }}
                className={\`min-w-[280px] snap-center bg-gradient-to-br \${camp.bg_gradient_from} \${camp.bg_gradient_to} rounded-3xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-transform border border-white/50\`}
              >
                <div className="absolute -right-2 -top-2 text-7xl opacity-20 drop-shadow-sm">{camp.icon}</div>
                <div>
                  <span className={\`text-[10px] font-bold uppercase tracking-wider \${camp.tag_color} bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-md mb-3 inline-block shadow-sm\`}>
                    {camp.type_tag}
                  </span>
                  <h4 className={\`text-[16px] font-bold \${camp.text_color} leading-tight mb-1\`}>{camp.title}</h4>
                  <p className={\`text-[13px] \${camp.tag_color} opacity-80\`}>{camp.description}</p>
                </div>
                {camp.title.includes('กล่องสุ่ม') && (
                   <div className="mt-4 flex justify-end">
                     <div className="px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-md flex items-center gap-1">
                       <span className={\`text-[12px] font-bold \${camp.text_color}\`}>เปิดกล่องเลย</span>
                     </div>
                   </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* 🪄 Elegant Tabs */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-t-[2.5rem] min-h-[500px] shadow-[0_-4px_24px_rgba(0,0,0,0.02)] border-t border-gray-100 pt-6 px-5"
        >
          <div className="flex mb-6 bg-gray-50 p-1 rounded-full relative">
            {['rewards', 'coupons', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={\`flex-1 py-2.5 text-[13px] font-bold capitalize transition-colors relative z-10 \${activeTab === tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                {tab === 'rewards' ? dict.rewardsCatalog : tab === 'coupons' ? dict.coupons : dict.pointsHistory}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabBackground" 
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'rewards' ? (
              <motion.div 
                key="rewards"
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {rewards.length > 0 ? rewards.map((reward) => (
                  <div key={reward.id} className="group flex gap-4 p-4 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Gift size={24} className="text-gray-400" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{reward.name}</h4>
                      <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {reward.discount_type === 'free_item' ? 'ฟรี 1 รายการ' : reward.discount_type === 'percent' ? \`ลด \${reward.discount_value}%\` : \`ลด \${reward.discount_value} บาท\`}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md">
                           <Sparkles size={12} className="text-amber-500" />
                           <span className="text-[12px] font-black text-gray-900">{reward.cost_points.toLocaleString()}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleRedeem(reward.id)}
                          disabled={(memberInfo?.points || 0) < reward.cost_points}
                          className={\`text-[12px] font-bold px-4 py-2 rounded-full transition-all \${
                            (memberInfo?.points || 0) >= reward.cost_points 
                            ? 'bg-gray-900 text-white hover:bg-black hover:scale-105 shadow-md active:scale-95' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }\`}
                        >
                          {dict.redeem}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center">
                    <Gift size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-[15px] font-bold text-gray-900 mb-1">{dict.noRewards}</p>
                    <p className="text-[13px] text-gray-500">{dict.checkBackLater}</p>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'coupons' ? (
              <motion.div 
                key="coupons"
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {vouchers.length > 0 ? vouchers.map((voucher) => (
                  <div key={voucher.id} className={\`relative rounded-3xl overflow-hidden shadow-sm flex flex-col bg-white border transition-all \${voucher.is_used ? 'border-gray-100 opacity-60 grayscale' : 'border-amber-100 hover:shadow-md hover:scale-[1.02]'}\`}>
                    <div className="flex items-stretch">
                      <div className={\`w-[100px] flex flex-col items-center justify-center p-4 border-r border-dashed \${voucher.is_used ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-700'}\`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                          {voucher.type === 'percent' ? 'ส่วนลด' : 'มูลค่า'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black tracking-tighter">
                            {voucher.type === 'percent' ? voucher.discount_percent : voucher.discount_amount}
                          </span>
                          <span className="text-sm font-bold">
                            {voucher.type === 'percent' ? '%' : '฿'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between bg-white relative">
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r border-dashed border-gray-200 z-10" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                        
                        <div>
                          <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1 pr-4">{voucher.title}</h4>
                          <p className="text-[13px] text-gray-500 line-clamp-2">{voucher.description}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                            {voucher.expires_at ? \`Exp: \${new Date(voucher.expires_at).toLocaleDateString('en-GB')}\` : 'No Expiry'}
                          </span>
                          <button 
                            disabled={voucher.is_used}
                            className={\`text-[12px] font-bold px-5 py-2 rounded-full transition-all \${
                              voucher.is_used ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-95'
                            }\`}
                          >
                            {voucher.is_used ? 'ใช้แล้ว' : dict.useCoupon}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gift size={24} className="text-gray-300" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 mb-1">{dict.noCoupons}</p>
                    <p className="text-[13px] text-gray-500">{dict.noCouponsDesc}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
                transition={{ duration: 0.3 }}
                className="space-y-0"
              >
                {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-xl">
                    <div className="flex gap-4 items-center">
                      <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center \${item.type === 'earn' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-500'}\`}>
                        {item.type === 'earn' ? <TrendingUp size={20} /> : <Gift size={20} />}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900 leading-tight">
                          {translateHistoryDescription(item.description, locale as string)}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-1 font-medium">
                          {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={\`text-[15px] font-black \${item.type === 'earn' ? 'text-emerald-500' : 'text-gray-900'}\`}>
                      {item.type === 'earn' ? '+' : '-'}{item.points.toLocaleString()}
                    </span>
                  </div>
                )) : (
                  <div className="py-20 text-center">
                    <History size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-[15px] font-bold text-gray-900 mb-1">{dict.noHistory}</p>
                    <p className="text-[13px] text-gray-500">{dict.historyEmpty}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* 👑 Minimal Benefits Bottom Sheet */}
      <AnimatePresence>
        {showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-[18px] font-bold text-gray-900">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 -mr-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <h4 className="text-[12px] text-gray-400 mb-3 uppercase tracking-wider font-bold">สิทธิประโยชน์สมาชิก</h4>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-4 border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 text-amber-500">
                        <Gift size={20} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[14px] font-bold text-gray-900">{dict.howToEarn}</p>
                        <p className="text-[13px] text-gray-500 mt-0.5">{dict.earnRule}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 text-blue-500">
                        <User size={20} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[14px] font-bold text-gray-900">สะสมฉายาสุดเท่</p>
                        <p className="text-[13px] text-gray-500 mt-0.5">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowBenefits(false);
                        setShowCatalog(true);
                      }}
                      className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-2xl text-[14px] font-bold shadow-md hover:bg-black transition-colors"
                    >
                      ดูแคตตาล็อคฉายาทั้งหมด
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h4 className="text-[12px] text-gray-400 mb-4 uppercase tracking-wider font-bold">สิทธิประโยชน์ตามระดับ</h4>
                  <div className="space-y-6">
                    {tiers.map((tier) => (
                      <div key={tier.name} className="flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-3xl flex-shrink-0 flex items-center justify-center text-[16px] font-black uppercase tracking-wider shadow-sm border border-black/5" style={{ backgroundColor: tier.bgHex || '#F2ECE4', color: tier.textHex || '#1A1A18' }}>
                          {tier.name[0]}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-baseline gap-2 mb-2">
                            <h4 className="text-[16px] font-bold text-gray-900">{tier.name}</h4>
                            <span className="text-[12px] text-gray-400 font-bold">{tier.minPoints.toLocaleString()} {dict.pts}</span>
                          </div>
                          <ul className="space-y-2.5">
                            {tier.benefits && tier.benefits.map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 font-medium">
                                <Check size={16} strokeWidth={3} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 👑 CATALOG MODAL */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto pb-safe flex flex-col"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
                <h3 className="text-[18px] font-bold text-gray-900">แคตตาล็อคฉายา</h3>
                <button onClick={() => setShowCatalog(false)} className="p-2 -mr-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  {titles.map((tier, idx) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={idx} 
                      onClick={() => setSelectedBadge(tier)}
                      className={\`relative flex flex-col items-center justify-center p-5 rounded-[2rem] border shadow-sm cursor-pointer transition-all \${tier.isUnlocked ? 'bg-white border-transparent' : 'bg-white/50 border-transparent grayscale opacity-70'}\`}
                    >
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-[24px] font-black shadow-sm mb-4" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[14px] font-bold text-center text-gray-900 leading-tight mb-1">{tier.name}</h4>
                      
                      {/* Mini Progress */}
                      {!tier.isUnlocked && (
                        <div className="w-full mt-3">
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: \`\${tier.progress}%\` }}></div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🏆 BADGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Header colored banner */}
              <div className="h-32 w-full flex items-center justify-center relative" style={{ backgroundColor: selectedBadge.bgHex }}>
                <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-black/50 transition-colors backdrop-blur-sm">
                  <X size={20} />
                </button>
              </div>
              
              {/* Avatar floating */}
              <div className="relative flex justify-center -mt-12">
                <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-[36px] font-black shadow-lg bg-white border-4 border-white" style={{ backgroundColor: selectedBadge.bgHex, color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
              </div>

              <div className="px-6 pb-8 pt-5 text-center">
                <h3 className="text-[22px] font-black text-gray-900 mb-2">{selectedBadge.name}</h3>
                
                {selectedBadge.isUnlocked ? (
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[13px] font-bold rounded-full mb-6">
                    <Check size={16} strokeWidth={3} /> ปลดล็อกแล้ว
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 text-gray-500 text-[13px] font-bold rounded-full mb-6">
                    ยังไม่ปลดล็อก
                  </div>
                )}

                <div className="text-left space-y-4">
                  {/* How to get */}
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> ภารกิจรับฉายา
                    </h4>
                    <p className="text-[14px] font-medium text-gray-800 leading-relaxed">{selectedBadge.description || \`สะสม \${selectedBadge.minPoints} เป้าหมาย\`}</p>
                    
                    {!selectedBadge.isUnlocked && (
                      <div className="mt-5">
                        <div className="flex justify-between text-[12px] mb-2 font-bold">
                          <span className="text-gray-500">ความคืบหน้า</span>
                          <span className="text-gray-900">{selectedBadge.currentValue} / {selectedBadge.minPoints}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-gray-900 rounded-full transition-all duration-1000" style={{ width: \`\${selectedBadge.progress}%\` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  {selectedBadge.benefits && (
                    <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
                      <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Gift size={14} /> สิทธิพิเศษ
                      </h4>
                      <p className="text-[14px] font-medium text-amber-900 leading-relaxed whitespace-pre-line">{selectedBadge.benefits}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🎁 MYSTERY BOX MODAL */}
      <AnimatePresence>
        {showMysteryBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1A1A18]/60 backdrop-blur-md" 
              onClick={() => !isPlayingBox && mysteryBoxState !== 'opening' && setShowMysteryBox(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 overflow-hidden text-center shadow-2xl"
            >
              <button 
                onClick={() => setShowMysteryBox(false)} 
                disabled={mysteryBoxState === 'opening'}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-30"
              >
                <X size={20} />
              </button>
              
              {mysteryBoxState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-[2rem] flex items-center justify-center text-6xl mb-6 shadow-inner relative overflow-hidden">
                    <span className="relative z-10 drop-shadow-md">🎁</span>
                  </div>
                  <h3 className="text-[24px] font-black text-[#1A1A18] tracking-tight mb-2">
                    {locale === 'en' ? 'Mystery Box' : 'กล่องสุ่มหรรษา'}
                  </h3>
                  <p className="text-gray-500 text-[14px] font-medium mb-8 leading-relaxed px-4">
                    {locale === 'en' ? 'Spend 50 points to open a box and win random points back! (Up to 500 Pts)' : 'ใช้ 50 แต้ม เพื่อเปิดกล่องสุ่ม ลุ้นรับแต้มคืนสูงสุด 500 แต้ม!'}
                  </p>
                  <button
                    onClick={handlePlayMysteryBox}
                    disabled={(memberInfo?.points || 0) < 50}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[15px] uppercase tracking-wider hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:bg-gray-300 shadow-xl shadow-gray-900/20"
                  >
                    {(memberInfo?.points || 0) < 50 ? (locale === 'en' ? 'Not enough points' : 'แต้มไม่เพียงพอ') : (locale === 'en' ? 'Open Box (50 Pts)' : 'เปิดกล่อง (50 แต้ม)')}
                  </button>
                </motion.div>
              )}
              
              {mysteryBoxState === 'opening' && (
                <div className="py-10">
                  <motion.div 
                    animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-[2rem] flex items-center justify-center text-7xl shadow-xl"
                  >
                    <span className="drop-shadow-lg">🎁</span>
                  </motion.div>
                  <h3 className="text-[20px] font-black text-[#1A1A18] tracking-tight mt-10 animate-pulse">
                    {locale === 'en' ? 'Opening...' : 'กำลังเปิดกล่อง...'}
                  </h3>
                </div>
              )}
              
              {mysteryBoxState === 'result' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-32 h-32 mx-auto bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-8 relative border border-emerald-100"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-7xl font-black drop-shadow-md"
                    >
                      {mysteryBoxResult > 50 ? '🎉' : mysteryBoxResult === 50 ? '🎁' : '😅'}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-[24px] font-black text-[#1A1A18] tracking-tight mb-2">
                    {mysteryBoxResult > 50 ? (locale === 'en' ? 'JACKPOT!' : 'แจ็คพอตแตก!') : mysteryBoxResult === 50 ? (locale === 'en' ? 'Nice!' : 'ดีเลย!') : (locale === 'en' ? 'Ouch!' : 'ได้เกลือออ!')}
                  </h3>
                  <div className="text-emerald-500 font-black text-5xl mb-8 tracking-tighter">
                    +{mysteryBoxResult} <span className="text-2xl opacity-70">PTS</span>
                  </div>
                  <button
                    onClick={() => {
                      setMysteryBoxState('idle');
                      setShowMysteryBox(false);
                    }}
                    className="w-full py-4 bg-gray-100 text-[#1A1A18] rounded-2xl font-black text-[15px] uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {locale === 'en' ? 'Close' : 'ปิดหน้าต่าง'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 📱 Phone Link Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPhoneModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl z-10 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-gray-100 text-gray-900 rounded-[1.5rem] flex items-center justify-center mb-6">
                 <Zap size={28} />
              </div>
              <h3 className="text-[22px] font-black text-[#1A1A18] mb-2 leading-tight">
                {locale === 'en' ? 'Link Phone Number' : 'เชื่อมต่อเบอร์โทรศัพท์'}
              </h3>
              <p className="text-[14px] text-gray-500 font-medium mb-8 leading-relaxed">
                {locale === 'en' ? 'Link your phone number to receive points from POS orders.' : 'ระบุเบอร์โทรศัพท์ของคุณเพื่อรับแต้มจากการสั่งซื้อหน้าร้าน (รวมคะแนนอัตโนมัติ)'}
              </p>
              
              <div className="mb-8 space-y-4">
                <input 
                  type="text" 
                  id="nickname-input-modal"
                  value={nicknameInput} 
                  onChange={e => setNicknameInput(e.target.value)} 
                  placeholder={locale === 'en' ? "Nickname / Name" : "ชื่อเล่น / ชื่อเรียก"} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[16px] font-bold text-[#1A1A18] text-center focus:ring-2 focus:ring-black outline-none transition-all placeholder:font-medium placeholder:text-gray-400" 
                />
                <input 
                  type="tel" 
                  id="phone-input-modal"
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)} 
                  placeholder="08X-XXX-XXXX" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[20px] font-black text-[#1A1A18] text-center focus:ring-2 focus:ring-black outline-none transition-all placeholder:font-medium placeholder:text-gray-400 tracking-wider" 
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-[14px] hover:bg-gray-200 transition-colors"
                >
                  {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  onClick={handleLinkPhone}
                  disabled={isLinkingPhone || phoneInput.length < 9 || !nicknameInput.trim()}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-gray-900/20 hover:bg-black transition-colors disabled:opacity-50 disabled:shadow-none flex justify-center items-center active:scale-95"
                >
                  {isLinkingPhone ? <Loader2 size={20} className="animate-spin" /> : (locale === 'en' ? 'Link Phone' : 'บันทึก')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
`;

fs.writeFileSync('app/liff/member/page.tsx', beforeReturn + newJSX, 'utf8');
