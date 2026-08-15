const fs = require('fs');
const file = 'components/pos/SOPStaticContent.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Content Sections wrapper
content = content.replace(
    /\{\/\* Content Sections \*\/\}\n\s+<div className="space-y-10 pb-8">\n\s+\{\/\* Section 1 \*\/\}/g,
    `{/* Content Sections */}
                <div className="block md:grid md:grid-cols-12 gap-10 print:block">
                    <div className="md:col-span-12 print:block">
                        <div className="space-y-10 print:space-y-0 print:block pb-8">
                            {/* PAGE 1: Sections 1-3 */}
                            <div className="print:break-after-page print:pb-8 space-y-10 print:space-y-8">
                                {/* Section 1 */}`
);

// 2. Wrap Sections 4-6
content = content.replace(
    /\s+<\/Section>\n\n\s+\{\/\* Section 4 \*\/\}/g,
    `\n                    </Section>\n                            </div>\n                            {/* PAGE 2: Sections 4-6 */}\n                            <div className="print:break-after-page print:pt-8 space-y-10 print:space-y-8">\n                                {/* Section 4 */}`
);

// 3. Close the new wrappers before Evaluation Form
content = content.replace(
    /\s+<\/Section>\n\n\s+<\/div>\n\n\s+\{\/\* Evaluation Form Component \*\/\}/g,
    `\n                    </Section>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n            {/* Evaluation Form Component */}`
);

// 4. Update CSS block
content = content.replace(
    /\.break-inside-avoid \{\n\s+display: inline-block !important;\n\s+width: 100% !important;\n\s+\}/g,
    ``
);

fs.writeFileSync(file, content);
