const fs = require('fs');
const path = require('path');

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove the /13 part for public holiday
    content = content.replace(
        /<span className="text-\[10px\] font-bold text-\[\#A3A3A3\] mb-0\.5">\/ \{q\.quota\}<\/span>/g,
        '{q.label !== \'นักขัตฤกษ์\' && <span className="text-[10px] font-bold text-[#A3A3A3] mb-0.5">/ {q.quota}</span>}'
    );
    content = content.replace(
        /<span className="text-xs font-bold text-gray-400 mb-0\.5">\/ \{q\.quota\}<\/span>/g,
        '{q.label !== \'นักขัตฤกษ์\' && <span className="text-xs font-bold text-gray-400 mb-0.5">/ {q.quota}</span>}'
    );

    // Remove the progress bar for public holiday
    content = content.replace(
        /<div className="w-full bg-\[\#EFEFEF\] rounded-full h-1 mt-2">/g,
        '{q.label !== \'นักขัตฤกษ์\' && <div className="w-full bg-[#EFEFEF] rounded-full h-1 mt-2">'
    );
    content = content.replace(
        /<div className="w-full bg-gray-200 rounded-full h-1\.5 mt-2">/g,
        '{q.label !== \'นักขัตฤกษ์\' && <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">'
    );
    // Add the closing tag for the conditionally rendered progress bar container
    // The structure is:
    // <div className="w-full ...">
    //    <div className="..." style="..."></div>
    // </div>
    // So we need to find the closing div of the progress bar wrapper.
    content = content.replace(
        /<\/div>\s*<\/div>\s*\}\)\)/g,
        '</div>\n                    }</div>\n            }))'
    );
    // Wait, replacing the closing div that way is brittle. Let's just do a manual string replace.

    fs.writeFileSync(filepath, content);
}

// POSStaffManager.tsx
let contentPOS = fs.readFileSync(path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx'), 'utf8');
contentPOS = contentPOS.replace(
    /<span className="text-\[10px\] font-bold text-\[\#A3A3A3\] mb-0\.5">\/ \{q\.quota\}<\/span>\s*<\/div>\s*<div className="w-full bg-\[\#EFEFEF\] rounded-full h-1 mt-2">\s*<div className=\{`h-1 rounded-full \$\{q\.used >= q\.quota && q\.quota > 0 \? 'bg-\[\#E54D2E\]' : 'bg-\[\#111111\]'\}`\} style=\{\{ width: `\$\{Math\.min\(100, q\.quota > 0 \? \(q\.used \/ q\.quota\) \* 100 : 100\)\}%` \}\}><\/div>\s*<\/div>/g,
    `{q.label !== 'นักขัตฤกษ์' && <span className="text-[10px] font-bold text-[#A3A3A3] mb-0.5">/ {q.quota}</span>}
                    </div>
                    {q.label !== 'นักขัตฤกษ์' && (
                        <div className="w-full bg-[#EFEFEF] rounded-full h-1 mt-2">
                            <div className={\`h-1 rounded-full \${q.used >= q.quota && q.quota > 0 ? 'bg-[#E54D2E]' : 'bg-[#111111]'}\`} style={{ width: \`\${Math.min(100, q.quota > 0 ? (q.used / q.quota) * 100 : 100)}%\` }}></div>
                        </div>
                    )}`
);
fs.writeFileSync(path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx'), contentPOS);


// page.tsx
let contentLeaves = fs.readFileSync(path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'leaves', 'page.tsx'), 'utf8');
contentLeaves = contentLeaves.replace(
    /<span className="text-xs font-bold text-gray-400 mb-0\.5">\/ \{q\.quota\}<\/span>\s*<\/div>\s*<div className="w-full bg-gray-200 rounded-full h-1\.5 mt-2">\s*<div className=\{`h-1\.5 rounded-full \$\{q\.used >= q\.quota && q\.quota > 0 \? 'bg-red-500' : 'bg-gray-900'\}`\} style=\{\{ width: `\$\{Math\.min\(100, q\.quota > 0 \? \(q\.used \/ q\.quota\) \* 100 : 100\)\}%` \}\}><\/div>\s*<\/div>/g,
    `{q.label !== 'นักขัตฤกษ์' && <span className="text-xs font-bold text-gray-400 mb-0.5">/ {q.quota}</span>}
                    </div>
                    {q.label !== 'นักขัตฤกษ์' && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className={\`h-1.5 rounded-full \${q.used >= q.quota && q.quota > 0 ? 'bg-red-500' : 'bg-gray-900'}\`} style={{ width: \`\${Math.min(100, q.quota > 0 ? (q.used / q.quota) * 100 : 100)}%\` }}></div>
                        </div>
                    )}`
);
fs.writeFileSync(path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'leaves', 'page.tsx'), contentLeaves);

console.log("Patched 13 hide");
