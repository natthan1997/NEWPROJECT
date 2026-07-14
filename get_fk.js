const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// We can't query information_schema from REST API directly unless exposed.
// Let's use the RPC we have or just do it via fetching from an API.
