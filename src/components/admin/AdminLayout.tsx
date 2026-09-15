import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  Calendar,
  FileSpreadsheet,
  Building2,
  UserCheck,
  Settings,
  LogOut,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { User, Event, AdminPermission, hasPermission } from '../../types.ts';

export type AdminTab =
  | 'dashboard'
  | 'registrations'
  | 'hackathon'
  | 'payments'
  | 'scanner'
  | 'events'
  | 'exports'
  | 'clubs'
  | 'users'
  | 'settings';

interface AdminLayoutProps {
  currentUser: User;
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onSwitchToPublic: () => void;
  pendingPaymentsCount: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  events,
  selectedEvent,
  onSelectEvent,
  currentTab,
  onTabChange,
  onLogout,
  onSwitchToPublic,
  pendingPaymentsCount,
  children,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const [showPermsModal, setShowPermsModal] = useState(false);

  const navItems: {
    id: AdminTab;
    label: string;
    icon: any;
    badge?: number;
    requiredPermission?: AdminPermission;
    superAdminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Overview & KPIs', icon: LayoutDashboard },
    {
      id: 'scanner',
      label: 'QR Gate Scanner',
      icon: QrCode,
      requiredPermission: 'qr_scanner',
    },
    
    {
      id: 'registrations',
      label: 'Teams / Registrations',
      icon: Users,
    },
    {
      id: 'hackathon',
      label: 'Hackathon Screening',
      icon: Sparkles, // Or another icon like FileText, but it's not imported. Let's just use Settings icon or Users.
    },
    {
      id: 'payments',
      label: 'Payment Verification',
      icon: CreditCard,
      badge: pendingPaymentsCount,
      requiredPermission: 'payment_verification',
    },
    {
      id: 'events',
      label: 'Events & Forms',
      icon: Calendar,
      requiredPermission: 'event_management',
    },
    {
      id: 'exports',
      label: 'Excel & Sheet Sync',
      icon: FileSpreadsheet,
      requiredPermission: 'export_data',
    },
    {
      id: 'clubs',
      label: 'Clubs',
      icon: Building2,
      requiredPermission: 'club_management',
      superAdminOnly: true,
    },
    {
      id: 'users',
      label: 'Admin Accounts & RBAC',
      icon: UserCheck,
      requiredPermission: 'user_management',
      superAdminOnly: true,
    },
    {
      id: 'settings',
      label: 'Reminders & Audit',
      icon: Settings,
      requiredPermission: 'broadcast_settings',
    },
  ];

  const isSelectedEventFree = Boolean(
    selectedEvent && (!selectedEvent.payment_enabled || selectedEvent.fee === 0)
  );

  useEffect(() => {
    if (isSelectedEventFree && currentTab === 'payments') {
      onTabChange('dashboard');
    }
  }, [isSelectedEventFree, currentTab, onTabChange]);

  const visibleNavItems = navItems.filter((item) => {
    if (isSelectedEventFree && item.id === 'payments') return false;
    if (isSuperAdmin) return true;
    if (item.superAdminOnly) return false;
    if (item.requiredPermission) {
      return hasPermission(currentUser, item.requiredPermission);
    }
    return true;
  });

  const activePermsCount = isSuperAdmin
    ? 8
    : (currentUser.permissions?.length || 0);

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Event selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white text-slate-900 font-black text-base flex items-center justify-center shadow-xs">
                  CE
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Organizer Console
                  </div>
                  <div className="text-sm font-bold text-white leading-none">
                    College Events Hub
                  </div>
                </div>
              </div>

              {/* Active Event Selector */}
              <div className="hidden md:flex items-center pl-4 border-l border-slate-700/80">
                <div className="relative">
                  <select
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const ev = events.find((item) => item.id === e.target.value);
                      if (ev) onSelectEvent(ev);
                    }}
                    className="appearance-none bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg border border-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white max-w-[240px] truncate"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.club_name})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right: User Profile & RBAC Badge */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSwitchToPublic}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                title="View public registration page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public Page</span>
              </button>

              {/* Permission pill */}
              <button
                onClick={() => setShowPermsModal(true)}
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  isSuperAdmin
                    ? 'bg-amber-900/40 text-amber-300 border-amber-700/60 hover:bg-amber-900/60'
                    : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                }`}
                title="View authorized capabilities for this account"
              >
                {isSuperAdmin ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Super Admin</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activePermsCount} Active Permissions</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-700/80">
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-slate-600 bg-slate-800 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-emerald-400">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign out of organizer portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Bar */}
        <div className="bg-slate-950/70 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 py-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => onTabChange(item.id)}
                    className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                          isActive
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        College Event Administration Platform
      </footer>

      {/* Account Permissions Modal */}
      {showPermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentUser.name}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => setShowPermsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">
                Authorized Capabilities:
              </div>
              {isSuperAdmin ? (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Super Administrator (Unrestricted Master Access)
                  </div>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    This account has full authorization to add other admin logins, delegate permissions, scan passes, modify participant data, verify payments, and manage events.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {(currentUser.permissions || []).map((p) => (
                    <div
                      key={p}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 capitalize">
                        {p.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                  {(!currentUser.permissions || currentUser.permissions.length === 0) && (
                    <div className="text-xs text-slate-500 italic p-3 text-center">
                      No specific capabilities assigned. Contact a Super Administrator to grant permissions.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowPermsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
