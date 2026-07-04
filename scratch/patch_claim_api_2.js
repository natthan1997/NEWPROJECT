const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/liff/points/claim/route.ts');
let code = fs.readFileSync(filePath, 'utf8');

const target = `        if (!member) {
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
        } else {
            // Update profile if they scan but info was empty
            if (!member.display_name || !member.avatar_url) {
                await supabase.from('pos_members').update({
                    display_name: member.display_name || displayName,
                    avatar_url: member.avatar_url || avatarUrl,
                    updated_at: new Date().toISOString()
                }).eq('id', member.id)
            }
        }`;

const replacement = `        if (!member || !member.phone) {
            if (!body.phone) {
                return NextResponse.json({ 
                    success: false, 
                    requirePhone: true, 
                    message: 'Please enter your phone number to proceed' 
                })
            }
        }

        if (!member) {
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
        } else {
            // Member exists, but might need to update phone or profile
            const updates: any = {};
            let needsUpdate = false;
            
            if (!member.phone && body.phone) {
                updates.phone = body.phone;
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
            
            if (needsUpdate) {
                updates.updated_at = new Date().toISOString();
                
                // If adding a phone number, make sure we handle potential conflicts
                // (e.g. phone already exists). A simple update is fine; if it fails, 
                // it might be due to unique constraint, which means the phone is taken.
                const { error: updateErr } = await supabase.from('pos_members').update(updates).eq('id', member.id);
                if (updateErr) {
                    console.error('Update Member Profile Error:', updateErr);
                } else {
                    member = { ...member, ...updates };
                }
            }
        }`;

code = code.replace(target, replacement);
fs.writeFileSync(filePath, code);
