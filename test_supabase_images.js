const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');

// Load env variables manually since dotenv might not be in dependencies
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImages() {
  console.log('Fetching active menu items from Supabase...');
  const { data, error } = await supabase
    .from('pos_menu_items')
    .select('id, name, image_url')
    .eq('is_active', true)
    .limit(10);

  if (error) {
    console.error('Error fetching from Supabase:', error);
    process.exit(1);
  }

  console.log(`Found ${data.length} active menu items. Testing URLs...`);

  for (const item of data) {
    if (!item.image_url) {
      console.log(`Item: ${item.name} - No image_url`);
      continue;
    }

    console.log(`\nTesting Item: ${item.name}`);
    console.log(`URL: ${item.image_url}`);

    await new Promise((resolve) => {
      // Test without Origin
      https.get(item.image_url, (res) => {
        console.log(`  Normal GET Status: ${res.statusCode}`);
        console.log(`  Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NONE'}`);
        
        // Test with Origin
        const reqOpts = {
          headers: {
            'Origin': 'https://xylstudio.com'
          }
        };
        https.get(item.image_url, reqOpts, (corsRes) => {
          console.log(`  CORS GET Status: ${corsRes.statusCode}`);
          console.log(`  CORS Access-Control-Allow-Origin: ${corsRes.headers['access-control-allow-origin'] || 'NONE'}`);
          resolve();
        }).on('error', (e) => {
          console.log(`  CORS GET Error: ${e.message}`);
          resolve();
        });
      }).on('error', (e) => {
        console.log(`  Normal GET Error: ${e.message}`);
        resolve();
      });
    });
  }
}

testImages();
