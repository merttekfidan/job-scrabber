'use client';

import Link from 'next/link';
import { AlertCircle, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/5 max-w-md text-center">
        <AlertCircle
          className="mx-auto mb-4 text-red-400"
          size={48}
          aria-hidden
        />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6 text-sm">
          {error.message || 'An unexpected error occurred in the dashboard.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} aria-label="Try again">
            Try again
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <LayoutDashboard size={16} aria-hidden />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
