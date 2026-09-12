const fs = require('fs');
let code = fs.readFileSync('src/components/admin/HackathonScreeningView.tsx', 'utf8');

code = code.replace(
  "const res = await fetch(`/api/events/${event.id}/registrations`, {",
  "const res = await fetch(`/api/registrations?event_id=${event.id}`, {"
);

fs.writeFileSync('src/components/admin/HackathonScreeningView.tsx', code);
console.log("Patched fetch in HackathonScreeningView");
