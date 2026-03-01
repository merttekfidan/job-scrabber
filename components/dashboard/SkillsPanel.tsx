'use client';

import React from 'react';
import { safeParseJson } from '@/lib/utils';

type SkillsPanelProps = {
  requiredSkills: string[] | string;
  preferredSkills?: string[] | string;
};

export const SkillsPanel = ({
  requiredSkills,
  preferredSkills,
}: SkillsPanelProps) => {
  const required = safeParseJson<string[]>(requiredSkills, []);
  const preferred = safeParseJson<string[]>(preferredSkills ?? [], []);

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Required Skills</h3>
      <div className="flex flex-wrap gap-2">
        {required.map((skill, i) => (
          <span
            key={i}
            className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-base font-medium text-blue-300"
          >
            {skill}
          </span>
        ))}
        {required.length === 0 && (
          <span className="text-base italic text-gray-500">No specific skills listed.</span>
        )}
      </div>
      {preferred.length > 0 && (
        <>
          <h3 className="mb-2 mt-4 text-lg font-bold text-white">Preferred Skills</h3>
          <div className="flex flex-wrap gap-2">
            {preferred.map((skill, i) => (
              <span
                key={i}
                className="rounded-lg border border-gray-600/30 bg-gray-700/30 px-3 py-1 text-base font-medium text-gray-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
