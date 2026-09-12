const fs = require('fs');
let dbCode = fs.readFileSync('server/db.ts', 'utf8');

if (!dbCode.includes('sessions: { token: string; email: string; expiresAt: number; }[];')) {
  dbCode = dbCode.replace(
    '  google_sheet_integrations: GoogleSheetIntegration[];\n}',
    '  google_sheet_integrations: GoogleSheetIntegration[];\n  sessions: { token: string; email: string; expiresAt: number; }[];\n}'
  );
}

if (!dbCode.includes('sessions: []')) {
  dbCode = dbCode.replace(
    '    google_sheet_integrations: [],\n  };',
    '    google_sheet_integrations: [],\n    sessions: [],\n  };'
  );
}

// Add session helpers to DatabaseManager
const sessionHelpers = `
  // --- Sessions ---
  public createSession(email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.data.sessions.push({ token, email, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    this.save();
    return token;
  }
  
  public getEmailBySessionToken(token: string): string | null {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session || Date.now() > session.expiresAt) return null;
    return session.email;
  }
  
  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }
`;

if (!dbCode.includes('public createSession(')) {
  dbCode = dbCode.replace('  // --- Users & Roles & RBAC ---', sessionHelpers + '\n  // --- Users & Roles & RBAC ---');
}

fs.writeFileSync('server/db.ts', dbCode);
console.log('patched db');
