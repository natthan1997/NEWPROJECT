const fs = require('fs');
const filePath = 'components/pos/POSMemberManager.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add import for Settings and X
code = code.replace(
  /Settings|X/g, 
  match => match // Just a dummy check, we will inject Settings explicitly
);

if (!code.includes('Settings')) {
  code = code.replace(
    /import \{([^\}]*)\} from 'lucide-react'/,
    "import { $1, Settings } from 'lucide-react'"
  );
}

// 2. Add import for CrmSettingsPage
if (!code.includes('CrmSettingsPage')) {
  code = code.replace(
    /import \{ useI18n \} from "@\/lib\/I18nContext";/,
    "import { useI18n } from \"@/lib/I18nContext\";\nimport CrmSettingsPage from '@/app/dashboard/admin/pos-settings/crm/page';"
  );
}

// 3. Add state showCrmSettings
if (!code.includes('showCrmSettings')) {
  code = code.replace(
    /const \[searchTerm, setSearchTerm\] = useState\(''\)/,
    "const [searchTerm, setSearchTerm] = useState('')\n    const [showCrmSettings, setShowCrmSettings] = useState(false)"
  );
}

// 4. Add the gear icon to the header
const headerTarget = /<h2 className="text-\[10px\] font-black uppercase tracking-\[0\.3em\] text-\[#1A1A18\]">([^<]*)<\/h2>\s*<span className="text-\[8px\] font-black text-sage-600 bg-sage-50 px-2 py-1 uppercase tracking-widest">([^<]*)<\/span>/;
const headerReplacement = `<h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A18]">$1</h2>
                             <div className="flex gap-2 items-center">
                                 <span className="text-[8px] font-black text-sage-600 bg-sage-50 px-2 py-1 uppercase tracking-widest">$2</span>
                                 <button onClick={() => setShowCrmSettings(true)} className="p-1 text-gray-400 hover:text-[#1A1A18] transition-colors" title="ตั้งค่า CRM & Loyalty">
                                     <Settings size={14} />
                                 </button>
                             </div>`;

code = code.replace(headerTarget, headerReplacement);

// 5. Add the modal JSX at the end of the main return
const modalTarget = /(<\/div>\s*<\/div>\s*)$/;
const modalJSX = `
            {/* CRM Settings Modal */}
            {showCrmSettings && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white w-full max-w-7xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm font-bold text-gray-900">การตั้งค่า CRM & Loyalty</h2>
                            <button onClick={() => setShowCrmSettings(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CrmSettingsPage />
                        </div>
                    </div>
                </div>
            )}
$1`;

if (!code.includes('CRM Settings Modal')) {
  // Try to insert just before the last two closing divs (which usually end the component)
  code = code.replace(/(\s*<\/div>\s*<\/div>\s*)$/g, modalJSX);
}

fs.writeFileSync(filePath, code);
console.log('POSMemberManager.tsx updated successfully');
