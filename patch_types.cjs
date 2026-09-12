const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const registrationHackathonFields = `
  screening_document_url?: string;
  screening_status?: 'pending' | 'shortlisted' | 'rejected';
  
  // Advanced Hackathon Fields
  hackathon_submission?: {
    file_name: string;
    file_url: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
    submission_status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UPDATED';
    reviewer_id?: string;
    reviewer_name?: string;
    reviewer_comment?: string;
    reviewed_at?: string;
    email_status?: 'NOT_SENT' | 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
    email_sent_at?: string;
    email_error?: string;
  };
`;

code = code.replace(
  /screening_document_url\?\: string;\n\s*screening_status\?\: 'pending' \| 'shortlisted' \| 'rejected';/,
  registrationHackathonFields
);

const eventHackathonFields = `
  auto_closed_at?: string;
  
  // Hackathon specific config
  hackathon_settings?: {
    submission_opens?: string;
    submission_deadline?: string;
    allow_late_submissions?: boolean;
    sender_name?: string;
    reply_to?: string;
    shortlisted_email_subject?: string;
    shortlisted_email_body?: string;
    not_shortlisted_email_subject?: string;
    not_shortlisted_email_body?: string;
  };
`;

code = code.replace(/auto_closed_at\?\: string;/, eventHackathonFields);

fs.writeFileSync('src/types.ts', code);
console.log("Patched types.ts");
