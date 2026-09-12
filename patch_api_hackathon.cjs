const fs = require('fs');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

// Add multer import
code = code.replace(
  "import express, { Request, Response } from 'express';",
  "import express, { Request, Response } from 'express';\nimport multer from 'multer';\nimport path from 'path';\nimport fs_mod from 'fs';"
);

// Setup multer storage
const multerConfig = `
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'server', 'uploads');
    if (!fs_mod.existsSync(dir)) fs_mod.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF and PPT/PPTX are allowed.'));
  }
});

`;

code = code.replace("const router = express.Router();", "const router = express.Router();\n" + multerConfig);

// Add endpoints
const newEndpoints = `
// ====================
// HACKATHON ENDPOINTS
// ====================

// Upload submission (Team)
router.post('/registrations/:id/submission', upload.single('file'), (req: Request, res: Response) => {
  const { id } = req.params;
  const reg = db.getRegistration(id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  
  if (!req.file) return res.status(400).json({ error: 'No valid file uploaded' });

  // In a real app, verify that the logged-in user owns this registration.
  
  const hackathon_submission = {
    file_name: req.file.originalname,
    file_url: \`/api/registrations/\${id}/submission/download\`,
    file_path: req.file.path,
    file_type: req.file.mimetype,
    file_size: req.file.size,
    uploaded_at: new Date().toISOString(),
    submission_status: 'SUBMITTED' as const,
    email_status: reg.hackathon_submission?.email_status || 'NOT_SENT',
  };

  const updated = db.updateRegistration(id, { hackathon_submission, screening_status: 'pending' });
  res.json({ success: true, registration: updated });
});

// Download submission (Admin)
router.get('/registrations/:id/submission/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const reg = db.getRegistration(id);
  if (!reg || !reg.hackathon_submission || !reg.hackathon_submission.file_path) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  // Note: Add RBAC check here if strictly needed
  
  res.download(reg.hackathon_submission.file_path, reg.hackathon_submission.file_name);
});

// Review Submission (Admin)
router.post('/registrations/:id/screening', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, comment } = req.body; // status: 'shortlisted' | 'rejected' | 'pending'
  const adminId = getOrganizerIdentity(req);
  if (!adminId.email) return res.status(401).json({ error: 'Unauthorized' });

  const reg = db.getRegistration(id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  
  const event = db.getEvent(reg.event_id);

  const hackathon_submission = {
    ...(reg.hackathon_submission || {}),
    reviewer_id: adminId.email,
    reviewer_name: adminId.email,
    reviewer_comment: comment !== undefined ? comment : reg.hackathon_submission?.reviewer_comment,
    reviewed_at: new Date().toISOString()
  };
  
  const updated = db.updateRegistration(id, { 
    screening_status: status,
    hackathon_submission: hackathon_submission as any
  });
  
  // Send Email if finalized
  if ((status === 'shortlisted' || status === 'rejected') && event) {
    try {
      db.updateRegistration(id, { 
        hackathon_submission: { ...hackathon_submission, email_status: 'SENDING' } as any 
      });
      
      await sendScreeningStatusEmail(
        reg.email, 
        event.name, 
        reg.team_name || reg.name, 
        status
      );
      
      db.updateRegistration(id, { 
        hackathon_submission: { 
          ...hackathon_submission, 
          email_status: 'SENT', 
          email_sent_at: new Date().toISOString() 
        } as any 
      });
      
      // Log
      db.addAuditLog({
        user_email: adminId.email,
        action: 'SENT_SCREENING_EMAIL',
        entity_type: 'REGISTRATION',
        entity_id: id,
        metadata: { status, to: reg.email }
      });
      
    } catch (e: any) {
      console.error("Screening email error", e);
      db.updateRegistration(id, { 
        hackathon_submission: { 
          ...hackathon_submission, 
          email_status: 'FAILED',
          email_error: e.message 
        } as any 
      });
    }
  }

  // Log action
  db.addAuditLog({
    user_email: adminId.email,
    action: 'REVIEWED_SUBMISSION',
    entity_type: 'REGISTRATION',
    entity_id: id,
    metadata: { status, comment }
  });

  res.json({ success: true, registration: db.getRegistration(id) });
});

`;

// Add error handling for multer
code = code.replace(
  "export default router;",
  `${newEndpoints}\n\n// Handle Multer errors globally\nrouter.use((err: any, req: Request, res: Response, next: any) => {\n  if (err instanceof multer.MulterError || err.message.includes('Invalid file type')) {\n    return res.status(400).json({ error: err.message });\n  }\n  next(err);\n});\n\nexport default router;`
);

fs.writeFileSync('server/routes/api.ts', code);
console.log("Patched api.ts with hackathon endpoints");
