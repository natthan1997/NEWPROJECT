import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET all gacha pool items
export async function GET() {
  try {
    const { data: pool, error } = await supabase
      .from('gacha_rewards_pool')
      .select('*')
      .order('rarity_tier', { ascending: false })
      .order('probability_weight', { ascending: false });

    if (error) throw error;
    
    // Calculate total weight to give the frontend an idea of the drop rates
    const totalWeight = (pool || []).reduce((sum, item) => sum + (item.is_active ? (item.probability_weight || 0) : 0), 0);

    const poolWithRates = (pool || []).map(item => ({
        ...item,
        drop_rate_percentage: totalWeight > 0 && item.is_active ? Number(((item.probability_weight || 0) / totalWeight * 100).toFixed(2)) : 0
    }));

    return NextResponse.json({ success: true, pool: poolWithRates });
  } catch (error: any) {
    console.error('Error fetching gacha pool:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST a new gacha pool item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate inputs
    if (!body.name || !body.rarity_tier || body.probability_weight === undefined || !body.reward_type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const payload = {
      name: body.name,
      description: body.description || null,
      rarity_tier: body.rarity_tier,
      probability_weight: Number(body.probability_weight),
      reward_type: body.reward_type,
      value_points: Number(body.value_points) || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
      max_quantity: body.max_quantity || null,
      current_quantity: 0, 
    };

    const { data, error } = await supabase
      .from('gacha_rewards_pool')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error: any) {
    console.error('Error creating gacha pool item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT to update an existing item
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const payload = {
      name: body.name,
      description: body.description || null,
      rarity_tier: body.rarity_tier,
      probability_weight: Number(body.probability_weight),
      reward_type: body.reward_type,
      value_points: Number(body.value_points) || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
      max_quantity: body.max_quantity || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('gacha_rewards_pool')
      .update(payload)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error: any) {
    console.error('Error updating gacha pool item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE an item
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('gacha_rewards_pool')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting gacha pool item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
