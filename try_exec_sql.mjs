import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim()

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
ALTER TABLE pos_loyalty_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pos_member_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
`

async function run() {
  console.log('Running SQL Migration via exec_sql...')
  const { data, error } = await supabase.rpc('exec_sql', { query: sql })
  
  if (error) {
    console.error('Error applying migration via exec_sql:', error)
  } else {
    console.log('Migration Applied Successfully!')
  }
}

run()
