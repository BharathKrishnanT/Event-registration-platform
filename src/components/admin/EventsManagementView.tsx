import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  QrCode,
  Edit2,
  ExternalLink,
  Users,
  Building2,
  Clock,
  MapPin,
  X,
  CheckCircle2,
  Settings2,
  Download,
  Trash2,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  Link,
  CreditCard
} from 'lucide-react';
import { Event, Club, EventFormField, User, isSuperAdmin, hasPermission } from '../../types.ts';

interface EventsManagementViewProps {
  events: Event[];
  clubs: Club[];
  selectedEvent: Event | null;
  currentUser?: User | null;
  onSelectEvent: (event: Event) => void;
  onEventCreated: (event: Event) => void;
  onEventUpdated: (event: Event) => void;
  onEventDeleted?: (eventId: string) => void;
}

export const EventsManagementView: React.FC<EventsManagementViewProps> = ({
  events,
  clubs,
  selectedEvent,
  currentUser,
  onSelectEvent,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [clearDataTarget, setClearDataTarget] = useState<Event | null>(null);
  const [showQrModal, setShowQrModal] = useState<Event | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [eventLink, setEventLink] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Quick Add/Remove Payment to Event Modal
  const [paymentConfigModal, setPaymentConfigModal] = useState<Event | null>(null);
  const [paymentFeeInput, setPaymentFeeInput] = useState<number>(250);
  const [paymentUpiInput, setPaymentUpiInput] = useState<string>('');
  const [isSubmittingPaymentConfig, setIsSubmittingPaymentConfig] = useState(false);

  const canManagePaymentSetting = !currentUser || isSuperAdmin(currentUser) || hasPermission(currentUser, 'event_management');

  // Form State for New Event
  const [clubId, setClubId] = useState(clubs[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:30 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [eventType, setEventType] = useState<'solo' | 'team'>('solo');
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [capacity, setCapacity] = useState<number>(300);
  const [autoCloseOnCapacity, setAutoCloseOnCapacity] = useState<boolean>(true);
  const [fee, setFee] = useState<number>(100);
  const [upiId, setUpiId] = useState('college.union@okhdfcbank');
  const [posterUrl, setPosterUrl] = useState(
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Event State
  const [editClubId, setEditClubId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editEventType, setEditEventType] = useState<'solo' | 'team'>('solo');
  const [editMinTeamSize, setEditMinTeamSize] = useState<number>(2);
  const [editMaxTeamSize, setEditMaxTeamSize] = useState<number>(4);
  const [editCapacity, setEditCapacity] = useState<number>(300);
  const [editAutoCloseOnCapacity, setEditAutoCloseOnCapacity] = useState<boolean>(true);
  const [editFee, setEditFee] = useState<number>(0);
  const [editUpiId, setEditUpiId] = useState('');
  const [editStatus, setEditStatus] = useState<Event['status']>('REGISTRATION_OPEN');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [editFormFields, setEditFormFields] = useState<EventFormField[]>([]);

  // Form Builder fields state for creation
  const [formFields, setFormFields] = useState<EventFormField[]>([
    {
      id: 'f-1',
      field_name: 'year_of_study',
      label: 'Year of Study',
      field_type: 'dropdown',
      is_required: true,
      options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'],
    },
    {
      id: 'f-2',
      field_name: 'food_preference',
      label: 'Refreshments & Lunch Choice',
      field_type: 'dropdown',
      is_required: false,
      options: ['Vegetarian', 'Non-Vegetarian'],
    },
  ]);

  // Open Edit Modal
  const handleOpenEditModal = (ev: Event) => {
    setShowEditModal(ev);
    setEditClubId(ev.club_id);
    setEditName(ev.name);
    setEditDescription(ev.description || '');
    setEditVenue(ev.venue);
    setEditStartDate(ev.start_date);
    setEditStartTime(ev.start_time);
    setEditEndTime(ev.end_time);
    setEditEventType(ev.event_type || 'solo');
    setEditMinTeamSize(ev.min_team_size || 2);
    setEditMaxTeamSize(ev.max_team_size || 4);
    setEditCapacity(ev.capacity || 500);
    setEditAutoCloseOnCapacity(ev.auto_close_on_capacity ?? true);
    setEditFee(ev.fee || 0);
    setEditUpiId(ev.upi_id || '');
    setEditStatus(ev.status);
    setEditPosterUrl(ev.poster_url || '');
    setEditFormFields(ev.form_fields ? JSON.parse(JSON.stringify(ev.form_fields)) : []);
  };

  // Open Poster / Link QR Modal
  const handleOpenQrModal = async (ev: Event) => {
    setShowQrModal(ev);
    try {
      const res = await fetch(`/api/events/${ev.id}/registration-qr`);
      if (res.ok) {
        const data = await res.json();
        setQrCodeDataUrl(data.qr_data_url);
        setEventLink(data.event_url);
      }
    } catch (e) {
      console.error('Failed to get QR code', e);
    }
  };

  // Status toggle
  const handleStatusChange = async (ev: Event, newStatus: Event['status']) => {
    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onEventUpdated(updated);
        showNotice(`Status of "${ev.name}" changed to ${newStatus.replace('_', ' ')}.`);
      }
    } catch (e) {
      console.error('Update status failed', e);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Create Event Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          name,
          description,
          venue,
          start_date: startDate,
          end_date: startDate,
          start_time: startTime,
          end_time: endTime,
          event_type: eventType,
          min_team_size: (eventType === 'team' || eventType === 'hackathon') ? minTeamSize : undefined,
          max_team_size: (eventType === 'team' || eventType === 'hackathon') ? maxTeamSize : undefined,
          capacity: Number(capacity) || undefined,
          auto_close_on_capacity: autoCloseOnCapacity,
          fee: Number(fee) || 0,
          currency: 'INR',
          upi_id: upiId,
          payment_enabled: Number(fee) > 0,
          poster_url: posterUrl,
          form_fields: formFields.map(f => ({
            ...f,
            options: f.field_type === 'dropdown' ? f.options?.map(o => o.trim()).filter(Boolean) : undefined
          })),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onEventCreated(created);
        setShowCreateModal(false);
        showNotice(`Event "${created.name}" created successfully.`);
        setName('');
        setDescription('');
      }
    } catch (e) {
      console.error('Failed to create event', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Event Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${showEditModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: editClubId,
          name: editName,
          description: editDescription,
          venue: editVenue,
          start_date: editStartDate,
          end_date: editStartDate,
          start_time: editStartTime,
          end_time: editEndTime,
          event_type: editEventType,
          min_team_size: (editEventType === 'team' || editEventType === 'hackathon') ? editMinTeamSize : undefined,
          max_team_size: (editEventType === 'team' || editEventType === 'hackathon') ? editMaxTeamSize : undefined,
          capacity: Number(editCapacity) || undefined,
          auto_close_on_capacity: editAutoCloseOnCapacity,
          fee: Number(editFee) || 0,
          currency: 'INR',
          upi_id: editUpiId,
          payment_enabled: Number(editFee) > 0,
          status: editStatus,
          poster_url: editPosterUrl,
          form_fields: editFormFields.map(f => ({
            ...f,
            options: f.field_type === 'dropdown' ? f.options?.map(o => o.trim()).filter(Boolean) : undefined
          })),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onEventUpdated(updated);
        setShowEditModal(null);
        showNotice(`Event "${updated.name}" updated successfully.`);
      }
    } catch (e) {
      console.error('Failed to update event', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Event Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/events/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (onEventDeleted) {
          onEventDeleted(deleteTarget.id);
        }
        showNotice(`Event "${deleteTarget.name}" and associated records deleted.`);
        setDeleteTarget(null);
      }
    } catch (e) {
      console.error('Failed to delete event', e);
    }
  };

  // Clear Event Attendees Confirm
  const handleClearDataConfirm = async () => {
    if (!clearDataTarget) return;
    try {
      const res = await fetch(`/api/events/${clearDataTarget.id}/clear-data`, {
        method: 'POST',
      });
      if (res.ok) {
        const result = await res.json();
        showNotice(
          `Purged ${result.clearedRegistrations} registrations & ${result.clearedAttendance} attendance records for ${clearDataTarget.name}.`
        );
        setClearDataTarget(null);
      }
    } catch (e) {
      console.error('Failed to clear event data', e);
    }
  };

  // Quick Remove Payment from Event (make free)
  const handleRemoveEventPayment = async (ev: Event) => {
    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ev,
          fee: 0,
          payment_enabled: false,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onEventUpdated(updated);
        showNotice(`Payment requirement removed from "${ev.name}". Event registration is now FREE.`);
      }
    } catch (e) {
      console.error('Failed to remove event payment', e);
    }
  };

  // Open Add Payment Modal for Event
  const handleOpenAddPayment = (ev: Event) => {
    setPaymentConfigModal(ev);
    setPaymentFeeInput(ev.fee > 0 ? ev.fee : 250);
    setPaymentUpiInput(ev.upi_id || 'collegeevents@okaxis');
  };

  // Save Event Payment Configuration
  const handleSaveEventPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentConfigModal) return;
    setIsSubmittingPaymentConfig(true);
    try {
      const res = await fetch(`/api/events/${paymentConfigModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentConfigModal,
          fee: Number(paymentFeeInput),
          payment_enabled: Number(paymentFeeInput) > 0,
          upi_id: paymentUpiInput.trim() || 'collegeevents@okaxis',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onEventUpdated(updated);
        setPaymentConfigModal(null);
        showNotice(`Payment fee of ₹${paymentFeeInput} added to "${paymentConfigModal.name}".`);
      }
    } catch (e) {
      console.error('Failed to update event payment', e);
    } finally {
      setIsSubmittingPaymentConfig(false);
    }
  };

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

      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Events Management & Forms</h2>
          <p className="text-xs text-slate-500">
            Create, edit, or remove college symposiums, modify custom forms, manage fees and poster QRs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev) => {
          const isCurrent = selectedEvent?.id === ev.id;
          return (
            <div
              key={ev.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all shadow-xs flex flex-col justify-between ${
                isCurrent ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Poster */}
                <div className="relative aspect-16/9 bg-slate-900">
                  <img
                    src={ev.poster_url}
                    alt={ev.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ev.status === 'REGISTRATION_CLOSED' && ev.auto_closed_at
                          ? 'bg-rose-600 text-white'
                          : ev.status === 'REGISTRATION_OPEN'
                          ? 'bg-emerald-500 text-white'
                          : ev.status === 'EVENT_LIVE'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {ev.status === 'REGISTRATION_CLOSED' && ev.auto_closed_at ? 'CLOSED (FULL)' : ev.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold">
                    {ev.club_name || 'College Club'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{ev.name}</h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{ev.start_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {ev.start_time} - {ev.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Capacity: {ev.capacity ? `${ev.capacity} seats` : 'Unlimited'}</span>
                      </div>
                      {ev.capacity && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ev.auto_close_on_capacity !== false
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ev.auto_close_on_capacity !== false ? 'Auto-close: On' : 'Auto-close: Off'}
                        </span>
                      )}
                    </div>
                  </div>

                  {ev.status === 'REGISTRATION_CLOSED' && ev.auto_closed_at && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                      <span className="font-semibold">Auto-closed: Max capacity reached</span>
                      <button
                        onClick={() => handleStatusChange(ev, 'REGISTRATION_OPEN')}
                        className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline text-[11px] shrink-0 ml-2"
                      >
                        Reopen
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Registration Fee</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${ev.fee > 0 ? 'text-slate-900' : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]'}`}>
                        {ev.fee > 0 ? `₹${ev.fee}` : 'FREE'}
                      </span>
                      {canManagePaymentSetting && (
                        ev.fee > 0 ? (
                          <button
                            onClick={() => handleRemoveEventPayment(ev)}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline transition-colors"
                            title="Remove payment requirement (make event free)"
                          >
                            Remove Payment
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAddPayment(ev)}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
                            title="Add payment requirement to this event"
                          >
                            + Add Payment
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenQrModal(ev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-200/70 transition-colors"
                      title="Poster Registration QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                      QR
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(ev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Edit Event Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => setDeleteTarget(ev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={ev.status}
                      onChange={(e) => handleStatusChange(ev, e.target.value as any)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REGISTRATION_OPEN">Open</option>
                      <option value="REGISTRATION_CLOSED">Closed</option>
                      <option value="EVENT_LIVE">Live</option>
                      <option value="EVENT_COMPLETED">Completed</option>
                    </select>

                    <button
                      onClick={() => onSelectEvent(ev)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isCurrent ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>

                {/* Quick Purge Event Data */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Attendee Data:</span>
                  <button
                    onClick={() => setClearDataTarget(ev)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors"
                    title="Purge attendees for this event"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear Attendees
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Poster QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Event Registration Poster QR
              </h3>
              <button
                onClick={() => setShowQrModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl inline-block">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Registration link QR"
                    className="w-52 h-52 object-contain bg-white rounded-xl p-2"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                    Generating...
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900">{showQrModal.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Print on college banners, flyers, or project onto seminar presentation slides.
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all select-all">
                {eventLink || `/events/${showQrModal.slug}`}
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                {qrCodeDataUrl && (
                  <a
                    href={qrCodeDataUrl}
                    download={`${showQrModal.slug}-registration-qr.png`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download High-Res QR Image
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Event?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>? All registered attendee lists, payments, and check-in logs for this event will also be removed.
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
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Attendees Confirmation Modal */}
      {clearDataTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Purge Attendees for Event?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will delete all test registrations, payments, and attendance scans for <strong>{clearDataTarget.name}</strong>, resetting it to a clean slate. The event itself and form setup will remain intact.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClearDataTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDataConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
              >
                Purge Attendees
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit College Event</h3>
                <p className="text-xs text-slate-500">
                  Update event parameters, timings, fee schedule, and form inputs.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Event Basics
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organizing Club *
                    </label>
                    <select
                      required
                      value={editClubId}
                      onChange={(e) => setEditClubId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REGISTRATION_OPEN">Registration Open</option>
                      <option value="REGISTRATION_CLOSED">Registration Closed</option>
                      <option value="EVENT_LIVE">Event Live</option>
                      <option value="EVENT_COMPLETED">Event Completed</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Description
                    </label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue *</label>
                    <input
                      type="text"
                      required
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start & End Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        placeholder="09:30 AM"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        placeholder="05:00 PM"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={editEventType}
                      onChange={(e) => setEditEventType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="solo">Solo / Individual</option>
                      <option value="team">Team Based</option>
                    </select>
                  </div>

                  {(editEventType === 'team' || editEventType === 'hackathon') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Team Size (Min - Max)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={editMinTeamSize}
                          onChange={(e) => setEditMinTeamSize(Number(e.target.value))}
                          placeholder="Min"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                        />
                        <input
                          type="number"
                          value={editMaxTeamSize}
                          onChange={(e) => setEditMaxTeamSize(Number(e.target.value))}
                          placeholder="Max"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Capacity
                    </label>
                    <input
                      type="number"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <div className="mt-2.5 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <input
                        type="checkbox"
                        id="edit-auto-close"
                        checked={editAutoCloseOnCapacity}
                        onChange={(e) => setEditAutoCloseOnCapacity(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <label htmlFor="edit-auto-close" className="text-xs text-slate-700 cursor-pointer select-none">
                        <span className="font-bold block text-slate-900">Auto-close when maximum capacity is reached</span>
                        <span className="text-[11px] text-slate-500">
                          Automatically switches event status to "Registration Closed" and blocks new attendee submissions once maximum capacity is reached.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments Config */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Payment Settings
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registration Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={editFee}
                      onChange={(e) => setEditFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Enter 0 for free events</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Club UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={editUpiId}
                      onChange={(e) => setEditUpiId(e.target.value)}
                      placeholder="e.g. club@okhdfcbank"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Poster Image URL
                    </label>
                    <input
                      type="text"
                      value={editPosterUrl}
                      onChange={(e) => setEditPosterUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Form Custom Fields */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Custom Form Questions
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditFormFields([
                        ...editFormFields,
                        {
                          id: `ff-${Date.now()}`,
                          field_name: `field_${Date.now()}`,
                          label: 'New Question',
                          field_type: 'text',
                          is_required: false,
                        },
                      ]);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-2">
                  {editFormFields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => {
                              const copy = [...editFormFields];
                              copy[idx].label = e.target.value;
                              setEditFormFields(copy);
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 flex-1"
                          />
                          <select
                            value={field.field_type}
                            onChange={(e) => {
                              const copy = [...editFormFields];
                              copy[idx].field_type = e.target.value as any;
                              setEditFormFields(copy);
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="text">Text Input</option>
                            <option value="number">Number</option>
                            <option value="dropdown">Dropdown Options</option>
                          </select>
                        </div>
                        {field.field_type === 'dropdown' && (
                          <input
                            type="text"
                            placeholder="Options (comma separated)"
                            value={field.options ? field.options.join(',') : ''}
                            onChange={(e) => {
                              const copy = [...editFormFields];
                              copy[idx].options = e.target.value.split(',');
                              setEditFormFields(copy);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-slate-600">
                          <input
                            type="checkbox"
                            checked={field.is_required}
                            onChange={(e) => {
                              const copy = [...editFormFields];
                              copy[idx].is_required = e.target.checked;
                              setEditFormFields(copy);
                            }}
                            className="rounded text-slate-900"
                          />
                          Required
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setEditFormFields(editFormFields.filter((_, fIdx) => fIdx !== idx));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New College Event</h3>
                <p className="text-xs text-slate-500">
                  Configure event details, UPI payment credentials, and custom questions.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Event Basics
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organizing Club *
                    </label>
                    <select
                      required
                      value={clubId}
                      onChange={(e) => setClubId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. AI & Robotics Symposium"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Details, schedule, guidelines for attendees..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue *</label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Main Auditorium"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start & End Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="09:30 AM"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="05:00 PM"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="solo">Solo / Individual</option>
                      <option value="team">Team Based</option>
                    </select>
                  </div>

                  {(eventType === 'team' || eventType === 'hackathon') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Team Size (Min - Max)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={minTeamSize}
                          onChange={(e) => setMinTeamSize(Number(e.target.value))}
                          placeholder="Min"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                        />
                        <input
                          type="number"
                          value={maxTeamSize}
                          onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                          placeholder="Max"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Capacity
                    </label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      placeholder="500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <div className="mt-2.5 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <input
                        type="checkbox"
                        id="create-auto-close"
                        checked={autoCloseOnCapacity}
                        onChange={(e) => setAutoCloseOnCapacity(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <label htmlFor="create-auto-close" className="text-xs text-slate-700 cursor-pointer select-none">
                        <span className="font-bold block text-slate-900">Auto-close when maximum capacity is reached</span>
                        <span className="text-[11px] text-slate-500">
                          Automatically switches event status to "Registration Closed" and blocks new attendee submissions once maximum capacity is reached.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments Config */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Payment Settings
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registration Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value))}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Enter 0 for free events</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Club UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. club@okhdfcbank"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Poster Image URL
                    </label>
                    <input
                      type="text"
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Form Custom Fields */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Custom Form Questions
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormFields([
                        ...formFields,
                        {
                          id: `ff-${Date.now()}`,
                          field_name: `field_${Date.now()}`,
                          label: 'New Question',
                          field_type: 'text',
                          is_required: false,
                        },
                      ]);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-2">
                  {formFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => {
                              const copy = [...formFields];
                              copy[idx].label = e.target.value;
                              setFormFields(copy);
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 flex-1"
                          />
                          <select
                            value={field.field_type}
                            onChange={(e) => {
                              const copy = [...formFields];
                              copy[idx].field_type = e.target.value as any;
                              setFormFields(copy);
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="text">Text Input</option>
                            <option value="number">Number</option>
                            <option value="dropdown">Dropdown Options</option>
                          </select>
                        </div>
                        {field.field_type === 'dropdown' && (
                          <input
                            type="text"
                            placeholder="Options (comma separated)"
                            value={field.options ? field.options.join(',') : ''}
                            onChange={(e) => {
                              const copy = [...formFields];
                              copy[idx].options = e.target.value.split(',');
                              setFormFields(copy);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-slate-600">
                          <input
                            type="checkbox"
                            checked={field.is_required}
                            onChange={(e) => {
                              const copy = [...formFields];
                              copy[idx].is_required = e.target.checked;
                              setFormFields(copy);
                            }}
                            className="rounded text-slate-900"
                          />
                          Required
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setFormFields(formFields.filter((f) => f.id !== field.id));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Event...' : 'Create Event & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Payment to Event Modal */}
      {paymentConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Payment Requirement</h3>
                  <p className="text-xs text-slate-500">{paymentConfigModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentConfigModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEventPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registration Fee (INR ₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentFeeInput}
                    onChange={(e) => setPaymentFeeInput(Number(e.target.value))}
                    placeholder="e.g. 250"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Attendees will be required to transfer this amount via UPI before their registration is confirmed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  College / Club UPI ID *
                </label>
                <input
                  type="text"
                  required
                  value={paymentUpiInput}
                  onChange={(e) => setPaymentUpiInput(e.target.value)}
                  placeholder="e.g. collegeevents@okaxis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentConfigModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPaymentConfig || paymentFeeInput <= 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingPaymentConfig ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enable Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
