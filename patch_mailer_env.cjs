const fs = require('fs');
let code = fs.readFileSync('server/mailer.ts', 'utf8');

const helper = `
function cleanEnv(val, keyName) {
  if (!val) return '';
  let cleaned = val.trim();
  const prefixRegex = new RegExp('^' + keyName + '[\\\\s=]*', 'i');
  cleaned = cleaned.replace(prefixRegex, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned.trim();
}
`;

const targetStr = `  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });`;

const replaceStr = `  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const host = cleanEnv(process.env.SMTP_HOST, 'SMTP_HOST');
    const portStr = cleanEnv(process.env.SMTP_PORT, 'SMTP_PORT');
    const secureStr = cleanEnv(process.env.SMTP_SECURE, 'SMTP_SECURE');
    const user = cleanEnv(process.env.SMTP_USER, 'SMTP_USER');
    const pass = cleanEnv(process.env.SMTP_PASS, 'SMTP_PASS');
    
    transporter = nodemailer.createTransport({
      host: host,
      port: Number(portStr) || 587,
      secure: secureStr === 'true',
      auth: {
        user: user,
        pass: pass,
      },
    });`;

// Ensure we don't add the helper multiple times
if (!code.includes('function cleanEnv')) {
  // Add helper right after imports
  code = code.replace(/import \* as nodemailer from 'nodemailer';/, "import * as nodemailer from 'nodemailer';\n" + helper);
}

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('server/mailer.ts', code);
console.log("Patched mailer.ts to clean environment variables");
