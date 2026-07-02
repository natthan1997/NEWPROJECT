import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/app/menu/[table_id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update refreshShopAvailability signature and logic
const targetFunc = /const refreshShopAvailability = useCallback\(async \(branchId\?: string \| null\) => \{[\s\S]*?let nextMessage = 'ขณะนี้ร้านปิดให้บริการ'/m;

const newFunc = `const refreshShopAvailability = useCallback(async (branchId?: string | null, tableData?: any) => {
    let settingsQuery = supabase
      .from('pos_shop_settings')
      .select('status, is_open, status_expiry, opening_hours, branch_id')

    if (branchId) {
      settingsQuery = settingsQuery.eq('branch_id', branchId)
    } else {
      settingsQuery = settingsQuery.eq('id', '00000000-0000-0000-0000-000000000001')
    }

    const { data: settings } = await settingsQuery.maybeSingle()
    const { data: activeShifts } = branchId
      ? await supabase.from('pos_shifts').select('id').eq('status', 'open').eq('branch_id', branchId).limit(1)
      : await supabase.from('pos_shifts').select('id').eq('status', 'open').limit(1)

    const hasActiveShift = !!activeShifts?.length
    let nextOpen = hasActiveShift
    let nextMessage = 'ขณะนี้ร้านปิดให้บริการ'`;

content = content.replace(targetFunc, newFunc);

const targetOverride = `    if (settings?.is_open === false || settings?.status === 'closed') {
      nextOpen = false
      nextMessage = 'ขณะนี้ร้านปิดให้บริการ'
    } else if (settings?.status === 'paused') {
      nextOpen = false
      nextMessage = 'ขณะนี้ร้านหยุดรับออเดอร์ชั่วคราว'
    } else if (!hasActiveShift) {
      nextOpen = false
      nextMessage = 'ขณะนี้ร้านปิดให้บริการ'
    }

    setIsShopOpen(nextOpen)`;

const newOverride = `    if (settings?.is_open === false || settings?.status === 'closed') {
      nextOpen = false
      nextMessage = 'ขณะนี้ร้านปิดให้บริการ'
    } else if (settings?.status === 'paused') {
      nextOpen = false
      nextMessage = 'ขณะนี้ร้านหยุดรับออเดอร์ชั่วคราว'
    } else if (!hasActiveShift) {
      nextOpen = false
      nextMessage = 'ขณะนี้ร้านปิดให้บริการ'
    }

    // Bypass check if table has allow_after_hours = true
    const currentTable = tableData || table;
    if (currentTable?.allow_after_hours) {
        nextOpen = true;
    }

    setIsShopOpen(nextOpen)`;

content = content.replace(targetOverride, newOverride);

// Update calls to refreshShopAvailability to pass table data
content = content.replace(/await refreshShopAvailability\(finalTableData\.branch_id\)/g, "await refreshShopAvailability(finalTableData.branch_id, finalTableData)");

fs.writeFileSync(filePath, content);
console.log("Updated menu page.");
