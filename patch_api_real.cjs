const fs = require('fs');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

const targetStr = `  try {
    const result = await sendOTP(email, code);
    res.json({ success: true, message: 'OTP sent successfully', previewUrl: result.previewUrl, code: result.code });
  } catch (err: any) {`;

const replaceStr = `  try {
    await sendOTP(email, code);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server/routes/api.ts', code);
  console.log("Patched api.ts");
} else {
  console.log("Could not find target in api.ts");
}
