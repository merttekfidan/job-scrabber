'use client';

import React from 'react';
import { Globe } from 'lucide-react';

type SalaryContext = {
  range?: string;
  confidence?: string;
  source?: string;
} | string;

type CompetitorContext = {
  likelyCompetitors?: string[];
  differentiator?: string;
};

type HiringUrgency = {
  level?: string;
  signals?: string[];
};

type RemotePolicy = {
  type?: string;
  details?: string;
};

type CultureSignal = {
  signal?: string;
  rating?: number;
  evidence?: string;
  implication?: string;
};

type CompanyInsights = {
  strategicFocus?: string;
  salaryContext?: SalaryContext;
  competitorContext?: CompetitorContext;
  hiringUrgency?: HiringUrgency;
  remotePolicy?: RemotePolicy;
  cultureSignals?: CultureSignal[];
};

type CompanyInsightsPanelProps = {
  insights: CompanyInsights | null;
};

export const CompanyInsightsPanel = ({ insights }: CompanyInsightsPanelProps) => {
  if (!insights) return null;

  return (
    <div className="space-y-6">
      {insights.strategicFocus && (
        <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6 transition-colors hover:border-indigo-500/40">
          <div className="-mr-10 -mt-10 absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
          <h3 className="relative z-10 mb-4 flex items-center gap-2 text-lg font-bold text-indigo-400">
            <Globe size={20} /> Company Strategic Focus
          </h3>
          <p className="relative z-10 text-lg leading-relaxed text-gray-300">
            {insights.strategicFocus}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.salaryContext && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-emerald-400">
              💰 Salary Intelligence
            </h4>
            {typeof insights.salaryContext === 'object' ? (
              <div className="flex flex-col gap-2">
                {insights.salaryContext.range && (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2">
                    <span className="text-base font-medium uppercase tracking-wider text-gray-400">
                      Est. Range
                    </span>
                    <span className="text-base font-bold text-emerald-300">
                      {insights.salaryContext.range}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  {typeof insights.salaryContext === 'object' &&
                    insights.salaryContext.confidence && (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          insights.salaryContext.confidence === 'high'
                            ? 'border-green-500/20 bg-green-500/10 text-green-400'
                            : insights.salaryContext.confidence === 'medium'
                              ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                              : 'border-gray-700 bg-gray-800 text-gray-400'
                        }`}
                      >
                        {insights.salaryContext.confidence} Confidence
                      </span>
                    )}
                  {typeof insights.salaryContext === 'object' &&
                    insights.salaryContext.source && (
                      <span
                        className="flex-1 truncate text-[10px] italic text-gray-500"
                        title={insights.salaryContext.source}
                      >
                        Source: {insights.salaryContext.source}
                      </span>
                    )}
                </div>
              </div>
            ) : (
              <p className="text-base leading-relaxed text-gray-300">
                {insights.salaryContext}
              </p>
            )}
          </div>
        )}

        {insights.competitorContext && (
          <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 p-5">
            <h4 className="mb-3 font-bold text-violet-400">🏁 Competitive Landscape</h4>
            {(insights.competitorContext.likelyCompetitors?.length ?? 0) > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {(insights.competitorContext.likelyCompetitors ?? []).map((c, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-base text-violet-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {insights.competitorContext.differentiator && (
              <p className="italic text-gray-400">✦ {insights.competitorContext.differentiator}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.hiringUrgency && (
          <div
            className={`flex flex-col gap-3 rounded-2xl border p-4 ${
              insights.hiringUrgency.level === 'High'
                ? 'border-red-500/20 bg-red-500/10'
                : insights.hiringUrgency.level === 'Medium'
                  ? 'border-amber-500/20 bg-amber-500/10'
                  : 'border-gray-700/50 bg-gray-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4
                className={`text-base font-bold ${
                  insights.hiringUrgency.level === 'High'
                    ? 'text-red-400'
                    : insights.hiringUrgency.level === 'Medium'
                      ? 'text-amber-400'
                      : 'text-gray-400'
                }`}
              >
                ⏰ Hiring Urgency
              </h4>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                  insights.hiringUrgency.level === 'High'
                    ? 'border-red-500/20 bg-red-500/10 text-red-400'
                    : insights.hiringUrgency.level === 'Medium'
                      ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400'
                }`}
              >
                {insights.hiringUrgency.level}
              </span>
            </div>
            {(insights.hiringUrgency.signals?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(insights.hiringUrgency.signals ?? []).map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-gray-700/50 bg-gray-900/40 px-2 py-0.5 text-[10px] text-gray-400"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {insights.remotePolicy && (
          <div className="flex flex-col gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-cyan-400">🏠 Remote Policy</h4>
              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400">
                {insights.remotePolicy.type}
              </span>
            </div>
            <span
              className="line-clamp-2 text-base italic text-gray-400"
              title={insights.remotePolicy.details}
            >
              {insights.remotePolicy.details}
            </span>
          </div>
        )}
      </div>

      {(insights.cultureSignals?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-5">
          <h4 className="mb-4 text-base font-bold uppercase tracking-wider text-gray-400">
            Culture Signals
          </h4>
          <div className="space-y-4">
            {(insights.cultureSignals ?? []).map((cs, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4"
              >
                <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <span className="text-base font-bold text-gray-200">{cs.signal}</span>
                  <div className="flex w-full items-center gap-3 sm:w-1/2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-[width] duration-700 ease-out"
                        style={{
                          width: `${((cs.rating ?? 0) / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-base font-bold text-gray-400">
                      {cs.rating}/5
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {cs.evidence && (
                    <p className="text-base leading-relaxed text-gray-400">
                      <span className="mr-1.5 font-medium text-gray-500">Evidence:</span>
                      &quot;{cs.evidence}&quot;
                    </p>
                  )}
                  {cs.implication && (
                    <p className="text-base leading-relaxed text-indigo-300">
                      <span className="mr-1.5 font-medium text-indigo-400/70">Implication:</span>
                      {cs.implication}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
