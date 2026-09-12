const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

code = code.replace(
  "id: 'hackathon',\n      label: 'Hackathon Screening',\n      icon: Users",
  "id: 'hackathon',\n      label: 'Hackathon Screening',\n      icon: Sparkles"
);

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);
