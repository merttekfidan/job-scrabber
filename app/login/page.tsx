'use client';

import { useState } from 'react';
import { authenticate, completeBypassLogin } from '@/app/actions';
import { Lock, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let data: { success?: boolean; bypass?: boolean; error?: string; isMock?: boolean };
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(res.ok ? 'Invalid server response. Please try again.' : `Server error (${res.status}). Please try again.`);
        return;
      }

      if (data?.success) {
        if (data.bypass) {
          try {
            const result = await completeBypassLogin(email);
            if (result) setError(result);
          } catch (err) {
            console.error('[Login] completeBypassLogin error:', err);
            setError('Bypass login failed. Please request a new code.');
          }
        } else {
          setStep('code');
          setCodeSent(true);
          if (data.isMock) {
            setError(
              'Notice: RESEND_API_KEY is missing. The 6-digit code was printed to your Next.js terminal.'
            );
          }
        }
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('[Login] handleSendOTP error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', code);

      const result = await authenticate(undefined, formData);
      if (result) setError(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message !== 'NEXT_REDIRECT') {
        console.error('[Login] handleVerify error:', err);
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    await handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/5 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="HuntIQ Logo"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-purple-500/20 object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {step === 'email' ? 'Welcome to HuntIQ' : 'Check Your Email'}
        </h1>
        <p className="text-gray-400 mb-8">
          {step === 'email' ? (
            'Sign in to track your job applications and get AI coaching.'
          ) : (
            <>
              We sent a 6-digit code to <strong className="text-white">{email}</strong>
            </>
          )}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="w-full max-w-sm mx-auto flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300 text-left">
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  aria-label="Email address"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" aria-hidden /> Sending...
                </>
              ) : (
                <>
                  Send Login Code <ArrowRight size={18} aria-hidden />
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-2">
              New users will be automatically registered.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="w-full max-w-sm mx-auto flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="text-sm font-medium text-gray-300 text-left">
                Verification Code
              </label>
              <div className="relative">
                <input
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-2xl tracking-[0.5em] text-center"
                  aria-label="Verification code"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" aria-hidden /> Verifying...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="flex items-center justify-between text-sm mt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="text-gray-400 hover:text-white transition"
              >
                ← Change email
              </button>
              <button type="button" onClick={handleResend} className="text-blue-400 hover:text-blue-300 transition">
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
