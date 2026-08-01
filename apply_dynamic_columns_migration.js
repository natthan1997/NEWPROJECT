const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const { createClient } = require(path.join(process.cwd(), 'node_modules', '@supabase/supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const migrationPath = path.join(__dirname, 'migrations', '20260725000000_add_dynamic_recipe_and_scaling_columns.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log("Applying Migration SQL via exec_sql RPC...");

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Migration failed via exec_sql:", error);
  } else {
    console.log("Migration executed successfully via exec_sql:", data);
  }
}

applyMigration();
