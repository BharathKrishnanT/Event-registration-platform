const fs = require('fs');
let code = fs.readFileSync('src/components/public/PublicEventPage.tsx', 'utf8');

const targetStr = `      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setOtpSuccessMsg('Verification code sent! Please check your email.');
      } else {`;

const replaceStr = `      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        if (data.code) {
          setOtpSuccessMsg(\`[Test Mode] Verification code is: \${data.code}\`);
          setOtpCode(data.code);
        } else {
          setOtpSuccessMsg('Verification code sent! Please check your email.');
        }
      } else {`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/public/PublicEventPage.tsx', code);
    console.log("Patched PublicEventPage.tsx");
} else {
    console.log("Could not find target string in PublicEventPage.tsx");
}
