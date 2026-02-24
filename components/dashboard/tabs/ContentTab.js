import React from 'react';
import { Briefcase, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ContentTab({ app }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-base text-gray-400">
                    Archived from <a href={app.job_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{new URL(app.job_url).hostname}</a>
                </div>
                <a href={app.job_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary flex items-center gap-2">
                    <ExternalLink size={14} /> View Live
                </a>
            </div>
            <div className="bg-gray-950/50 rounded-xl border border-gray-700/50 p-8 max-h-[600px] overflow-y-auto">
                {app.formatted_content ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-300 prose-a:text-blue-400 prose-strong:text-gray-200 prose-ul:list-disc prose-ul:pl-5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{app.formatted_content}</ReactMarkdown>
                    </div>
                ) : app.original_content ? (
                    <article className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-300 prose-a:text-blue-400 prose-strong:text-gray-200">
                        <div className="whitespace-pre-wrap font-sans text-gray-300 text-base leading-7 tracking-wide">{app.original_content}</div>
                    </article>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No content archived for this application.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

