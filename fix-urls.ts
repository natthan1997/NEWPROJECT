import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const oldUrl = 'https://pub-a6469596238f4a58a3a44fb4bbecd952.r2.dev';
  const newUrl = 'https://rushup-images.fragrant-disk-47c5.workers.dev';
  
  // pos_menu_items
  const { data: menus } = await supabase.from('pos_menu_items').select('id, image_url').like('image_url', `${oldUrl}%`);
  console.log(`Found ${menus?.length || 0} menus to update`);
  for (const item of (menus || [])) {
    await supabase.from('pos_menu_items').update({ image_url: item.image_url.replace(oldUrl, newUrl) }).eq('id', item.id);
  }
  
  // pos_categories
  const { data: cats } = await supabase.from('pos_categories').select('id, image_url').like('image_url', `${oldUrl}%`);
  console.log(`Found ${cats?.length || 0} categories to update`);
  for (const item of (cats || [])) {
    await supabase.from('pos_categories').update({ image_url: item.image_url.replace(oldUrl, newUrl) }).eq('id', item.id);
  }

  // plant_library_variants
  const { data: plants } = await supabase.from('plant_library_variants').select('id, image_url').like('image_url', `${oldUrl}%`);
  console.log(`Found ${plants?.length || 0} plants to update`);
  for (const item of (plants || [])) {
    await supabase.from('plant_library_variants').update({ image_url: item.image_url.replace(oldUrl, newUrl) }).eq('id', item.id);
  }
  
  console.log('Done');
}
run();
