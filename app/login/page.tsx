'use client';

import { useState } from 'react';
import { authenticate } from '@/app/actions';
import logger from '@/lib/logger';
import { AlertCircle, Mail, ArrowRight, RefreshCw, Lock, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('action', mode);

      const result = await authenticate(undefined, formData);
      if (result) setError(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message !== 'NEXT_REDIRECT') {
        logger.error('Login handleSubmit failed', { message: err instanceof Error ? err.message : String(err) });
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setConfirmPassword('');
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
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-gray-400 mb-8">
          {mode === 'login'
            ? 'Sign in to track your job applications and get AI coaching.'
            : 'Sign up to start tracking your job applications.'}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300 text-left">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Email address"
                tabIndex={0}
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300 text-left">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Password"
                tabIndex={0}
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300 text-left">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  aria-label="Confirm password"
                  tabIndex={0}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm" role="alert">
              <AlertCircle size={16} aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            tabIndex={0}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" aria-hidden />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {mode === 'login' ? (
                  <>
                    Sign In <LogIn size={18} aria-hidden />
                  </>
                ) : (
                  <>
                    Create Account <UserPlus size={18} aria-hidden />
                  </>
                )}
              </>
            )}
          </button>

          <p className="text-sm text-center text-gray-400 mt-2">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-blue-400 hover:text-blue-300 transition font-medium"
                  tabIndex={0}
                  aria-label="Switch to sign up"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-blue-400 hover:text-blue-300 transition font-medium"
                  tabIndex={0}
                  aria-label="Switch to sign in"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
