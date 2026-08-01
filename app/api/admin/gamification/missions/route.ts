import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: missions, error } = await supabase
      .from('gamification_missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, missions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // In a real app we should check if user is admin here
    
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin capability
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    const { data, error } = await supabase
      .from('gamification_missions')
      .insert({
        title: body.title,
        description: body.description,
        condition_rules: body.condition_rules || {},
        reward_tickets: body.reward_tickets || 1,
        is_active: body.is_active ?? true,
        campaign_type: body.campaign_type || 'weekly',
        start_date: body.start_date || null,
        end_date: body.end_date || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, mission: data });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) throw new Error('ID is required');

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data, error } = await supabase
      .from('gamification_missions')
      .update({
        title: body.title,
        description: body.description,
        condition_rules: body.condition_rules,
        reward_tickets: body.reward_tickets,
        is_active: body.is_active,
        campaign_type: body.campaign_type,
        start_date: body.start_date,
        end_date: body.end_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, mission: data });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID is required');

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
      }
    );

    const { error } = await supabase
      .from('gamification_missions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
