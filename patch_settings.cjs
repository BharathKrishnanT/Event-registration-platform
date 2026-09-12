const fs = require('fs');
let code = fs.readFileSync('src/components/admin/SettingsView.tsx', 'utf8');

// Add new state variables
code = code.replace(
  "const [isSendingReminders, setIsSendingReminders] = useState(false);",
  "const [isSendingReminders, setIsSendingReminders] = useState(false);\n  const [isSending1Day, setIsSending1Day] = useState(false);\n  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);\n  const [broadcastSubject, setBroadcastSubject] = useState('');\n  const [broadcastMessage, setBroadcastMessage] = useState('');"
);

// Add handlers
const newHandlers = `
  const handleSend1DayReminder = async () => {
    setIsSending1Day(true);
    try {
      const res = await fetch(\`/api/events/\${event.id}/reminders/1-day\`, { method: 'POST' });
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
      const res = await fetch(\`/api/events/\${event.id}/broadcast\`, {
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
`;

code = code.replace(
  "const handleSendReminders = async () => {",
  newHandlers + "\n  const handleSendReminders = async () => {"
);


// Replace the reminders tab content
const oldTab1End = "      {/* Tab 2: Email Logs */}";
const newRemindersSection = `
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-8">
          
          {/* Section 1: 1-Day Reminder */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
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
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
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
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
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

      {/* Tab 2: Email Logs */}`;

const oldRemindersRegex = /\{\/\* Tab 1: Automated Reminders \*\/\}[\s\S]*?(?=\{\/\* Tab 2: Email Logs \*\/\} )/g;

// A little trick because regex replace with multiple lines is hard in string
code = code.split("{/* Tab 1: Automated Reminders */}").shift() + 
       "{/* Tab 1: Automated Reminders */}\n      {activeTab === 'reminders' && (\n" + 
       newRemindersSection;

fs.writeFileSync('src/components/admin/SettingsView.tsx', code);
console.log('Settings Patched');
