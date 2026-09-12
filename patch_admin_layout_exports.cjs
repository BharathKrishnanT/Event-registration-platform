const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

// Need to import HackathonScreeningView... Wait, we are doing it in App.tsx not AdminLayout.tsx
// AdminLayout just handles tabs.
