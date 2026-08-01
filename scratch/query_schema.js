require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: members, count: memberCount } = await supabase.from('pos_members').select('*', { count: 'exact', head: true })
  console.log('Total members:', memberCount)

  // Check what "unregistered" means. Are there members without phone numbers?
  const { count: unregisteredCount } = await supabase.from('pos_members').select('*', { count: 'exact', head: true }).is('phone', null)
  console.log('Members without phone (unregistered?):', unregisteredCount)
  
  // Maybe there's a different table for visits?
  const { count: visitCount } = await supabase.from('pos_member_visits').select('*', { count: 'exact', head: true }).catch(() => ({ count: null }));
  console.log('Member visits table count:', visitCount);
}

run()
