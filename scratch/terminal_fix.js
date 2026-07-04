import fs from 'fs';

const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `const incomplete = modifierGroups.filter(
                  g =>
                    tempSelectedModifiers.filter(m => m.group_id === g.id).length <
                    (g.min_selection || g.min_select || 0)
                )`;

const replacement = `const incomplete = modifierGroups.filter(g => {
                  const minReq = Number(g.min_selection ?? g.min_select ?? 0);
                  const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === g.id);
                  const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0);
                  return totalQtyInGroup < minReq;
                })`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log('Fixed POSTerminal canConfirm logic');
} else {
  console.log('Target not found in POSTerminal.tsx');
}
