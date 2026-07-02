import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSManagementUnified.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update ManagementTab type
content = content.replace(
  "type ManagementTab = 'resources' | 'menu_system' | 'stock_control' | 'recipes' | 'audit'",
  "type ManagementTab = 'resources' | 'recipes' | 'audit'"
);

// Update tabs array
const oldTabsStr = `  const tabs = [
    { id: 'resources', label: 'คลังพัสดุ', sub: 'Resources', icon: Package },
    { id: 'menu_system', label: 'ระบบจัดการเมนู', sub: 'Menu System', icon: Layers },
    { id: 'stock_control', label: 'อัปเดตสต็อก', sub: 'Stock Control', icon: ToggleRight },
    { id: 'recipes', label: 'สูตรตัดสต็อก', sub: 'Recipes', icon: FlaskConical },
    { id: 'audit', label: 'สรุปการตรวจนับ', sub: 'Audit & Sync', icon: ClipboardCheck },
  ]`;

const newTabsStr = `  const tabs = [
    { id: 'resources', label: 'คลังพัสดุ', sub: 'Resources', icon: Package },
    { id: 'recipes', label: 'สูตรตัดสต็อก', sub: 'Recipes', icon: FlaskConical },
    { id: 'audit', label: 'สรุปการตรวจนับ', sub: 'Audit & Sync', icon: ClipboardCheck },
  ]`;

content = content.replace(oldTabsStr, newTabsStr);

// Remove menu_system and stock_control components from AnimatePresence
// Since we used complex structure for menu_system, I will use regex or substring to remove it.
const startMenuSystem = content.indexOf("{activeTab === 'menu_system' && (");
const endMenuSystem = content.indexOf("{activeTab === 'stock_control' && (");
if (startMenuSystem !== -1 && endMenuSystem !== -1) {
  content = content.substring(0, startMenuSystem) + content.substring(endMenuSystem);
}

const startStockControl = content.indexOf("{activeTab === 'stock_control' && (");
const endStockControl = content.indexOf("{activeTab === 'recipes' && (");
if (startStockControl !== -1 && endStockControl !== -1) {
  content = content.substring(0, startStockControl) + content.substring(endStockControl);
}

fs.writeFileSync(filePath, content);
console.log('Successfully updated POSManagementUnified');
