import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Mail,
  ShieldCheck,
  History,
  Send,
  CheckCircle2,
  RefreshCw,
  Database,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';
import { Event, AuditLog, EmailLog } from '../../types.ts';

interface SettingsViewProps {
  event: Event;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ event }) => {
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [isSending1Day, setIsSending1Day] = useState(false);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [reminderResult, setReminderResult] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [activeTab, setActiveTab] = useState<'reminders' | 'emails' | 'audit' | 'data'>('reminders');

  const [notice, setNotice] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetAttendanceModal, setShowResetAttendanceModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchLogs = async () => {
    try {
      const [auditRes, emailRes] = await Promise.all([
        fetch('/api/audit-logs'),
        fetch(`/api/email-logs?event_id=${event.id}`),
      ]);
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (emailRes.ok) setEmailLogs(await emailRes.json());
    } catch (e) {
      console.error('Failed to load logs', e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [event.id]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  
  const handleSend1DayReminder = async () => {
    setIsSending1Day(true);
    try {
      const res = await fetch(`/api/events/${event.id}/reminders/1-day`, { method: 'POST' });
      const data = await res.json();
      showNotice(data.message || '1-Day reminders sent.');
      fetchLogs();
    } catch (e: any) {
      console.error('1-Day Reminders failed', e);
      showNotice('Failed to send reminders.');
    } finally {
      setIsSending1Day(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;
    setIsSendingBroadcast(true);
    try {
      const res = await fetch(`/api/events/${event.id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: broadcastSubject, message: broadcastMessage })
      });
      const data = await res.json();
      showNotice(data.message || 'Broadcast sent.');
      setBroadcastSubject('');
      setBroadcastMessage('');
      fetchLogs();
    } catch (e: any) {
      console.error('Broadcast failed', e);
      showNotice('Failed to send broadcast.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    setReminderResult(null);
    try {
      const res = await fetch(`/api/events/${event.id}/reminders/send`, { method: 'POST' });
      const data = await res.json();
      setReminderResult(data);
      fetchLogs();
    } catch (e: any) {
      console.error('Reminders failed', e);
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleClearEventData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch(`/api/events/${event.id}/clear-data`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showNotice(`Cleared ${data.clearedRegistrations} registrations and ${data.clearedAttendance} attendance records.`);
        setShowClearModal(false);
        fetchLogs();
      }
    } catch (e) {
      console.error('Failed to clear event data', e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetAttendance = async () => {
    setIsClearing(true);
    try {
      const res = await fetch(`/api/events/${event.id}/reset-attendance`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showNotice(`Reset attendance scans for ${data.resetCount} attendees. Registrations and payments remain intact.`);
        setShowResetAttendanceModal(false);
        fetchLogs();
      }
    } catch (e) {
      console.error('Failed to reset attendance', e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reminders'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Automated Reminders
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'emails'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Email Delivery Logs
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Logs & Security Trail
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'data'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Database & Reset Tools
        </button>
      </div>

      {/* Tab 1: Automated Reminders */}
      {activeTab === 'reminders' && (

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-8">
          
          {/* Section 1: 1-Day Reminder */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1-Day Event Reminder</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Sends a reminder email with the QR code pass to ALL confirmed participants. Use this 24 hours before the event starts.
                </p>
              </div>
            </div>
            <button
              onClick={handleSend1DayReminder}
              disabled={isSending1Day}
              className="ml-16 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending1Day ? 'Sending Reminders...' : 'Send 1-Day Reminders'}
            </button>
          </div>

          {/* Section 2: Custom Broadcast */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Custom Broadcast Email</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl mb-4">
                  Send a custom message to ALL confirmed participants. Useful for venue changes, important announcements, or special instructions.
                </p>
                <form onSubmit={handleSendBroadcast} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject Line</label>
                    <input 
                      type="text" 
                      required
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" 
                      placeholder="e.g., Important Update regarding Venue" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message Content (Plain Text)</label>
                    <textarea 
                      required
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={4} 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" 
                      placeholder="Write your message here..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSendingBroadcast ? 'Sending Broadcast...' : 'Send Broadcast Email'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Section 3: Check-in Follow-up (Existing) */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Missing Check-Ins Reminder</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl mb-4">
                Dispatches targeted email alerts containing personalized QR check-in passes to confirmed attendees who have NOT yet scanned at the entrance gates.
              </p>
              
              {reminderResult && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">{reminderResult.message}</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSendReminders}
                disabled={isSendingReminders}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                {isSendingReminders ? 'Broadcasting...' : 'Trigger Missing Check-in Broadcast'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Email Logs */}      {activeTab === 'emails' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Email Delivery Log</h3>
            <button onClick={fetchLogs} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.map((l: any) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">{new Date(l.sent_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{l.type}</td>
                    <td className="px-4 py-3">{l.recipient}</td>
                    <td className="px-4 py-3 text-emerald-600">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Security & Audit Trail</h3>
            <button onClick={fetchLogs} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((l: any) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">{l.user_email}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{l.action}</td>
                    <td className="px-4 py-3 text-slate-500">{l.entity_type} ({l.entity_id})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Database & Reset Tools */}
      {activeTab === 'data' && (
        <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Danger Zone</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                These actions are destructive and cannot be undone. Please proceed with extreme caution.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
             <button
                onClick={() => setShowClearModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                Wipe All Event Data
              </button>
          </div>
        </div>
      )}

      {/* Clear Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <h3 className="font-bold text-slate-900">Wipe All Event Data</h3>
            </div>
            <div className="p-6 text-sm text-slate-600">
              Are you absolutely sure? This will delete all registrations, payments, and attendance records for <strong>{event.name}</strong>. This cannot be undone!
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 font-bold text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleClearEventData}
                disabled={isClearing}
                className="px-6 py-2 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {isClearing ? 'Wiping Data...' : 'Yes, Wipe Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
