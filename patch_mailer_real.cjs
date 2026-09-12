const fs = require('fs');
let code = fs.readFileSync('server/mailer.ts', 'utf8');

const targetStr = `  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    console.log("No SMTP configured. Using Ethereal test account:", testAccount.user);
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }`;

const replaceStr = `  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables must be configured to send real emails. Please add them in the Secrets menu.");
  }`;

code = code.replace(targetStr, replaceStr);

// Also remove the "test mode" logic from sendOTP
code = code.replace(
  /let previewUrl = undefined;[\s\S]*?return \{ info, previewUrl, code: !process\.env\.SMTP_HOST \? code : undefined \};/,
  "return { info };"
);

fs.writeFileSync('server/mailer.ts', code);
console.log("Patched mailer.ts for real emails");
