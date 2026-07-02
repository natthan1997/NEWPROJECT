import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuAppConfig.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We will add a local state for child header
content = content.replace(
  'const [activeTab, setActiveTab] = useState<MenuAppTab>(\'items\')',
  `const [activeTab, setActiveTab] = useState<MenuAppTab>('items')\n  const [childHeader, setChildHeader] = useState<React.ReactNode>(null)`
);

// We replace the activeTab === 'items' block to pass setChildHeader and remove hideStockToggle
content = content.replace(
  /setViewExtraHeader=\{\(\) => \{\}\}.*\n.*shopSettings=\{shopSettings\}\n.*hideStockToggle=\{true\}\n.*forceViewMode="grid"/,
  `setViewExtraHeader={setChildHeader}\n                shopSettings={shopSettings}\n                hideStockToggle={false}`
);

// We replace the activeTab === 'modifiers' block to pass setChildHeader
content = content.replace(
  /setViewExtraHeader=\{\(\) => \{\}\}/,
  `setViewExtraHeader={setChildHeader}`
);

// Under the APP-LIKE TOP TABS, we will render the childHeader
content = content.replace(
  /<\/div>\n      <\/div>\n\n      \{\/\* MAIN CONTENT AREA \*\/\}/,
  `</div>\n      </div>\n\n      {/* TOOLBAR FROM CHILD COMPONENTS */}\n      {childHeader && (\n        <div className="shrink-0 bg-white px-4 py-3 md:px-8 border-b border-gray-100 flex items-center justify-between">\n          {childHeader}\n        </div>\n      )}\n\n      {/* MAIN CONTENT AREA */}`
);

fs.writeFileSync(filePath, content);
console.log('Fixed POSMenuAppConfig');
