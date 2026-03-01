import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Download, Cpu, LayoutList, Share2 } from 'lucide-react';

export const metadata = {
    title: 'Documentation | HuntIQ',
    description: 'Learn how to use HuntIQ effectively to organize your job search.',
};

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-black text-gray-200">
            <header className="sticky top-0 z-50 rounded-none border-t-0 border-x-0 border-b border-white/10 bg-[var(--bg-card)] backdrop-blur-xl">
                <div className="container py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                        <span className="font-medium text-white">Back to App</span>
                    </Link>
                    <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        HuntIQ Docs
                    </div>
                </div>
            </header>

            <main className="container py-12 max-w-4xl mx-auto flex flex-col md:flex-row gap-12">
                {/* Sidebar Navigation */}
                <aside className="md:w-64 shrink-0">
                    <div className="sticky top-24 space-y-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Topics</h3>
                        <a href="#getting-started" className="block px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Getting Started</a>
                        <a href="#chrome-extension" className="block px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Chrome Extension</a>
                        <a href="#kanban-board" className="block px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Kanban Board</a>
                        <a href="#ai-tools" className="block px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">AI Processing Tools</a>
                        <a href="#sharing" className="block px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Sharing Profiles</a>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 space-y-16">
                    <section id="getting-started" className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                                <BookOpen size={20} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Getting Started</h2>
                        </div>
                        <p className="text-gray-400 text-lg">
                            HuntIQ is your central hub for job hunting. To get the most out of the platform, you'll want to use both the web dashboard and the Chrome Extension.
                        </p>
                        <div className="p-6 border border-white/10 border-l-4 border-l-purple-500 rounded-r-xl bg-[var(--bg-card)] backdrop-blur-xl bg-purple-900/10">
                            <strong>Quick Tip:</strong> Upload your latest CV in the "Coach" tab first. Our AI uses your CV to generate personalized insights for every job you save.
                        </div>
                    </section>

                    <section id="chrome-extension" className="space-y-6 pt-8 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                                <Download size={20} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Chrome Extension</h2>
                        </div>
                        <p className="text-gray-400">
                            The extension is the easiest way to add jobs to your pipeline. It automatically parses the page to extract the job title, company, salary, and full description.
                        </p>
                        <ul className="space-y-3 text-gray-300 list-disc list-inside">
                            <li>Supported on LinkedIn, Indeed, Glassdoor, and most standard ATS systems (Greenhouse, Lever).</li>
                            <li>Click the extension icon on any job posting to verify the parsed data.</li>
                            <li>Click "Save Application" to immediately inject it into your HuntIQ dashboard.</li>
                        </ul>
                    </section>

                    <section id="kanban-board" className="space-y-6 pt-8 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
                                <LayoutList size={20} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Kanban Board</h2>
                        </div>
                        <p className="text-gray-400">
                            Visualize your pipeline from "Applied" to "Offer Final".
                        </p>
                        <p className="text-gray-300">
                            You can easily drag and drop applications between columns to update their status. Clicking on any card opens the detailed view where you can add interview stages, notes, and run AI analysis.
                        </p>
                    </section>

                    <section id="ai-tools" className="space-y-6 pt-8 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                                <Cpu size={20} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">AI Processing Tools</h2>
                        </div>
                        <p className="text-gray-400">
                            HuntIQ connects to top-tier AI providers (Groq, Claude, OpenAI) to superpower your prep.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-900 border border-gray-700 p-5 rounded-xl">
                                <h4 className="font-bold text-white mb-2">CV Gap Analysis</h4>
                                <p className="text-sm text-gray-400">Compares the raw job description against your uploaded CV to highlight missing keywords and skills.</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-700 p-5 rounded-xl">
                                <h4 className="font-bold text-white mb-2">Interview Prep</h4>
                                <p className="text-sm text-gray-400">Generates tailored speaking points, likely questions they will ask you, and red flags you should look out for.</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-700 p-5 rounded-xl">
                                <h4 className="font-bold text-white mb-2">Company Insights</h4>
                                <p className="text-sm text-gray-400">Searches the web for recent news, funding rounds, and culture insights.</p>
                            </div>
                        </div>
                    </section>

                    <section id="sharing" className="space-y-6 pt-8 border-t border-gray-800 pb-20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center">
                                <Share2 size={20} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Sharing Profiles</h2>
                        </div>
                        <p className="text-gray-400">
                            Need advice from a mentor or friend before an interview? Click the "Share" button on any application detail view. This generates a secure, unique link that displays the job description and AI insights, while keeping your private notes hidden.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
