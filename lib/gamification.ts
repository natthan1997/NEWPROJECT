import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getResetBoundary(campaignType: string): Date {
    const nowStr = new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"});
    const bkkNow = new Date(nowStr);
    
    if (campaignType === 'daily') {
       const y = bkkNow.getFullYear();
       const m = String(bkkNow.getMonth() + 1).padStart(2, '0');
       const d = String(bkkNow.getDate()).padStart(2, '0');
       return new Date(`${y}-${m}-${d}T00:00:00+07:00`);
    } else if (campaignType === 'weekly') {
       const day = bkkNow.getDay();
       const diff = bkkNow.getDate() - day + (day === 0 ? -6 : 1);
       const monday = new Date(bkkNow.setDate(diff));
       const y = monday.getFullYear();
       const m = String(monday.getMonth() + 1).padStart(2, '0');
       const d = String(monday.getDate()).padStart(2, '0');
       return new Date(`${y}-${m}-${d}T00:00:00+07:00`);
    } else if (campaignType === 'monthly') {
       const y = bkkNow.getFullYear();
       const m = String(bkkNow.getMonth() + 1).padStart(2, '0');
       return new Date(`${y}-${m}-01T00:00:00+07:00`);
    }
    
    return new Date(0);
}

export async function evaluateOrderMissions(order_id: string, member_id: string) {
    if (!order_id || !member_id) return { success: false, error: 'Missing params' };

    const { data: order, error: orderError } = await supabase
      .from('pos_orders')
      .select('net_total, created_at, id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) return { success: false, error: 'Order not found' };

    const orderDate = new Date(order.created_at);
    const timeString = orderDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour12: false, hour: '2-digit', minute: '2-digit' });

    const { data: orderItems } = await supabase
      .from('pos_order_items')
      .select('quantity, item:item_id(category_id, category:category_id(name))')
      .eq('order_id', order_id);

    const { data: missions, error: missionsError } = await supabase
      .from('gamification_missions')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.gt.${new Date().toISOString()},end_date.is.null`);

    if (missionsError || !missions || missions.length === 0) return { success: true, evaluated: 0 };

    const { data: progresses, error: progressError } = await supabase
      .from('member_mission_progress')
      .select('*')
      .eq('member_id', member_id)
      .in('mission_id', missions.map((m: any) => m.id));

    const progressMap = new Map((progresses || []).map((p: any) => [p.mission_id, p]));

    let evaluatedCount = 0;

    for (const mission of missions) {
      const rules = mission.condition_rules || {};
      let currentProgressRow = progressMap.get(mission.id);
      
      const resetBoundary = getResetBoundary(mission.campaign_type || 'weekly');

      if (currentProgressRow) {
         const progressTime = new Date(currentProgressRow.updated_at || currentProgressRow.created_at);
         if (progressTime < resetBoundary) {
             currentProgressRow = {
                 ...currentProgressRow,
                 progress_data: {},
                 is_completed: false,
                 claimed_at: null
             };
         }
      }

      if (currentProgressRow?.is_completed) continue;

      let isConditionMet = false;

      if (rules.type === 'time_bound') {
        const startTime = rules.start_time || '00:00';
        const endTime = rules.end_time || '23:59';
        const minSpend = rules.min_spend || 0;

        if (timeString >= startTime && timeString <= endTime && order.net_total >= minSpend) {
          isConditionMet = true;
        }
      }

      let incrementBy = 1;
      if (rules.type === 'order_item') {
         if (orderItems && rules.category) {
            let matchedQuantity = 0;
            for (const orderItem of orderItems) {
               const categoryName = (orderItem as any).item?.category?.name;
               if (categoryName && categoryName.toLowerCase() === rules.category.toLowerCase()) {
                  matchedQuantity += orderItem.quantity || 1;
               }
            }
            if (matchedQuantity > 0) {
               isConditionMet = true;
               incrementBy = matchedQuantity;
            }
         }
      }

      if (isConditionMet) {
        evaluatedCount++;
        const targetCount = rules.count || 1;
        
        let newProgressCount = incrementBy;
        let progressData = { count: incrementBy };
        let progressId = currentProgressRow?.id;

        if (currentProgressRow) {
          newProgressCount = (currentProgressRow.progress_data?.count || 0) + incrementBy;
          progressData = { ...currentProgressRow.progress_data, count: newProgressCount };
        }

        const isCompleted = newProgressCount >= targetCount;
        let claimedAt = null;

        if (isCompleted) {
           claimedAt = new Date().toISOString();
           // Grant reward automatically
           const { data: member } = await supabase
              .from('pos_members')
              .select('gacha_tickets')
              .eq('id', member_id)
              .single();
              
           if (member) {
              const currentTickets = member.gacha_tickets || 0;
              const newTickets = currentTickets + (mission.reward_tickets || 1);
              await supabase
                  .from('pos_members')
                  .update({ gacha_tickets: newTickets })
                  .eq('id', member_id);
           }
        }

        if (currentProgressRow && currentProgressRow.id) {
          await supabase
            .from('member_mission_progress')
            .update({
              progress_data: progressData,
              is_completed: isCompleted,
              claimed_at: claimedAt,
              updated_at: new Date().toISOString()
            })
            .eq('id', progressId);
        } else {
          await supabase
            .from('member_mission_progress')
            .insert({
              member_id: member_id,
              mission_id: mission.id,
              progress_data: progressData,
              is_completed: isCompleted,
              claimed_at: claimedAt
            });
        }
      }
    }

    return { success: true, evaluated: evaluatedCount };
}
