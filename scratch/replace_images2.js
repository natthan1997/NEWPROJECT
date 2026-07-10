const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if not exists
  if (!content.includes("import Image from 'next/image'")) {
    content = content.replace(
      "import React, { useState, useEffect, useMemo, useRef } from 'react'",
      "import React, { useState, useEffect, useMemo, useRef } from 'react'\nimport Image from 'next/image'"
    );
  }

  // Branch image
  content = content.replace(
    /<img crossOrigin="anonymous"  src=\{table\.branch\.image_url \? \`\$\{table\.branch\.image_url\}\?v=8\` : ''\} className="w-full h-full object-cover" \/>/g,
    '<Image src={table.branch.image_url} alt="" fill sizes="100px" className="object-cover" priority={true} />'
  );
  
  // Tier 1 and Tier 2 (Lines 1325, 1366)
  content = content.replace(
    /<img crossOrigin="anonymous"  src=\{item\.image_url \? \`\$\{item\.image_url\}\?v=8\` : ''\} alt=\{getPrimaryMenuName\(item\)\} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" \/>/g,
    '<Image src={item.image_url} alt={getPrimaryMenuName(item)} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-700" priority={true} />'
  );

  // Main category items (Line 1430)
  content = content.replace(
    /<img crossOrigin="anonymous"  src=\{item\.image_url \+ \(item\.image_url\.includes\('\?'\) \? '&' : '\?'\) \+ 'v=' \+ Date\.now\(\)\} alt=\{getPrimaryMenuName\(item\)\} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" \/>/g,
    '<Image src={item.image_url} alt={getPrimaryMenuName(item)} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" priority={true} />'
  );
  
  // Search items (Line 1540)
  content = content.replace(
    /<img crossOrigin="anonymous"  src=\{item\.image_url \? \`\$\{item\.image_url\}\?v=8\` : ''\} className="w-full h-full object-cover mix-blend-multiply" \/>/g,
    '<Image src={item.image_url} alt="" fill sizes="100px" className="object-cover mix-blend-multiply" />'
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

processFile('app/menu/[table_id]/page.tsx');
console.log('done table menu');
