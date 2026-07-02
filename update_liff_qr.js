const fs = require('fs');

const files = [
  'app/liff/menu/page.tsx',
  'app/menu/[table_id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Update formatCartModifierLine
  content = content.replace(
    /const formatCartModifierLine = \(modifier: any\) => \{\s*const name = modifier\.name \|\| modifier\.option_name \|\| modifier\.selected_value \|\| '';\s*if \(\!name\) return '';\s*const value = modifier\.value \|\| modifier\.selected_value \|\| modifier\.option_value \|\| modifier\.option_name \|\| '';\s*if \(value && value !== name\) return `\$\{name\}: \$\{value\}`;\s*return name;\s*\};/,
    `const formatCartModifierLine = (modifier: any) => {
  const name = modifier.name || modifier.option_name || modifier.selected_value || '';
  if (!name) return '';
  const value = modifier.value || modifier.selected_value || modifier.option_value || modifier.option_name || '';
  const qtyPrefix = modifier.qty > 1 ? \`\${modifier.qty}x \` : '';
  if (value && value !== name) return \`\${qtyPrefix}\${name}: \${value}\`;
  return \`\${qtyPrefix}\${name}\`;
};`
  );

  // 2. Update modal minReq/maxAllowed validation
  content = content.replace(
    /const selectedInGroup = tempSelectedModifiers\.filter\(m => m\.group_id === group\.id\)\s+const isComplete = selectedInGroup\.length >= minReq\s+const isAtMax = selectedInGroup\.length >= maxAllowed/g,
    `const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === group.id)
                  const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0)
                  const isComplete = totalQtyInGroup >= minReq
                  const isAtMax = totalQtyInGroup >= maxAllowed`
  );

  // 3. Update modal footer price
  content = content.replace(
    /const incomplete = modifierGroups\.filter\(g => tempSelectedModifiers\.filter\(m => m\.group_id === g\.id\)\.length < \(g\.min_selection \|\| g\.min_select \|\| 0\)\)\s+const canConfirm = incomplete\.length === 0\s+const totalPrice = \(pendingItem\.sale_price \|\| 0\) \+ tempSelectedModifiers\.reduce\(\(acc, m\) => acc \+ \(m\.price_adjustment \|\| m\.price \|\| 0\), 0\)/g,
    `const incomplete = modifierGroups.filter(g => tempSelectedModifiers.filter(m => m.group_id === g.id).reduce((sum, m) => sum + (m.qty || 1), 0) < (g.min_selection || g.min_select || 0))
                  const canConfirm = incomplete.length === 0
                  const totalPrice = (pendingItem.sale_price || 0) + tempSelectedModifiers.reduce((acc, m) => acc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0)`
  );

  // 4. Update cart total price
  content = content.replace(
    /const modsPrice = item\.selected_modifiers\?\.reduce\(\(macc: number, m: any\) => macc \+ \(m\.price_adjustment \|\| m\.price \|\| 0\), 0\) \|\| 0;/g,
    `const modsPrice = item.selected_modifiers?.reduce((macc: number, m: any) => macc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0;`
  );
  content = content.replace(
    /const modsPrice = item\.selected_modifiers\?\.reduce\(\(acc, m\) => acc \+ \(m\.price_adjustment \|\| m\.price \|\| 0\), 0\) \|\| 0;/g,
    `const modsPrice = item.selected_modifiers?.reduce((acc: number, m: any) => acc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0;`
  );

  // 5. Update cart render price
  content = content.replace(
    /\{locale === 'en' \? '฿' : locale === 'zh' \? '฿' : '฿'\}\{\(\(item\.sale_price \+ \(item\.selected_modifiers\?\.reduce\(\(acc, m\) => acc \+ \(m\.price_adjustment \|\| m\.price \|\| 0\), 0\) \|\| 0\)\) \* item\.quantity\)\.toLocaleString\(\)\}/g,
    `{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}{((item.sale_price + (item.selected_modifiers?.reduce((acc: number, m: any) => acc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0) || 0)) * item.quantity).toLocaleString()}`
  );

  // 6. Fix `items: cart.map(...)` logic where modifiers are mapped to the final object
  content = content.replace(
    /modifiers: \(item\.selected_modifiers \|\| \[\]\)\.map\(\(mod: any\) => \(\{\s*id: mod\?\.id \|\| null,\s*name: mod\?\.name \|\| '',\s*value: mod\?\.value \|\| '',\s*price: Number\(mod\?\.price_adjustment \|\| mod\?\.price \|\| 0\),\s*\}\)\),/g,
    `modifiers: (item.selected_modifiers || []).map((mod: any) => ({
        id: mod?.id || null,
        name: mod?.name || '',
        value: mod?.value || '',
        price: Number(mod?.price_adjustment || mod?.price || 0),
        qty: mod?.qty || 1,
      })),`
  );

  // 7. Update modifier modal option click logic and add minus button
  // I will use a regex to replace the inner block of the options rendering map
  const optionRegex = /\{group\.options\?\.map\(\(opt: any, optIdx: number\) => \{([\s\S]*?)<\/button>\s*\)\s*\}\)\}/g;
  
  content = content.replace(optionRegex, (match, inner) => {
    return `{group.options?.map((opt: any, optIdx: number) => {
                          const existingOptIndex = tempSelectedModifiers.findIndex(m => m.id === opt.id)
                          const isSelected = existingOptIndex > -1
                          const optQty = isSelected ? (tempSelectedModifiers[existingOptIndex].qty || 1) : 0
                          const isDisabled = !isSelected && isAtMax && maxAllowed > 1
                          
                          return (
                            <button
                              key={opt.id}
                              disabled={isDisabled}
                              onClick={() => {
                                let nextSelected = [...tempSelectedModifiers]
                                if (isSelected) {
                                  if (maxAllowed === 1) {
                                    nextSelected.splice(existingOptIndex, 1)
                                  } else {
                                    if (!isAtMax) {
                                      nextSelected[existingOptIndex] = { ...nextSelected[existingOptIndex], qty: optQty + 1 }
                                    }
                                  }
                                } else {
                                  if (maxAllowed === 1) {
                                    nextSelected = [...nextSelected.filter(m => m.group_id !== group.id), { ...opt, qty: 1 }]
                                  } else {
                                    nextSelected = [...nextSelected, { ...opt, qty: 1 }]
                                  }
                                }
                                setTempSelectedModifiers(nextSelected)
                                if (errorGroupId === group.id) setErrorGroupId(null)
                              }}
                              className={\`group relative flex items-center justify-between p-3 rounded-xl transition-all border-2 \${
                                isSelected ? 'border-black bg-gray-50 shadow-sm' : 'border-transparent hover:bg-gray-50'
                              } \${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}\`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                                <div className={\`flex items-center justify-center shrink-0 transition-all \${
                                  maxAllowed === 1 ? 'w-5 h-5 rounded-full border-2' : 'w-5 h-5 rounded border-2'
                                } \${isSelected ? 'border-black bg-black' : 'border-gray-300 bg-white group-hover:border-gray-400'}\`}>
                                  {isSelected && (
                                    maxAllowed === 1 ? (
                                      <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-200" />
                                    ) : (
                                      <Check size={14} className="text-white animate-in zoom-in duration-200" strokeWidth={3} />
                                    )
                                  )}
                                </div>
                                <span className={\`text-[15px] truncate leading-tight pt-0.5 \${isSelected ? 'text-black font-bold' : 'text-gray-700 font-medium'}\`}>{opt.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {isSelected && maxAllowed > 1 && (
                                  <div className="flex items-center gap-1.5 bg-black/5 rounded-full px-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                                    <div
                                      onClick={() => {
                                        let nextSelected = [...tempSelectedModifiers]
                                        const idx = nextSelected.findIndex(m => m.id === opt.id)
                                        if (idx > -1) {
                                          if ((nextSelected[idx].qty || 1) > 1) {
                                            nextSelected[idx] = { ...nextSelected[idx], qty: nextSelected[idx].qty - 1 }
                                          } else {
                                            nextSelected.splice(idx, 1)
                                          }
                                          setTempSelectedModifiers(nextSelected)
                                        }
                                      }}
                                      className="w-6 h-6 rounded-full bg-white text-red-500 flex items-center justify-center shadow-sm cursor-pointer border border-gray-200 hover:bg-gray-50"
                                    >
                                      <Minus size={12} strokeWidth={4} />
                                    </div>
                                    <span className="text-[12px] font-bold px-1">{optQty}</span>
                                  </div>
                                )}
                                {opt.price_adjustment !== 0 && (
                                    <div className={\`text-[14px] font-medium shrink-0 pt-0.5 \${isSelected ? 'text-black' : 'text-gray-500'}\`}>
                                      {opt.price_adjustment > 0 ? \`+฿\${opt.price_adjustment}\` : \`-฿\${Math.abs(opt.price_adjustment)}\`}
                                    </div>
                                )}
                              </div>
                            </button>
                          )
                        }})`
  });

  fs.writeFileSync(file, content);
});
