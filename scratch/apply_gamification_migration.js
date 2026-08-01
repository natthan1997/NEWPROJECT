import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = fs.readFileSync('./migrations/20260725211200_add_gamification_and_gacha_tables.sql', 'utf-8')

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
