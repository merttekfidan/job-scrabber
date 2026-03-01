'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layers } from 'lucide-react';

type JobDescriptionProps = {
  content: string;
};

export const JobDescription = ({ content }: JobDescriptionProps) => {
  const source =
    content ||
    'No description available.';

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/20 p-8">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
        <Layers className="text-blue-400" /> Job Description
      </h3>
      <div className="prose prose-invert prose-blue max-w-none text-gray-300 prose-headings:text-gray-100 prose-a:text-blue-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
      </div>
    </div>
  );
};
