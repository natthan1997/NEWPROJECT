import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: missions } = await supabase
      .from('gamification_missions')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.gt.${new Date().toISOString()},end_date.is.null`);
  console.log(JSON.stringify(missions, null, 2))
}
run()
