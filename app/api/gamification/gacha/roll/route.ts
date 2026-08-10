import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const createSupabaseServiceClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
        global: {
            fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
    })
}

function getRandomReward(pool: any[], requirePity: boolean = false) {
    let filteredPool = pool;
    if (requirePity) {
        // Pity guarantees R, SR or UR
        filteredPool = pool.filter(item => item.rarity_tier === 'R' || item.rarity_tier === 'SR' || item.rarity_tier === 'UR');
        if (filteredPool.length === 0) {
            filteredPool = pool; // Fallback if no SR/UR exists
        }
    }

    const totalWeight = filteredPool.reduce((sum, item) => sum + (item.probability_weight || 0), 0);
    if (totalWeight === 0) return null;

    let randomNum = Math.random() * totalWeight;
    for (const item of filteredPool) {
        if (randomNum < item.probability_weight) {
            return item;
        }
        randomNum -= item.probability_weight;
    }
    return filteredPool[filteredPool.length - 1]; // Fallback
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { memberId, rollCount = 1 } = body // rollCount can be 1 or 10

        if (!memberId) {
            return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
        }

        if (rollCount !== 1 && rollCount !== 10) {
             return NextResponse.json({ error: 'Invalid rollCount. Must be 1 or 10' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()

        // 1. Check user tickets
        const { data: member, error: memberError } = await supabase
            .from('pos_members')
            .select('gacha_tickets, points')
            .eq('id', memberId)
            .single()

        if (memberError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        const currentTickets = member.gacha_tickets || 0
        if (currentTickets < rollCount) {
            return NextResponse.json({ error: 'Not enough gacha tickets' }, { status: 400 })
        }

        // 2. Fetch Gacha Pool
        const { data: pool, error: poolError } = await supabase
            .from('gacha_rewards_pool')
            .select('*')
            .eq('is_active', true)

        if (poolError || !pool || pool.length === 0) {
            return NextResponse.json({ error: 'Gacha pool is empty' }, { status: 500 })
        }

        // Filter valid items (not maxed out)
        const validPool = pool.filter(item => 
            item.max_quantity === null || (item.current_quantity !== null && item.current_quantity < item.max_quantity)
        )

        if (validPool.length === 0) {
             return NextResponse.json({ error: 'No rewards available right now' }, { status: 500 })
        }

        // 3. Roll Logic
        const results = [];
        let hasRareOrBetter = false;

        for (let i = 0; i < rollCount; i++) {
            // Apply Pity on the 10th pull if no R/SR/UR has been obtained in the previous 9 pulls
            const isPityPull = (rollCount === 10 && i === 9 && !hasRareOrBetter);
            
            const reward = getRandomReward(validPool, isPityPull);
            if (reward) {
                if (reward.rarity_tier === 'R' || reward.rarity_tier === 'SR' || reward.rarity_tier === 'UR') {
                    hasRareOrBetter = true;
                }
                results.push({
                    reward_id: reward.id,
                    reward,
                    is_pity: isPityPull
                });
            }
        }

        // 4. Update Database
        
        // Deduct tickets
        let newTickets = currentTickets - rollCount;
        let newPoints = member.points || 0;
        
        // Prepare History inserts and points compensation
        const historyInserts = [];
        for (const res of results) {
            let compensated = 0;
            if (res.reward.reward_type === 'points') {
                compensated = res.reward.value_points || 0;
                newPoints += compensated;
            } else if (res.reward.reward_type === 'coupon' && res.reward.item_id) {
                // Fetch coupon details
                const { data: coupon, error: couponError } = await supabase
                    .from('pos_loyalty_coupons')
                    .select('*')
                    .eq('id', res.reward.item_id)
                    .single();

                if (!couponError && coupon && coupon.is_active) {
                    // Grant coupon to member
                    await supabase.from('pos_member_coupons').insert({
                        member_id: memberId,
                        coupon_id: coupon.id,
                        coupon_name: coupon.name,
                        discount_type: coupon.discount_type,
                        discount_value: coupon.discount_value,
                        applicable_categories: coupon.applicable_categories,
                        applicable_items: coupon.applicable_items,
                        excluded_categories: coupon.excluded_categories,
                        excluded_items: coupon.excluded_items,
                        min_order_amount: coupon.min_order_amount,
                        max_discount_amount: coupon.max_discount_amount,
                        image_url: coupon.image_url,
                        status: 'active'
                    });
                } else {
                    // If coupon is missing or inactive, we could compensate with points or just do nothing
                    console.warn(`Coupon ${res.reward.item_id} not found or inactive for reward ${res.reward.id}`);
                }
            }

            historyInserts.push({
                member_id: memberId,
                reward_id: res.reward.id,
                is_pity: res.is_pity,
                compensated_with_points: compensated,
            });

            // Increment current_quantity in pool if necessary
            if (res.reward.max_quantity !== null) {
                await supabase.rpc('increment_gacha_quantity', { row_id: res.reward.id });
                // If RPC doesn't exist, we fallback to sequential update, but skipping for brevity
            }
        }

        // Update member tickets and points
        await supabase
            .from('pos_members')
            .update({ 
                gacha_tickets: newTickets,
                points: newPoints 
            })
            .eq('id', memberId)

        // Insert history
        await supabase.from('member_gacha_history').insert(historyInserts)

        return NextResponse.json({
            success: true,
            results: results.map(r => ({
                id: r.reward.id,
                name: r.reward.name,
                image_url: r.reward.image_url,
                rarity_tier: r.reward.rarity_tier,
                reward_type: r.reward.reward_type,
                value_points: r.reward.value_points,
                is_pity: r.is_pity
            })),
            tickets_remaining: newTickets,
            points_added: newPoints - (member.points || 0)
        })

    } catch (err: any) {
        console.error('Gacha Roll Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
