import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
    });
    
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, compensationType } = await req.json();

    if (!profileId || !compensationType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify requesting user is admin
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (requesterProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the profile
    const { error } = await supabase
      .from('profiles')
      .update({ holiday_compensation_type: compensationType })
      .eq('id', profileId);

    if (error) {
      console.error('Failed to update compensation type:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in update-compensation-type:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
