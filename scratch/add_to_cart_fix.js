import fs from 'fs';

const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update signature
content = content.replace(
  `const addToCart = async (item: MenuItem, modifiers: any[] = [], qty: number = 1) => {`,
  `const addToCart = async (item: MenuItem, modifiers: any[] = [], qty: number = 1, fromModal: boolean = false) => {`
);

// 2. Update condition
content = content.replace(
  `if (item.modifiers && item.modifiers.length > 0 && modifiers.length === 0) {`,
  `if (item.modifiers && item.modifiers.length > 0 && !fromModal && modifiers.length === 0) {`
);

// 3. Update the call in the modal
content = content.replace(
  `addToCart(modifierModalItem, tempSelectedModifiers, tempQuantity)`,
  `addToCart(modifierModalItem, tempSelectedModifiers, tempQuantity, true)`
);

fs.writeFileSync(filePath, content);
console.log('Fixed addToCart modal blocking bug');
