const fs = require('fs');

function replaceFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    
    // Pattern 1: .limit(1).maybeSingle() -> .order('updated_at', { ascending: false }).limit(1).maybeSingle()
    content = content.replace(/\.from\('pos_shop_settings'\)\.select\(([^)]+)\)\.limit\(1\)\.maybeSingle\(\)/g, ".from('pos_shop_settings').select($1).order('updated_at', { ascending: false }).limit(1).maybeSingle()");
    
    // Pattern 2: .maybeSingle() -> .order('updated_at', { ascending: false }).maybeSingle()
    // Need to be careful to only replace for pos_shop_settings
    // We can just use a regex that matches pos_shop_settings to maybeSingle
    content = content.replace(/\.from\('pos_shop_settings'\)\.select\(([^)]+)\)\.maybeSingle\(\)/g, ".from('pos_shop_settings').select($1).order('updated_at', { ascending: false }).limit(1).maybeSingle()");
    
    // Ensure we don't accidentally add it twice
    content = content.replace(/\.order\('updated_at', \{ ascending: false \}\)\.order\('updated_at'/g, ".order('updated_at'");
    
    fs.writeFileSync(path, content);
}

replaceFile('app/liff/member/page.tsx');
replaceFile('app/liff/history/page.tsx');
replaceFile('components/liff/LiffProvider.tsx');
replaceFile('components/dashboard/delivery/DeliveryManager.tsx');
