import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6"
      role="status"
      aria-label="Page not found"
    >
      <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/5 max-w-md text-center">
        <FileQuestion
          className="mx-auto mb-4 text-gray-500"
          size={48}
          aria-hidden
        />
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-gray-400 mb-6 text-sm">
          The page or application you&apos;re looking for doesn&apos;t exist or
          you don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
