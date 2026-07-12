const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
const { cookies } = require('next/headers')
process.env.NEXT_PUBLIC_SUPABASE_URL = ''
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
try {
  createRouteHandlerClient({ cookies })
} catch (e) {
  console.log("Error:", e.message)
}
