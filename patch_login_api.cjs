const fs = require('fs');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

const oldLogin = `router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, google_token } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalized = email.trim().toLowerCase();
  const user = db.getUserByEmail(normalized);

  if (!user) {
    db.auditLog(normalized, 'UNAUTHORIZED_LOGIN_ATTEMPT', 'auth', 'none', { ip: req.ip });
    return res.status(403).json({
      error: 'Access denied. This Google account is not authorized to manage events.',
      code: 'UNAUTHORIZED_ACCOUNT',
    });
  }

  // Update last login
  db.updateUser(user.id, { last_login: new Date().toISOString() });
  db.auditLog(user.email, 'ADMIN_LOGIN', 'user', user.id, { role: user.role });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id,
      avatar_url: user.avatar_url,
      permissions: user.permissions,
      two_step_verified: true,
    },
    token: \`bearer-session-\${user.id}-\${Date.now()}\`,
  });
});`;

const newLogin = `router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalized = email.trim().toLowerCase();
  const user = db.getUserByEmail(normalized);

  if (!user) {
    db.auditLog(normalized, 'UNAUTHORIZED_LOGIN_ATTEMPT', 'auth', 'none', { ip: req.ip });
    return res.status(403).json({
      error: 'Access denied. This Google account is not authorized to manage events.',
      code: 'UNAUTHORIZED_ACCOUNT',
    });
  }

  if (!code) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(normalized, { code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });
    
    try {
      await sendOTP(normalized, otpCode);
      return res.json({ requires_otp: true, message: 'OTP sent successfully' });
    } catch (err: any) {
      console.error('OTP Send error:', err);
      return res.status(500).json({ error: 'Failed to send OTP email: ' + (err.message || err.toString()) });
    }
  }

  const stored = otpStore.get(normalized);
  if (!stored) return res.status(400).json({ error: 'No OTP requested for this email' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalized);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (stored.code !== code) return res.status(400).json({ error: 'Invalid OTP code' });
  
  otpStore.delete(normalized);

  // Update last login
  db.updateUser(user.id, { last_login: new Date().toISOString() });
  db.auditLog(user.email, 'ADMIN_LOGIN', 'user', user.id, { role: user.role });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id,
      avatar_url: user.avatar_url,
      permissions: user.permissions,
      two_step_verified: true,
    },
    token: \`bearer-session-\${user.id}-\${Date.now()}\`,
  });
});`;

if (code.includes("router.post('/auth/login'")) {
  // It's safer to just replace the whole route since we know exactly where it is.
  const routeStart = code.indexOf("router.post('/auth/login'");
  const nextRouteStart = code.indexOf("router.get('/users'");
  if (routeStart !== -1 && nextRouteStart !== -1) {
    code = code.substring(0, routeStart) + newLogin + "\\n\\n" + code.substring(nextRouteStart);
    fs.writeFileSync('server/routes/api.ts', code);
    console.log("Patched login route successfully");
  } else {
    console.log("Could not find boundaries for login route");
  }
} else {
  console.log("Route not found");
}
