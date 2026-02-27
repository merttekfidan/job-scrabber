'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-[#0a0a0a] text-white p-6">
      <div className="bg-gray-900/40 p-8 rounded-2xl border border-white/5 max-w-md text-center">
        <AlertCircle className="mx-auto mb-4 text-red-400" size={48} aria-hidden />
        <h2 className="text-xl font-semibold mb-2">Bir hata oluştu</h2>
        <p className="text-gray-400 mb-6 text-sm">
          {error.message || 'Beklenmeyen bir hata oluştu.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          aria-label="Tekrar dene"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
