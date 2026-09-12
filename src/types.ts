export type Role = 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'EVENT_ORGANIZER' | 'VOLUNTEER';
export type UserRole = Role;

export type AdminPermission =
  | 'qr_scanner'               // Scan passes at entrance gates (QR Camera & manual check-in)
  | 'participant_modification' // Add walk-ins, edit attendee info, delete records, reset check-ins
  | 'payment_verification'     // Approve, reject, and edit fee payments and UTRs
  | 'event_management'         // Create & edit events, venues, fees, and custom registration fields
  | 'club_management'          // Create & configure college clubs and societies
  | 'export_data'              // Download attendee rosters to Excel/CSV & sync Google Sheets
  | 'broadcast_settings'       // Dispatch check-in reminder broadcasts & purge demo data
  | 'user_management';         // Manage admin logins & delegate access permissions (Super Admin)

export interface PermissionDefinition {
  id: AdminPermission;
  label: string;
  shortLabel: string;
  description: string;
  category: 'gate' | 'desk' | 'finance' | 'admin';
}

export const ALL_ADMIN_PERMISSIONS: PermissionDefinition[] = [
  {
    id: 'qr_scanner',
    label: 'QR Gate Scanner',
    shortLabel: 'QR Scanner',
    description: 'Scan and validate participant QR passes at entrance gates',
    category: 'gate',
  },
  {
    id: 'participant_modification',
    label: 'Participant Data Modification',
    shortLabel: 'Participant Mod',
    description: 'Add walk-ins, modify attendee details, delete records, and reset check-in status',
    category: 'desk',
  },
  {
    id: 'payment_verification',
    label: 'Payment Verification',
    shortLabel: 'Payment Verify',
    description: 'Approve submitted UTR transactions, reject payments, and update fee records',
    category: 'finance',
  },
  {
    id: 'event_management',
    label: 'Events & Forms Builder',
    shortLabel: 'Events & Forms',
    description: 'Create and edit events, venues, ticket fees, and custom registration questions',
    category: 'admin',
  },
  {
    id: 'club_management',
    label: 'Clubs & Societies',
    shortLabel: 'Clubs',
    description: 'Create, edit, and configure college clubs and organizational scopes',
    category: 'admin',
  },
  {
    id: 'export_data',
    label: 'Data Export & Sync',
    shortLabel: 'Export & Sync',
    description: 'Download participant rosters to Excel/CSV and configure Google Sheets sync',
    category: 'admin',
  },
  {
    id: 'broadcast_settings',
    label: 'Broadcasts & Data Tools',
    shortLabel: 'Broadcast & Tools',
    description: 'Dispatch automated QR reminder emails to un-scanned attendees and purge records',
    category: 'admin',
  },
  {
    id: 'user_management',
    label: 'Admin Accounts & RBAC',
    shortLabel: 'User RBAC',
    description: 'Add other admin logins and delegate granular access permissions (Super Admin only)',
    category: 'admin',
  },
];

export function hasPermission(user: User | null | undefined, permission: AdminPermission): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export interface CheckInResult {
  success: boolean;
  status:
    | 'SUCCESS'
    | 'ALREADY_CHECKED_IN'
    | 'WRONG_EVENT'
    | 'UNCONFIRMED_PAYMENT'
    | 'INVALID_TOKEN'
    | 'EVENT_NOT_LIVE'
    | 'TEAM_SELECTION_REQUIRED';
  message: string;
  registration?: Registration;
  attendance?: Attendance;
}

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
export type AttendanceStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'PARTIAL';

export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_LIVE'
  | 'EVENT_COMPLETED'
  | 'ARCHIVED';

export interface TeamMember {
  name: string;
  phone?: string;
  checked_in: boolean;
  checked_in_at?: string;
}

export interface User {
  id: string;
  google_id?: string;
  email: string;
  name: string;
  role: Role;
  club_id?: string | null;
  avatar_url?: string;
  permissions?: AdminPermission[];
  created_at: string;
  last_login?: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  contact_email: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface EventFormField {
  id: string;
  event_id: string;
  field_name: string;
  label: string;
  field_type: 'text' | 'number' | 'email' | 'phone' | 'dropdown' | 'radio' | 'checkbox' | 'date';
  is_required: boolean;
  options?: string[]; // For dropdown, radio
  placeholder?: string;
  sort_order: number;
}

export interface Event {
  id: string;
  club_id: string;
  club_name?: string;
  name: string;
  slug: string;
  description: string;
  event_type?: 'solo' | 'team' | 'hackathon';
  min_team_size?: number;
  max_team_size?: number;
  poster_url: string;
  logo_url?: string;
  venue: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  registration_open: string;
  registration_close: string;
  capacity?: number;
  auto_close_on_capacity?: boolean;
  
  auto_closed_at?: string;
  
  // Hackathon specific config
  hackathon_settings?: {
    submission_opens?: string;
    submission_deadline?: string;
    allow_late_submissions?: boolean;
    sender_name?: string;
    reply_to?: string;
    shortlisted_email_subject?: string;
    shortlisted_email_body?: string;
    not_shortlisted_email_subject?: string;
    not_shortlisted_email_body?: string;
  };

  fee: number;
  currency: string;
  payment_qr_url?: string;
  upi_id?: string;
  payment_instructions?: string;
  payment_enabled: boolean;
  status: EventStatus;
  form_fields?: EventFormField[];
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  event_name?: string;
  registration_number: string;
  name: string;
  phone: string;
  email: string;
  college: string;
  department: string;
  transaction_id?: string;
  payment_status: PaymentStatus;
  registration_status: RegistrationStatus;
  attendance_status: AttendanceStatus;
  qr_token?: string;
  custom_fields?: Record<string, any>;

  team_name?: string;
  team_members?: TeamMember[];
  
  screening_document_url?: string;
  screening_status?: 'pending' | 'shortlisted' | 'rejected';
  
  // Advanced Hackathon Fields
  hackathon_submission?: {
    file_name: string;
    file_url: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
    submission_status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UPDATED';
    reviewer_id?: string;
    reviewer_name?: string;
    reviewer_comment?: string;
    reviewed_at?: string;
    email_status?: 'NOT_SENT' | 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
    email_sent_at?: string;
    email_error?: string;
  };

  created_at: string;

  updated_at: string;
  // Computed / joined fields
  check_in_time?: string;
  gate?: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  event_id: string;
  registration_number: string;
  participant_name: string;
  amount: number;
  currency: string;
  transaction_id: string;
  payment_status: PaymentStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  registration_id: string;
  event_id: string;
  participant_name: string;
  registration_number: string;
  college: string;
  department: string;
  check_in_time: string;
  gate: string;
  scanner_id: string;
  checked_in_by: string;
  created_at: string;
}

export interface Scanner {
  id: string;
  name: string;
  gate_name: string;
  event_id: string;
  is_active: boolean;
  last_active_at: string;
}

export interface EmailLog {
  id: string;
  registration_id: string;
  recipient: string;
  type: 'REGISTRATION_RECEIVED' | 'REGISTRATION_CONFIRMED' | 'PAYMENT_REJECTED' | 'CHECKIN_REMINDER' | 'QR_RESENT';
  status: 'SENT' | 'FAILED' | 'PENDING';
  subject: string;
  body_preview: string;
  sent_at: string;
  provider_message_id?: string;
  error?: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GoogleSheetIntegration {
  id: string;
  event_id: string;
  sheet_id: string;
  sheet_title: string;
  sync_status: 'SYNCED' | 'SYNC_PENDING' | 'SYNC_FAILED';
  last_synced_at: string;
  records_synced: number;
  error_message?: string;
}

export interface EventKPIs {
  total_registrations: number;
  confirmed_registrations: number;
  pending_payments: number;
  verified_payments: number;
  rejected_payments: number;
  checked_in: number;
  not_checked_in: number;
  attendance_percentage: number;
  total_revenue: number;
  capacity?: number;
}
