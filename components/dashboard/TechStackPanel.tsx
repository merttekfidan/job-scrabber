'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

type TechStackPanelProps = {
  techStack: string[] | unknown[];
};

export const TechStackPanel = ({ techStack }: TechStackPanelProps) => {
  if (!techStack?.length) return null;

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Sparkles size={18} className="text-yellow-400" /> Tech Stack
      </h3>
      <div className="flex flex-wrap gap-2">
        {techStack.map((tech, i) => (
          <span
            key={i}
            className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-base font-medium text-yellow-200"
          >
            {String(tech)}
          </span>
        ))}
      </div>
    </div>
  );
};
