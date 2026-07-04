const fs = require('fs');
const filePath = 'components/pos/POSMemberManager.tsx';
let code = fs.readFileSync(filePath, 'utf8');

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
            <style jsx global>`;

code = code.replace('<style jsx global>', modalJSX);
fs.writeFileSync(filePath, code);
console.log('Added modal JSX');
