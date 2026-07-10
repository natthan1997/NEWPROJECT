const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add unoptimized and priority=true to all Images, replacing existing priority if it exists
  // First remove any existing priority={...}
  content = content.replace(/ priority=\{[^\}]+\}/g, '');
  content = content.replace(/ priority/g, '');

  // Add unoptimized and priority
  content = content.replace(/<Image /g, '<Image unoptimized priority={true} ');

  // Fix unsafe unwrapped Images in liff/menu
  content = content.replace(
    /                         <Image unoptimized priority=\{true\} src=\{item\.image_url\}/g,
    '                         {item.image_url && <Image unoptimized priority={true} src={item.image_url}'
  );
  content = content.replace(
    / className="object-cover" \/>\n                        <\/div>/g,
    ' className="object-cover" />}\n                        </div>'
  ); // Need to be careful here

  fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('app/liff/menu/page.tsx');
fixFile('app/menu/[table_id]/page.tsx');
console.log('done');
