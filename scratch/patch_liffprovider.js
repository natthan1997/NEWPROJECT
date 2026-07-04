import fs from 'fs';

const filePath = 'components/liff/LiffProvider.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We need to replace the block that fetches memberData with a call to the new API.
// In LiffProvider.tsx, inside initLiff:
//          const { data: memberData } = await supabase
//            .from('pos_members')
//            .select('phone, address, full_name, display_name, avatar_url, points, member_tier')
//            .eq('line_user_id', profile.userId)
//            .maybeSingle();
//
// We will replace it with:
//          const res = await fetch('/api/liff/member/init', {
//            method: 'POST', headers: { 'Content-Type': 'application/json' },
//            body: JSON.stringify({ lineUserId: profile.userId, displayName: profile.displayName, avatarUrl: profile.pictureUrl })
//          });
//          const json = await res.json();
//          const memberData = json.member;

content = content.replace(
  /const { data: memberData } = await supabase\s*\n\s*\.from\('pos_members'\)\s*\n\s*\.select\('phone, address, full_name, display_name, avatar_url, points, member_tier'\)\s*\n\s*\.eq\('line_user_id', profile\.userId\)\s*\n\s*\.maybeSingle\(\);/g,
  `const res = await fetch('/api/liff/member/init', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId: profile.userId, displayName: profile.displayName, avatarUrl: profile.pictureUrl })
          });
          const json = await res.json();
          const memberData = json.member;`
);

fs.writeFileSync(filePath, content);
console.log('Patched LiffProvider.tsx');
