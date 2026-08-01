import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: progress } = await supabase
      .from('member_mission_progress')
      .select('*')
      .eq('member_id', "859b759b-8400-4d91-ad64-4884158d896c")
      .eq('mission_id', "0e405a68-61ed-4913-a822-f21bf9f0fc79");
  console.log("DB progress:", JSON.stringify(progress, null, 2))
}
run()
