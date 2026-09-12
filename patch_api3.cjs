const fs = require('fs');
let code = fs.readFileSync('server/routes/api.ts', 'utf8');

code = code.replace("const { sendScreeningStatusEmail } = require('../mailer.ts');", "");
code = code.replace("import { sendOTP, sendRegistrationConfirmation } from '../mailer.ts';", "import { sendOTP, sendRegistrationConfirmation, sendScreeningStatusEmail } from '../mailer.ts';");

fs.writeFileSync('server/routes/api.ts', code);
console.log('Patched require to static import');
