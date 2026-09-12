const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RegistrationsView.tsx', 'utf8');
if (!code.includes('const isHackathon = event.event_type === \'hackathon\';')) {
    code = code.replace(/const isEventFree = !event.payment_enabled \|\| event.fee === 0;/, "const isEventFree = !event.payment_enabled || event.fee === 0;\n  const isHackathon = event.event_type === 'hackathon';");
    fs.writeFileSync('src/components/admin/RegistrationsView.tsx', code);
    console.log("Fixed isHackathon");
}
