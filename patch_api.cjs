const fs = require('fs');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

// Import new mailer functions
code = code.replace(
  "import { sendOTP, sendRegistrationConfirmation, sendScreeningStatusEmail } from '../mailer.ts';",
  "import { sendOTP, sendRegistrationConfirmation, sendScreeningStatusEmail, sendCustomBroadcastEmail, sendEventReminderEmail } from '../mailer.ts';"
);

// Add email sending to verify payment
const oldVerify = `  const result = db.verifyPayment(id, identity.email);
  if (!result.success) {
    return res.status(404).json({ error: 'Registration or payment not found' });
  }
  res.json({ success: true, message: 'Payment verified and QR pass generated', registration: result.registration });`;

const newVerify = `  const result = db.verifyPayment(id, identity.email);
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

  res.json({ success: true, message: 'Payment verified and QR pass generated', registration: result.registration });`;

code = code.replace(oldVerify, newVerify);

// Add custom broadcast & 1-day reminder endpoints
const newEndpoints = `
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
      const htmlContent = \`
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">Message from \${event.name} Organizers</h2>
          <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-top: 20px; line-height: 1.6;">
            \${message.replace(/\\n/g, '<br/>')}
          </div>
        </div>
      \`;
      await sendCustomBroadcastEmail(reg.email, subject, htmlContent);
      sentCount++;
    } catch (e) {
      console.error('Broadcast failed for', reg.email, e);
    }
  }

  res.json({ success: true, message: \`Broadcast sent to \${sentCount} confirmed participants.\` });
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

  res.json({ success: true, message: \`1-Day reminder sent to \${sentCount} confirmed participants.\` });
});
`;

code = code.replace(
  "router.post('/events/:id/reminders/send', async (req: Request, res: Response) => {",
  newEndpoints + "\nrouter.post('/events/:id/reminders/send', async (req: Request, res: Response) => {"
);

fs.writeFileSync('server/routes/api.ts', code);
console.log('API Patched');
