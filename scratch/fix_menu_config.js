import fs from 'fs';

const filePath = 'components/pos/POSMenuAppConfig.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `
  const tabs = [
    { id: 'items', label: 'เมนู', icon: LayoutGrid },
    { id: 'categories', label: 'หมวดหมู่', icon: Tag },
    { id: 'modifiers', label: 'ตัวเลือก', icon: SlidersHorizontal },
  ]

  // Render tabs in the parent header to save space
  useEffect(() => {
    setViewExtraHeader(
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MenuAppTab)}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-all \${
                isActive ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }\`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [activeTab, setViewExtraHeader])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* TOOLBAR FROM CHILD COMPONENTS */}
      {childHeader && (
        <div className="shrink-0 bg-white px-4 py-3 md:px-6 border-b border-gray-100 flex items-center justify-between shadow-sm relative z-10">
          {childHeader}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar bg-gray-50/30">
`;

// Find where to inject
const useEffectStart = content.indexOf('  // Set the top extra header (if needed)');
const mainContentStart = content.indexOf('        <AnimatePresence mode="wait">');

if (useEffectStart !== -1 && mainContentStart !== -1) {
    content = content.substring(0, useEffectStart) + replacement + content.substring(mainContentStart);
    fs.writeFileSync(filePath, content);
    console.log('POSMenuAppConfig updated');
} else {
    console.log('Could not find target strings in POSMenuAppConfig');
}
