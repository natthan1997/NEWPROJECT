async function test() {
  const fetch = require('node-fetch'); // Use global fetch in Node 18+
  
  // First we need a token
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config({ path: '.env.local' });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const token = 'test-prod-' + Date.now();
  await supabase.from('pos_qr_reward_tokens').insert({
      token,
      points: 2,
      order_id: '3d43036f-6e54-4b17-8ea1-65e8ae2aaace',
  });
  
  console.log('Created token:', token);
  
  const res = await global.fetch('https://xylstudio.com/api/liff/points/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          token: token,
          lineUserId: 'U5dc61bfebbeea5efed07f0847ff92371',
      })
  });
  
  const text = await res.text();
  console.log('Prod API Response:', text);
}
test();
