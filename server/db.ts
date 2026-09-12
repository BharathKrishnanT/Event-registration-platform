import fs from 'fs';

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const fbApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  Club,
  Event,
  EventFormField,
  Registration,
  RegistrationStatus,
  Payment,
  PaymentStatus,
  Attendance,
  Scanner,
  EmailLog,
  AuditLog,
  GoogleSheetIntegration,
  User,
  EventKPIs,
  AttendanceStatus,
  AdminPermission,
  TeamMember,
} from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  clubs: Club[];
  events: Event[];
  event_form_fields: EventFormField[];
  registrations: Registration[];
  payments: Payment[];
  attendance: Attendance[];
  scanners: Scanner[];
  email_logs: EmailLog[];
  reminders: any[];
  audit_logs: AuditLog[];
  google_sheet_integrations: GoogleSheetIntegration[];
  sessions: { token: string; email: string; expiresAt: number; }[];
}

function getInitialData(): DatabaseSchema {
  const clubs: Club[] = [
    {
      id: 'club-tech',
      name: 'Technical Club',
      description: 'Hub for engineering innovations, workshops, hackathons, and technical symposiums.',
      logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80',
      contact_email: 'technicalclub@college.edu',
      status: 'ACTIVE',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'club-coding',
      name: 'Coding & Algorithms Club',
      description: 'Competitive programming, open-source building, and developer conferences.',
      logo_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&auto=format&fit=crop&q=80',
      contact_email: 'codingclub@college.edu',
      status: 'ACTIVE',
      created_at: '2026-01-12T10:00:00Z',
    },
    {
      id: 'club-robotics',
      name: 'Robotics & IoT Club',
      description: 'Designing autonomous rovers, bot battles, and embedded intelligence systems.',
      logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&auto=format&fit=crop&q=80',
      contact_email: 'robotics@college.edu',
      status: 'ACTIVE',
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'club-cultural',
      name: 'Cultural & Fine Arts Club',
      description: 'Annual cultural festival, live music, theatrical arts, and creative showcases.',
      logo_url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=200&auto=format&fit=crop&q=80',
      contact_email: 'cultural@college.edu',
      status: 'ACTIVE',
      created_at: '2026-01-18T10:00:00Z',
    },
    {
      id: 'club-ecell',
      name: 'Entrepreneurship Cell (E-Cell)',
      description: 'Startup summits, venture pitching, angel investor connects, and founder talks.',
      logo_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&auto=format&fit=crop&q=80',
      contact_email: 'ecell@college.edu',
      status: 'ACTIVE',
      created_at: '2026-01-20T10:00:00Z',
    },
  ];

  const events: Event[] = [
    {
      id: 'evt-techfest-2026',
      club_id: 'club-tech',
      club_name: 'Technical Club',
      name: 'TECHFEST 2026',
      slug: 'techfest-2026',
      description: 'The flagship annual technical symposium featuring paper presentations, project expos, AI challenges, and industry keynote sessions.',
      poster_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80',
      venue: 'Main Auditorium, APJ Abdul Kalam Block',
      start_date: '2026-09-25',
      end_date: '2026-09-25',
      start_time: '09:00 AM',
      end_time: '05:00 PM',
      registration_open: '2026-08-01T00:00:00Z',
      registration_close: '2026-09-24T23:59:59Z',
      capacity: 500,
      auto_close_on_capacity: true,
      fee: 100,
      currency: 'INR',
      upi_id: 'techfest2026@sbi',
      payment_instructions: 'Scan the UPI QR code using Google Pay, PhonePe, Paytm, or BHIM. Enter your 12-digit UTR/Transaction Reference Number below.',
      payment_enabled: true,
      status: 'REGISTRATION_OPEN',
      created_at: '2026-08-01T09:00:00Z',
      updated_at: '2026-09-10T12:00:00Z',
    },
    {
      id: 'evt-hackabit-2026',
      club_id: 'club-coding',
      club_name: 'Coding & Algorithms Club',
      name: 'HACK-A-BIT 2026',
      slug: 'hackabit-2026',
      description: '24-hour sprint to build next-gen decentralized apps, AI agents, and climate-tech solutions with ₹1,00,000 in cash prizes.',
      poster_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
      venue: 'Innovation & Research Hub, 3rd Floor',
      start_date: '2026-10-10',
      end_date: '2026-10-11',
      start_time: '10:00 AM',
      end_time: '10:00 AM',
      registration_open: '2026-08-15T00:00:00Z',
      registration_close: '2026-10-08T23:59:59Z',
      capacity: 200,
      auto_close_on_capacity: true,
      fee: 150,
      currency: 'INR',
      upi_id: 'hackabit@icici',
      payment_instructions: 'Pay ₹150 registration fee per hacker using any UPI application. Submit your transaction ID for fast verification.',
      payment_enabled: true,
      status: 'REGISTRATION_OPEN',
      created_at: '2026-08-15T09:00:00Z',
      updated_at: '2026-09-05T12:00:00Z',
    },
    {
      id: 'evt-robosumo-2026',
      club_id: 'club-robotics',
      club_name: 'Robotics & IoT Club',
      name: 'ROBOSUMO ARENA',
      slug: 'robosumo-2026',
      description: 'Autonomous heavyweight bot combat championship. Watch robots battle to push opponents out of the circular ring.',
      poster_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      venue: 'Indoor Sports Complex, Ring A',
      start_date: '2026-09-18',
      end_date: '2026-09-18',
      start_time: '01:00 PM',
      end_time: '06:00 PM',
      registration_open: '2026-08-10T00:00:00Z',
      registration_close: '2026-09-17T20:00:00Z',
      capacity: 60,
      auto_close_on_capacity: true,
      fee: 200,
      currency: 'INR',
      upi_id: 'robosumo@hdfcbank',
      payment_instructions: 'Enter UPI transaction reference from payment receipt.',
      payment_enabled: true,
      status: 'EVENT_LIVE',
      created_at: '2026-08-10T10:00:00Z',
      updated_at: '2026-09-10T15:00:00Z',
    }
  ];

  const event_form_fields: EventFormField[] = [
    // TECHFEST fields
    {
      id: 'ff-1',
      event_id: 'evt-techfest-2026',
      field_name: 'year',
      label: 'Year of Study',
      field_type: 'dropdown',
      is_required: true,
      options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'],
      placeholder: 'Select your year',
      sort_order: 1,
    },
    {
      id: 'ff-2',
      event_id: 'evt-techfest-2026',
      field_name: 'student_id',
      label: 'Roll / Student ID',
      field_type: 'text',
      is_required: true,
      placeholder: 'e.g. 23CS1084',
      sort_order: 2,
    },
    {
      id: 'ff-3',
      event_id: 'evt-techfest-2026',
      field_name: 'whatsapp',
      label: 'WhatsApp Number',
      field_type: 'phone',
      is_required: false,
      placeholder: 'For event updates broadcast',
      sort_order: 3,
    },
    {
      id: 'ff-4',
      event_id: 'evt-techfest-2026',
      field_name: 'food_preference',
      label: 'Lunch Preference',
      field_type: 'dropdown',
      is_required: true,
      options: ['Vegetarian', 'Non-Vegetarian', 'Jain'],
      placeholder: 'Select food preference',
      sort_order: 4,
    },
    // HACK-A-BIT fields
    {
      id: 'ff-5',
      event_id: 'evt-hackabit-2026',
      field_name: 'team_name',
      label: 'Team Name',
      field_type: 'text',
      is_required: true,
      placeholder: 'e.g. ByteBusters',
      sort_order: 1,
    },
    {
      id: 'ff-6',
      event_id: 'evt-hackabit-2026',
      field_name: 'tshirt_size',
      label: 'T-Shirt Size',
      field_type: 'dropdown',
      is_required: true,
      options: ['S', 'M', 'L', 'XL', 'XXL'],
      placeholder: 'Select size',
      sort_order: 2,
    },
    {
      id: 'ff-7',
      event_id: 'evt-hackabit-2026',
      field_name: 'github_profile',
      label: 'GitHub / Portfolio URL',
      field_type: 'text',
      is_required: false,
      placeholder: 'https://github.com/...',
      sort_order: 3,
    }
  ];

  const users: User[] = [
    {
      id: 'usr-1',
      google_id: 'google-sub-superadmin-01',
      email: 'bharathkrishnan.t@gmail.com',
      name: 'Bharath Krishnan',
      role: 'SUPER_ADMIN',
      club_id: null,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      permissions: [
        'qr_scanner',
        'participant_modification',
        'payment_verification',
        'event_management',
        'club_management',
        'export_data',
        'broadcast_settings',
        'user_management',
      ],
      created_at: '2026-01-01T00:00:00Z',
      last_login: '2026-09-10T21:30:00Z',
    },
    {
      id: 'usr-2',
      google_id: 'google-sub-clubadmin-02',
      email: 'technical.head@college.edu',
      name: 'Aditi Sharma',
      role: 'CLUB_ADMIN',
      club_id: 'club-tech',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      permissions: [
        'event_management',
        'participant_modification',
        'payment_verification',
        'qr_scanner',
        'export_data',
      ],
      created_at: '2026-01-10T10:00:00Z',
      last_login: '2026-09-09T18:20:00Z',
    },
    {
      id: 'usr-3',
      google_id: 'google-sub-organizer-03',
      email: 'organizer.techfest@college.edu',
      name: 'Rohan Deshmukh',
      role: 'EVENT_ORGANIZER',
      club_id: 'club-tech',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      permissions: [
        'participant_modification',
        'qr_scanner',
        'payment_verification',
      ],
      created_at: '2026-02-01T10:00:00Z',
      last_login: '2026-09-10T20:15:00Z',
    },
    {
      id: 'usr-4',
      google_id: 'google-sub-scanner-04',
      email: 'volunteer.scanner@college.edu',
      name: 'Vikram Patel',
      role: 'VOLUNTEER',
      club_id: 'club-tech',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      permissions: [
        'qr_scanner',
      ],
      created_at: '2026-02-15T10:00:00Z',
      last_login: '2026-09-10T19:00:00Z',
    }
  ];

  // Clean slate: no fake registrations, payments, attendances or audit logs
  const registrations: Registration[] = [];
  const payments: Payment[] = [];
  const attendance: Attendance[] = [];
  const scanners: Scanner[] = [
    {
      id: 'scanner-gate-1',
      name: 'Main Gate Terminal 1',
      gate_name: 'Gate 1 (Main Entrance)',
      event_id: 'evt-techfest-2026',
      is_active: true,
      last_active_at: new Date().toISOString(),
    },
    {
      id: 'scanner-gate-2',
      name: 'Auditorium Side Scanner',
      gate_name: 'Gate 2 (Side Auditorium)',
      event_id: 'evt-techfest-2026',
      is_active: true,
      last_active_at: new Date().toISOString(),
    }
  ];
  const email_logs: EmailLog[] = [];
  const audit_logs: AuditLog[] = [];
  const google_sheet_integrations: GoogleSheetIntegration[] = [];

  return {
    users,
    clubs,
    events,
    event_form_fields,
    registrations,
    payments,
    attendance,
    scanners,
    email_logs,
    reminders: [],
    audit_logs,
    google_sheet_integrations,
  };
}

class DatabaseManager {
  public async initFirestoreSync() {
    try {
      // Very basic sync: just load users to prove it's linked
      const usersSnap = await getDocs(collection(firestoreDb, 'users'));
      if (!usersSnap.empty) {
        this.data.users = usersSnap.docs.map(d => d.data() as User);
      }
      
      const eventsSnap = await getDocs(collection(firestoreDb, 'events'));
      if (!eventsSnap.empty) {
        this.data.events = eventsSnap.docs.map(d => d.data() as Event);
      }
      
      const regsSnap = await getDocs(collection(firestoreDb, 'registrations'));
      if (!regsSnap.empty) {
        this.data.registrations = regsSnap.docs.map(d => d.data() as Registration);
      }

      console.log('Successfully synced from Firestore on startup!');
    } catch (err) {
      console.error('Failed to sync from Firestore:', err);
    }
  }

  private cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => this.cleanUndefined(v));
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      } else {
        cleaned[key] = this.cleanUndefined(cleaned[key]);
      }
    });
    return cleaned;
  }

  private async syncToFirestore(dbData?: DatabaseSchema) {
    const targetData = dbData || this.data;
    if (!targetData) return;
    try {
      // Sync users
      for (const user of targetData.users || []) {
        await setDoc(doc(firestoreDb, 'users', user.id), this.cleanUndefined(user));
      }
      // Sync events
      for (const evt of targetData.events || []) {
        await setDoc(doc(firestoreDb, 'events', evt.id), this.cleanUndefined(evt));
      }
      // Sync registrations
      for (const reg of targetData.registrations || []) {
        await setDoc(doc(firestoreDb, 'registrations', reg.id), this.cleanUndefined(reg));
      }
    } catch (err) {
      console.error('Failed to sync to Firestore:', err);
    }
  }

  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        // Purge any previously seeded fake dummy attendees, payments, or attendance
        const dummyNames = ['Aarav Patel', 'Priya Sundaram', 'Kavya Ramanathan', 'Vikramaditya Verma', 'Sneha Kulkarni'];
        parsed.registrations = (parsed.registrations || []).filter(
          r => !r.id.startsWith('reg-00') && !dummyNames.includes(r.name)
        );
        parsed.payments = (parsed.payments || []).filter(
          p => !p.id.startsWith('pay-00') && !dummyNames.includes(p.participant_name)
        );
        parsed.attendance = (parsed.attendance || []).filter(
          a => !a.id.startsWith('att-00') && !dummyNames.includes(a.participant_name)
        );
        parsed.audit_logs = (parsed.audit_logs || []).filter(
          a => !a.id.startsWith('aud-00')
        );
        parsed.email_logs = (parsed.email_logs || []).filter(
          e => !e.id.startsWith('eml-00')
        );
        this.saveDataDirect(parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Failed to read db.json, reinitializing initial schema', err);
    }
    const initial = getInitialData();
    this.saveDataDirect(initial);
    return initial;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
      this.syncToFirestore(data).catch(e => console.error("Firestore sync error", e));
    } catch (err) {
      console.error('Failed to persist db to disk', err);
    }
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      this.saveDataDirect(this.data);
      this.isSaving = false;
    }, 50);
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }


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

  // --- Users & Roles & RBAC ---
  public getDefaultPermissionsForRole(role: string): AdminPermission[] {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          'qr_scanner',
          'participant_modification',
          'payment_verification',
          'event_management',
          'club_management',
          'export_data',
          'broadcast_settings',
          'user_management',
        ];
      case 'CLUB_ADMIN':
        return [
          'event_management',
          'participant_modification',
          'payment_verification',
          'qr_scanner',
          'export_data',
        ];
      case 'EVENT_ORGANIZER':
        return [
          'participant_modification',
          'qr_scanner',
          'payment_verification',
        ];
      case 'VOLUNTEER':
        return ['qr_scanner'];
      default:
        return ['qr_scanner'];
    }
  }

  public getUsers(): User[] {
    return this.data.users.map(u => ({
      ...u,
      permissions: u.permissions && u.permissions.length > 0
        ? u.permissions
        : this.getDefaultPermissionsForRole(u.role),
    }));
  }

  public getUserByEmail(email: string): User | undefined {
    const u = this.data.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (!u) return undefined;
    return {
      ...u,
      permissions: u.permissions && u.permissions.length > 0
        ? u.permissions
        : this.getDefaultPermissionsForRole(u.role),
    };
  }

  public addUser(user: Omit<User, 'id' | 'created_at'>): User {
    const perms = user.permissions && user.permissions.length > 0
      ? user.permissions
      : this.getDefaultPermissionsForRole(user.role);

    const newUser: User = {
      ...user,
      permissions: perms,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.save();
    return this.data.users[index];
  }

  public deleteUser(id: string): { success: boolean; error?: string } {
    const target = this.data.users.find(u => u.id === id);
    if (!target) {
      return { success: false, error: 'User not found' };
    }
    // Protect primary Super Admin
    if (target.email === 'bharathkrishnan.t@gmail.com') {
      return { success: false, error: 'Cannot delete the primary root Super Admin account' };
    }
    // Ensure at least one SUPER_ADMIN remains
    if (target.role === 'SUPER_ADMIN') {
      const superAdminCount = this.data.users.filter(u => u.role === 'SUPER_ADMIN').length;
      if (superAdminCount <= 1) {
        return { success: false, error: 'Cannot delete the last Super Admin' };
      }
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
    return { success: true };
  }

  // --- Clubs ---
  public getClubs(): Club[] {
    return this.data.clubs;
  }

  public getClubById(id: string): Club | undefined {
    return this.data.clubs.find(c => c.id === id);
  }

  public createClub(club: Omit<Club, 'id' | 'created_at'>): Club {
    const newClub: Club = {
      ...club,
      id: `club-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.data.clubs.push(newClub);
    this.save();
    return newClub;
  }

  public updateClub(id: string, updates: Partial<Club>): Club | null {
    const index = this.data.clubs.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.data.clubs[index] = { ...this.data.clubs[index], ...updates };
    this.save();
    return this.data.clubs[index];
  }

  public deleteClub(id: string): { success: boolean; error?: string } {
    const index = this.data.clubs.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Club not found' };
    const club = this.data.clubs[index];
    this.data.clubs.splice(index, 1);
    // Unassign club from events and users
    this.data.events.forEach(e => {
      if (e.club_id === id) {
        e.club_id = '';
      }
    });
    this.data.users.forEach(u => {
      if (u.club_id === id) {
        u.club_id = null;
      }
    });
    this.save();
    return { success: true };
  }

  // --- Events ---
  public getEvents(clubId?: string): Event[] {
    let list = this.data.events;
    if (clubId) {
      list = list.filter(e => e.club_id === clubId);
    }
    return list.map(e => {
      const club = this.getClubById(e.club_id);
      const fields = this.data.event_form_fields.filter(f => f.event_id === e.id);
      return {
        ...e,
        club_name: club?.name,
        form_fields: fields.sort((a, b) => a.sort_order - b.sort_order),
      };
    });
  }

  public getEventBySlug(slug: string): Event | undefined {
    const event = this.data.events.find(e => e.slug === slug || e.id === slug);
    if (!event) return undefined;
    const club = this.getClubById(event.club_id);
    const fields = this.data.event_form_fields.filter(f => f.event_id === event.id);
    return {
      ...event,
      club_name: club?.name,
      form_fields: fields.sort((a, b) => a.sort_order - b.sort_order),
    };
  }

  public getEventById(id: string): Event | undefined {
    const event = this.data.events.find(e => e.id === id);
    if (!event) return undefined;
    const club = this.getClubById(event.club_id);
    const fields = this.data.event_form_fields.filter(f => f.event_id === event.id);
    return {
      ...event,
      club_name: club?.name,
      form_fields: fields.sort((a, b) => a.sort_order - b.sort_order),
    };
  }

  public createEvent(data: Partial<Event> & { club_id: string; name: string }): Event {
    const id = `evt-${Date.now()}`;
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newEvent: Event = {
      id,
      club_id: data.club_id,
      name: data.name,
      slug,
      description: data.description || '',
      event_type: data.event_type || 'solo',
      min_team_size: data.min_team_size,
      max_team_size: data.max_team_size,
      poster_url: data.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      logo_url: data.logo_url,
      venue: data.venue || 'College Auditorium',
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || new Date().toISOString().split('T')[0],
      start_time: data.start_time || '09:00 AM',
      end_time: data.end_time || '05:00 PM',
      registration_open: data.registration_open || new Date().toISOString(),
      registration_close: data.registration_close || new Date(Date.now() + 86400000 * 30).toISOString(),
      capacity: data.capacity !== undefined ? data.capacity : 500,
      auto_close_on_capacity: data.auto_close_on_capacity ?? true,
      auto_closed_at: data.auto_closed_at,
      fee: data.fee || 0,
      currency: data.currency || 'INR',
      upi_id: data.upi_id || 'college@upi',
      payment_instructions: data.payment_instructions || 'Scan the QR code and provide your UPI Reference/UTR ID.',
      payment_enabled: data.payment_enabled ?? (data.fee ? data.fee > 0 : false),
      status: data.status || 'REGISTRATION_OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.events.push(newEvent);

    // If custom form fields provided
    if (data.form_fields && Array.isArray(data.form_fields)) {
      data.form_fields.forEach((f, idx) => {
        this.data.event_form_fields.push({
          ...f,
          id: `ff-${Date.now()}-${idx}`,
          event_id: id,
          sort_order: idx + 1,
        });
      });
    }

    this.save();
    this.checkAndAutoCloseEvent(id);
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<Event>): Event | null {
    const index = this.data.events.findIndex(e => e.id === id);
    if (index === -1) return null;

    // If organizer manually reopens the event, clear the auto-closed timestamp
    const autoClosedAt = updates.status === 'REGISTRATION_OPEN'
      ? undefined
      : (updates.auto_closed_at !== undefined ? updates.auto_closed_at : this.data.events[index].auto_closed_at);

    this.data.events[index] = {
      ...this.data.events[index],
      ...updates,
      auto_closed_at: autoClosedAt,
      updated_at: new Date().toISOString(),
    };

    if (updates.form_fields && Array.isArray(updates.form_fields)) {
      // replace form fields
      this.data.event_form_fields = this.data.event_form_fields.filter(f => f.event_id !== id);
      updates.form_fields.forEach((f, idx) => {
        this.data.event_form_fields.push({
          ...f,
          id: f.id || `ff-${Date.now()}-${idx}`,
          event_id: id,
          sort_order: idx + 1,
        });
      });
    }

    this.save();

    // Check capacity if still open and auto-close is enabled
    if (this.data.events[index].status === 'REGISTRATION_OPEN') {
      this.checkAndAutoCloseEvent(id);
    }

    return this.getEventById(id) || null;
  }

  /**
   * Automatically closes registrations when maximum event capacity is reached
   */
  public checkAndAutoCloseEvent(eventId: string): boolean {
    const event = this.data.events.find(e => e.id === eventId);
    if (!event || !event.capacity) return false;
    // Auto-close feature is enabled by default unless explicitly turned off
    if (event.auto_close_on_capacity === false) return false;

    // Count confirmed attendees
    const confirmedCount = this.data.registrations.filter(
      r => r.event_id === eventId && r.registration_status === 'CONFIRMED'
    ).length;

    // Count active submissions (pending verification or confirmed)
    const activeCount = this.data.registrations.filter(
      r => r.event_id === eventId && r.registration_status !== 'CANCELLED' && r.registration_status !== 'REJECTED'
    ).length;

    // For free events, confirmedCount equals total attendees.
    // For paid events, both confirmed and submitted pending seats count toward quota.
    const isCapacityFull = event.fee > 0
      ? (activeCount >= event.capacity || confirmedCount >= event.capacity)
      : (confirmedCount >= event.capacity);

    if (isCapacityFull && event.status === 'REGISTRATION_OPEN') {
      event.status = 'REGISTRATION_CLOSED';
      event.auto_closed_at = new Date().toISOString();
      event.updated_at = new Date().toISOString();

      this.auditLog(
        'system@eventportal.internal',
        'EVENT_AUTO_CLOSED_CAPACITY_REACHED',
        'event',
        eventId,
        {
          event_name: event.name,
          capacity: event.capacity,
          confirmed_count: confirmedCount,
          active_count: activeCount,
          reason: `Auto-closed: Maximum target capacity of ${event.capacity} seats reached.`,
        }
      );

      this.save();
      return true;
    }

    return false;
  }

  public deleteEvent(id: string): { success: boolean; error?: string } {
    const index = this.data.events.findIndex(e => e.id === id);
    if (index === -1) return { success: false, error: 'Event not found' };

    // Remove event and cascading records
    this.data.events.splice(index, 1);
    this.data.event_form_fields = this.data.event_form_fields.filter(f => f.event_id !== id);

    const regIds = new Set(this.data.registrations.filter(r => r.event_id === id).map(r => r.id));
    this.data.registrations = this.data.registrations.filter(r => r.event_id !== id);
    this.data.payments = this.data.payments.filter(p => p.event_id !== id);
    this.data.attendance = this.data.attendance.filter(a => a.event_id !== id);
    this.data.scanners = this.data.scanners.filter(s => s.event_id !== id);
    this.data.email_logs = this.data.email_logs.filter(e => !regIds.has(e.registration_id));
    this.data.google_sheet_integrations = this.data.google_sheet_integrations.filter(g => g.event_id !== id);

    this.save();
    return { success: true };
  }

  // --- Registrations ---
  public getRegistrations(eventId?: string): Registration[] {
    let list = this.data.registrations;
    if (eventId) {
      list = list.filter(r => r.event_id === eventId);
    }
    // enrich with attendance data if checked in
    return list.map(r => {
      const att = this.data.attendance.find(a => a.registration_id === r.id);
      const event = this.data.events.find(e => e.id === r.event_id);
      return {
        ...r,
        event_name: event?.name,
        attendance_status: (att ? 'CHECKED_IN' : 'NOT_CHECKED_IN') as AttendanceStatus,
        check_in_time: att?.check_in_time,
        gate: att?.gate,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getRegistrationById(id: string): Registration | undefined {
    const reg = this.data.registrations.find(r => r.id === id || r.registration_number === id);
    if (!reg) return undefined;
    const att = this.data.attendance.find(a => a.registration_id === reg.id);
    const event = this.data.events.find(e => e.id === reg.event_id);
    return {
      ...reg,
      event_name: event?.name,
      attendance_status: (att ? 'CHECKED_IN' : 'NOT_CHECKED_IN') as AttendanceStatus,
      check_in_time: att?.check_in_time,
      gate: att?.gate,
    };
  }

  public getRegistrationByToken(token: string): Registration | undefined {
    const reg = this.data.registrations.find(r => r.qr_token === token);
    if (!reg) return undefined;
    const att = this.data.attendance.find(a => a.registration_id === reg.id);
    const event = this.data.events.find(e => e.id === reg.event_id);
    return {
      ...reg,
      event_name: event?.name,
      attendance_status: (att ? 'CHECKED_IN' : 'NOT_CHECKED_IN') as AttendanceStatus,
      check_in_time: att?.check_in_time,
      gate: att?.gate,
    };
  }

  public checkDuplicate(eventId: string, email: string, phone: string): { isDuplicate: boolean; existingReg?: Registration; reason?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    const existingByEmail = this.data.registrations.find(
      r => r.event_id === eventId && r.email.trim().toLowerCase() === normalizedEmail
    );
    if (existingByEmail) {
      return { isDuplicate: true, existingReg: existingByEmail, reason: 'Email already registered for this event' };
    }

    const existingByPhone = this.data.registrations.find(
      r => r.event_id === eventId && r.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone
    );
    if (existingByPhone) {
      return { isDuplicate: true, existingReg: existingByPhone, reason: 'Phone number already registered for this event' };
    }

    return { isDuplicate: false };
  }

  public createRegistration(params: {
    event_id: string;
    name: string;
    phone: string;
    email: string;
    college: string;
    department: string;
    transaction_id?: string;
    custom_fields?: Record<string, any>;
    team_name?: string;
    team_members?: TeamMember[];
    screening_document_url?: string;
  }): { registration: Registration; isNew: boolean } {
    const event = this.getEventById(params.event_id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.event_type === 'team') {
      if (!params.team_name) {
        throw new Error('Team name is required for team events');
      }
      if (!params.team_members || params.team_members.length < (event.min_team_size || 1)) {
        throw new Error(`Minimum ${event.min_team_size || 1} team members required`);
      }
      if (event.max_team_size && params.team_members.length > event.max_team_size) {
        throw new Error(`Maximum ${event.max_team_size} team members allowed`);
      }
    }

    // Status check
    if (event.status === 'REGISTRATION_CLOSED' || event.status === 'EVENT_COMPLETED' || event.status === 'ARCHIVED') {
      throw new Error('Registrations are currently closed for this event.');
    }

    // Capacity check & auto close
    if (event.capacity) {
      const confirmedCount = this.data.registrations.filter(
        r => r.event_id === params.event_id && r.registration_status === 'CONFIRMED'
      ).length;
      const activeCount = this.data.registrations.filter(
        r => r.event_id === params.event_id && r.registration_status !== 'CANCELLED' && r.registration_status !== 'REJECTED'
      ).length;

      const isCapacityFull = event.fee > 0
        ? (activeCount >= event.capacity || confirmedCount >= event.capacity)
        : (confirmedCount >= event.capacity);

      if (isCapacityFull) {
        if (event.auto_close_on_capacity !== false && event.status === 'REGISTRATION_OPEN') {
          this.checkAndAutoCloseEvent(event.id);
        }
        throw new Error(`Registration is full. Maximum capacity of ${event.capacity} has been reached.`);
      }
    }

    // Duplicate check
    const dup = this.checkDuplicate(params.event_id, params.email, params.phone);
    if (dup.isDuplicate && dup.existingReg) {
      return { registration: dup.existingReg, isNew: false };
    }

    // Sequential human-readable registration ID: REG-2026-000128
    const eventRegistrations = this.data.registrations.filter(r => r.event_id === params.event_id);
    const count = eventRegistrations.length + 101;
    const year = new Date().getFullYear();
    const registration_number = `REG-${year}-${count.toString().padStart(6, '0')}`;

    const id = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // If event is free, automatically confirm!
    const isFree = !event.payment_enabled || event.fee === 0;
    const payment_status = isFree ? 'VERIFIED' : 'PENDING';
    const registration_status = isFree ? 'CONFIRMED' : 'PENDING';

    // If confirmed immediately, generate secure opaque QR token
    const qr_token = isFree ? crypto.randomBytes(16).toString('hex') : undefined;

    const registration: Registration = {
      id,
      event_id: params.event_id,
      event_name: event.name,
      registration_number,
      name: params.name.trim(),
      phone: params.phone.trim(),
      email: params.email.trim().toLowerCase(),
      college: params.college.trim(),
      department: params.department.trim(),
      transaction_id: params.transaction_id?.trim() || (isFree ? 'FREE_PASS' : undefined),
      payment_status,
      registration_status,
      attendance_status: 'NOT_CHECKED_IN',
      qr_token,
      custom_fields: params.custom_fields || {},
      team_name: params.team_name,
      team_members: params.team_members,
      screening_document_url: params.screening_document_url,
      screening_status: params.screening_document_url ? 'pending' : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.registrations.push(registration);

    // Add payment entry if payment was made
    if (event.payment_enabled && params.transaction_id) {
      const payment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        registration_id: id,
        event_id: params.event_id,
        registration_number,
        participant_name: params.name,
        amount: event.fee,
        currency: event.currency || 'INR',
        transaction_id: params.transaction_id.trim(),
        payment_status: isFree ? 'VERIFIED' : 'PENDING',
        created_at: new Date().toISOString(),
      };
      this.data.payments.push(payment);
    }

    // Log email
    const emailLog: EmailLog = {
      id: `eml-${Date.now()}`,
      registration_id: id,
      recipient: registration.email,
      type: isFree ? 'REGISTRATION_CONFIRMED' : 'REGISTRATION_RECEIVED',
      status: 'SENT',
      subject: isFree
        ? `Registration Confirmed: ${event.name} [${registration_number}]`
        : `Registration Received: ${event.name} [${registration_number}]`,
      body_preview: isFree
        ? `Hello ${registration.name}, your registration is confirmed. Your check-in pass has been generated.`
        : `Hello ${registration.name}, your registration for ${event.name} has been received and is awaiting payment verification.`,
      sent_at: new Date().toISOString(),
      provider_message_id: `mock_mail_${Date.now()}`,
    };
    this.data.email_logs.push(emailLog);

    this.save();
    this.checkAndAutoCloseEvent(params.event_id);
    return { registration, isNew: true };
  }

  // --- Payment Verification ---
  public verifyPayment(registrationId: string, verifiedBy: string): { success: boolean; registration?: Registration } {
    const regIndex = this.data.registrations.findIndex(r => r.id === registrationId || r.registration_number === registrationId);
    if (regIndex === -1) return { success: false };

    const reg = this.data.registrations[regIndex];
    reg.payment_status = 'VERIFIED';
    reg.registration_status = 'CONFIRMED';
    // Generate cryptographically secure random opaque token if not already exists
    if (!reg.qr_token) {
      reg.qr_token = crypto.randomBytes(16).toString('hex');
    }
    reg.updated_at = new Date().toISOString();

    // Update payment record
    const pay = this.data.payments.find(p => p.registration_id === reg.id);
    if (pay) {
      pay.payment_status = 'VERIFIED';
      pay.verified_by = verifiedBy;
      pay.verified_at = new Date().toISOString();
    }

    // Log confirmation email
    const event = this.getEventById(reg.event_id);
    const emailLog: EmailLog = {
      id: `eml-${Date.now()}`,
      registration_id: reg.id,
      recipient: reg.email,
      type: 'REGISTRATION_CONFIRMED',
      status: 'SENT',
      subject: `Registration Confirmed: ${event?.name || 'College Event'} [${reg.registration_number}]`,
      body_preview: `Hello ${reg.name}, your payment of ₹${event?.fee || 0} has been verified. Present your QR code pass at check-in.`,
      sent_at: new Date().toISOString(),
      provider_message_id: `msg_verify_${Date.now()}`,
    };
    this.data.email_logs.push(emailLog);

    // Audit log
    this.auditLog(verifiedBy, 'PAYMENT_VERIFIED', 'payment', pay?.id || reg.id, {
      registration_number: reg.registration_number,
      participant: reg.name,
      transaction_id: reg.transaction_id,
    });

    // Sync Google Sheet if active
    const sheet = this.data.google_sheet_integrations.find(s => s.event_id === reg.event_id);
    if (sheet) {
      sheet.sync_status = 'SYNCED';
      sheet.last_synced_at = new Date().toISOString();
      sheet.records_synced += 1;
    }

    this.save();
    this.checkAndAutoCloseEvent(reg.event_id);
    return { success: true, registration: reg };
  }

  public rejectPayment(registrationId: string, rejectionReason: string, rejectedBy: string): { success: boolean; registration?: Registration } {
    const regIndex = this.data.registrations.findIndex(r => r.id === registrationId || r.registration_number === registrationId);
    if (regIndex === -1) return { success: false };

    const reg = this.data.registrations[regIndex];
    reg.payment_status = 'REJECTED';
    reg.registration_status = 'REJECTED';
    reg.updated_at = new Date().toISOString();

    const pay = this.data.payments.find(p => p.registration_id === reg.id);
    if (pay) {
      pay.payment_status = 'REJECTED';
      pay.rejection_reason = rejectionReason;
      pay.verified_by = rejectedBy;
      pay.verified_at = new Date().toISOString();
    }

    const event = this.getEventById(reg.event_id);
    const emailLog: EmailLog = {
      id: `eml-${Date.now()}`,
      registration_id: reg.id,
      recipient: reg.email,
      type: 'PAYMENT_REJECTED',
      status: 'SENT',
      subject: `Payment Update: ${event?.name || 'College Event'} [${reg.registration_number}]`,
      body_preview: `Hello ${reg.name}, your payment for ${event?.name} could not be verified. Reason: ${rejectionReason}. Please contact the organizers.`,
      sent_at: new Date().toISOString(),
      provider_message_id: `msg_reject_${Date.now()}`,
    };
    this.data.email_logs.push(emailLog);

    this.auditLog(rejectedBy, 'PAYMENT_REJECTED', 'payment', pay?.id || reg.id, {
      registration_number: reg.registration_number,
      reason: rejectionReason,
    });

    this.save();
    return { success: true, registration: reg };
  }

  // --- Registration Management (Update / Delete / Manual Desk Add) ---
  public updateRegistration(id: string, updates: Partial<Registration>): Registration | null {
    const index = this.data.registrations.findIndex(r => r.id === id);
    if (index === -1) return null;

    const current = this.data.registrations[index];

    // If payment status changed to VERIFIED and no QR token exists, generate one
    let qr_token = updates.qr_token !== undefined ? updates.qr_token : current.qr_token;
    let regStatus = updates.registration_status || current.registration_status;
    const paymentStatus = updates.payment_status || current.payment_status;

    if (paymentStatus === 'VERIFIED') {
      regStatus = 'CONFIRMED';
      if (!qr_token) {
        qr_token = crypto.randomBytes(16).toString('hex');
      }
    }

    const updated: Registration = {
      ...current,
      ...updates,
      payment_status: paymentStatus,
      registration_status: regStatus,
      qr_token,
      updated_at: new Date().toISOString(),
    };

    this.data.registrations[index] = updated;

    // Sync corresponding payment entry if present
    const payIndex = this.data.payments.findIndex(p => p.registration_id === id);
    if (payIndex !== -1) {
      this.data.payments[payIndex] = {
        ...this.data.payments[payIndex],
        participant_name: updated.name,
        transaction_id: updated.transaction_id || this.data.payments[payIndex].transaction_id,
        payment_status: paymentStatus,
      };
    }

    // Sync attendance if attendance_status explicitly set
    if (updates.attendance_status === 'CHECKED_IN') {
      const existingAtt = this.data.attendance.find(a => a.registration_id === id);
      if (!existingAtt) {
        this.data.attendance.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          registration_id: updated.id,
          event_id: updated.event_id,
          participant_name: updated.name,
          registration_number: updated.registration_number,
          college: updated.college,
          department: updated.department,
          check_in_time: new Date().toISOString(),
          gate: updates.gate || 'Admin Desk',
          scanner_id: 'admin-manual',
          checked_in_by: 'Admin Desk',
          created_at: new Date().toISOString(),
        });
      }
    } else if (updates.attendance_status === 'NOT_CHECKED_IN') {
      this.data.attendance = this.data.attendance.filter(a => a.registration_id !== id);
      updated.check_in_time = undefined;
      updated.gate = undefined;
    }

    this.save();
    this.checkAndAutoCloseEvent(updated.event_id);
    return updated;
  }

  public deleteRegistration(id: string): boolean {
    const index = this.data.registrations.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.data.registrations.splice(index, 1);
    this.data.payments = this.data.payments.filter(p => p.registration_id !== id);
    this.data.attendance = this.data.attendance.filter(a => a.registration_id !== id);
    this.data.email_logs = this.data.email_logs.filter(e => e.registration_id !== id);

    this.save();
    return true;
  }

  public createManualRegistration(params: {
    event_id: string;
    name: string;
    phone: string;
    email: string;
    college?: string;
    department?: string;
    payment_status?: PaymentStatus;
    attendance_status?: AttendanceStatus;
    gate?: string;
    transaction_id?: string;
    custom_fields?: Record<string, any>;
    created_by?: string;
  }): Registration {
    const event = this.getEventById(params.event_id);
    if (!event) throw new Error('Event not found');

    const year = new Date().getFullYear();
    const count = this.data.registrations.filter(r => r.event_id === params.event_id).length + 1;
    const registration_number = `REG-${year}-${count.toString().padStart(6, '0')}`;
    const id = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const payStatus: PaymentStatus = params.payment_status || 'VERIFIED';
    const regStatus: RegistrationStatus = payStatus === 'VERIFIED' ? 'CONFIRMED' : 'PENDING';
    const qr_token = payStatus === 'VERIFIED' ? crypto.randomBytes(16).toString('hex') : undefined;

    const registration: Registration = {
      id,
      event_id: params.event_id,
      event_name: event.name,
      registration_number,
      name: params.name.trim(),
      phone: params.phone.trim(),
      email: params.email.trim().toLowerCase(),
      college: (params.college || 'College Campus').trim(),
      department: (params.department || 'General').trim(),
      transaction_id: params.transaction_id?.trim() || 'DESK-MANUAL',
      payment_status: payStatus,
      registration_status: regStatus,
      attendance_status: params.attendance_status || 'NOT_CHECKED_IN',
      qr_token,
      custom_fields: params.custom_fields || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.registrations.push(registration);

    // Add payment entry
    if (event.fee > 0 || params.transaction_id) {
      this.data.payments.push({
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        registration_id: id,
        event_id: params.event_id,
        registration_number,
        participant_name: registration.name,
        amount: event.fee,
        currency: event.currency || 'INR',
        transaction_id: registration.transaction_id || 'DESK-MANUAL',
        payment_status: payStatus,
        verified_by: params.created_by || 'Admin Desk',
        verified_at: payStatus === 'VERIFIED' ? new Date().toISOString() : undefined,
        created_at: new Date().toISOString(),
      });
    }

    // If marked checked in immediately at desk
    if (params.attendance_status === 'CHECKED_IN') {
      const now = new Date().toISOString();
      registration.check_in_time = now;
      registration.gate = params.gate || 'Registration Desk';

      this.data.attendance.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        registration_id: id,
        event_id: params.event_id,
        participant_name: registration.name,
        registration_number,
        college: registration.college,
        department: registration.department,
        check_in_time: now,
        gate: params.gate || 'Registration Desk',
        scanner_id: 'admin-manual',
        checked_in_by: params.created_by || 'Admin Desk',
        created_at: now,
      });
    }

    this.save();
    this.checkAndAutoCloseEvent(params.event_id);
    return registration;
  }

  // --- Payment Management (Add / Edit / Delete) ---
  public addPayment(params: {
    registration_id: string;
    amount?: number;
    transaction_id?: string;
    verified_by?: string;
    payment_status?: PaymentStatus;
  }): Payment | null {
    const reg = this.data.registrations.find(r => r.id === params.registration_id);
    if (!reg) return null;

    const event = this.data.events.find(e => e.id === reg.event_id);
    const id = `pay-${crypto.randomBytes(4).toString('hex')}`;
    const payment: Payment = {
      id,
      registration_id: reg.id,
      event_id: reg.event_id,
      registration_number: reg.registration_number,
      participant_name: reg.name,
      amount: params.amount !== undefined ? params.amount : (event?.fee || 0),
      currency: event?.currency || 'INR',
      transaction_id: params.transaction_id || `OFFLINE-${Date.now()}`,
      payment_status: params.payment_status || 'VERIFIED',
      verified_by: params.verified_by || 'Admin',
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Replace any existing payment for this registration
    this.data.payments = this.data.payments.filter(p => p.registration_id !== reg.id);
    this.data.payments.push(payment);

    reg.transaction_id = payment.transaction_id;
    reg.payment_status = payment.payment_status;
    if (payment.payment_status === 'VERIFIED') {
      reg.registration_status = 'CONFIRMED';
      if (!reg.qr_token) {
        reg.qr_token = crypto.randomBytes(16).toString('hex');
      }
    }
    reg.updated_at = new Date().toISOString();
    this.save();
    return payment;
  }

  public updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    const index = this.data.payments.findIndex(p => p.id === id);
    if (index === -1) return null;

    const current = this.data.payments[index];
    const updated: Payment = {
      ...current,
      ...updates,
    };
    this.data.payments[index] = updated;

    // Sync with registration if status or transaction_id changed
    const reg = this.data.registrations.find(r => r.id === updated.registration_id);
    if (reg) {
      if (updates.transaction_id !== undefined) {
        reg.transaction_id = updates.transaction_id;
      }
      if (updates.payment_status) {
        reg.payment_status = updates.payment_status;
        if (updates.payment_status === 'VERIFIED') {
          reg.registration_status = 'CONFIRMED';
          if (!reg.qr_token) {
            reg.qr_token = crypto.randomBytes(16).toString('hex');
          }
        } else if (updates.payment_status === 'REJECTED') {
          reg.registration_status = 'REJECTED';
        }
      }
      reg.updated_at = new Date().toISOString();
    }

    this.save();
    return updated;
  }

  public deletePayment(id: string, resetRegistration: boolean = true): boolean {
    const index = this.data.payments.findIndex(p => p.id === id);
    if (index === -1) return false;
    const payment = this.data.payments[index];
    this.data.payments.splice(index, 1);

    if (resetRegistration && payment.registration_id) {
      const reg = this.data.registrations.find(r => r.id === payment.registration_id);
      if (reg) {
        reg.transaction_id = undefined;
        reg.payment_status = 'PENDING';
        reg.updated_at = new Date().toISOString();
      }
    }

    this.save();
    return true;
  }

  // --- Attendance Reset & Event Data Clear ---
  public resetAttendance(registrationId: string): boolean {
    const reg = this.data.registrations.find(r => r.id === registrationId);
    if (!reg) return false;

    this.data.attendance = this.data.attendance.filter(a => a.registration_id !== registrationId);
    reg.attendance_status = 'NOT_CHECKED_IN';
    reg.check_in_time = undefined;
    reg.gate = undefined;
    reg.updated_at = new Date().toISOString();

    this.save();
    return true;
  }

  public clearEventData(eventId: string): { clearedRegistrations: number; clearedPayments: number; clearedAttendance: number } {
    const targetRegs = this.data.registrations.filter(r => r.event_id === eventId);
    const regIds = new Set(targetRegs.map(r => r.id));

    const clearedRegistrations = targetRegs.length;
    const clearedPayments = this.data.payments.filter(p => p.event_id === eventId).length;
    const clearedAttendance = this.data.attendance.filter(a => a.event_id === eventId).length;

    this.data.registrations = this.data.registrations.filter(r => r.event_id !== eventId);
    this.data.payments = this.data.payments.filter(p => p.event_id !== eventId);
    this.data.attendance = this.data.attendance.filter(a => a.event_id !== eventId);
    this.data.email_logs = this.data.email_logs.filter(e => !regIds.has(e.registration_id));

    this.save();
    return { clearedRegistrations, clearedPayments, clearedAttendance };
  }
  public checkIn(params: {
    qr_token: string;
    event_id: string;
    gate?: string;
    scanner_id?: string;
    checked_in_by?: string;
    member_indices?: number[];
  }): {
    success: boolean;
    status: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'INVALID_TOKEN' | 'WRONG_EVENT' | 'UNCONFIRMED_PAYMENT' | 'TEAM_SELECTION_REQUIRED';
    message: string;
    participant?: Registration;
    attendance?: Attendance;
  } {
    const { qr_token, event_id, gate = 'Gate 1 (Main Entrance)', scanner_id = 'scanner-default', checked_in_by = 'Organizer', member_indices } = params;

    // 1. Find registration by QR token
    const reg = this.data.registrations.find(r => r.qr_token === qr_token);
    if (!reg) {
      return {
        success: false,
        status: 'INVALID_TOKEN',
        message: 'This QR pass is not recognized in the system.',
      };
    }

    const event = this.getEventById(reg.event_id);

    // 2. Event verification
    if (reg.event_id !== event_id) {
      return {
        success: false,
        status: 'WRONG_EVENT',
        message: 'QR code belongs to a different event.',
        participant: reg,
      };
    }

    // 3. Payment & Confirmation check
    if (reg.payment_status !== 'VERIFIED' || reg.registration_status !== 'CONFIRMED') {
      return {
        success: false,
        status: 'UNCONFIRMED_PAYMENT',
        message: 'Registration is not confirmed. Payment status: ' + reg.payment_status,
        participant: reg,
      };
    }

    // 4. Team Selection
    if (event?.event_type === 'team' && reg.team_members && reg.team_members.length > 0) {
      if (!member_indices) {
        return {
          success: false,
          status: 'TEAM_SELECTION_REQUIRED',
          message: 'Please select which team members are present.',
          participant: reg,
        };
      }

      // Mark selected members as checked in
      let anyNewCheckIn = false;
      member_indices.forEach(idx => {
        if (reg.team_members && reg.team_members[idx] && !reg.team_members[idx].checked_in) {
          reg.team_members[idx].checked_in = true;
          reg.team_members[idx].checked_in_at = new Date().toISOString();
          anyNewCheckIn = true;
        }
      });

      if (!anyNewCheckIn) {
        return {
          success: false,
          status: 'ALREADY_CHECKED_IN',
          message: 'Selected participants are already checked in.',
          participant: reg,
        };
      }
    } else {
      // 4. Duplicate check-in check for solo
      const existingAttendance = this.data.attendance.find(a => a.registration_id === reg.id);
      if (existingAttendance) {
        return {
          success: false,
          status: 'ALREADY_CHECKED_IN',
          message: 'Participant is already checked in.',
          participant: reg,
          attendance: existingAttendance,
        };
      }
    }

    // 5. Record new attendance
    const now = new Date().toISOString();
    const newAttendance: Attendance = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      registration_id: reg.id,
      event_id: reg.event_id,
      participant_name: reg.name,
      registration_number: reg.registration_number,
      college: reg.college,
      department: reg.department,
      check_in_time: now,
      gate,
      scanner_id,
      checked_in_by,
      created_at: now,
    };

    this.data.attendance.push(newAttendance);
    reg.attendance_status = 'CHECKED_IN';
    reg.updated_at = now;

    this.auditLog(checked_in_by, 'PARTICIPANT_CHECKED_IN', 'attendance', newAttendance.id, {
      registration_number: reg.registration_number,
      participant: reg.name,
      gate,
      check_in_time: now,
    });

    this.save();
    return {
      success: true,
      status: 'SUCCESS',
      message: 'Check-in successful!',
      participant: reg,
      attendance: newAttendance,
    };
  }

  public manualCheckIn(params: {
    registration_id: string;
    event_id: string;
    gate?: string;
    checked_in_by: string;
    reason?: string;
    member_indices?: number[];
  }): { success: boolean; status?: string; message: string; participant?: Registration; attendance?: Attendance } {
    const reg = this.data.registrations.find(
      r => (r.id === params.registration_id || r.registration_number === params.registration_id) && r.event_id === params.event_id
    );

    if (!reg) {
      return { success: false, status: 'NOT_FOUND', message: 'Registration record not found for this event' };
    }

    const event = this.getEventById(reg.event_id);

    if (reg.registration_status !== 'CONFIRMED') {
      return { success: false, status: 'UNCONFIRMED_PAYMENT', message: 'Cannot check in: Registration is ' + reg.registration_status };
    }

    // Team Selection
    if (event?.event_type === 'team' && reg.team_members && reg.team_members.length > 0) {
      if (!params.member_indices) {
        return {
          success: false,
          status: 'TEAM_SELECTION_REQUIRED',
          message: 'Please select which team members are present.',
          participant: reg,
        };
      }

      // Mark selected members as checked in
      let anyNewCheckIn = false;
      params.member_indices.forEach(idx => {
        if (reg.team_members && reg.team_members[idx] && !reg.team_members[idx].checked_in) {
          reg.team_members[idx].checked_in = true;
          reg.team_members[idx].checked_in_at = new Date().toISOString();
          anyNewCheckIn = true;
        }
      });

      if (!anyNewCheckIn) {
        return {
          success: false,
          status: 'ALREADY_CHECKED_IN',
          message: 'Selected participants are already checked in.',
          participant: reg,
        };
      }
    } else {
      const existingAttendance = this.data.attendance.find(a => a.registration_id === reg.id);
      if (existingAttendance) {
        return { success: false, status: 'ALREADY_CHECKED_IN', message: 'Participant is already checked in', participant: reg, attendance: existingAttendance };
      }
    }

    const now = new Date().toISOString();
    const newAttendance: Attendance = {
      id: `att-manual-${Date.now()}`,
      registration_id: reg.id,
      event_id: reg.event_id,
      participant_name: reg.name,
      registration_number: reg.registration_number,
      college: reg.college,
      department: reg.department,
      check_in_time: now,
      gate: params.gate || 'Manual Desk Fallback',
      scanner_id: 'manual-search-checkin',
      checked_in_by: params.checked_in_by,
      created_at: now,
    };

    this.data.attendance.push(newAttendance);
    reg.attendance_status = 'CHECKED_IN';
    reg.updated_at = now;

    this.auditLog(params.checked_in_by, 'MANUAL_CHECKIN_PERFORMED', 'attendance', newAttendance.id, {
      registration_number: reg.registration_number,
      reason: params.reason || 'Manual check-in by organizer',
    });

    this.save();
    return { success: true, message: 'Manual check-in recorded successfully', participant: reg, attendance: newAttendance };
  }

  // --- Analytics & KPIs ---
  public getKPIs(eventId?: string): EventKPIs {
    const regs = eventId ? this.data.registrations.filter(r => r.event_id === eventId) : this.data.registrations;
    const event = eventId ? this.getEventById(eventId) : null;

    const total_registrations = regs.length;
    const confirmed_registrations = regs.filter(r => r.registration_status === 'CONFIRMED').length;
    const pending_payments = regs.filter(r => r.payment_status === 'PENDING').length;
    const verified_payments = regs.filter(r => r.payment_status === 'VERIFIED').length;
    const rejected_payments = regs.filter(r => r.payment_status === 'REJECTED').length;

    // Checked in
    const checked_in = regs.filter(r => {
      return this.data.attendance.some(a => a.registration_id === r.id);
    }).length;

    const not_checked_in = Math.max(0, confirmed_registrations - checked_in);
    const attendance_percentage = confirmed_registrations > 0 ? parseFloat(((checked_in / confirmed_registrations) * 100).toFixed(1)) : 0;

    // Revenue calculation
    let total_revenue = 0;
    this.data.payments
      .filter(p => (!eventId || p.event_id === eventId) && p.payment_status === 'VERIFIED')
      .forEach(p => {
        total_revenue += p.amount;
      });

    return {
      total_registrations,
      confirmed_registrations,
      pending_payments,
      verified_payments,
      rejected_payments,
      checked_in,
      not_checked_in,
      attendance_percentage,
      total_revenue,
      capacity: event?.capacity,
    };
  }

  public getAnalytics(eventId: string) {
    const regs = this.data.registrations.filter(r => r.event_id === eventId);
    const atts = this.data.attendance.filter(a => a.event_id === eventId);

    // 1. College distribution
    const collegeMap: Record<string, number> = {};
    regs.forEach(r => {
      collegeMap[r.college] = (collegeMap[r.college] || 0) + 1;
    });
    const collegeDistribution = Object.entries(collegeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 2. Department distribution
    const deptMap: Record<string, number> = {};
    regs.forEach(r => {
      deptMap[r.department] = (deptMap[r.department] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Gate distribution
    const gateMap: Record<string, number> = {};
    atts.forEach(a => {
      gateMap[a.gate] = (gateMap[a.gate] || 0) + 1;
    });
    const gateDistribution = Object.entries(gateMap).map(([name, count]) => ({ name, count }));

    // 4. Check-in timeline
    const checkinTimeline = atts.map(a => ({
      time: a.check_in_time,
      name: a.participant_name,
      gate: a.gate,
    }));

    return {
      kpis: this.getKPIs(eventId),
      collegeDistribution,
      departmentDistribution,
      gateDistribution,
      checkinTimeline,
    };
  }

  // --- Audit Logs ---
  public auditLog(userEmail: string, action: string, entityType: string, entityId: string, metadata?: Record<string, any>) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      timestamp: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  public getEmailLogs(eventId?: string): EmailLog[] {
    if (!eventId) return this.data.email_logs.slice(0, 100);
    const eventRegIds = new Set(this.data.registrations.filter(r => r.event_id === eventId).map(r => r.id));
    return this.data.email_logs.filter(e => eventRegIds.has(e.registration_id)).slice(0, 100);
  }

  // --- Automated Reminders ---
  public sendCheckinReminders(eventId: string, triggeredBy: string): { sentCount: number; targetCount: number } {
    const event = this.getEventById(eventId);
    if (!event) throw new Error('Event not found');

    // Confirmed registrations that have NOT checked in
    const targetRegs = this.data.registrations.filter(
      r => r.event_id === eventId && r.registration_status === 'CONFIRMED' && r.attendance_status === 'NOT_CHECKED_IN'
    );

    let sentCount = 0;
    targetRegs.forEach(reg => {
      const emailLog: EmailLog = {
        id: `eml-rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        registration_id: reg.id,
        recipient: reg.email,
        type: 'CHECKIN_REMINDER',
        status: 'SENT',
        subject: `Reminder: Check-in Open for ${event.name} [${reg.registration_number}]`,
        body_preview: `Your registration for ${event.name} is confirmed, but your attendance has not yet been recorded. Please present your QR pass at the entrance gate.`,
        sent_at: new Date().toISOString(),
        provider_message_id: `msg_rem_${Date.now()}`,
      };
      this.data.email_logs.push(emailLog);
      sentCount++;
    });

    this.auditLog(triggeredBy, 'REMINDERS_SENT', 'event', eventId, {
      event_name: event.name,
      sent_count: sentCount,
      target_count: targetRegs.length,
    });

    this.save();
    return { sentCount, targetCount: targetRegs.length };
  }
}

export const db = new DatabaseManager();

// Helper to generate dynamic QR codes as Data URL
export async function generateQRCode(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}
