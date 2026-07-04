const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
); // I need admin key for SQL execution if I use RPC? No, I can't execute arbitrary SQL without postgres admin, wait.
