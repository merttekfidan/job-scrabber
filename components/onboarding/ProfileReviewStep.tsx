'use client';

import React from 'react';
import { Briefcase, GraduationCap, Award, Code, TrendingUp } from 'lucide-react';
import type { CvExtracted } from '@/types/onboarding';

type ProfileReviewStepProps = {
  profile: CvExtracted;
  onContinue: () => void;
};

export const ProfileReviewStep = ({ profile, onContinue }: ProfileReviewStepProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Your Profile</h2>
        <p className="mt-2 text-gray-400">
          Here&apos;s what we extracted. Review it, then we&apos;ll ask a few follow-ups.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm leading-relaxed text-gray-300">{profile.summary}</p>
        <div className="mt-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-indigo-400" />
          <span className="text-xs font-medium text-indigo-400">{profile.experienceLevel} Level</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Code size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold">Skills</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 12).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-300"
              >
                {skill}
              </span>
            ))}
            {profile.skills.length > 12 && (
              <span className="px-2.5 py-0.5 text-xs text-gray-500">
                +{profile.skills.length - 12} more
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Briefcase size={16} className="text-green-400" />
            <h3 className="text-sm font-semibold">Experience</h3>
          </div>
          <div className="space-y-2">
            {profile.experience.slice(0, 3).map((exp, i) => (
              <div key={i} className="text-xs">
                <p className="font-medium text-white">{exp.title}</p>
                <p className="text-gray-500">
                  {exp.company} &middot; {exp.duration}
                </p>
              </div>
            ))}
          </div>
        </div>

        {profile.education.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-white">
              <GraduationCap size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold">Education</h3>
            </div>
            <div className="space-y-2">
              {profile.education.map((edu, i) => (
                <div key={i} className="text-xs">
                  <p className="font-medium text-white">{edu.degree}</p>
                  <p className="text-gray-500">{edu.institution}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.certifications.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-white">
              <Award size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold">Certifications</h3>
            </div>
            <div className="space-y-1">
              {profile.certifications.map((cert, i) => (
                <p key={i} className="text-xs text-gray-300">{cert}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mx-auto mt-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        aria-label="Continue to follow-up questions"
      >
        Looks Good — Continue
      </button>
    </div>
  );
};
