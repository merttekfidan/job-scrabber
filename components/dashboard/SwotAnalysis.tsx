'use client';

import React from 'react';
import { BrainCircuit, CheckCircle, AlertCircle } from 'lucide-react';
import { safeParseJson } from '@/lib/utils';

export type SwotData = {
  strengths?: string | string[];
  weaknesses?: string | string[];
  [key: string]: unknown;
};

type SwotAnalysisProps = {
  swot: SwotData | null;
};

export const SwotAnalysis = ({ swot }: SwotAnalysisProps) => {
  if (!swot) return null;

  const strengths = Array.isArray(swot.strengths)
    ? swot.strengths
    : safeParseJson<string[]>(swot.strengths, []);
  const weaknesses = Array.isArray(swot.weaknesses)
    ? swot.weaknesses
    : safeParseJson<string[]>(swot.weaknesses, []);

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-xl font-bold text-white">
        <BrainCircuit className="text-purple-400" /> Candidate Gap Analysis (SWOT)
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-green-500/10 bg-green-500/5 p-5">
          <h4 className="mb-3 flex items-center gap-2 border-b border-green-500/10 pb-2 font-bold text-green-400">
            <CheckCircle size={16} /> Strengths
          </h4>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-gray-300">
                <span className="mt-1.5 block h-[6px] min-w-[6px] rounded-full bg-green-500 text-green-500/50" />
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
          <h4 className="mb-3 flex items-center gap-2 border-b border-red-500/10 pb-2 font-bold text-red-400">
            <AlertCircle size={16} /> Gaps / Weaknesses
          </h4>
          <ul className="space-y-2">
            {weaknesses.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-gray-300">
                <span className="mt-1.5 block h-[6px] min-w-[6px] rounded-full bg-red-500 text-red-500/50" />
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
