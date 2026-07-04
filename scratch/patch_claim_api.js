const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/liff/points/claim/route.ts');
let code = fs.readFileSync(filePath, 'utf8');

// Update API to require phone for new members
const target = `        // 2. Ensure member exists
        const { data: member, error: memberError } = await supabase
            .from('pos_members')
            .select('*')
            .eq('line_user_id', lineUserId)
            .maybeSingle()
        
        if (!member) {
            await supabase.from('pos_members').insert({
                line_user_id: lineUserId,
                display_name: displayName,
                avatar_url: avatarUrl,
                points: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        } else {`;

const replacement = `        // 2. Ensure member exists
        let { data: member, error: memberError } = await supabase
            .from('pos_members')
            .select('*')
            .eq('line_user_id', lineUserId)
            .maybeSingle()
            
        // Check by phone if lineUserId not found, in case they registered at POS
        if (!member && body.phone) {
            const { data: memberByPhone } = await supabase
               .from('pos_members')
               .select('*')
               .eq('phone', body.phone)
               .maybeSingle()
               
            if (memberByPhone) {
                // Link line account
                await supabase.from('pos_members').update({
                    line_user_id: lineUserId,
                    display_name: memberByPhone.display_name || displayName,
                    avatar_url: memberByPhone.avatar_url || avatarUrl
                }).eq('id', memberByPhone.id)
                member = memberByPhone
            }
        }
        
        if (!member) {
            if (!body.phone) {
                return NextResponse.json({ 
                    success: false, 
                    requirePhone: true, 
                    message: 'Please register with your phone number' 
                })
            }
        
            const { data: newMember } = await supabase.from('pos_members').insert({
                line_user_id: lineUserId,
                phone: body.phone,
                display_name: displayName,
                avatar_url: avatarUrl,
                points: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).select().single()
            member = newMember
        } else {`;

code = code.replace(target, replacement);
fs.writeFileSync(filePath, code);
