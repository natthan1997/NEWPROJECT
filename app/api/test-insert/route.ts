export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const historyObj = {
    member_id: 'test-user-id',
    points: 55,
    type: 'earn',
    description: 'Test from API with anon key'
  };
  
  const { data, error } = await supabase.from('pos_points_history').insert(historyObj);
  
  return NextResponse.json({ 
    success: !error,
    error: error
  });
}
