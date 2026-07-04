import fs from 'fs';

const filePath = 'components/pos/POSModifierManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `min_selection: cleanGroup.min_select || cleanGroup.min_selection || 0`,
  `min_selection: cleanGroup.min_select ?? cleanGroup.min_selection ?? 0`
);
content = content.replace(
  `max_selection: cleanGroup.max_select || cleanGroup.max_selection || 1`,
  `max_selection: cleanGroup.max_select ?? cleanGroup.max_selection ?? 1`
);
content = content.replace(
  `min_select: cleanGroup.min_select || cleanGroup.min_selection || 0`,
  `min_select: cleanGroup.min_select ?? cleanGroup.min_selection ?? 0`
);
content = content.replace(
  `max_select: cleanGroup.max_select || cleanGroup.max_selection || 1`,
  `max_select: cleanGroup.max_select ?? cleanGroup.max_selection ?? 1`
);

fs.writeFileSync(filePath, content);
console.log('Fixed POSModifierManager save logic');
