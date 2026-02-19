
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    let errorMessage = "An unknown error occurred.";
    if (error === 'Configuration') {
        errorMessage = "There is a problem with the server configuration. Check if your .env.local file has the correct AUTH_SECRET and Google credentials.";
    } else if (error === 'AccessDenied') {
        errorMessage = "Access denied. You do not have permission to sign in.";
    } else if (error === 'Verification') {
        errorMessage = "The sign in link is no longer valid. It may have been used already or it may have expired.";
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
            <div className="bg-gray-900/40 p-8 rounded-2xl border border-red-500/20 w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
                <p className="text-red-300 font-medium mb-4">{error}</p>
                <p className="text-gray-400 mb-8">{errorMessage}</p>

                <a href="/login" className="text-blue-400 hover:text-blue-300 underline">Back to Login</a>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
