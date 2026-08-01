const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function exportFullRecipeAudit() {
  console.log("=== EXPORTING FULL MENU & RECIPE AUDIT DATA ===");

  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';

  const { data: menuList } = await supabase.from('pos_menu_items').select('*').order('name');
  const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('*').order('name');
  const { data: invItems } = await supabase.from('inventory_items').select('*').order('name');

  const invMap = new Map((invItems || []).map(i => [i.id, i]));

  let mdContent = `# รายงานตรวจสอบสูตรอาหารและวัตถุดิบทั้งหมด (Full Menu & Recipe Audit Report)\n\n`;
  mdContent += `**สาขา**: XYL STUDIO (${targetBranchId})\n`;
  mdContent += `**วันที่สร้างรายงาน**: ${new Date().toLocaleString('th-TH')}\n\n`;

  mdContent += `---\n\n## 1. หมวดรายการเมนูอาหารและเครื่องดื่ม (POS Menu Items)\n\n`;
  mdContent += `| ลำดับ | ชื่อเมนู | หมวดหมู่ | ราคาขาย (บาท) | ต้นทุนคงที่ (บาท) | ต้นทุนคำนวณจากสูตร (บาท) | รายละเอียดวัตถุดิบในสูตร (Recipe Details) |\n`;
  mdContent += `| :---: | :--- | :--- | :---: | :---: | :---: | :--- |\n`;

  (menuList || []).forEach((m, idx) => {
    let recipeDetails = [];
    let calculatedCost = 0;

    if (Array.isArray(m.recipe_data) && m.recipe_data.length > 0) {
      m.recipe_data.forEach(ing => {
        const inv = invMap.get(ing.ingredient_id);
        const unitCost = Number(inv?.cost_price || 0);
        const qty = Number(ing.quantity || 0);
        const factor = Number(ing.factor !== undefined ? ing.factor : 1);
        const lineCost = unitCost * qty * factor;
        calculatedCost += lineCost;

        recipeDetails.push(`• **${inv?.name || ing.name || 'ไม่ทราบชื่อ'}**: ${qty} ${ing.recipe_unit || inv?.unit || ''} (ต้นทุนต่อหน่วย ${unitCost} บ. -> **${lineCost.toFixed(2)} บ.**)`);
      });
    }

    const recipeStr = recipeDetails.length > 0 ? recipeDetails.join('<br>') : '*ไม่มีสูตร Recipe (ใช้ราคาต้นทุนคงที่)*';
    const priceStr = m.price !== undefined && m.price !== null ? `${m.price} บ.` : '*ไม่ได้ระบุ*';
    const fixedCostStr = m.cost_price !== undefined && m.cost_price !== null ? `${m.cost_price} บ.` : '0 บ.';
    const calcCostStr = calculatedCost > 0 ? `**${calculatedCost.toFixed(2)} บ.**` : fixedCostStr;

    mdContent += `| ${idx + 1} | **${m.name}** | ${m.category || '-'} | ${priceStr} | ${fixedCostStr} | ${calcCostStr} | ${recipeStr} |\n`;
  });

  mdContent += `\n---\n\n## 2. หมวดตัวเลือกเพิ่มเติม (POS Menu Modifiers)\n\n`;
  mdContent += `| ลำดับ | ชื่อตัวเลือก (Modifier) | ราคาบวกเพิ่ม (บาท) | ต้นทุนคงที่ (บาท) | ต้นทุนคำนวณจากสูตร (บาท) | รายละเอียดวัตถุดิบในสูตร |\n`;
  mdContent += `| :---: | :--- | :---: | :---: | :---: | :--- |\n`;

  (modifierList || []).forEach((mod, idx) => {
    let recipeDetails = [];
    let calculatedCost = 0;

    if (Array.isArray(mod.recipe_data) && mod.recipe_data.length > 0) {
      mod.recipe_data.forEach(ing => {
        const inv = invMap.get(ing.ingredient_id);
        const unitCost = Number(inv?.cost_price || 0);
        const qty = Number(ing.quantity || 0);
        const factor = Number(ing.factor !== undefined ? ing.factor : 1);
        const lineCost = unitCost * qty * factor;
        calculatedCost += lineCost;

        recipeDetails.push(`• **${inv?.name || ing.name || 'ไม่ทราบชื่อ'}**: ${qty} ${ing.recipe_unit || inv?.unit || ''} (ต้นทุนต่อหน่วย ${unitCost} บ. -> **${lineCost.toFixed(2)} บ.**)`);
      });
    }

    const recipeStr = recipeDetails.length > 0 ? recipeDetails.join('<br>') : '*ไม่มีสูตร Recipe*';
    const priceStr = mod.price ? `${mod.price} บ.` : '0 บ.';
    const fixedCostStr = mod.cost_price ? `${mod.cost_price} บ.` : '0 บ.';
    const calcCostStr = calculatedCost > 0 ? `**${calculatedCost.toFixed(2)} บ.**` : fixedCostStr;

    mdContent += `| ${idx + 1} | **${mod.name}** | ${priceStr} | ${fixedCostStr} | ${calcCostStr} | ${recipeStr} |\n`;
  });

  mdContent += `\n---\n\n## 3. หมวดวัตถุดิบในคลังสินค้า (Inventory Items)\n\n`;
  mdContent += `| ลำดับ | รหัสวัตถุดิบ (ID) | ชื่อวัตถุดิบ | หน่วยนับ (Unit) | ราคาต้นทุนต่อหน่วย (Cost Price/Unit) | จำนวนสต็อกคงเหลือ |\n`;
  mdContent += `| :---: | :--- | :--- | :---: | :---: | :---: |\n`;

  (invItems || []).forEach((inv, idx) => {
    const costDisplay = Number(inv.cost_price || 0) === 0 ? `<span style="color:red; font-weight:bold;">0 บาท (ยังไม่ได้ตั้งราคา)</span>` : `${inv.cost_price} บาท / ${inv.unit || 'หน่วย'}`;
    mdContent += `| ${idx + 1} | \`${inv.id}\` | **${inv.name}** | ${inv.unit || '-'} | ${costDisplay} | ${inv.stock_quantity ?? '-'} |\n`;
  });

  // Write to Artifact directory
  const artifactDir = '/Users/chenchirawongpothisan/.gemini/antigravity-ide/brain/bbb6972f-9ef6-4666-8542-8f8bf3b8e29e';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const outputPath = path.join(artifactDir, 'full_menu_recipe_audit.md');
  fs.writeFileSync(outputPath, mdContent, 'utf8');

  console.log(`Successfully exported audit report to: ${outputPath}`);
}

exportFullRecipeAudit();
