const fs = require('fs');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

const targetStr = `  try {
    await sendOTP(email, code);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('OTP Send error:', err);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }`;

const replaceStr = `  try {
    await sendOTP(email, code);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('OTP Send error:', err);
    res.status(500).json({ error: 'Failed to send OTP email: ' + (err.message || err.toString()) });
  }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server/routes/api.ts', code);
  console.log("Patched api.ts");
} else {
  console.log("Not found in api.ts");
}
