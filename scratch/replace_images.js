const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if not exists
  if (!content.includes("import Image from 'next/image'")) {
    content = content.replace(
      "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';",
      "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';\nimport Image from 'next/image';"
    );
  }

  // Generic replacement for all <img> tags that look like these
  content = content.replace(
    /\{mItem\.image_url && <img src=\{\`\$\{mItem\.image_url\}\?v=8\`\} className="w-full h-full object-cover" crossOrigin="anonymous" \/>\}/g,
    '{mItem.image_url && <Image src={mItem.image_url} alt="" fill sizes="50px" className="object-cover" />}'
  );
  
  // Banner carousel replacement (Line 1963)
  content = content.replace(
    /\{item\.image_url && <img crossOrigin="anonymous" src=\{item\.image_url \? \`\$\{item\.image_url\}\?v=8\` : ''\} alt=\{getPrimaryMenuName\(item\)\} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" \/>\}/g,
    '{item.image_url && <Image src={item.image_url} alt={getPrimaryMenuName(item)} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-110 transition-transform duration-700" priority={index < 2} />}'
  );

  // Tier 1 and Tier 2 (Line 2016, 2059)
  content = content.replace(
    /\{item\.image_url && <img crossOrigin="anonymous"  src=\{item\.image_url \? \`\$\{item\.image_url\}\?v=8\` : ''\} alt=\{getPrimaryMenuName\(item\)\} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" \/>\}/g,
    '{item.image_url && <Image src={item.image_url} alt={getPrimaryMenuName(item)} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" priority={true} />}'
  );
  
  // Reviews (Line 2122)
  content = content.replace(
    /\{rev\.customer_image && <img  src=\{rev\.customer_image\} className="w-full h-full object-cover" \/>\}/g,
    '{rev.customer_image && <Image src={rev.customer_image} alt="Review" fill sizes="150px" className="object-cover" />}'
  );
  
  // Main Category (Line 2154)
  content = content.replace(
    /\{item\.image_url && <img crossOrigin="anonymous"  src=\{item\.image_url \? \`\$\{item\.image_url\}\?v=8\` : ''\} alt=\{getPrimaryMenuName\(item\)\} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" \/>\}/g,
    '{item.image_url && <Image src={item.image_url} alt={getPrimaryMenuName(item)} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" priority={index < 6} />}'
  );

  // Modals/Cart (Line 2253)
  content = content.replace(
    /<img crossOrigin="anonymous"  src=\{item\.image_url \? \`\$\{item\.image_url\}\?v=8\` : ''\} alt=\{getPrimaryMenuName\(item\)\} className="w-full h-full object-cover" \/>/g,
    '<Image src={item.image_url} alt={getPrimaryMenuName(item)} fill sizes="100px" className="object-cover" />'
  );
  
  // Upsell (Line 2447)
  content = content.replace(
    /<img crossOrigin="anonymous"  src=\{upsellItem\.image_url \? \`\$\{upsellItem\.image_url\}\?v=8\` : ''\} alt=\{getPrimaryMenuName\(upsellItem\)\} className="w-full h-full object-cover transition-transform group-hover:scale-110" \/>/g,
    '<Image src={upsellItem.image_url} alt={getPrimaryMenuName(upsellItem)} fill sizes="100px" className="object-cover transition-transform group-hover:scale-110" />'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
}

processFile('app/liff/menu/page.tsx');
console.log('done liff');
