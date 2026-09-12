const nodemailer = require('nodemailer');
function cleanEnv(val, keyName) {
  if (!val) return '';
  let cleaned = val.trim();
  const prefixRegex = new RegExp('^' + keyName + '[\\s=]*', 'i');
  cleaned = cleaned.replace(prefixRegex, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned.trim();
}

async function test() {
  const host = cleanEnv(process.env.SMTP_HOST, 'SMTP_HOST');
  const port = cleanEnv(process.env.SMTP_PORT, 'SMTP_PORT');
  const secure = cleanEnv(process.env.SMTP_SECURE, 'SMTP_SECURE');
  const user = cleanEnv(process.env.SMTP_USER, 'SMTP_USER');
  const pass = cleanEnv(process.env.SMTP_PASS, 'SMTP_PASS');
  
  console.log("Config:", { host, port, secure, user, pass: pass ? "***" : "none" });

  const transporter = nodemailer.createTransport({
    host: host,
    port: Number(port) || 587,
    secure: secure === 'true',
    auth: {
      user: user,
      pass: pass,
    },
  });
  
  try {
    let info = await transporter.sendMail({
      from: '"Test" <noreply@events.local>',
      to: 'bharathkrishnan.t@gmail.com', // The user's email
      subject: 'Test',
      text: 'Test mail'
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Mail Error:", err);
  }
}
test();
