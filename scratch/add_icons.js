import fs from 'fs';

const filePath = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `  Menu as MenuIcon, LogOut, Settings, List, Star, ToggleRight, CheckCircle2, XCircle`;
const replacement = `  Menu as MenuIcon, LogOut, Settings, List, Star, ToggleRight, CheckCircle2, XCircle, Upload, AlertCircle`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Added Upload and AlertCircle to imports');
} else {
    console.log('Target not found for icon imports');
}
