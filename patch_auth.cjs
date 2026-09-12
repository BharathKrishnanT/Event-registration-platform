const fs = require('fs');
let apiCode = fs.readFileSync('server/routes/api.ts', 'utf8');

// Replace getOrganizerIdentity
const oldAuthStr = `function getOrganizerIdentity(req: Request): {
  email: string;
  role: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
} {
  let authEmail = (req.headers['x-user-email'] as string)?.trim().toLowerCase();
  if (!authEmail && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\\s*)organizer_email=([^;]+)/);
    if (match) {
      try {
        authEmail = decodeURIComponent(match[1]).trim().toLowerCase();
      } catch {
        authEmail = match[1].trim().toLowerCase();
      }
    }
  }

  let user = authEmail ? db.getUserByEmail(authEmail) : null;
  if (!user) {
    user = db.getUserByEmail('bharathkrishnan.t@gmail.com') || {
      id: 'usr_super_1',
      email: 'bharathkrishnan.t@gmail.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      permissions: [
        'qr_scanner',
        'participant_modification',
        'payment_verification',
        'event_management',
        'export_data',
        'club_management',
        'user_management',
        'broadcast_settings',
      ],
      created_at: new Date().toISOString(),
    };
  }

  const role = user.role;
  const permissions: string[] = user.permissions || [];
  const hasPermission = (permission: string): boolean => {
    if (role === 'SUPER_ADMIN') return true;
    return permissions.includes(permission);
  };

  return { email: user.email, role, permissions, hasPermission };
}`;

const newAuthStr = `function getOrganizerIdentity(req: Request): {
  email: string;
  role: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
} {
  let authEmail: string | null = null;
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\\s*)session_token=([^;]+)/);
    if (match) {
      const token = match[1];
      authEmail = db.getEmailBySessionToken(token);
    }
  }

  const emptyIdentity = {
    email: '',
    role: 'NONE',
    permissions: [],
    hasPermission: () => false
  };

  if (!authEmail) return emptyIdentity;

  const user = db.getUserByEmail(authEmail);
  if (!user) return emptyIdentity;

  const role = user.role;
  const permissions: string[] = user.permissions || [];
  const hasPermission = (permission: string): boolean => {
    if (role === 'SUPER_ADMIN') return true;
    return permissions.includes(permission);
  };

  return { email: user.email, role, permissions, hasPermission };
}`;

apiCode = apiCode.replace(oldAuthStr, newAuthStr);

// Update login response to issue HttpOnly cookie
const oldLoginSuccess = `  db.updateUser(user.id, { last_login: new Date().toISOString() });
  db.auditLog(user.email, 'ADMIN_LOGIN', 'user', user.id, { role: user.role });

  return res.json({
    user: {`;

const newLoginSuccess = `  db.updateUser(user.id, { last_login: new Date().toISOString() });
  db.auditLog(user.email, 'ADMIN_LOGIN', 'user', user.id, { role: user.role });
  
  const token = db.createSession(user.email);
  res.cookie('session_token', token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  return res.json({
    user: {`;
apiCode = apiCode.replace(oldLoginSuccess, newLoginSuccess);

// Add logout API
const newEndpoints = `
// --------------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT (ORGANIZER ONLY)
// --------------------------------------------------------

router.post('/auth/logout', (req: Request, res: Response) => {
  const tokenMatch = req.headers.cookie?.match(/(?:^|;\\s*)session_token=([^;]+)/);
  if (tokenMatch) {
    db.deleteSession(tokenMatch[1]);
  }
  res.clearCookie('session_token');
  res.json({ success: true });
});
`;
apiCode = apiCode.replace(
  '// --------------------------------------------------------\n// AUTHENTICATION & USER MANAGEMENT (ORGANIZER ONLY)\n// --------------------------------------------------------',
  newEndpoints
);

fs.writeFileSync('server/routes/api.ts', apiCode);
console.log('patched auth');
