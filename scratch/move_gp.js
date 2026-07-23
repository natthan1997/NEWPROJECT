const fs = require('fs');
const posSettingsPath = './components/pos/POSShopSettings.tsx';
const posContent = fs.readFileSync(posSettingsPath, 'utf8');

const lines = posContent.split('\n');

const startDelivery = 718; // line 719 in 1-based index is lines[718]
const endDelivery = 837;   // line 838 in 1-based index is lines[837]

const startAdvanced = 1176; // line 1177
const endAdvanced = 1313;   // line 1314

const advancedContentToMove = lines.slice(startAdvanced, endAdvanced + 1);

// Replace lines[startDelivery] to lines[endDelivery] with advancedContentToMove
const newLines = [
    ...lines.slice(0, startDelivery),
    ...advancedContentToMove,
    ...lines.slice(endDelivery + 1, startAdvanced),
    ...lines.slice(endAdvanced + 1)
];

fs.writeFileSync(posSettingsPath, newLines.join('\n'));
console.log('done replacing');
