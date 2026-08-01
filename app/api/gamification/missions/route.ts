import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const createSupabaseServiceClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, serviceRoleKey)
}

function getResetBoundary(campaignType: string): Date {
    // Get current time in Bangkok timezone
    const nowStr = new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"});
    const bkkNow = new Date(nowStr);
    
    if (campaignType === 'daily') {
       const y = bkkNow.getFullYear();
       const m = String(bkkNow.getMonth() + 1).padStart(2, '0');
       const d = String(bkkNow.getDate()).padStart(2, '0');
       return new Date(`${y}-${m}-${d}T00:00:00+07:00`);
    } else if (campaignType === 'weekly') {
       const day = bkkNow.getDay(); // 0 is Sunday
       const diff = bkkNow.getDate() - day + (day === 0 ? -6 : 1); // Monday
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
    
    return new Date(0); // Epoch for 'special' or unknown
}

export async function GET(req: NextRequest) {
    try {
        const memberId = req.nextUrl.searchParams.get('memberId')
        
        const supabase = createSupabaseServiceClient()

        // Fetch active missions
        const { data: missions, error: missionsError } = await supabase
            .from('gamification_missions')
            .select('*')
            .eq('is_active', true)
        
        if (missionsError) {
            console.error('Fetch missions error:', missionsError)
            return NextResponse.json({ error: missionsError.message }, { status: 500 })
        }

        let progresses: any[] = []

        if (memberId) {
            // Fetch progress for this member
            const { data: prog, error: progError } = await supabase
                .from('member_mission_progress')
                .select('*')
                .eq('member_id', memberId)
            
            if (progError) {
                console.error('Fetch progress error:', progError)
                // non-fatal, continue without progress
            } else {
                progresses = prog || []
            }
        }

        // Map progress to missions
        const result = (missions || []).map(mission => {
            let prog = progresses.find(p => p.mission_id === mission.id)
            const resetBoundary = getResetBoundary(mission.campaign_type || 'weekly');
            
            // Check if progress is expired based on updated_at or created_at
            if (prog) {
               const progressTime = new Date(prog.updated_at || prog.created_at);
               if (progressTime < resetBoundary) {
                  // Expired, treat as empty for the frontend
                  prog = null;
               }
            }

            return {
                ...mission,
                progress: prog ? prog.progress_data : {},
                is_completed: prog ? prog.is_completed : false,
                claimed_at: prog ? prog.claimed_at : null
            }
        })

        return NextResponse.json({
            success: true,
            missions: result
        })

    } catch (err: any) {
        console.error('Gamification Missions Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
