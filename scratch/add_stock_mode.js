import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update state
content = content.replace(
  "const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')",
  "const [viewMode, setViewMode] = useState<'grid' | 'table' | 'stock'>('grid')"
);

// We need an icon for the Stock toggle. Let's add 'PackageOpen' or 'ToggleRight' or 'Box' to lucide-react imports
if (!content.includes('ToggleRight')) {
  content = content.replace("List, Star", "List, Star, ToggleRight, CheckCircle2, XCircle");
}

fs.writeFileSync(filePath, content);
console.log("Updated state in POSMenuManager.tsx");
