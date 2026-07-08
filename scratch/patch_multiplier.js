const fs = require('fs');

function replaceFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    // Replace .point_multiplier with .multiplier
    // But wait, the admin panel uses "point_multiplier" in its state `setCampaigns([{ point_multiplier: ... }])`
    // So if I just replace all `point_multiplier` with `multiplier`, it will fix everything!
    content = content.replace(/point_multiplier/g, 'multiplier');
    fs.writeFileSync(path, content);
}

replaceFile('app/liff/member/page.tsx');
replaceFile('app/dashboard/admin/pos-settings/crm/page.tsx');
replaceFile('components/pos/POSTerminal.tsx');
