'use client';

import { useActionState } from 'react';
import { authenticate } from "../actions"
import Link from "next/link"
import { Lock, Briefcase, AlertCircle } from "lucide-react"

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
            <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/5 w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Briefcase size={32} className="text-blue-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                <p className="text-gray-400 mb-8">Sign in to track your job applications and get AI coaching.</p>

                <form
                    action={dispatch}
                    className="w-full max-w-sm flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="code" className="text-sm font-medium text-gray-300">Login Code</label>
                        <div className="relative">
                            <input
                                name="code"
                                type="text"
                                placeholder="123456"
                                required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest"
                            />
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        </div>
                        <p className="text-xs text-blue-400">
                            For this demo, the code is always <strong>123456</strong>
                        </p>
                    </div>

                    <div
                        className="flex h-8 items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <>
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <p className="text-sm text-red-500">{errorMessage}</p>
                            </>
                        )}
                    </div>

                    <button
                        aria-disabled={isPending}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                    >
                        {isPending ? 'Signing in...' : 'Sign In'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        New users will be automatically registered.
                    </p>
                </form>
            </div>
        </div>
    )
}
