const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Remove ?v=8 cache buster from image URLs
      if (content.includes('?v=')) {
        content = content.replace(/\?v=[0-9]+/g, '');
        changed = true;
      }
      if (content.includes("?`${")) {
        // e.g. `${item.image_url}?v=8`
        content = content.replace(/\?v=[0-9]+/g, '');
        changed = true;
      }

      // Add loading="lazy" to img tags if not present
      const imgRegex = /<img\s([^>]+)>/g;
      content = content.replace(imgRegex, (match, attrs) => {
        if (!attrs.includes('loading=')) {
          changed = true;
          return `<img loading="lazy" ${attrs}>`;
        }
        return match;
      });

      if (changed) {
        // Clean up some messed up templates if needed
        content = content.replace(/\?v=/g, ''); 
        content = content.replace(/\?`\$/g, '`$'); 
        
        // Let's specifically fix the item.image_url ? `${item.image_url}?v=8` : '' pattern
        content = content.replace(/src=\{([^?]+)\s\?\s`\$\{([^}]+)\}`\s:\s''\}/g, 'src={$1 || \'\'}');
        // e.g. src={item.image_url ? `${item.image_url}` : ''} -> src={item.image_url || ''}
        
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('./components/pos');
