'use client';

import { useState } from 'react';
import { authenticate } from "../actions"
import { Lock, Briefcase, AlertCircle, Mail, ArrowRight, RefreshCw } from "lucide-react"

export default function LoginPage() {
    const [step, setStep] = useState('email'); // 'email' | 'code'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    const handleSendOTP = async (e) => {
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

            const data = await res.json();

            if (data.success) {
                if (data.bypass && data.bypassCode) {
                    const formData = new FormData();
                    formData.append('email', email);
                    formData.append('code', data.bypassCode);
                    const result = await authenticate(undefined, formData);
                    if (result) {
                        setError(result);
                    }
                } else {
                    setStep('code');
                    setCodeSent(true);
                    if (data.isMock) {
                        setError('Notice: RESEND_API_KEY is missing. The 6-digit code was printed to your Next.js terminal.');
                    }
                }
            } else {
                setError(data.error || 'Failed to send verification code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!code) return;

        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('code', code);

            const result = await authenticate(undefined, formData);
            if (result) {
                setError(result); // Error message from server action
            }
        } catch (err) {
            // Redirect happens on success — this catch is for actual errors
            if (err.message !== 'NEXT_REDIRECT') {
                setError('Verification failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        await handleSendOTP({ preventDefault: () => { } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
            <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/5 w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Briefcase size={32} className="text-blue-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                    {step === 'email' ? 'Welcome to Job Scrabber' : 'Check Your Email'}
                </h1>
                <p className="text-gray-400 mb-8">
                    {step === 'email'
                        ? 'Sign in to track your job applications and get AI coaching.'
                        : <>We sent a 6-digit code to <strong className="text-white">{email}</strong></>
                    }
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
                                />
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><RefreshCw size={18} className="animate-spin" /> Sending...</>
                            ) : (
                                <>Send Login Code <ArrowRight size={18} /></>
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
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || code.length !== 6}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><RefreshCw size={18} className="animate-spin" /> Verifying...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="flex items-center justify-between text-sm mt-2">
                            <button
                                type="button"
                                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                                className="text-gray-400 hover:text-white transition"
                            >
                                ← Change email
                            </button>
                            <button
                                type="button"
                                onClick={handleResend}
                                className="text-blue-400 hover:text-blue-300 transition"
                            >
                                Resend code
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
