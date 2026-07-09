const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if not exists
  if (!content.includes('import Image from \'next/image\'')) {
    content = 'import Image from "next/image";\n' + content;
    changed = true;
  }

  // Replace <img ... /> with <Image width={300} height={300} ... />
  // We need to match <img ... /> carefully.
  const imgRegex = /<img\s+loading="lazy"\s+crossOrigin="anonymous"\s+src=\{([^}]+)\}\s+className="([^"]+)"\s*\/>/g;
  
  content = content.replace(imgRegex, (match, src, className) => {
    return `<Image src={${src}} alt="menu image" width={300} height={300} className="${className}" />`;
  });

  // Also match the ones without crossOrigin just in case
  const imgRegex2 = /<img\s+loading="lazy"\s+src=\{([^}]+)\}\s+className="([^"]+)"\s*\/>/g;
  content = content.replace(imgRegex2, (match, src, className) => {
    return `<Image src={${src}} alt="menu image" width={300} height={300} className="${className}" />`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

processFile('./components/pos/POSTerminal.tsx');
processFile('./components/pos/POSMenuManager.tsx');
processFile('./components/pos/PromoBannerSlider.tsx');
