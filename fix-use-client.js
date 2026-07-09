const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.startsWith('import Image from "next/image";\n\'use client\'')) {
    content = content.replace('import Image from "next/image";\n\'use client\'', '\'use client\'\nimport Image from "next/image";');
    fs.writeFileSync(filePath, content);
    console.log('Fixed ' + filePath);
  } else if (content.startsWith('import Image from "next/image";\n"use client"')) {
    content = content.replace('import Image from "next/image";\n"use client"', '"use client"\nimport Image from "next/image";');
    fs.writeFileSync(filePath, content);
    console.log('Fixed ' + filePath);
  }
}

fixFile('./components/pos/POSMenuManager.tsx');
fixFile('./components/pos/POSTerminal.tsx');
fixFile('./components/pos/PromoBannerSlider.tsx');
