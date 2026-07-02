import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state variable for stock draft
const stateInjectionPoint = "const [reorderDraft, setReorderDraft] = useState<Record<string, string[]>>({})";
if (!content.includes("const [stockDraft, setStockDraft]")) {
  content = content.replace(
    stateInjectionPoint,
    `${stateInjectionPoint}\n  const [stockDraft, setStockDraft] = useState<Record<string, boolean>>({})`
  );
}

// 2. Add Save function for stock draft
const functionInjectionPoint = "const handleBulkUpdate = async (id: string, field: string, value: any) => {";
const saveStockFunction = `
  const handleSaveStockDraft = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(stockDraft).map(([id, inStock]) => ({
        id,
        in_stock: inStock
      }));
      
      for (const update of updates) {
        await supabase.from('pos_menu_items').update({ in_stock: update.in_stock }).eq('id', update.id);
      }
      
      setItems(items.map(item => {
        if (stockDraft[item.id] !== undefined) {
          return { ...item, in_stock: stockDraft[item.id] };
        }
        return item;
      }));
      setStockDraft({});
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  const handleStockDraftToggle = (id: string, currentStatus: boolean) => {
    setStockDraft(prev => {
      const next = { ...prev };
      // If toggled back to original state, remove from draft
      const originalItem = items.find(i => i.id === id);
      const originalStatus = originalItem?.in_stock !== false;
      const newStatus = !currentStatus;
      
      if (newStatus === originalStatus) {
        delete next[id];
      } else {
        next[id] = newStatus;
      }
      return next;
    });
  }

`;
if (!content.includes("handleSaveStockDraft")) {
  content = content.replace(functionInjectionPoint, saveStockFunction + functionInjectionPoint);
}

fs.writeFileSync(filePath, content);
console.log("Added draft state and functions");
