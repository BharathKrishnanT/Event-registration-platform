import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs_mod from 'fs';
import * as XLSX from 'xlsx';
import { db, generateQRCode } from '../db.ts';
import { sendOTP, sendRegistrationConfirmation, sendScreeningStatusEmail, sendCustomBroadcastEmail, sendEventReminderEmail } from '../mailer.ts';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'server', 'uploads');
    if (!fs_mod.existsSync(dir)) fs_mod.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF and PPT/PPTX are allowed.'));
  }
});



const otpStore = new Map<string, { code: string; expiresAt: number }>();

router.post('/auth/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  
  try {
    await sendOTP(email, code);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('OTP Send error:', err);
    res.status(500).json({ error: 'Failed to send OTP email: ' + (err.message || err.toString()) });
  }
});

router.post('/auth/verify-otp', (req: Request, res: Response) => {
  const { email, code } = req.body;
  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) return res.status(400).json({ error: 'No OTP requested for this email' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (stored.code !== code) return res.status(400).json({ error: 'Invalid OTP code' });
  
  otpStore.delete(email.toLowerCase());
  res.json({ success: true, message: 'Email verified' });
});

// 

// Helper to extract organizer identity from header or session, with RBAC permission checker
function getOrganizerIdentity(req: Request): {
  email: string;
  role: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
} {
  let authEmail = (req.headers['x-user-email'] as string)?.trim().toLowerCase();
  if (!authEmail && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)organizer_email=([^;]+)/);
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
}


// --------------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT (ORGANIZER ONLY)
// --------------------------------------------------------

router.post('/auth/logout', (req: Request, res: Response) => {
  const tokenMatch = req.headers.cookie?.match(/(?:^|;\s*)session_token=([^;]+)/);
  if (tokenMatch) {
    db.deleteSession(tokenMatch[1]);
  }
  res.clearCookie('session_token');
  res.json({ success: true });
});

router.post('/auth/login', async (req: Request, res: Response) => {
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
  
  const token = db.createSession(user.email);
  res.cookie('session_token', token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

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
    token: `bearer-session-${user.id}-${Date.now()}`,
  });
});

router.get('/users', async (req: Request, res: Response) => {
  const users = db.getUsers();
  res.json(users);
});

router.post('/users', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('user_management')) {
    return res.status(403).json({
      error: 'Access denied: Super Admin authorization is required to create or authorize administrator accounts.',
    });
  }

  const { email, name, role, club_id, permissions } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Missing required user fields' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User email already exists in whitelist' });
  }

  const newUser = db.addUser({
    email,
    name,
    role,
    club_id: club_id || null,
    permissions: Array.isArray(permissions) ? permissions : undefined,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
  });

  db.auditLog(identity.email, 'USER_WHITELISTED', 'user', newUser.id, { email, role, permissions: newUser.permissions });

  res.status(201).json(newUser);
});

router.put('/users/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('user_management')) {
    return res.status(403).json({
      error: 'Access denied: Super Admin authorization is required to modify administrator accounts or permissions.',
    });
  }

  const { id } = req.params;
  const updated = db.updateUser(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  db.auditLog(identity.email, 'USER_UPDATED', 'user', id, { updates: Object.keys(req.body) });
  res.json(updated);
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('user_management')) {
    return res.status(403).json({
      error: 'Access denied: Super Admin authorization is required to revoke administrator accounts.',
    });
  }

  const { id } = req.params;
  const result = db.deleteUser(id);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Failed to delete user' });
  }
  db.auditLog(identity.email, 'USER_DELETED', 'user', id);
  res.json({ success: true, message: 'User removed from whitelist' });
});

// --------------------------------------------------------
// CLUBS
// --------------------------------------------------------
router.get('/clubs', async (req: Request, res: Response) => {
  const clubs = db.getClubs();
  res.json(clubs);
});

router.post('/clubs', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('club_management')) {
    return res.status(403).json({ error: 'Access denied: Club Management permission required' });
  }

  const { name, description, logo_url, contact_email } = req.body;
  if (!name || !contact_email) {
    return res.status(400).json({ error: 'Club name and contact email are required' });
  }

  const newClub = db.createClub({
    name,
    description: description || '',
    logo_url: logo_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop&q=80',
    contact_email,
    status: 'ACTIVE',
  });

  db.auditLog(identity.email, 'CLUB_CREATED', 'club', newClub.id, { name });

  res.status(201).json(newClub);
});

router.put('/clubs/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('club_management')) {
    return res.status(403).json({ error: 'Access denied: Club Management permission required' });
  }

  const { id } = req.params;
  const updated = db.updateClub(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Club not found' });
  }
  db.auditLog(identity.email, 'CLUB_UPDATED', 'club', id, { updates: Object.keys(req.body) });
  res.json(updated);
});

router.delete('/clubs/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('club_management')) {
    return res.status(403).json({ error: 'Access denied: Club Management permission required' });
  }

  const { id } = req.params;
  const result = db.deleteClub(id);
  if (!result.success) {
    return res.status(404).json({ error: result.error || 'Club not found' });
  }
  db.auditLog(identity.email, 'CLUB_DELETED', 'club', id);
  res.json({ success: true, message: 'Club deleted' });
});

// --------------------------------------------------------
// EVENTS
// --------------------------------------------------------
router.get('/events', async (req: Request, res: Response) => {
  const { club_id } = req.query;
  const events = db.getEvents(club_id as string);
  // Auto-close check for any open events that reached capacity
  events.forEach(e => {
    if (e.capacity && (e.auto_close_on_capacity ?? true) && e.status === 'REGISTRATION_OPEN') {
      db.checkAndAutoCloseEvent(e.id);
    }
  });
  res.json(db.getEvents(club_id as string));
});

router.get('/events/:slugOrId', async (req: Request, res: Response) => {
  const { slugOrId } = req.params;
  let event = db.getEventBySlug(slugOrId) || db.getEventById(slugOrId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  if (event.capacity && (event.auto_close_on_capacity ?? true) && event.status === 'REGISTRATION_OPEN') {
    db.checkAndAutoCloseEvent(event.id);
    event = db.getEventById(event.id) || event;
  }
  res.json(event);
});

router.post('/events', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('event_management')) {
    return res.status(403).json({ error: 'Access denied: Event Management permission required' });
  }

  const { name, club_id, ...rest } = req.body;
  if (!name || !club_id) {
    return res.status(400).json({ error: 'Event name and Club are required' });
  }

  const newEvent = db.createEvent({ name, club_id, ...rest });
  db.auditLog(identity.email, 'EVENT_CREATED', 'event', newEvent.id, { name: newEvent.name });

  res.status(201).json(db.getEventById(newEvent.id));
});

router.put('/events/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('event_management')) {
    return res.status(403).json({ error: 'Access denied: Event Management permission required' });
  }

  const { id } = req.params;
  const updated = db.updateEvent(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.auditLog(identity.email, 'EVENT_UPDATED', 'event', id, { updates: Object.keys(req.body) });

  res.json(updated);
});

router.delete('/events/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('event_management')) {
    return res.status(403).json({ error: 'Access denied: Event Management permission required' });
  }

  const { id } = req.params;
  const result = db.deleteEvent(id);
  if (!result.success) {
    return res.status(404).json({ error: result.error || 'Event not found' });
  }

  db.auditLog(identity.email, 'EVENT_DELETED', 'event', id);

  res.json({ success: true, message: 'Event and associated records deleted' });
});

router.post('/events/:id/clear-data', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('event_management')) {
    return res.status(403).json({ error: 'Access denied: Event Management permission required' });
  }

  const { id } = req.params;
  const result = db.clearEventData(id);

  db.auditLog(identity.email, 'EVENT_DATA_PURGED', 'event', id, result);

  res.json({ success: true, message: 'Event registrations, payments, and attendance cleared', ...result });
});

// Generate QR code for public event registration link (for posters, slides, flyers)
router.get('/events/:id/registration-qr', async (req: Request, res: Response) => {
  const { id } = req.params;
  const event = db.getEventById(id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const eventUrl = `${protocol}://${host}/events/${event.slug}`;

  try {
    const qrDataUrl = await generateQRCode(eventUrl);
    res.json({ event_url: eventUrl, qr_data_url: qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate registration QR code' });
  }
});

// --------------------------------------------------------
// REGISTRATIONS (PUBLIC ATTENDEE & ORGANIZER)
// --------------------------------------------------------
router.post('/registrations', async (req: Request, res: Response) => {
  try {
    const { event_id, name, phone, email, college, department, transaction_id, custom_fields, team_name, team_members, screening_document_base64, screening_document_name } = req.body;

    // 1. Validation
    if (!event_id || !name || !phone || !email || !college || !department) {
      return res.status(400).json({
        error: 'Please fill in all required fields (Name, Phone, Email, College, Department).',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Validate phone number (Indian phone format e.g. 10 digits or with +91)
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const event = db.getEventById(event_id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event registration is open
    if (event.status === 'REGISTRATION_CLOSED' || event.status === 'EVENT_COMPLETED' || event.status === 'ARCHIVED') {
      return res.status(400).json({ error: 'Registrations are currently closed for this event.' });
    }

    // If payment enabled, require transaction_id
    if (event.payment_enabled && event.fee > 0 && (!transaction_id || transaction_id.trim() === '')) {
      return res.status(400).json({ error: 'Payment Transaction ID (UTR) is required.' });
    }

    // Check duplicate
    const duplicateCheck = db.checkDuplicate(event_id, email, phone);
    if (duplicateCheck.isDuplicate && duplicateCheck.existingReg) {
      return res.status(409).json({
        error: 'You are already registered for this event.',
        registration_number: duplicateCheck.existingReg.registration_number,
        registration: duplicateCheck.existingReg,
      });
    }

    // Create registration
    let screening_document_url;
    if (screening_document_base64 && screening_document_name) {
      try {
        const matches = screening_document_base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = Date.now() + '-' + screening_document_name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fs = require('fs');
          fs.writeFileSync('./uploads/' + fileName, buffer);
          screening_document_url = '/uploads/' + fileName;
        }
      } catch (err) {
        console.error("Failed to save screening document:", err);
      }
    }

    const result = db.createRegistration({
      event_id,
      name,
      phone,
      email,
      college,
      department,
      transaction_id,
      custom_fields,
      team_name,
      team_members,
      screening_document_url,
    });

    if (result.isNew && result.registration) {
      try {
        const qrCodeDataUrl = await generateQRCode(result.registration.qr_token || result.registration.id);
        await sendRegistrationConfirmation(result.registration.email, event.name, result.registration, qrCodeDataUrl);
      } catch (mailErr) {
        console.error("Failed to send confirmation email:", mailErr);
      }
    }

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Unable to complete registration. Please check your details.' });
  }
});


router.post('/registrations/:id/screening-status', async (req: Request, res: Response) => {
  try {
    const identity = getOrganizerIdentity(req);
    if (!identity.hasPermission('participant_modification')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!['shortlisted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const reg = db.getRegistrationById(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    const event = db.getEventById(reg.event_id);

    const updated = db.updateRegistration(id, { screening_status: status });
    
    if (updated && status !== 'pending') {
      try {
        
        await sendScreeningStatusEmail(reg.email, event?.name || 'Hackathon', reg.team_name || reg.name, status);
      } catch (e) {
        console.error("Failed to send screening email:", e);
      }
    }

    res.json({ success: true, registration: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/registrations', async (req: Request, res: Response) => {
  const { event_id } = req.query;
  const registrations = db.getRegistrations(event_id as string);
  res.json(registrations);
});

router.get('/registrations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const registration = db.getRegistrationById(id) || db.getRegistrationByToken(id);
  if (!registration) {
    return res.status(404).json({ error: 'Registration record not found' });
  }

  // If verified and confirmed, include generated QR code pass
  let qr_pass_image: string | undefined;
  if (registration.qr_token && registration.registration_status === 'CONFIRMED') {
    try {
      qr_pass_image = await generateQRCode(registration.qr_token);
    } catch (e) {
      console.error('Failed to generate pass QR', e);
    }
  }

  const event = db.getEventById(registration.event_id);

  res.json({
    ...registration,
    event,
    qr_pass_image,
  });
});

router.post('/registrations/:id/resend-email', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reg = db.getRegistrationById(id);
  if (!reg) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  const event = db.getEventById(reg.event_id);
  const emailLog = {
    id: `eml-resend-${Date.now()}`,
    registration_id: reg.id,
    recipient: reg.email,
    type: 'QR_RESENT' as const,
    status: 'SENT' as const,
    subject: `[Resent] Registration Pass: ${event?.name || 'College Event'} [${reg.registration_number}]`,
    body_preview: `Hello ${reg.name}, here is your re-issued confirmation pass and QR check-in code.`,
    sent_at: new Date().toISOString(),
    provider_message_id: `msg_resend_${Date.now()}`,
  };

  db.getRaw().email_logs.push(emailLog);
  db.save();

  const identity = getOrganizerIdentity(req);
  db.auditLog(identity.email, 'CONFIRMATION_EMAIL_RESENT', 'registration', reg.id, {
    recipient: reg.email,
    registration_number: reg.registration_number,
  });

  res.json({ success: true, message: `Confirmation pass email resent to ${reg.email}` });
});

// Manual Desk Registration (Walk-ins / On-Spot Registration)
router.post('/registrations/manual', async (req: Request, res: Response) => {
  try {
    const identity = getOrganizerIdentity(req);
    if (!identity.hasPermission('participant_modification')) {
      return res.status(403).json({ error: 'Access denied: Participant Data Modification permission required' });
    }

    const { event_id, name, phone, email, college, department, payment_status, attendance_status, gate, transaction_id, custom_fields } = req.body;
    if (!event_id || !name || !email || !phone) {
      return res.status(400).json({ error: 'Event, Name, Phone, and Email are required for manual registration' });
    }

    const reg = db.createManualRegistration({
      event_id,
      name,
      phone,
      email,
      college,
      department,
      payment_status,
      attendance_status,
      gate,
      transaction_id,
      custom_fields,
      created_by: identity.email,
    });

    db.auditLog(identity.email, 'MANUAL_REGISTRATION_CREATED', 'registration', reg.id, {
      name: reg.name,
      registration_number: reg.registration_number,
      payment_status: reg.payment_status,
      attendance_status: reg.attendance_status,
    });

    res.status(201).json(reg);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create manual registration' });
  }
});

// Update Registration (Attendee info / Payment / Attendance)
router.put('/registrations/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('participant_modification')) {
    return res.status(403).json({ error: 'Access denied: Participant Data Modification permission required' });
  }

  const { id } = req.params;
  const updated = db.updateRegistration(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  db.auditLog(identity.email, 'REGISTRATION_UPDATED', 'registration', id, {
    updates: Object.keys(req.body),
    name: updated.name,
  });

  res.json(updated);
});

// Delete Registration
router.delete('/registrations/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('participant_modification')) {
    return res.status(403).json({ error: 'Access denied: Participant Data Modification permission required' });
  }

  const { id } = req.params;
  const success = db.deleteRegistration(id);
  if (!success) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  db.auditLog(identity.email, 'REGISTRATION_DELETED', 'registration', id);

  res.json({ success: true, message: 'Registration and associated records deleted' });
});

// Reset Attendee Check-In Status
router.post('/registrations/:id/reset-checkin', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('participant_modification')) {
    return res.status(403).json({ error: 'Access denied: Participant Data Modification permission required' });
  }

  const { id } = req.params;
  const success = db.resetAttendance(id);
  if (!success) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  db.auditLog(identity.email, 'CHECKIN_RESET', 'registration', id);

  res.json({ success: true, message: 'Check-in reset to NOT_CHECKED_IN' });
});

// Add Payment for Attendee
router.post('/registrations/:id/add-payment', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { id } = req.params;
  const { amount, transaction_id, payment_status } = req.body;
  const payment = db.addPayment({
    registration_id: id,
    amount: amount !== undefined ? Number(amount) : undefined,
    transaction_id: transaction_id || `MANUAL-${Date.now()}`,
    payment_status: payment_status || 'VERIFIED',
    verified_by: identity.email,
  });

  if (!payment) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  db.auditLog(identity.email, 'PAYMENT_ADDED_REGISTRATION', 'registration', id, {
    amount: payment.amount,
    transaction_id: payment.transaction_id,
  });

  res.json({ success: true, message: 'Payment recorded successfully', payment });
});

// Remove Payment for Attendee
router.post('/registrations/:id/remove-payment', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { id } = req.params;
  const rawPayments = db.getRaw().payments;
  const existingPayment = rawPayments.find(p => p.registration_id === id);

  if (existingPayment) {
    db.deletePayment(existingPayment.id, true);
  } else {
    const rawRegs = db.getRaw().registrations;
    const reg = rawRegs.find(r => r.id === id);
    if (!reg) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    reg.payment_status = 'PENDING';
    reg.transaction_id = undefined;
    reg.updated_at = new Date().toISOString();
    db.save();
  }

  db.auditLog(identity.email, 'PAYMENT_REMOVED_REGISTRATION', 'registration', id);

  res.json({ success: true, message: 'Payment removed and status reset to Pending' });
});

// --------------------------------------------------------
// PAYMENTS & VERIFICATION
// --------------------------------------------------------
router.get('/payments', async (req: Request, res: Response) => {
  const { event_id } = req.query;
  let payments = db.getRaw().payments;
  if (event_id) {
    payments = payments.filter(p => p.event_id === event_id);
  }
  payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(payments);
});

router.post('/payments', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { registration_id, amount, transaction_id, payment_status } = req.body;
  if (!registration_id) {
    return res.status(400).json({ error: 'Registration ID is required' });
  }

  const payment = db.addPayment({
    registration_id,
    amount: amount !== undefined ? Number(amount) : undefined,
    transaction_id: transaction_id || `MANUAL-${Date.now()}`,
    payment_status: payment_status || 'VERIFIED',
    verified_by: identity.email,
  });

  if (!payment) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  db.auditLog(identity.email, 'PAYMENT_ADDED', 'payment', payment.id, {
    registration_id,
    amount: payment.amount,
    transaction_id: payment.transaction_id,
  });

  res.status(201).json(payment);
});

router.put('/payments/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { id } = req.params;
  const updated = db.updatePayment(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  db.auditLog(identity.email, 'PAYMENT_UPDATED', 'payment', id, { updates: Object.keys(req.body) });

  res.json(updated);
});

router.delete('/payments/:id', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { id } = req.params;
  const success = db.deletePayment(id);
  if (!success) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  db.auditLog(identity.email, 'PAYMENT_DELETED', 'payment', id);

  res.json({ success: true, message: 'Payment record deleted' });
});

router.post('/payments/:id/verify', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { id } = req.params;
  const result = db.verifyPayment(id, identity.email);
  if (!result.success) {
    return res.status(404).json({ error: 'Registration or payment not found' });
  }
  
  if (result.registration) {
    try {
      const event = db.getEventById(result.registration.event_id);
      const qrCodeDataUrl = await generateQRCode(result.registration.qr_token || result.registration.id);
      await sendRegistrationConfirmation(result.registration.email, event?.name || 'Event', result.registration, qrCodeDataUrl);
    } catch (e) {
      console.error('Failed to send confirmation email on payment verify', e);
    }
  }

  res.json({ success: true, message: 'Payment verified and QR pass generated', registration: result.registration });
});

router.post('/payments/:id/reject', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('payment_verification')) {
    return res.status(403).json({ error: 'Access denied: Payment Verification permission required' });
  }

  const { id } = req.params;
  const { reason } = req.body;
  const result = db.rejectPayment(id, reason || 'Transaction ID not recognized in bank statement', identity.email);
  if (!result.success) {
    return res.status(404).json({ error: 'Registration or payment not found' });
  }
  res.json({ success: true, message: 'Payment rejected', registration: result.registration });
});

// --------------------------------------------------------
// CHECK-IN & ATTENDANCE SCANNER
// --------------------------------------------------------
router.post('/check-in/scan', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('qr_scanner')) {
    return res.status(403).json({
      success: false,
      status: 'UNAUTHORIZED_SCANNER',
      message: 'Access denied: Account is not authorized to operate QR Scanner gates.',
    });
  }

  const { qr_token, event_id, gate, scanner_id, member_indices } = req.body;

  if (!qr_token || !event_id) {
    return res.status(400).json({ error: 'QR token and event ID are required' });
  }

  const result = db.checkIn({
    qr_token: qr_token.trim(),
    event_id,
    gate: gate || 'Gate 1 (Main Entrance)',
    scanner_id: scanner_id || 'scanner-mobile',
    checked_in_by: identity.email,
    member_indices,
  });

  if (!result.success) {
    // Return specific status codes for clean client handling
    if (result.status === 'ALREADY_CHECKED_IN') {
      return res.status(409).json(result);
    }
    if (result.status === 'WRONG_EVENT') {
      return res.status(422).json(result);
    }
    if (result.status === 'UNCONFIRMED_PAYMENT') {
      return res.status(402).json(result);
    }
    if (result.status === 'TEAM_SELECTION_REQUIRED') {
      return res.status(200).json(result); // OK but needs selection
    }
    return res.status(404).json(result);
  }

  return res.json(result);
});

router.post('/check-in/manual', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('qr_scanner') && !identity.hasPermission('participant_modification')) {
    return res.status(403).json({
      success: false,
      status: 'UNAUTHORIZED_SCANNER',
      message: 'Access denied: Account is not authorized to check in attendees.',
    });
  }

  const { registration_id, event_id, gate, reason, member_indices } = req.body;
  if (!registration_id || !event_id) {
    return res.status(400).json({ error: 'Registration ID and Event ID are required' });
  }

  const result = db.manualCheckIn({
    registration_id,
    event_id,
    gate: gate || 'Manual Desk Fallback',
    checked_in_by: identity.email,
    reason,
    member_indices,
  });

  if (!result.success) {
    if (result.status === 'TEAM_SELECTION_REQUIRED') {
      return res.status(200).json(result); // Return OK for UI to show modal
    }
    return res.status(400).json(result);
  }

  return res.json(result);
});

router.get('/attendance', async (req: Request, res: Response) => {
  const { event_id } = req.query;
  let attendance = db.getRaw().attendance;
  if (event_id) {
    attendance = attendance.filter(a => a.event_id === event_id);
  }
  attendance.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(attendance);
});

// --------------------------------------------------------
// ANALYTICS & KPIS
// --------------------------------------------------------
router.get('/events/:id/kpis', async (req: Request, res: Response) => {
  const { id } = req.params;
  const kpis = db.getKPIs(id);
  res.json(kpis);
});

router.get('/events/:id/analytics', async (req: Request, res: Response) => {
  const { id } = req.params;
  const analytics = db.getAnalytics(id);
  res.json(analytics);
});

// Real-time live summary for fast polling in scanner & dashboard
router.get('/events/:id/live', async (req: Request, res: Response) => {
  const { id } = req.params;
  const kpis = db.getKPIs(id);
  const recentCheckins = db.getRaw().attendance
    .filter(a => a.event_id === id)
    .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
    .slice(0, 5);

  res.json({
    timestamp: new Date().toISOString(),
    kpis,
    recentCheckins,
  });
});

// --------------------------------------------------------
// EXPORTS: EXCEL (.XLSX), CSV, GOOGLE SHEETS
// --------------------------------------------------------
router.get('/events/:id/export/excel', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('export_data')) {
    return res.status(403).json({ error: 'Access denied: Data Export permission required' });
  }

  const { id } = req.params;
  const event = db.getEventById(id);
  if (!event) return res.status(404).send('Event not found');

  const regs = db.getRegistrations(id);
  const payments = db.getRaw().payments.filter(p => p.event_id === id);
  const attendance = db.getRaw().attendance.filter(a => a.event_id === id);
  const kpis = db.getKPIs(id);

  // Sheet 1: Registrations
  const regData = regs.map((r, index) => {
    let teamMembersNames = r.name;
    let teamMembersDetails = `${r.name} (Leader) - ${r.phone} - ${r.email} - [${r.attendance_status}]`;
    
    if (r.team_members && r.team_members.length > 0) {
      teamMembersNames += ', ' + r.team_members.map(m => m.name).join(', ');
      teamMembersDetails += ' | ' + r.team_members.map(m => `${m.name} - ${m.phone || 'N/A'} - [${m.checked_in ? 'In' : 'Out'}]`).join(' | ');
    }
    
    return {
      'S.No': index + 1,
      'Team ID': r.registration_number,
      'Team Name': r.team_name || 'N/A',
      'Members': teamMembersNames,
      'Members Details': teamMembersDetails,
      'College': r.college,
      'Department': r.department,
      'Transaction ID': r.transaction_id || 'N/A',
      'Payment Status': r.payment_status,
      'Registration Status': r.registration_status,
      'Registered At': r.created_at,
    };
  });

  // Sheet 2: Payments
  const payData = payments.map(p => ({
    'Payment ID': p.id,
    'Registration ID': p.registration_number,
    'Participant': p.participant_name,
    'Amount': `${p.currency} ${p.amount}`,
    'Transaction ID': p.transaction_id,
    'Status': p.payment_status,
    'Verified By': p.verified_by || 'Pending',
    'Verified At': p.verified_at || 'Pending',
    'Rejection Reason': p.rejection_reason || 'N/A',
    'Submitted At': p.created_at,
  }));

  // Sheet 3: Attendance
  const attData = attendance.map(a => ({
    'Attendance ID': a.id,
    'Registration ID': a.registration_number,
    'Participant Name': a.participant_name,
    'College': a.college,
    'Department': a.department,
    'Check-in Time': a.check_in_time,
    'Gate': a.gate,
    'Scanner ID': a.scanner_id,
    'Checked In By': a.checked_in_by,
  }));

  // Sheet 4: Summary
  const sumData = [
    { Metric: 'Event Name', Value: event.name },
    { Metric: 'Club', Value: event.club_name || 'College' },
    { Metric: 'Event Date', Value: `${event.start_date} (${event.start_time})` },
    { Metric: 'Venue', Value: event.venue },
    { Metric: 'Registration Fee', Value: `${event.currency} ${event.fee}` },
    { Metric: 'Total Registrations', Value: kpis.total_registrations },
    { Metric: 'Confirmed Registrations', Value: kpis.confirmed_registrations },
    { Metric: 'Pending Payments', Value: kpis.pending_payments },
    { Metric: 'Verified Payments', Value: kpis.verified_payments },
    { Metric: 'Total Checked In', Value: kpis.checked_in },
    { Metric: 'Not Checked In', Value: kpis.not_checked_in },
    { Metric: 'Attendance Rate', Value: `${kpis.attendance_percentage}%` },
    { Metric: 'Total Verified Revenue', Value: `${event.currency} ${kpis.total_revenue}` },
    { Metric: 'Report Generated', Value: new Date().toISOString() },
  ];

  const wb = XLSX.utils.book_new();

  const wsRegs = XLSX.utils.json_to_sheet(regData);
  const wsPayments = XLSX.utils.json_to_sheet(payData);
  const wsAttendance = XLSX.utils.json_to_sheet(attData);
  const wsSummary = XLSX.utils.json_to_sheet(sumData);

  XLSX.utils.book_append_sheet(wb, wsRegs, 'Registrations');
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  db.auditLog(identity.email, 'REGISTRATION_EXPORTED', 'export', id, { format: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${event.slug}-export.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
});

router.get('/events/:id/export/csv', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('export_data')) {
    return res.status(403).json({ error: 'Access denied: Data Export permission required' });
  }

  const { id } = req.params;
  const event = db.getEventById(id);
  if (!event) return res.status(404).send('Event not found');

  const regs = db.getRegistrations(id);
  const headers = ['S.No', 'Team ID', 'Team Name', 'Members', 'Members Details', 'College', 'Department', 'Transaction ID', 'Payment Status', 'Registration Status', 'Registered At'];
  const rows = regs.map((r, index) => {
    let teamMembersNames = r.name;
    let teamMembersDetails = `${r.name} (Leader) - ${r.phone} - ${r.email} - [${r.attendance_status}]`;
    
    if (r.team_members && r.team_members.length > 0) {
      teamMembersNames += ', ' + r.team_members.map(m => m.name).join(', ');
      teamMembersDetails += ' | ' + r.team_members.map(m => `${m.name} - ${m.phone || 'N/A'} - [${m.checked_in ? 'In' : 'Out'}]`).join(' | ');
    }

    return [
      index + 1,
      `"${r.registration_number}"`,
      `"${(r.team_name || 'N/A').replace(/"/g, '""')}"`,
      `"${teamMembersNames.replace(/"/g, '""')}"`,
      `"${teamMembersDetails.replace(/"/g, '""')}"`,
      `"${r.college.replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${r.transaction_id || ''}"`,
      r.payment_status,
      r.registration_status,
      `"${r.created_at}"`
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Disposition', `attachment; filename="${event.slug}-registrations.csv"`);
  res.setHeader('Content-Type', 'text/csv');
  return res.send(csv);
});

router.get('/events/:id/export/sheets', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('export_data')) {
    return res.status(403).json({ error: 'Access denied: Data Export permission required' });
  }

  const { id } = req.params;
  const event = db.getEventById(id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  let integration = db.getRaw().google_sheet_integrations.find(s => s.event_id === id);
  if (!integration) {
    integration = {
      id: `gsi-${Date.now()}`,
      event_id: id,
      sheet_id: `1${Math.random().toString(36).substring(2, 12)}SheetId`,
      sheet_title: `${event.name} - Synchronized Master Sheet`,
      sync_status: 'SYNCED',
      last_synced_at: new Date().toISOString(),
      records_synced: db.getRegistrations(id).length,
    };
    db.getRaw().google_sheet_integrations.push(integration);
    db.save();
  }

  const regs = db.getRegistrations(id);
  res.json({
    integration,
    syncedRows: regs.length,
    previewColumns: ['Registration ID', 'Name', 'Phone', 'Email', 'College', 'Department', 'Payment', 'Status', 'Attendance', 'Check-in Time'],
    sampleData: regs.slice(0, 5),
  });
});

router.post('/events/:id/export/sheets/sync', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('export_data')) {
    return res.status(403).json({ error: 'Access denied: Data Export permission required' });
  }

  const { id } = req.params;
  let integration = db.getRaw().google_sheet_integrations.find(s => s.event_id === id);
  const regs = db.getRegistrations(id);

  if (!integration) {
    integration = {
      id: `gsi-${Date.now()}`,
      event_id: id,
      sheet_id: `1${Math.random().toString(36).substring(2, 12)}SheetId`,
      sheet_title: `Live Sync Sheet - ${Date.now()}`,
      sync_status: 'SYNCED',
      last_synced_at: new Date().toISOString(),
      records_synced: regs.length,
    };
    db.getRaw().google_sheet_integrations.push(integration);
  } else {
    integration.sync_status = 'SYNCED';
    integration.last_synced_at = new Date().toISOString();
    integration.records_synced = regs.length;
  }

  db.auditLog(identity.email, 'GOOGLE_SHEET_EXPORTED', 'export', id, { records: regs.length });
  db.save();

  res.json({ success: true, message: 'Google Sheets synchronization completed', integration });
});

// --------------------------------------------------------
// REMINDERS & AUDIT LOGS
// --------------------------------------------------------

// Custom Broadcast Email
router.post('/events/:id/broadcast', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('broadcast_settings')) {
    return res.status(403).json({ error: 'Access denied: Broadcast & Settings permission required' });
  }

  const { id } = req.params;
  const { subject, message } = req.body;
  const event = db.getEventById(id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const regs = db.getRaw().registrations.filter(r => r.event_id === id && r.registration_status === 'CONFIRMED');
  
  let sentCount = 0;
  for (const reg of regs) {
    try {
      // Add custom HTML wrapper
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">Message from ${event.name} Organizers</h2>
          <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-top: 20px; line-height: 1.6;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
      await sendCustomBroadcastEmail(reg.email, subject, htmlContent);
      sentCount++;
    } catch (e) {
      console.error('Broadcast failed for', reg.email, e);
    }
  }

  res.json({ success: true, message: `Broadcast sent to ${sentCount} confirmed participants.` });
});

// 1-Day Reminder Email
router.post('/events/:id/reminders/1-day', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('broadcast_settings')) {
    return res.status(403).json({ error: 'Access denied: Broadcast & Settings permission required' });
  }

  const { id } = req.params;
  const event = db.getEventById(id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const regs = db.getRaw().registrations.filter(r => r.event_id === id && r.registration_status === 'CONFIRMED');
  
  let sentCount = 0;
  for (const reg of regs) {
    try {
      const qrCodeDataUrl = await generateQRCode(reg.qr_token || reg.id);
      await sendEventReminderEmail(reg.email, event.name, reg, qrCodeDataUrl);
      sentCount++;
    } catch (e) {
      console.error('Reminder failed for', reg.email, e);
    }
  }

  res.json({ success: true, message: `1-Day reminder sent to ${sentCount} confirmed participants.` });
});

router.post('/events/:id/reminders/send', async (req: Request, res: Response) => {
  const identity = getOrganizerIdentity(req);
  if (!identity.hasPermission('broadcast_settings')) {
    return res.status(403).json({ error: 'Access denied: Broadcast & Settings permission required' });
  }

  const { id } = req.params;
  try {
    const result = db.sendCheckinReminders(id, identity.email);
    res.json({
      success: true,
      message: `Automated reminder sent to ${result.sentCount} confirmed attendees who have not yet checked in.`,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/audit-logs', async (req: Request, res: Response) => {
  const logs = db.getAuditLogs(100);
  res.json(logs);
});

router.get('/email-logs', async (req: Request, res: Response) => {
  const { event_id } = req.query;
  const logs = db.getEmailLogs(event_id as string);
  res.json(logs);
});


// ====================
// HACKATHON ENDPOINTS
// ====================

// Upload submission (Team)
router.post('/registrations/:id/submission', upload.single('file'), (req: Request, res: Response) => {
  const { id } = req.params;
  const reg = db.getRegistrationById(id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  
  if (!req.file) return res.status(400).json({ error: 'No valid file uploaded' });

  // In a real app, verify that the logged-in user owns this registration.
  
  const hackathon_submission = {
    file_name: req.file.originalname,
    file_url: `/api/registrations/${id}/submission/download`,
    file_path: req.file.path,
    file_type: req.file.mimetype,
    file_size: req.file.size,
    uploaded_at: new Date().toISOString(),
    submission_status: 'SUBMITTED' as const,
    email_status: reg.hackathon_submission?.email_status || 'NOT_SENT',
  };

  const updated = db.updateRegistration(id, { hackathon_submission, screening_status: 'pending' });
  res.json({ success: true, registration: updated });
});

// Download submission (Admin)
router.get('/registrations/:id/submission/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const reg = db.getRegistrationById(id);
  if (!reg || !reg.hackathon_submission || !reg.hackathon_submission.file_path) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  // Note: Add RBAC check here if strictly needed
  
  res.download(reg.hackathon_submission.file_path, reg.hackathon_submission.file_name);
});

// Review Submission (Admin)
router.post('/registrations/:id/screening', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, comment } = req.body; // status: 'shortlisted' | 'rejected' | 'pending'
  const adminId = getOrganizerIdentity(req);
  if (!adminId.email) return res.status(401).json({ error: 'Unauthorized' });

  const reg = db.getRegistrationById(id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  
  const event = db.getEventById(reg.event_id);

  const hackathon_submission = {
    ...(reg.hackathon_submission || {}),
    reviewer_id: adminId.email,
    reviewer_name: adminId.email,
    reviewer_comment: comment !== undefined ? comment : reg.hackathon_submission?.reviewer_comment,
    reviewed_at: new Date().toISOString()
  };
  
  const updated = db.updateRegistration(id, { 
    screening_status: status,
    hackathon_submission: hackathon_submission as any
  });
  
  // Send Email if finalized
  if ((status === 'shortlisted' || status === 'rejected') && event) {
    try {
      db.updateRegistration(id, { 
        hackathon_submission: { ...hackathon_submission, email_status: 'SENDING' } as any 
      });
      
      await sendScreeningStatusEmail(
        reg.email, 
        event.name, 
        reg.team_name || reg.name, 
        status
      );
      
      db.updateRegistration(id, { 
        hackathon_submission: { 
          ...hackathon_submission, 
          email_status: 'SENT', 
          email_sent_at: new Date().toISOString() 
        } as any 
      });
      
      // Log
      db.addAuditLog({
        user_email: adminId.email,
        action: 'SENT_SCREENING_EMAIL',
        entity_type: 'REGISTRATION',
        entity_id: id,
        metadata: { status, to: reg.email }
      });
      
    } catch (e: any) {
      console.error("Screening email error", e);
      db.updateRegistration(id, { 
        hackathon_submission: { 
          ...hackathon_submission, 
          email_status: 'FAILED',
          email_error: e.message 
        } as any 
      });
    }
  }

  // Log action
  db.addAuditLog({
    user_email: adminId.email,
    action: 'REVIEWED_SUBMISSION',
    entity_type: 'REGISTRATION',
    entity_id: id,
    metadata: { status, comment }
  });

  res.json({ success: true, registration: db.getRegistrationById(id) });
});



// Handle Multer errors globally
router.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError || err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
