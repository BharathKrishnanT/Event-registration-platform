import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  QrCode,
  Eye,
  UserCheck,
  RefreshCw,
  X,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  UserPlus,
  Lock
} from 'lucide-react';
import { Event, Registration, PaymentStatus, AttendanceStatus, User, hasPermission } from '../../types.ts';
import { createQRCodeDataUrl } from '../../utils/qr.ts';

interface RegistrationsViewProps {
  event: Event;
  currentUser?: User | null;
}

export const RegistrationsView: React.FC<RegistrationsViewProps> = ({ event, currentUser }) => {
  const isEventFree = !event.payment_enabled || event.fee === 0;
  const isHackathon = event.event_type === 'hackathon';
  const canModifyData = hasPermission(currentUser, 'participant_modification');
  const canVerifyPayment = hasPermission(currentUser, 'payment_verification');
  const canScan = hasPermission(currentUser, 'qr_scanner');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addCollege, setAddCollege] = useState('College Campus');
  const [addDepartment, setAddDepartment] = useState('Computer Science');
  const [addPaymentStatus, setAddPaymentStatus] = useState<PaymentStatus>('VERIFIED');
  const [addAttendanceStatus, setAddAttendanceStatus] = useState<AttendanceStatus>('CHECKED_IN');
  const [addGate, setAddGate] = useState('Registration Desk');
  const [addTransactionId, setAddTransactionId] = useState('DESK-CASH');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Modal State
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('VERIFIED');
  const [editAttendanceStatus, setEditAttendanceStatus] = useState<AttendanceStatus>('NOT_CHECKED_IN');
  const [editGate, setEditGate] = useState('');
  const [editTransactionId, setEditTransactionId] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Target State
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/registrations?event_id=${event.id}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (e) {
      console.error('Failed to load registrations', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [event.id]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Open participant detail modal
  const handleOpenModal = async (reg: Registration) => {
    setSelectedReg(reg);
    if (reg.qr_token) {
      const url = await createQRCodeDataUrl(reg.qr_token);
      setModalQrUrl(url);
    } else {
      setModalQrUrl('');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (reg: Registration) => {
    setEditingReg(reg);
    setEditName(reg.name);
    setEditPhone(reg.phone);
    setEditEmail(reg.email);
    setEditCollege(reg.college);
    setEditDepartment(reg.department);
    setEditPaymentStatus(reg.payment_status);
    setEditAttendanceStatus(reg.attendance_status || 'NOT_CHECKED_IN');
    setEditGate(reg.gate || 'Gate 1 (Main Entrance)');
    setEditTransactionId(reg.transaction_id || '');
  };

  // Resend email action
  const handleResendEmail = async (regId: string) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/resend-email`, { method: 'POST' });
      const data = await res.json();
      showNotice(data.message || 'Confirmation email resent.');
    } catch (e) {
      console.error('Failed to resend email', e);
    }
  };

  // Verify payment inline
  const handleVerifyPayment = async (regId: string) => {
    try {
      const res = await fetch(`/api/payments/${regId}/verify`, { method: 'POST' });
      if (res.ok) {
        fetchRegistrations();
        showNotice('Payment successfully verified and pass issued.');
      }
    } catch (e) {
      console.error('Failed to verify payment', e);
    }
  };

  // Add payment for attendee inline
  const handleAddPayment = async (regId: string) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/add-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: event.fee || 0 }),
      });
      if (res.ok) {
        fetchRegistrations();
        showNotice('Payment added and registration verified.');
      } else {
        const err = await res.json();
        showNotice(err.error || 'Failed to add payment.');
      }
    } catch (e) {
      console.error('Failed to add payment', e);
    }
  };

  // Remove payment for attendee inline
  const handleRemovePayment = async (regId: string) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/remove-payment`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchRegistrations();
        showNotice('Payment removed and status reset to Pending.');
      } else {
        const err = await res.json();
        showNotice(err.error || 'Failed to remove payment.');
      }
    } catch (e) {
      console.error('Failed to remove payment', e);
    }
  };

  // Manual Check in inline
  const handleManualCheckIn = async (reg: Registration) => {
    try {
      const res = await fetch('/api/check-in/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: reg.id,
          event_id: event.id,
          gate: 'Organizer Table (Manual)',
          reason: 'Checked in via registrations table',
        }),
      });
      if (res.ok) {
        fetchRegistrations();
        showNotice(`Checked in ${reg.name} successfully.`);
      }
    } catch (e) {
      console.error('Failed to check in', e);
    }
  };

  // Reset Check-in
  const handleResetCheckIn = async (regId: string) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/reset-checkin`, { method: 'POST' });
      if (res.ok) {
        fetchRegistrations();
        showNotice('Check-in status reset to Not Checked In.');
      }
    } catch (e) {
      console.error('Failed to reset check-in', e);
    }
  };

  // Submit Manual Walk-In Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    try {
      const res = await fetch('/api/registrations/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          name: addName,
          phone: addPhone,
          email: addEmail,
          college: addCollege,
          department: addDepartment,
          payment_status: isEventFree ? 'VERIFIED' : addPaymentStatus,
          attendance_status: addAttendanceStatus,
          gate: addGate,
          transaction_id: isEventFree ? 'FREE_PASS' : addTransactionId,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setAddName('');
        setAddPhone('');
        setAddEmail('');
        fetchRegistrations();
        showNotice(`Added attendee ${addName} successfully.`);
      }
    } catch (e) {
      console.error('Failed to add manual registration', e);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/registrations/${editingReg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          college: editCollege,
          department: editDepartment,
          payment_status: isEventFree ? 'VERIFIED' : editPaymentStatus,
          attendance_status: editAttendanceStatus,
          gate: editGate,
          transaction_id: isEventFree ? (editingReg.transaction_id || 'FREE_PASS') : editTransactionId,
        }),
      });

      if (res.ok) {
        setEditingReg(null);
        fetchRegistrations();
        showNotice(`Updated ${editName} successfully.`);
      }
    } catch (e) {
      console.error('Failed to update registration', e);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/registrations/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchRegistrations();
        showNotice(`Registration for ${deleteTarget.name} removed.`);
        setDeleteTarget(null);
      }
    } catch (e) {
      console.error('Failed to delete registration', e);
    }
  };

  // Filter & Search Logic
  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.registration_number.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.college.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      (r.transaction_id && r.transaction_id.toLowerCase().includes(q));

    const matchPayment = isEventFree || paymentFilter === 'ALL' || r.payment_status === paymentFilter;
    const matchAttendance =
      attendanceFilter === 'ALL' || r.attendance_status === attendanceFilter;

    return matchSearch && matchPayment && matchAttendance;
  });

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Permission Restriction Notice if read-only */}
      {!canModifyData && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Read-Only Participant Directory:</span> Your account does not have <strong>Participant Data Modification</strong> permission. Walk-in registration, editing attendee details, deleting records, and resetting gate check-ins are restricted to authorized desk admins and Super Admins.
          </div>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Reg ID, Phone, Email, UTR..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Filter dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {!isEventFree && (
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-0 text-slate-800 cursor-pointer"
            >
              <option value="ALL">Payment: All</option>
              <option value="VERIFIED">Payment: Verified</option>
              <option value="PENDING">Payment: Pending</option>
              <option value="REJECTED">Payment: Rejected</option>
            </select>
          )}

          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-0 text-slate-800 cursor-pointer"
          >
            <option value="ALL">Attendance: All</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="NOT_CHECKED_IN">Not Checked In</option>
          </select>

          <button
            onClick={fetchRegistrations}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Reload registrations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={!canModifyData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={!canModifyData ? 'Requires Participant Data Modification permission' : 'Register walk-in participant'}
          >
            {canModifyData ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-400" />}
            <span>Add Walk-In Attendee</span>
          </button>
        </div>
      </div>

      {/* Registrations Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Reg ID</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">College / Dept</th>
                {!isEventFree && <th className="py-3 px-4">Payment</th>}
                {isHackathon && <th className="py-3 px-4">Screening</th>}
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={(isEventFree ? 6 : 7) + (isHackathon ? 1 : 0)} className="py-12 text-center text-slate-400">
                    No registrations found. Use "Add Walk-In Attendee" or register via the public event page.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isCheckedIn = r.attendance_status === 'CHECKED_IN';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.registration_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {r.name}
                          {r.team_name && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                              {r.team_name}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{r.phone}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {r.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[160px]" title={r.college}>
                          {r.college}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={r.department}>
                          {r.department}
                        </div>
                      </td>
                      {!isEventFree && (
                        <td className="py-3.5 px-4">
                          {r.payment_status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : r.payment_status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending UTR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                          {r.transaction_id && r.transaction_id !== 'FREE_PASS' && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">
                              {r.transaction_id}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        {isCheckedIn ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              <UserCheck className="w-3 h-3" />
                              Checked In
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {r.gate || 'Gate'}
                            </div>
                          </div>
                        ) : r.attendance_status === 'PARTIAL' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800">
                              <UserCheck className="w-3 h-3" />
                              Partial
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {r.gate || 'Gate'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not Checked In</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View Modal */}
                          <button
                            onClick={() => handleOpenModal(r)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Participant Details & Pass"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Attendee */}
                          <button
                            onClick={() => handleOpenEdit(r)}
                            disabled={!canModifyData}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={canModifyData ? 'Edit Attendee Details' : 'Requires Participant Data Modification permission'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Resend Email */}
                          <button
                            onClick={() => handleResendEmail(r.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Resend Confirmation Pass Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Reset Check-In if checked in */}
                          {isCheckedIn && (
                            <button
                              onClick={() => handleResetCheckIn(r.id)}
                              disabled={!canModifyData}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={canModifyData ? 'Reset Check-In Status' : 'Requires Participant Data Modification permission'}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Manual Check In */}
                          {!isCheckedIn && r.registration_status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleManualCheckIn(r)}
                              disabled={!canScan}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={canScan ? 'Perform gate check-in' : 'Requires QR Scanner permission'}
                            >
                              Check In
                            </button>
                          )}

                          {/* Add or Remove Payment Actions (only for paid events) */}
                          {!isEventFree && (
                            r.payment_status === 'VERIFIED' ? (
                              <button
                                onClick={() => handleRemovePayment(r.id)}
                                disabled={!canVerifyPayment}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={canVerifyPayment ? 'Remove payment record (reset to Pending)' : 'Requires Payment Verification permission'}
                              >
                                Remove Payment
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddPayment(r.id)}
                                disabled={!canVerifyPayment}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                title={canVerifyPayment ? 'Add payment & issue verified pass' : 'Requires Payment Verification permission'}
                              >
                                + Add Payment
                              </button>
                            )
                          )}

                          {/* Delete Attendee */}
                          <button
                            onClick={() => setDeleteTarget(r)}
                            disabled={!canModifyData}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={canModifyData ? 'Delete Attendee Record' : 'Requires Participant Data Modification permission'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Desk Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Walk-In Attendee</h3>
                <p className="text-xs text-slate-500">
                  Manual registration desk entry for {event.name}.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="rahul@college.edu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">College</label>
                  <input
                    type="text"
                    value={addCollege}
                    onChange={(e) => setAddCollege(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {!isEventFree && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                    <select
                      value={addPaymentStatus}
                      onChange={(e) => setAddPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="VERIFIED">Verified (Paid)</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Note</label>
                    <input
                      type="text"
                      value={addTransactionId}
                      onChange={(e) => setAddTransactionId(e.target.value)}
                      placeholder="e.g. CASH or UTR"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mark Attendance</label>
                  <select
                    value={addAttendanceStatus}
                    onChange={(e) => setAddAttendanceStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="CHECKED_IN">Check-in Right Now</option>
                    <option value="NOT_CHECKED_IN">Not Checked In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Entry Gate</label>
                  <input
                    type="text"
                    value={addGate}
                    onChange={(e) => setAddGate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Attendee & Issue Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendee Modal */}
      {editingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Attendee Details</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingReg.registration_number}
                </p>
              </div>
              <button
                onClick={() => setEditingReg(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">College</label>
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {!isEventFree && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="VERIFIED">Verified</option>
                      <option value="PENDING">Pending</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / UTR</label>
                    <input
                      type="text"
                      value={editTransactionId}
                      onChange={(e) => setEditTransactionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Status</label>
                  <select
                    value={editAttendanceStatus}
                    onChange={(e) => setEditAttendanceStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="CHECKED_IN">Checked In</option>
                    <option value="NOT_CHECKED_IN">Not Checked In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Entry Gate</label>
                  <input
                    type="text"
                    value={editGate}
                    onChange={(e) => setEditGate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReg(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Attendee Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Attendee?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete the registration record for{' '}
                <strong>{deleteTarget.name}</strong> ({deleteTarget.registration_number})? This action cannot be undone.
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
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participant Detail & Pass Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendee Pass & Details</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedReg.registration_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* QR Code Pass Preview */}
              {selectedReg.registration_status === 'CONFIRMED' && modalQrUrl ? (
                <div className="text-center p-5 bg-slate-900 rounded-xl text-white space-y-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Official Check-In QR Pass
                  </div>
                  <img
                    src={modalQrUrl}
                    alt="Attendee QR Code"
                    className="w-48 h-48 mx-auto bg-white p-2.5 rounded-xl object-contain"
                  />
                  <div className="font-mono text-xs text-slate-300">
                    {selectedReg.qr_token}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    QR Pass Not Issued
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {isEventFree
                      ? 'Pass and QR token are issued upon confirmed registration.'
                      : 'Pass and QR token are only issued once registration payment is verified.'}
                  </p>
                </div>
              )}

              {/* Data Fields */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReg.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact</span>
                  <span className="font-medium text-slate-800">{selectedReg.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Email</span>
                  <span className="font-medium text-slate-800 truncate block">{selectedReg.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">College</span>
                  <span className="font-medium text-slate-800">{selectedReg.college}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Department</span>
                  <span className="font-medium text-slate-800">{selectedReg.department}</span>
                </div>

                {selectedReg.team_name && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Team Details</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs font-bold text-slate-900 mb-2">
                        Team: {selectedReg.team_name}
                      </div>
                      <div className="space-y-1.5">
                        {selectedReg.team_members && selectedReg.team_members.map((tm: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded border border-slate-100">
                            <div>
                              <span className="font-semibold">{tm.name}</span>
                              <span className="text-slate-400 ml-2 text-[10px]">{tm.phone}</span>
                            </div>
                            <div>
                              {tm.checked_in ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                  <UserCheck className="w-3 h-3" /> In
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium text-[10px]">Not In</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!isEventFree && selectedReg.transaction_id !== 'FREE_PASS' ? (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Status</span>
                      <span className="font-bold text-slate-900">{selectedReg.payment_status}</span>
                    </div>
                    {selectedReg.transaction_id && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Transaction Ref / UTR</span>
                        <span className="font-mono text-slate-800">{selectedReg.transaction_id}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Admission Type</span>
                    <span className="font-bold text-emerald-700">Free Registration Pass</span>
                  </div>
                )}
                {selectedReg.check_in_time && (
                  <div className="col-span-2 p-3 bg-indigo-50 rounded-xl text-indigo-900">
                    <span className="text-xs font-bold block">Scanned Check-in:</span>
                    <span className="text-xs font-medium">
                      {new Date(selectedReg.check_in_time).toLocaleString()} at {selectedReg.gate}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReg(null);
                    handleOpenEdit(selectedReg);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Attendee
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResendEmail(selectedReg.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Resend Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReg(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
