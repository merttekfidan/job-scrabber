'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { safeParseJson } from '@/lib/utils';

type RedFlagsPanelProps = {
  negativeSignals: string[] | string;
};

export const RedFlagsPanel = ({ negativeSignals }: RedFlagsPanelProps) => {
  const signals = safeParseJson<string[]>(negativeSignals, []);
  if (signals.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-red-400">
        <AlertCircle size={18} /> Red Flags
      </h3>
      <ul className="space-y-3">
        {signals.map((signal, idx) => (
          <li key={idx} className="flex gap-2 text-base text-red-200/80">
            <span className="font-bold text-red-500">•</span>
            <span className="leading-snug">{signal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
