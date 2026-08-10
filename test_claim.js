const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testClaim() {
  const lineUserId = 'U5dc61bfebbeea5efed07f0847ff92371';
  
  // 1. Check member logic exactly as in route.ts
  const { data: member } = await supabase
      .from('pos_members')
      .select('*')
      .eq('line_user_id', lineUserId)
      .maybeSingle();
      
  console.log('Member:', member);
  
  const pdpaConsent = undefined;
  const phone = undefined;
  
  if (!member || !member.phone || !member.pdpa_consent) {
      if (!phone || pdpaConsent === undefined) {
          console.log('Would return requirePhone: true');
          return;
      }
  }
  
  console.log('Passed member check!');
  
  // Test generating a token and claiming it
  const token = 'test-token-' + Date.now();
  const orderId = '3d43036f-6e54-4b17-8ea1-65e8ae2aaace'; // From previous test
  
  await supabase.from('pos_qr_reward_tokens').insert({
      token,
      points: 2,
      order_id: orderId,
  });
  
  console.log('Created test token:', token);
  
  // Simulate API logic
  const { data: tokenInfo } = await supabase
      .from('pos_qr_reward_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_used', false)
      .single();
      
  if (!tokenInfo) {
      console.log('Token not found or used');
      return;
  }
  
  if (tokenInfo.order_id && (member || lineUserId)) {
      await supabase
          .from('pos_member_checkins')
          .update({ status: 'cancelled' })
          .eq('line_user_id', lineUserId)
          .eq('status', 'pending');

      await supabase.from('pos_member_checkins').insert({
          line_user_id: lineUserId,
          member_id: member?.id || lineUserId,
          customer_name: member?.full_name || member?.first_name || member?.display_name || 'สมาชิกใหม่',
          customer_image: member?.avatar_url || null,
          status: 'pending',
          order_id: tokenInfo.order_id
      });
      console.log('Inserted pending checkin!');
  }
  
  console.log('Would return isPendingPayment: true');
}
testClaim();
