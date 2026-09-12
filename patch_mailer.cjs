const fs = require('fs');
let code = fs.readFileSync('server/mailer.ts', 'utf8');

// Update sendOTP
code = code.replace(
  /export async function sendOTP[\s\S]*?return info;\n\}/,
  `export async function sendOTP(to: string, code: string) {
  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: '"Event Registration" <noreply@events.local>',
    to,
    subject: 'Your Verification Code',
    text: \`Your verification code is: \${code}\`,
    html: \`<b>Your verification code is:</b> <h2>\${code}</h2>\`,
  });

  console.log("OTP Email sent: %s", info.messageId);
  
  let previewUrl = undefined;
  if (!process.env.SMTP_HOST) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("Preview URL: %s", previewUrl);
  }
  
  return { info, previewUrl, code: !process.env.SMTP_HOST ? code : undefined };
}`
);

fs.writeFileSync('server/mailer.ts', code);
console.log("Patched mailer.ts");
