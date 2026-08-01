const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const missions = [
    { title: "นักดื่มกาแฟหน้าใหม่", description: "สั่งเมนูกาแฟครบ 3 แก้ว ภายในสัปดาห์นี้", condition_rules: { type: "order_item", category: "Coffee", count: 3 }, reward_tickets: 1, is_active: true },
    { title: "นักรีวิวตัวยง", description: "ถ่ายรูปเครื่องดื่มลง Story IG และแท็ก @xylstudio", condition_rules: { type: "social_share", platform: "instagram" }, reward_tickets: 2, is_active: true },
    { title: "ผู้มาเยือนยามเช้า", description: "ซื้อเครื่องดื่มช่วง 07:00 - 09:00", condition_rules: { type: "time_bound", start: "07:00", end: "09:00" }, reward_tickets: 1, is_active: true }
  ];
  for (const m of missions) {
    const { error } = await supabase.from('gamification_missions').insert(m);
    if (error) console.error(error);
  }
  console.log("Seeded!");
})();
