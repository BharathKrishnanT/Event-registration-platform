import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Mail,
  X,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertTriangle,
  QrCode,
  UserCog,
  CreditCard,
  Calendar,
  Building2,
  FileSpreadsheet,
  BellRing,
  Lock,
  Eye,
  KeyRound,
  Sparkles,
  Sliders
} from 'lucide-react';
import {
  User,
  Club,
  UserRole,
  AdminPermission,
  ALL_ADMIN_PERMISSIONS,
  hasPermission,
} from '../../types.ts';

interface UsersViewProps {
  clubs: Club[];
  currentUser?: User | null;
  onSwitchUser?: (user: User) => void;
}

const PERMISSION_CONFIG: Record<
  AdminPermission,
  { label: string; shortLabel: string; description: string; icon: any; color: string; badgeColor: string }
> = {
  qr_scanner: {
    label: 'QR Gate Scanner',
    shortLabel: 'QR Scanner',
    description: 'Scan tickets at entrance gates and validate attendee passes in real time',
    icon: QrCode,
    color: 'text-emerald-600',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  participant_modification: {
    label: 'Participant Data Modification',
    shortLabel: 'Participant Mod',
    description: 'Add walk-in attendees, edit participant info, delete records, and reset attendance',
    icon: UserCog,
    color: 'text-indigo-600',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  payment_verification: {
    label: 'Payment Verification',
    shortLabel: 'Payment Verify',
    description: 'Verify submitted UPI UTRs, reject unconfirmed payments, and update fee records',
    icon: CreditCard,
    color: 'text-amber-600',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  event_management: {
    label: 'Events & Forms Builder',
    shortLabel: 'Events & Forms',
    description: 'Create & edit events, configure dates, ticket prices, and build custom form questions',
    icon: Calendar,
    color: 'text-purple-600',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  club_management: {
    label: 'Clubs & Societies',
    shortLabel: 'Clubs',
    description: 'Create and configure college clubs, faculty coordinators, and organizational scopes',
    icon: Building2,
    color: 'text-blue-600',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  export_data: {
    label: 'Data Export & Sync',
    shortLabel: 'Export & Sync',
    description: 'Download participant rosters to Excel/CSV and manage real-time Google Sheets sync',
    icon: FileSpreadsheet,
    color: 'text-cyan-600',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  broadcast_settings: {
    label: 'Broadcasts & Data Tools',
    shortLabel: 'Broadcast & Tools',
    description: 'Dispatch automated QR reminder emails to un-scanned attendees and purge event data',
    icon: BellRing,
    color: 'text-rose-600',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  user_management: {
    label: 'Admin Accounts & RBAC',
    shortLabel: 'User RBAC',
    description: 'Add new administrator logins and delegate granular access permissions (Super Admin)',
    icon: ShieldCheck,
    color: 'text-slate-800',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

export const UsersView: React.FC<UsersViewProps> = ({ clubs, currentUser, onSwitchUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EVENT_ORGANIZER');
  const [clubId, setClubId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([
    'participant_modification',
    'qr_scanner',
    'payment_verification',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('EVENT_ORGANIZER');
  const [editClubId, setEditClubId] = useState('');
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete user state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 5000);
  };

  // Helper presets for permissions
  const applyPreset = (preset: 'super' | 'desk' | 'scanner' | 'finance' | 'club', isEdit = false) => {
    let perms: AdminPermission[] = [];
    if (preset === 'super') {
      perms = [
        'qr_scanner',
        'participant_modification',
        'payment_verification',
        'event_management',
        'club_management',
        'export_data',
        'broadcast_settings',
        'user_management',
      ];
    } else if (preset === 'desk') {
      perms = ['participant_modification', 'qr_scanner', 'payment_verification'];
    } else if (preset === 'scanner') {
      perms = ['qr_scanner'];
    } else if (preset === 'finance') {
      perms = ['payment_verification', 'export_data'];
    } else if (preset === 'club') {
      perms = ['event_management', 'participant_modification', 'payment_verification', 'qr_scanner', 'export_data'];
    }

    if (isEdit) {
      setEditPermissions(perms);
    } else {
      setSelectedPermissions(perms);
    }
  };

  const handleRoleChange = (newRole: UserRole, isEdit = false) => {
    if (isEdit) {
      setEditRole(newRole);
      if (newRole === 'SUPER_ADMIN') applyPreset('super', true);
      else if (newRole === 'CLUB_ADMIN') applyPreset('club', true);
      else if (newRole === 'EVENT_ORGANIZER') applyPreset('desk', true);
      else if (newRole === 'VOLUNTEER') applyPreset('scanner', true);
    } else {
      setRole(newRole);
      if (newRole === 'SUPER_ADMIN') applyPreset('super', false);
      else if (newRole === 'CLUB_ADMIN') applyPreset('club', false);
      else if (newRole === 'EVENT_ORGANIZER') applyPreset('desk', false);
      else if (newRole === 'VOLUNTEER') applyPreset('scanner', false);
    }
  };

  const togglePermission = (perm: AdminPermission, isEdit = false) => {
    if (isEdit) {
      setEditPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          club_id: clubId || null,
          permissions: selectedPermissions,
        }),
      });

      if (res.ok) {
        showNotice(`Successfully added ${email} with ${selectedPermissions.length} authorized capabilities.`);
        setShowModal(false);
        setName('');
        setEmail('');
        setClubId('');
        setSelectedPermissions(['participant_modification', 'qr_scanner', 'payment_verification']);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create user login');
      }
    } catch (e) {
      console.error('Add user failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditClubId(user.club_id || '');
    setEditPermissions(user.permissions || []);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          role: editRole,
          club_id: editClubId || null,
          permissions: editPermissions,
        }),
      });

      if (res.ok) {
        showNotice(`Updated permissions and access for ${editEmail}.`);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (e) {
      console.error('Failed to update user', e);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotice(`Revoked login access for ${deleteTarget.email}.`);
        setDeleteTarget(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  // Stats
  const totalUsers = users.length;
  const scannerUsers = users.filter((u) => hasPermission(u, 'qr_scanner')).length;
  const modUsers = users.filter((u) => hasPermission(u, 'participant_modification')).length;
  const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin Authorization Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Admin Logins & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            As a <strong>Super Administrator</strong>, you can invite and create other admin logins and delegate granular operational capabilities—such as <strong>Participant Data Modification</strong>, <strong>QR Pass Scanner</strong>, <strong>Payment Verification</strong>, and more.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-add-admin-login"
            onClick={() => setShowModal(true)}
            disabled={!isSuperAdmin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
            title={!isSuperAdmin ? 'Only Super Admin can add other logins' : 'Provision new administrator account'}
          >
            <Plus className="w-4 h-4" />
            Add Admin Login & Grant Access
          </button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Super Admin Privilege Required to Modify Accounts</div>
            <div className="text-amber-700 mt-0.5">
              You are currently logged in with a restricted role. Only Super Administrators (e.g. <code>bharathkrishnan.t@gmail.com</code>) have authorization to create new admin logins or change access permissions.
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Admin Accounts</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved in whitelist</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" />
            QR Gate Scanners
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{scannerUsers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Authorized for entrance gates</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <UserCog className="w-3.5 h-3.5" />
            Participant Modifiers
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{modUsers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Can edit & add walk-ins</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admins
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">{superAdminCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Full master access</div>
        </div>
      </div>

      {/* Admin Accounts & Permissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Administrator Accounts & Scopes</h3>
            <p className="text-[11px] text-slate-500">
              Each user's access to scanner, attendee modification, and financial features is strictly governed by their granted permissions.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">{users.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Google Account Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Club Scope</th>
                <th className="py-3 px-4 min-w-[280px]">Authorized Permissions & Capabilities</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {users.map((u) => {
                const assignedClub = clubs.find((c) => c.id === u.club_id);
                const isSuper = u.role === 'SUPER_ADMIN';
                const userPerms = u.permissions || [];

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-slate-100"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {currentUser?.id === u.id && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Active: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'CLUB_ADMIN'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : u.role === 'EVENT_ORGANIZER'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {isSuper ? 'All Events (Global)' : assignedClub?.name || 'All Events'}
                    </td>
                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>Full Master Access (All Capabilities Granted)</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userPerms.map((perm) => {
                            const conf = PERMISSION_CONFIG[perm];
                            if (!conf) return null;
                            const Icon = conf.icon;
                            return (
                              <span
                                key={perm}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${conf.badgeColor}`}
                                title={conf.description}
                              >
                                <Icon className="w-3 h-3" />
                                {conf.shortLabel}
                              </span>
                            );
                          })}
                          {userPerms.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">No permissions assigned</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {onSwitchUser && (
                          <button
                            onClick={() => onSwitchUser(u)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title={`Test portal as ${u.name} (${u.role})`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          disabled={!isSuperAdmin}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors disabled:opacity-30"
                          title="Authorize & Edit Permissions"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={!isSuperAdmin || u.email === 'bharathkrishnan.t@gmail.com'}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors disabled:opacity-30"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: ADD ADMIN LOGIN & AUTHORIZE PERMISSIONS */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Add Admin Login & Delegate Permissions
                  </h3>
                  <p className="text-xs text-slate-300">
                    Authorize an administrator account with explicit operational capabilities.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              {/* Account Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Prof. Arvind Rao or Priya Nair"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Google Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="organizer@college.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Primary Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole, false)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="EVENT_ORGANIZER">Event Organizer (Registration Desk)</option>
                    <option value="VOLUNTEER">Gate Volunteer (Scanner Only)</option>
                    <option value="CLUB_ADMIN">Club Admin (Club Operations)</option>
                    <option value="SUPER_ADMIN">Super Administrator (Full Master Control)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Club Organizational Scope
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="">All Events & Clubs (Global Scope)</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-900" />
                    Quick Authorization Presets:
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {selectedPermissions.length} / {ALL_ADMIN_PERMISSIONS.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('super', false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
                  >
                    Full Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('desk', false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"
                  >
                    Registration Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('scanner', false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                  >
                    QR Gate Scanner Only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('finance', false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  >
                    Finance & Payment Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions([])}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Granular Permission Checklist */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {ALL_ADMIN_PERMISSIONS.map((p) => {
                  const isChecked = selectedPermissions.includes(p.id);
                  const Icon = PERMISSION_CONFIG[p.id].icon;

                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-slate-50 border-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(p.id, false)}
                        className="mt-0.5 h-4 w-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${PERMISSION_CONFIG[p.id].color}`} />
                          <span className="text-xs font-bold text-slate-900">{p.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Authorizing Account...' : 'Create Admin Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT ADMIN LOGIN & UPDATE PERMISSIONS */}
      {/* ============================================================ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Admin Permissions & Access
                  </h3>
                  <p className="text-xs text-slate-300">
                    Modifying operational authorization for <strong>{editingUser.email}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Account Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole, true)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="EVENT_ORGANIZER">Event Organizer</option>
                    <option value="VOLUNTEER">Gate Volunteer (Scanner Only)</option>
                    <option value="CLUB_ADMIN">Club Admin</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Club Scope
                  </label>
                  <select
                    value={editClubId}
                    onChange={(e) => setEditClubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="">All Events (Global Scope)</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Presets for Edit */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-900" />
                    Authorization Presets:
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {editPermissions.length} / {ALL_ADMIN_PERMISSIONS.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('super', true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('desk', true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"
                  >
                    Registration Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('scanner', true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                  >
                    Scanner Only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('finance', true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  >
                    Finance
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPermissions([])}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Granular Permission Checklist */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {ALL_ADMIN_PERMISSIONS.map((p) => {
                  const isChecked = editPermissions.includes(p.id);
                  const Icon = PERMISSION_CONFIG[p.id].icon;

                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-slate-50 border-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(p.id, true)}
                        className="mt-0.5 h-4 w-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${PERMISSION_CONFIG[p.id].color}`} />
                          <span className="text-xs font-bold text-slate-900">{p.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmittingEdit ? 'Updating Permissions...' : 'Save Permissions & Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Revoke Administrator Login?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? They will immediately lose authorization to access the organizer console and scanners.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
