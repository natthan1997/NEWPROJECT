import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/app/dashboard/pos/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add to POSView
content = content.replace(
  "| 'history'",
  "| 'history'\n  | 'menu-management'"
);

// Add to navItems
const navItemLine = "{ id: 'management', label: 'จัดการระบบ', icon: Settings, roles: ['admin', 'manager'], group: 'management' },";
const newNavItems = `{ id: 'menu-management', label: 'จัดการเมนู', icon: Utensils, roles: ['admin', 'manager'], group: 'management' },\n    { id: 'management', label: 'จัดการระบบ', icon: Settings, roles: ['admin', 'manager'], group: 'management' },`;

content = content.replace(navItemLine, newNavItems);

// Render component inside renderView
// First need to import POSMenuAppConfig
content = content.replace(
  "import POSSettingsUnified from '@/components/pos/POSSettingsUnified'",
  "import POSSettingsUnified from '@/components/pos/POSSettingsUnified'\nimport POSMenuAppConfig from '@/components/pos/POSMenuAppConfig'"
);

// Render in switch block
const renderBlockOld = `if (activeView === 'management') {
      return (
        <POSManagementUnified
          profile={profile}
          activeView={activeView}
          onSetView={handleSetView}
          setViewExtraHeader={setViewExtraHeader}
          shopSettings={shopSettings}
        />
      )
    }`;

const renderBlockNew = `if (activeView === 'menu-management') {
      return (
        <POSMenuAppConfig
          profile={profile}
          activeView={activeView}
          onSetView={handleSetView}
          setViewExtraHeader={setViewExtraHeader}
          shopSettings={shopSettings}
        />
      )
    }

    if (activeView === 'management') {
      return (
        <POSManagementUnified
          profile={profile}
          activeView={activeView}
          onSetView={handleSetView}
          setViewExtraHeader={setViewExtraHeader}
          shopSettings={shopSettings}
        />
      )
    }`;

content = content.replace(renderBlockOld, renderBlockNew);

fs.writeFileSync(filePath, content);
console.log('Successfully updated POS page');
