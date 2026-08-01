const fs = require('fs');

function addTokenToFetch(content) {
    const tokenStr = `
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';`;

    // update-compensation-type
    content = content.replace(
        "const res = await fetch('/api/staff/update-compensation-type', {",
        `${tokenStr}\n            const res = await fetch('/api/staff/update-compensation-type', {`
    );
    content = content.replace(
        "headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ profileId: staffId, compensationType: newType })",
        "headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },\n                body: JSON.stringify({ profileId: staffId, compensationType: newType })"
    );

    // use-holiday
    content = content.replace(
        "const res = await fetch('/api/staff/use-holiday', {",
        `${tokenStr}\n            const res = await fetch('/api/staff/use-holiday', {`
    );
    content = content.replace(
        "headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify(useHolidayForm)",
        "headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },\n                body: JSON.stringify(useHolidayForm)"
    );

    // manual-approve-holiday
    content = content.replace(
        "const res = await fetch('/api/staff/manual-approve-holiday', {",
        `${tokenStr}\n            const res = await fetch('/api/staff/manual-approve-holiday', {`
    );
    content = content.replace(
        "headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ logId, status })",
        "headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },\n                body: JSON.stringify({ logId, status })"
    );

    return content;
}

let staffManager = fs.readFileSync('components/pos/POSStaffManager.tsx', 'utf8');
staffManager = addTokenToFetch(staffManager);
fs.writeFileSync('components/pos/POSStaffManager.tsx', staffManager);

let checkIn = fs.readFileSync('components/dashboard/AttendanceCheckIn.tsx', 'utf8');
checkIn = checkIn.replace(
    "await fetch('/api/staff/accrue-holiday', {",
    `const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token || '';
                    await fetch('/api/staff/accrue-holiday', {`
);
checkIn = checkIn.replace(
    "headers: { 'Content-Type': 'application/json' },\n                        body: JSON.stringify({ profileId: profile.id, logId: newLog.id })",
    "headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },\n                        body: JSON.stringify({ profileId: profile.id, logId: newLog.id })"
);
fs.writeFileSync('components/dashboard/AttendanceCheckIn.tsx', checkIn);

console.log("Fixed clients");
