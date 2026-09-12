const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

code = code.replace(
  "team_name?: string;\n    team_members?: TeamMember[];\n  }) {",
  "team_name?: string;\n    team_members?: TeamMember[];\n    screening_document_url?: string;\n  }) {"
);

code = code.replace(
  "team_members: params.team_members,",
  "team_members: params.team_members,\n      screening_document_url: params.screening_document_url,\n      screening_status: params.screening_document_url ? 'pending' : undefined,"
);

fs.writeFileSync('server/db.ts', code);
console.log('Patched db.ts');
