'use client';

import React from 'react';
import {
  MapPin,
  Banknote,
  Calendar,
  Briefcase,
  ExternalLink,
  Globe,
  Building,
} from 'lucide-react';
import { formatDate, formatSalary } from '@/lib/utils';
import type { Application } from '@/types/application';

type CompanyInfo = { industry?: string; size?: string; fundingStage?: string } | null;

type ApplicationHeaderProps = {
  app: Application;
  companyInfo: CompanyInfo;
  isShared: boolean;
  isSaving: boolean;
  onUpdateDetails: (updates: Record<string, unknown>) => Promise<void>;
};

export const ApplicationHeader = ({
  app,
  companyInfo,
  isShared,
  isSaving,
  onUpdateDetails,
}: ApplicationHeaderProps) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateDetails({ status: e.target.value });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-8 shadow-2xl mb-8">
      <div className="pointer-events-none absolute -mr-20 -mt-20 top-0 right-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="flex flex-start gap-6">
            <div className="flex h-20 w-20 shrink-0 capitalize items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-4xl font-bold text-blue-400 shadow-inner">
              {app.company?.charAt(0) ?? '?'}
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-bold leading-tight text-white md:text-4xl">
                {app.job_title}
              </h1>
              <div className="flex items-center gap-2 text-xl font-medium text-blue-400">
                <Building size={20} />
                {app.company}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-500"
              >
                View Job Post <ExternalLink size={16} />
              </a>
            )}
            {!isShared ? (
              <select
                className="w-full appearance-none cursor-pointer rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={app.status}
                onChange={handleStatusChange}
                disabled={isSaving}
              >
                <option value="Applied">Applied</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Offer Received">Offer Received</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            ) : (
              <div className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-2.5 text-center font-medium text-white">
                Status: {app.status}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-white/5 bg-black/20 p-4 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-1 text-base font-bold uppercase tracking-wider text-gray-500">
              <MapPin size={12} /> Location
            </div>
            <div className="truncate font-medium text-white">{app.location || 'Remote'}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-4 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-1 text-base font-bold uppercase tracking-wider text-gray-500">
              <Banknote size={12} /> Salary
            </div>
            <div className="truncate font-medium text-white">
              {app.salary ? formatSalary(app.salary, app.location) : 'N/A'}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-4 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-1 text-base font-bold uppercase tracking-wider text-gray-500">
              <Briefcase size={12} /> Work Mode
            </div>
            <div className="truncate font-medium text-white">{app.work_mode || 'Full-time'}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-4 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-1 text-base font-bold uppercase tracking-wider text-gray-500">
              <Calendar size={12} /> Applied On
            </div>
            <div className="truncate font-medium text-white">
              {formatDate(app.application_date)}
            </div>
          </div>
          <div className="col-span-2 rounded-xl border border-white/5 bg-black/20 p-4 backdrop-blur-sm lg:col-span-1">
            <div className="mb-1 flex items-center gap-1 text-base font-bold uppercase tracking-wider text-gray-500">
              <Globe size={12} /> Industry/Size
            </div>
            <div className="truncate font-medium text-white">
              {companyInfo?.industry || 'Unknown Sector'}
            </div>
            <div className="mt-1 truncate text-base text-gray-400">
              {companyInfo?.size || 'Unknown Size'} • {companyInfo?.fundingStage || 'Unknown Funding'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
