import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state variable
if (!content.includes('const [selectedTableZone, setSelectedTableZone] = useState')) {
    content = content.replace(
        'const [printMode, setPrintMode] = useState',
        'const [selectedTableZone, setSelectedTableZone] = useState(\'All\')\n  const [printMode, setPrintMode] = useState'
    );
}

// 2. Modify Table Modal rendering
const tableModalRegex = /<h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black">[\s\S]*?<\/h2>/;

const tableModalMatch = content.match(tableModalRegex);
if (tableModalMatch) {
    // Add the filter buttons below the header
    const filterLogic = `
            <header className="flex flex-col border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black">
                  {locale === 'en' ? 'Select Table' : locale === 'zh' ? '选择桌子' : 'เลือกโต๊ะ'}
                </h2>
                <button onClick={() => setShowTableModal(false)} className="p-2">
                  <X size={20} />
                </button>
              </div>
              
              {/* Zone Filter */}
              <div className="px-6 sm:px-8 pb-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {['All', ...Array.from(new Set(tables.map(t => t.zone || 'MAIN')))].map(zone => (
                  <button
                    key={zone}
                    onClick={() => setSelectedTableZone(zone)}
                    className={\`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all \${
                      selectedTableZone === zone
                        ? 'bg-black text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }\`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </header>
`;

    // Replace the old header completely up to the start of the grid
    const oldHeaderRegex = /<header className="flex items-center justify-between border-b border-gray-100 bg-white p-6 sm:p-8 font-bold">[\s\S]*?<\/header>/;
    content = content.replace(oldHeaderRegex, filterLogic);
}

// 3. Filter the tables being mapped
const mapRegex = /\{tables\.map\(table => \{/;
if (content.match(mapRegex)) {
    content = content.replace(
        mapRegex,
        `{tables.filter(t => selectedTableZone === 'All' || (t.zone || 'MAIN') === selectedTableZone).map(table => {`
    );
}

// 4. Remove the table.zone text from the cards
const zoneTextRegex = /<div className="flex justify-between items-start w-full">[\s\S]*?<span className=\{\`text-\[8px\] sm:text-\[9px\] font-bold uppercase tracking-widest \$\{isSelected \? 'text-white\/80' : isOccupied \? 'text-gray-400' : 'text-gray-400'\}\`\}>[\s\S]*?\{table\.zone \|\| 'MAIN'\}[\s\S]*?<\/span>/;
content = content.replace(zoneTextRegex, `<div className="flex justify-end items-start w-full min-h-[16px]">`);

fs.writeFileSync(filePath, content);
console.log("Successfully added zone filter.");
