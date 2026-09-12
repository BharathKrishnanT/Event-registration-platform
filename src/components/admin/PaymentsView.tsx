import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  Plus,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { Event, Payment, PaymentStatus, Registration, User, hasPermission } from '../../types.ts';

interface PaymentsViewProps {
  event: Event;
  currentUser?: User | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ event, currentUser }) => {
  const canVerifyPayment = hasPermission(currentUser, 'payment_verification');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [search, setSearch] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Invalid UTR Reference Number');
  const [customReason, setCustomReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Add Payment Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventRegistrations, setEventRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [selectedRegId, setSelectedRegId] = useState('');
  const [addAmount, setAddAmount] = useState<number>(event.fee || 0);
  const [addMode, setAddMode] = useState<'UPI' | 'CASH' | 'BANK' | 'WAIVED'>('UPI');
  const [addTransactionId, setAddTransactionId] = useState('');
  const [addStatus, setAddStatus] = useState<PaymentStatus>('VERIFIED');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Payment State
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editTransactionId, setEditTransactionId] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<PaymentStatus>('PENDING');
  const [editRejectionReason, setEditRejectionReason] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Payment Target
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payments?event_id=${event.id}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (e) {
      console.error('Failed to load payments', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [event.id]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleVerify = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, { method: 'POST' });
      if (res.ok) {
        fetchPayments();
        showNotice('Payment verified and registration pass dispatched.');
      }
    } catch (e) {
      console.error('Payment verification failed', e);
    }
  };

  const handleReject = async () => {
    if (!rejectionTarget) return;
    const finalReason =
      rejectionReason === 'Other' ? customReason.trim() : rejectionReason;
    try {
      const res = await fetch(`/api/payments/${rejectionTarget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });
      if (res.ok) {
        setRejectionTarget(null);
        setCustomReason('');
        fetchPayments();
        showNotice('Payment rejected and attendee notified.');
      }
    } catch (e) {
      console.error('Payment rejection failed', e);
    }
  };

  // Open Add Payment Modal
  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setAddAmount(event.fee || 0);
    setAddMode('UPI');
    setAddTransactionId('');
    setAddStatus('VERIFIED');
    setIsLoadingRegs(true);
    try {
      const res = await fetch(`/api/registrations?event_id=${event.id}`);
      if (res.ok) {
        const regs: Registration[] = await res.json();
        setEventRegistrations(regs);
        if (regs.length > 0) {
          const unverified = regs.find((r) => r.payment_status !== 'VERIFIED');
          setSelectedRegId(unverified ? unverified.id : regs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load registrations', err);
    } finally {
      setIsLoadingRegs(false);
    }
  };

  // Submit Add Payment
  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegId) return;

    let finalTxn = addTransactionId.trim();
    if (!finalTxn) {
      if (addMode === 'CASH') {
        finalTxn = `CASH-${Date.now().toString().slice(-6)}`;
      } else if (addMode === 'WAIVED') {
        finalTxn = `WAIVED-${Date.now().toString().slice(-6)}`;
      } else if (addMode === 'BANK') {
        finalTxn = `BANK-${Date.now().toString().slice(-6)}`;
      } else {
        finalTxn = `MANUAL-${Date.now().toString().slice(-6)}`;
      }
    }

    setIsSubmittingAdd(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: selectedRegId,
          amount: Number(addAmount),
          transaction_id: finalTxn,
          payment_status: addStatus,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchPayments();
        showNotice('Payment record added successfully and pass issued.');
      } else {
        const err = await res.json();
        showNotice(err.error || 'Failed to add payment.');
      }
    } catch (e) {
      console.error('Failed to add payment', e);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Payment) => {
    setEditPayment(p);
    setEditTransactionId(p.transaction_id || '');
    setEditAmount(p.amount || event.fee || 0);
    setEditStatus(p.payment_status);
    setEditRejectionReason(p.rejection_reason || '');
  };

  // Submit Edit Payment
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/payments/${editPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: editTransactionId,
          amount: Number(editAmount),
          payment_status: editStatus,
          rejection_reason: editStatus === 'REJECTED' ? editRejectionReason : null,
        }),
      });

      if (res.ok) {
        setEditPayment(null);
        fetchPayments();
        showNotice('Payment record updated successfully.');
      }
    } catch (e) {
      console.error('Failed to update payment', e);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Payment Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/payments/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPayments();
        showNotice('Payment record deleted.');
        setDeleteTarget(null);
      }
    } catch (e) {
      console.error('Failed to delete payment', e);
    }
  };

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(q)) ||
      (p.participant_name && p.participant_name.toLowerCase().includes(q)) ||
      (p.registration_number && p.registration_number.toLowerCase().includes(q));

    const matchesFilter = filter === 'ALL' || p.payment_status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = payments.filter((p) => p.payment_status === 'PENDING').length;
  const verifiedCount = payments.filter((p) => p.payment_status === 'VERIFIED').length;
  const totalCollected = verifiedCount * (event.fee || 0);

  const isEventFree = !event.payment_enabled || event.fee === 0;

  if (isEventFree) {
    return (
      <div className="space-y-6">
        <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Free Registration Event</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              <strong>{event.name}</strong> has a registration fee of ₹0 (Free Admission). Payment collection, transaction IDs, and manual verification are not required.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              Passes are issued automatically upon registration
            </span>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Collected
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalCollected.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Review
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verified Passes
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* UPI Info Card */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active UPI Receiving Account
          </div>
          <div className="text-base font-bold text-white mt-0.5 font-mono">
            {event.upi_id || 'Not configured'}
          </div>
        </div>
        <div className="text-xs text-slate-300">
          Fee per entry: <strong className="text-white">₹{event.fee || 0}</strong>
        </div>
      </div>

      {/* Permission Restriction Notice */}
      {!canVerifyPayment && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Read-Only Financial Ledger:</span> Your account does not have <strong>Payment Verification</strong> permission. Approving UPI transactions, rejecting invalid payments, modifying amounts, and deleting records are restricted.
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participant name, registration ID, or UTR..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({payments.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'VERIFIED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'REJECTED'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected
            </button>
          </div>

          <button
            onClick={fetchPayments}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh payments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAddModal}
            disabled={!canVerifyPayment}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={canVerifyPayment ? 'Manually record new payment' : 'Requires Payment Verification permission'}
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">Reg ID</th>
                <th className="py-3 px-4">Submitted UTR</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment submissions match the current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.participant_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {p.registration_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {p.transaction_id || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{p.amount || event.fee}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.payment_status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : p.payment_status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                          {p.rejection_reason && (
                            <div className="text-[10px] text-rose-600 mt-0.5">
                              {p.rejection_reason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {p.payment_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerify(p.id)}
                              disabled={!canVerifyPayment}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
                              title={canVerifyPayment ? 'Approve UPI payment' : 'Requires Payment Verification permission'}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Verify
                            </button>
                            <button
                              onClick={() => setRejectionTarget(p)}
                              disabled={!canVerifyPayment}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={canVerifyPayment ? 'Reject payment' : 'Requires Payment Verification permission'}
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenEdit(p)}
                          disabled={!canVerifyPayment}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={canVerifyPayment ? 'Edit Payment Record' : 'Requires Payment Verification permission'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(p)}
                          disabled={!canVerifyPayment}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={canVerifyPayment ? 'Remove Payment' : 'Requires Payment Verification permission'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Payment Record</h3>
                  <p className="text-xs text-slate-500">Record a manual UPI, Cash desk, or bank payment</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="p-6 space-y-4">
              {/* Select Attendee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Participant Registration *
                </label>
                {isLoadingRegs ? (
                  <div className="p-3 text-xs text-slate-400 bg-slate-50 rounded-xl animate-pulse">
                    Loading event participants...
                  </div>
                ) : eventRegistrations.length === 0 ? (
                  <div className="p-3 text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                    No registrations found for this event yet.
                  </div>
                ) : (
                  <select
                    value={selectedRegId}
                    onChange={(e) => setSelectedRegId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {eventRegistrations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.registration_number} - {r.name} ({r.payment_status} | {r.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'CASH', 'BANK', 'WAIVED'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAddMode(mode)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        addMode === mode
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'CASH' ? 'Cash Desk' : mode === 'BANK' ? 'NEFT/Bank' : mode === 'WAIVED' ? 'Complimentary' : 'UPI Online'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Amount Received (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={addAmount}
                      onChange={(e) => setAddAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Verification Status
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="VERIFIED">Verified (Issue Pass)</option>
                    <option value="PENDING">Pending Verification</option>
                  </select>
                </div>
              </div>

              {/* Transaction ID / UTR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  UTR / Reference / Receipt Number
                </label>
                <input
                  type="text"
                  value={addTransactionId}
                  onChange={(e) => setAddTransactionId(e.target.value)}
                  placeholder={
                    addMode === 'CASH'
                      ? 'e.g. CASH-DESK-01 (Auto-generated if empty)'
                      : addMode === 'WAIVED'
                      ? 'e.g. SPONSOR-PASS (Auto-generated if empty)'
                      : 'e.g. 423984120938'
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd || !selectedRegId}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdd ? (
                    'Recording...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Verify Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Payment Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove Payment Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove the payment record for{' '}
                <strong>{deleteTarget.participant_name}</strong> ({deleteTarget.transaction_id})?
                This will remove the payment and reset the participant's payment status to Pending.
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
                Remove Payment
              </button>
            </div>
          </div>
        </div>
      )}
      {editPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Payment Record</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editPayment.registration_number}
                </p>
              </div>
              <button
                onClick={() => setEditPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Participant Name
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800">
                  {editPayment.participant_name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submitted UTR / Transaction ID
                </label>
                <input
                  type="text"
                  required
                  value={editTransactionId}
                  onChange={(e) => setEditTransactionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {editStatus === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rejection Reason
                  </label>
                  <input
                    type="text"
                    value={editRejectionReason}
                    onChange={(e) => setEditRejectionReason(e.target.value)}
                    placeholder="e.g. UTR number was invalid or duplicate"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditPayment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Reject Payment Verification
              </h3>
              <button
                onClick={() => setRejectionTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  Participant: <strong>{rejectionTarget.participant_name}</strong>
                </div>
                <div>
                  Registration: <strong>{rejectionTarget.registration_number}</strong>
                </div>
                <div>
                  Submitted UTR: <strong>{rejectionTarget.transaction_id}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="Invalid UTR Reference Number">
                    Invalid UTR Reference Number
                  </option>
                  <option value="Amount does not match event fee">
                    Amount does not match event fee
                  </option>
                  <option value="Transaction not received in College Bank Account">
                    Transaction not received in College Bank Account
                  </option>
                  <option value="Duplicate transaction ID already used">
                    Duplicate transaction ID already used
                  </option>
                  <option value="Other">Custom / Other Reason</option>
                </select>
              </div>

              {rejectionReason === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Reason
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectionTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
