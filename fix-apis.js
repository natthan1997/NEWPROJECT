const fs = require('fs');
const files = [
    'app/api/staff/update-compensation-type/route.ts',
    'app/api/staff/use-holiday/route.ts',
    'app/api/staff/accrue-holiday/route.ts',
    'app/api/staff/manual-approve-holiday/route.ts'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(
            "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';",
            "import { createClient } from '@supabase/supabase-js';"
        );
        content = content.replace(
            "const supabase = createRouteHandlerClient({ cookies });",
            `const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
    });`
        );
        // Remove import { cookies }
        content = content.replace("import { cookies } from 'next/headers';\n", "");
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
}
