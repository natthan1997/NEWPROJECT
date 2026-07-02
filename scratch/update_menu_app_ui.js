import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuAppConfig.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldHeader = `  // Set the top extra header (if needed)
  useEffect(() => {
    setViewExtraHeader(
      <div className="flex items-center text-xl font-black uppercase tracking-tight">
        จัดการเมนูอาหาร (MENU APP)
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [setViewExtraHeader])`;

const newHeader = `  // Set the top extra header (if needed)
  useEffect(() => {
    setViewExtraHeader(
      <div className="flex items-center text-lg md:text-xl font-black uppercase tracking-tight text-gray-800">
        จัดการเมนู (Menu)
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [setViewExtraHeader])`;

content = content.replace(oldHeader, newHeader);

const oldTabsStr = `      {/* APP-LIKE TOP TABS */}
      <div className="shrink-0 border-b border-gray-100 bg-white shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex p-4 gap-2 w-max min-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MenuAppTab)}
                className={\`flex flex-1 min-w-[120px] md:min-w-[160px] items-center justify-center gap-2 rounded-2xl p-4 transition-all \${
                  isActive
                    ? 'bg-[#1A1A18] text-white shadow-md scale-105'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }\`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span className="text-sm font-black tracking-tight">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>`;

const newTabsStr = `      {/* APP-LIKE TOP TABS (CLEAN, iOS STYLE) */}
      <div className="shrink-0 bg-[#F5F5F7] px-4 py-4 md:px-8 border-b border-gray-200/60 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex bg-gray-200/60 p-1.5 rounded-2xl md:rounded-full overflow-x-auto no-scrollbar shadow-inner relative">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MenuAppTab)}
                  className={\`relative flex flex-1 min-w-[100px] items-center justify-center gap-2 rounded-xl md:rounded-full py-2.5 px-3 transition-all duration-300 ease-out z-10 \${
                    isActive
                      ? 'text-gray-900 font-bold'
                      : 'text-gray-500 font-medium hover:text-gray-700'
                  }\`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMenuAppTab"
                      className="absolute inset-0 bg-white rounded-xl md:rounded-full shadow-sm z-[-1]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon size={18} className={isActive ? 'text-[#1A1A18]' : 'text-gray-400'} />
                  <span className="text-sm whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>`;

content = content.replace(oldTabsStr, newTabsStr);

// Also change background color of main container from #FDFDFB to #F5F5F7
content = content.replace(
  'className="flex h-full flex-col overflow-hidden bg-[#FDFDFB] font-bold"',
  'className="flex h-full flex-col overflow-hidden bg-[#F5F5F7]"'
);

content = content.replace(
  'className="flex-1 overflow-y-auto bg-[#F5F4F0]/30 relative no-scrollbar"',
  'className="flex-1 overflow-y-auto relative no-scrollbar"'
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated POSMenuAppConfig UI');
