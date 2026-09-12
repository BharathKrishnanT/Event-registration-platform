const fs = require('fs');

let code = fs.readFileSync('src/components/public/PublicEventPage.tsx', 'utf8');

// Add states
code = code.replace(
  "const [email, setEmail] = useState('');",
  "const [email, setEmail] = useState('');\n  const [isEmailVerified, setIsEmailVerified] = useState(false);\n  const [otpCode, setOtpCode] = useState('');\n  const [isOtpSent, setIsOtpSent] = useState(false);\n  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);\n  const [otpError, setOtpError] = useState('');\n  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');"
);

// Add OTP functions
const otpFuncs = `
  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setOtpError('');
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setOtpSuccessMsg('Verification code sent! Please check your email.');
      } else {
        setOtpError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setOtpError('Network error. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setOtpError('Please enter the OTP.');
      return;
    }
    setOtpError('');
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        setIsEmailVerified(true);
        setIsOtpSent(false);
        setOtpSuccessMsg('Email successfully verified!');
      } else {
        setOtpError(data.error || 'Invalid OTP.');
      }
    } catch (err) {
      setOtpError('Network error. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };
`;

code = code.replace('const handleSubmit = async (e: React.FormEvent) => {', otpFuncs + '\n  const handleSubmit = async (e: React.FormEvent) => {');

// Prevent submit if not verified
code = code.replace(
  'if (!name || !phone || !email || !college || !department) {',
  'if (!isEmailVerified) {\n      setError("Please verify your email address using the OTP sent to your mail.");\n      setIsSubmitting(false);\n      return;\n    }\n    if (!name || !phone || !email || !college || !department) {'
);

// Update Email Field UI
const emailFieldOriginal = `                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>`;

const emailFieldNew = `                {/* Email with OTP Verification */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={isEmailVerified}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setIsEmailVerified(false); setIsOtpSent(false); setOtpSuccessMsg(''); }}
                        className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="john@example.com"
                      />
                    </div>
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isVerifyingOtp || !email}
                        className="whitespace-nowrap px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isOtpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    )}
                    {isEmailVerified && (
                      <div className="flex items-center px-4 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl border border-emerald-200">
                        <CheckCircle className="w-4 h-4 mr-2" /> Verified
                      </div>
                    )}
                  </div>
                  
                  {isOtpSent && !isEmailVerified && (
                    <div className="mt-3 flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="block w-full sm:w-48 px-4 py-2.5 border border-brand-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm text-center tracking-widest font-mono"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpCode.length < 6}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                  {otpError && <p className="mt-2 text-sm text-rose-500 font-medium">{otpError}</p>}
                  {otpSuccessMsg && <p className="mt-2 text-sm text-emerald-600 font-medium">{otpSuccessMsg}</p>}
                </div>`;

code = code.replace(emailFieldOriginal, emailFieldNew);

fs.writeFileSync('src/components/public/PublicEventPage.tsx', code);
console.log('Patched PublicEventPage');
