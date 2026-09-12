const fs = require('fs');
let code = fs.readFileSync('server/mailer.ts', 'utf8');

// Replace the from address in sendOTP
code = code.replace(
  /from: '"Event Registration" <noreply@events.local>',/g,
  `from: \`"Event Registration" <\${process.env.SMTP_USER}>\`,`
);

// Replace the from address in sendRegistrationConfirmation
code = code.replace(
  /from: '"Event Registration" <noreply@events.local>',/g,
  `from: \`"Event Registration" <\${process.env.SMTP_USER}>\`,`
);

// Replace the from address in sendScreeningStatusEmail
code = code.replace(
  /from: '"Event Organizing Team" <noreply@events.local>',/g,
  `from: \`"Event Organizing Team" <\${process.env.SMTP_USER}>\`,`
);

fs.writeFileSync('server/mailer.ts', code);
console.log("Patched mailer.ts to use real From address");
