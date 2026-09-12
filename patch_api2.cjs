const fs = require('fs');
const crypto = require('crypto');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

// Update destructuring
code = code.replace(
  "const { event_id, name, phone, email, college, department, transaction_id, custom_fields, team_name, team_members } = req.body;",
  "const { event_id, name, phone, email, college, department, transaction_id, custom_fields, team_name, team_members, screening_document_base64, screening_document_name } = req.body;"
);

// Add logic to save file before calling createRegistration
const createRegOrig = `
    const result = db.createRegistration({
      event_id,
      name,
      phone,
      email,
      college,
      department,
      transaction_id,
      custom_fields,
      team_name,
      team_members,
    });`;

const createRegNew = `
    let screening_document_url;
    if (screening_document_base64 && screening_document_name) {
      try {
        const matches = screening_document_base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = Date.now() + '-' + screening_document_name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fs = require('fs');
          fs.writeFileSync('./uploads/' + fileName, buffer);
          screening_document_url = '/uploads/' + fileName;
        }
      } catch (err) {
        console.error("Failed to save screening document:", err);
      }
    }

    const result = db.createRegistration({
      event_id,
      name,
      phone,
      email,
      college,
      department,
      transaction_id,
      custom_fields,
      team_name,
      team_members,
      screening_document_url,
    });`;

code = code.replace(createRegOrig, createRegNew);

// Add route to update screening status
const statusRoute = `
router.post('/registrations/:id/screening-status', async (req: Request, res: Response) => {
  try {
    const identity = getOrganizerIdentity(req);
    if (!identity.hasPermission('participant_modification')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!['shortlisted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const reg = db.getRegistrationById(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    const event = db.getEventById(reg.event_id);

    const updated = db.updateRegistration(id, { screening_status: status });
    
    if (updated && status !== 'pending') {
      try {
        const { sendScreeningStatusEmail } = require('../mailer.ts');
        await sendScreeningStatusEmail(reg.email, event?.name || 'Hackathon', reg.team_name || reg.name, status);
      } catch (e) {
        console.error("Failed to send screening email:", e);
      }
    }

    res.json({ success: true, registration: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;

code = code.replace("router.get('/registrations', async (req: Request, res: Response) => {", statusRoute + "\nrouter.get('/registrations', async (req: Request, res: Response) => {");

fs.writeFileSync('server/routes/api.ts', code);
console.log('Patched api2');
