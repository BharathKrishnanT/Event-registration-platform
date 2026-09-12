const fs = require('fs');

const componentCode = `import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Lock, ArrowRight, KeyRound } from 'lucide-react';
import { User } from '../../types.ts';

interface AdminLoginProps {
  onLoginSuccess: (user: User, token: string) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Access denied');
      }
      
      if (data.requires_otp) {
        setStep('otp');
      } else {
        // Unexpected state: Login success without OTP
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Access denied. Account not authorized.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 bg-slate-900 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 mb-3 border border-white/20">
            {step === 'email' ? <Lock className="w-6 h-6 text-white" /> : <KeyRound className="w-6 h-6 text-white" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">Organizer Portal</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            {step === 'email' ? 'Authorized College Event Organizers & Admins Only' : 'Enter the 6-digit code sent to your email'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            2-Step Verification Enforced
          </div>
        </div>

        {/* Body Form */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {errorMsg}
              </div>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Authorized Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter authorized admin email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\\D/g, '').substring(0, 6))}
                  placeholder="000000"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-center text-2xl tracking-widest font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Sign In
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setErrorMsg(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {step === 'email' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                ← Back to Public Event Registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`
fs.writeFileSync('src/components/admin/AdminLogin.tsx', componentCode);
