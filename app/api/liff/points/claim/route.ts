import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const createSupabaseServiceClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { token, lineUserId, displayName, avatarUrl, phone, firstName, lastName, fullName, dateOfBirth, gender, pdpaConsent } = body

        if (!token || !lineUserId) {
            return NextResponse.json({ error: 'Missing token or lineUserId' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()
        
        // 1. Get token info
        const { data: tokenInfo, error: tokenError } = await supabase
            .from('pos_qr_reward_tokens')
            .select('*')
            .eq('token', token)
            .maybeSingle()

        if (tokenError) {
            console.error('Error fetching token:', tokenError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!tokenInfo) {
            return NextResponse.json({ error: 'Token ไม่ถูกต้อง หรือถูกใช้งานไปแล้ว' }, { status: 400 })
        }

        const merchantId = tokenInfo.merchant_id || '00000000-0000-0000-0000-000000000000';

        if (tokenInfo.is_used && tokenInfo.claimed_by === lineUserId) {
            return NextResponse.json({ error: 'คุณได้รับคะแนนสำหรับออเดอร์นี้ไปแล้ว' }, { status: 400 })
        }

        if (tokenInfo.is_used) {
            return NextResponse.json({ error: 'QR Code นี้ถูกใช้งานไปแล้ว' }, { status: 400 })
        }

        // 2. Ensure member exists
        let { data: member, error: memberError } = await supabase
            .from('pos_members')
            .select('*')
            .eq('line_user_id', lineUserId)
            .eq('merchant_id', merchantId)
            .maybeSingle()
            
        // Check by phone if lineUserId not found, in case they registered at POS
        if (!member && phone) {
            const { data: memberByPhone } = await supabase
               .from('pos_members')
               .select('*')
               .eq('phone', phone)
               .eq('merchant_id', merchantId)
               .maybeSingle()
               
            if (memberByPhone) {
                // Link line account
                await supabase.from('pos_members').update({
                    line_user_id: lineUserId,
                    display_name: memberByPhone.display_name || displayName,
                    avatar_url: memberByPhone.avatar_url || avatarUrl,
                    first_name: memberByPhone.first_name || firstName || undefined,
                    last_name: memberByPhone.last_name || lastName || undefined,
                    full_name: memberByPhone.full_name || fullName || `${firstName} ${lastName}`.trim() || undefined,
                    date_of_birth: memberByPhone.date_of_birth || dateOfBirth || undefined,
                    gender: memberByPhone.gender || gender || undefined,
                    pdpa_consent: pdpaConsent !== undefined ? pdpaConsent : memberByPhone.pdpa_consent
                }).eq('id', memberByPhone.id)
                member = memberByPhone
            }
        }
        
        if (!member || !member.phone || !member.pdpa_consent) {
            if (!phone || pdpaConsent === undefined) {
                if (tokenInfo.order_id && (member || lineUserId)) {
                    try {
                        await supabase
                            .from('pos_member_checkins')
                            .update({ status: 'cancelled' })
                            .eq('line_user_id', lineUserId)
                            .eq('status', 'pending');

                        await supabase.from('pos_member_checkins').insert({
                            line_user_id: lineUserId,
                            member_id: member?.id || lineUserId,
                            customer_name: member?.full_name || member?.first_name || member?.display_name || displayName || 'สมาชิกใหม่',
                            customer_image: member?.avatar_url || avatarUrl || null,
                            status: 'linked',
                            order_id: tokenInfo.order_id
                        });
                    } catch(e) {
                        console.error('Insert pending checkin error:', e);
                    }
                }

                return NextResponse.json({ 
                    success: false, 
                    requirePhone: true, 
                    message: 'Please complete your registration to claim points',
                    currentPhone: member?.phone || '',
                    currentFirstName: member?.first_name || '',
                    currentLastName: member?.last_name || '',
                    currentDob: member?.date_of_birth || '',
                    currentGender: member?.gender || '',
                    currentPdpaConsent: member?.pdpa_consent || false
                })
            }
        }

        if (!member) {
            const { data: newMember } = await supabase.from('pos_members').insert({
                line_user_id: lineUserId,
                phone: phone,
                first_name: firstName,
                last_name: lastName,
                full_name: fullName || `${firstName} ${lastName}`.trim(),
                display_name: displayName,
                avatar_url: avatarUrl,
                date_of_birth: dateOfBirth || null,
                gender: gender || null,
                pdpa_consent: pdpaConsent,
                points: 0,
                merchant_id: merchantId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).select().single()
            member = newMember
        } else {
            // Member exists, but might need to update phone or profile
            const updates: any = {};
            let needsUpdate = false;
            
            if (!member.phone && phone) {
                updates.phone = phone;
                needsUpdate = true;
            }
            if (!member.display_name && displayName) {
                updates.display_name = displayName;
                needsUpdate = true;
            }
            if (!member.avatar_url && avatarUrl) {
                updates.avatar_url = avatarUrl;
                needsUpdate = true;
            }
            if (!member.first_name && firstName) {
                updates.first_name = firstName;
                needsUpdate = true;
            }
            if (!member.last_name && lastName) {
                updates.last_name = lastName;
                needsUpdate = true;
            }
            if (!member.full_name && fullName) {
                updates.full_name = fullName;
                needsUpdate = true;
            }
            if (!member.date_of_birth && dateOfBirth) {
                updates.date_of_birth = dateOfBirth;
                needsUpdate = true;
            }
            if (!member.gender && gender) {
                updates.gender = gender;
                needsUpdate = true;
            }
            if (member.pdpa_consent === false && pdpaConsent === true) {
                updates.pdpa_consent = true;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                updates.updated_at = new Date().toISOString();
                
                const { error: updateErr } = await supabase.from('pos_members').update(updates).eq('id', member.id);
                if (updateErr) {
                    console.error('Update Member Profile Error:', updateErr);
                } else {
                    member = { ...member, ...updates };
                }
            }
        }

        // 2.5 Check if order is pending payment (scanned before cashier checkout)
        if (tokenInfo.order_id) {
            const { data: order } = await supabase
                .from('pos_orders')
                .select('id, status, paid_at, total_amount, points_earned')
                .eq('id', tokenInfo.order_id)
                .maybeSingle();

            const isOrderPaid = order && (
                order.paid_at !== null ||
                order.status === 'completed' || 
                order.status === 'paid'
            );

            if (!order || !isOrderPaid) {
                // Link customer to POS terminal via check-ins
                if (member) {
                    const memberName = member.full_name || member.first_name || member.display_name || 'สมาชิก';
                    
                    try {
                        // Find and delete any existing pending check-ins for this user
                        await supabase
                            .from('pos_member_checkins')
                            .update({ status: 'cancelled' })
                            .eq('line_user_id', lineUserId)
                            .eq('status', 'pending');
                            
                        await supabase.from('pos_member_checkins').insert({
                            line_user_id: lineUserId,
                            member_id: member.id,
                            customer_name: memberName,
                            customer_image: member.avatar_url || avatarUrl || null,
                            status: 'linked',
                            order_id: tokenInfo.order_id
                        });
                    } catch(e) {
                        console.error('Insert checkin error:', e);
                    }

                    // Update actual order if it exists
                    if (order) {
                        await supabase.from('pos_orders').update({
                            customer_id: member.id,
                            customer_name: memberName,
                            points_earned: tokenInfo.points
                        }).eq('id', order.id);
                    }

                    // Record pending point transaction in history if order exists
                    if (order) {
                        try {
                            const historyPayload: any = {
                                member_id: member.id,
                                order_id: tokenInfo.order_id,
                                points: tokenInfo.points,
                                points_change: tokenInfo.points,
                                type: 'earn',
                                status: 'pending',
                                description: 'สะสมพอยท์ (รอชำระเงิน)',
                                merchant_id: merchantId,
                                created_at: new Date().toISOString()
                            };

                            const { error: hErr } = await supabase.from('pos_points_history').upsert(historyPayload, {
                                onConflict: 'order_id'
                            });

                            if (hErr && (hErr.message.includes('column "status"') || hErr.message.includes('column "order_id"'))) {
                                delete historyPayload.order_id;
                                await supabase.from('pos_points_history').insert(historyPayload);
                            }
                        } catch (historyErr) {
                            console.error('Pending history record error:', historyErr);
                        }
                    }
                }

                // Fetch order items for display in the animation overlay
                let orderItems: any[] = [];
                let { data: items, error: itemsErr } = await supabase
                    .from('pos_order_items')
                    .select('*, item:pos_menu_items!item_id(name)')
                    .eq('order_id', tokenInfo.order_id);

                if (itemsErr || !items) {
                    const { data: fallbackItems } = await supabase
                        .from('pos_order_items')
                        .select('*')
                        .eq('order_id', tokenInfo.order_id);
                    items = fallbackItems;
                }

                if (items) {
                    orderItems = items
                      .filter((i: any) => i.status !== 'cancelled' && i.status !== 'void' && i.status !== 'refunded')
                      .map((i: any) => ({
                        ...i,
                        item_name: i.item?.name || i.name || i.item_name || 'สินค้า'
                      }));
                }

                return NextResponse.json({
                    success: false,
                    isPendingPayment: true,
                    pointsPending: tokenInfo.points,
                    orderItems,
                    message: 'คุณจะได้รับคะแนนสะสมหลังจากชำระเงินเรียบร้อยแล้ว'
                });
            }
        }

        // 3. Mark token as used (Atomic-ish)
        const { error: updateTokenError } = await supabase
            .from('pos_qr_reward_tokens')
            .update({
                is_used: true,
                claimed_by: lineUserId,
                claimed_at: new Date().toISOString()
            })
            .eq('id', tokenInfo.id)
            .eq('is_used', false)

        if (updateTokenError) {
            return NextResponse.json({ error: 'ไม่สามารถระบุการใช้งาน Token ได้' }, { status: 400 })
        }

        // 3.5 Update pos_orders with customer info & points earned if linked to an order
        // Only if it hasn't been awarded by the POS already
        let shouldAwardPoints = true;
        let finalOrderNumber = null;
        if (tokenInfo.order_id) {
            const { data: existingOrderInfo } = await supabase
                .from('pos_orders')
                .select('points_earned, customer_id, order_number')
                .eq('id', tokenInfo.order_id)
                .maybeSingle();
                
            if (existingOrderInfo) {
                finalOrderNumber = existingOrderInfo.order_number;
            }
                
            if (existingOrderInfo && existingOrderInfo.points_earned > 0 && existingOrderInfo.customer_id) {
                shouldAwardPoints = false; // Points were already awarded during POS checkout
            } else {
                const memberName = member?.full_name || member?.first_name || member?.display_name || 'สมาชิก';
                await supabase
                    .from('pos_orders')
                    .update({
                        customer_id: member?.id || undefined,
                        customer_name: memberName,
                        points_earned: tokenInfo.points,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', tokenInfo.order_id);
            }
        }

        // 4. Increment member points (Only if not already awarded by POS checkout)
        if (shouldAwardPoints) {
            const { error: pointError } = await supabase.rpc('increment_member_points', { 
                user_id: lineUserId, 
                points_to_add: tokenInfo.points 
            })

            if (pointError) {
                // Fallback if RPC fails
                await supabase.from('pos_members')
                    .update({ 
                        points: (member?.points || 0) + tokenInfo.points,
                        updated_at: new Date().toISOString()
                    })
                    .eq('line_user_id', lineUserId)
            }
        }

        // 5. Record in history (Safely attempt to include description)
        if (shouldAwardPoints) {
            try {
                const historyObj: any = {
                    member_id: member?.id || lineUserId,
                    points: tokenInfo.points,
                    points_change: tokenInfo.points,
                    type: 'earn',
                    merchant_id: merchantId,
                    created_at: new Date().toISOString()
                }
                
                const descStr = finalOrderNumber 
                    ? `Claimed via QR Code (Order #${finalOrderNumber})`
                    : 'Claimed via QR Code';

                // We try to include description; if it fails due to missing column, we'll catch it
                const { error: historyError } = await supabase.from('pos_points_history').insert({
                    ...historyObj,
                    description: descStr
                })

                if (historyError && historyError.message.includes('column "description" of relation "pos_points_history" does not exist')) {
                    // Retry without description column
                    await supabase.from('pos_points_history').insert(historyObj)
                }
            } catch (hErr) {
                console.error('History record error (non-fatal):', hErr)
            }
        }
        let orderItems = [];
        if (tokenInfo.order_id) {
            let { data: items, error: itemsError } = await supabase
                .from('pos_order_items')
                .select('*, item:pos_menu_items!item_id(name)')
                .eq('order_id', tokenInfo.order_id);
            
            if (itemsError || !items) {
                const { data: fallbackItems } = await supabase
                    .from('pos_order_items')
                    .select('*')
                    .eq('order_id', tokenInfo.order_id);
                items = fallbackItems;
            }
            
            if (items) {
                orderItems = items
                  .filter((i: any) => i.status !== 'cancelled' && i.status !== 'void' && i.status !== 'refunded')
                  .map((i: any) => ({
                    ...i,
                    item_name: i.item?.name || i.name || i.item_name || 'สินค้า'
                  }));
            }
            
            // --- Gamification Retroactive Trigger ---
            if (member?.id || lineUserId) {
                const targetMemberId = member?.id || lineUserId;
                const gamificationUrl = new URL('/api/gamification/evaluate', req.url).toString();
                fetch(gamificationUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: tokenInfo.order_id,
                        member_id: targetMemberId
                    })
                }).catch(err => console.error('LIFF gamification eval error:', err));
            }
        }

        return NextResponse.json({ 
            success: true, 
            pointsAdded: tokenInfo.points,
            orderItems,
            message: `Successfully claimed ${tokenInfo.points} points!`
        })
    } catch (error) {
        console.error('POST /api/liff/points/claim error', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
