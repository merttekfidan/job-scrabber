"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Copy, CheckCircle2, Puzzle, Chrome, UserPlus, Zap, Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ExtensionDownloadButton({ buttonType = 'default' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText("chrome://extensions");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {buttonType === 'primary' ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-base font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    Start Hunting - It's Free
                </button>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white text-base font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4 text-gray-400" />
                    Get Extension
                </button>
            )}

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
                    <div
                        className="w-full max-w-3xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#060608]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg text-white shadow-lg shadow-purple-500/20">
                                    <Puzzle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Job Scrabber Setup Guide</h3>
                                    <p className="text-sm text-gray-400 font-medium">Complete these 5 steps to master your job hunt.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-[#0a0a0f] relative">
                            <div className="space-y-10">

                                {/* Step 1: Download */}
                                <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="hidden sm:block absolute left-5 top-10 w-px h-full bg-gradient-to-b from-purple-500/50 to-blue-500/50" />
                                    <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                        1
                                    </div>
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Download className="w-5 h-5 text-purple-400" />
                                            <h4 className="text-lg font-bold text-white">Download the Extension</h4>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                            Grab the latest beta build of Job Scrabber. Once downloaded, extract (unzip) the folder somewhere on your computer.
                                        </p>
                                        <a
                                            href="/assets/job-scrabber-extension.zip"
                                            download="job-scrabber-extension.zip"
                                            className="inline-flex px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity items-center gap-2 shadow-lg shadow-purple-500/20"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download .ZIP File
                                        </a>
                                    </div>
                                </div>

                                {/* Step 2: Install */}
                                <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="hidden sm:block absolute left-5 top-10 w-px h-full bg-gradient-to-b from-blue-500/50 to-emerald-500/50" />
                                    <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        2
                                    </div>
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Chrome className="w-5 h-5 text-blue-400" />
                                            <h4 className="text-lg font-bold text-white">Install in Chrome</h4>
                                        </div>
                                        <div className="text-gray-400 text-sm mb-4 space-y-3">
                                            <p className="flex items-start gap-2">
                                                <span className="text-blue-400 font-bold">A.</span> Copy this link and paste it into your Chrome URL bar:
                                            </p>
                                            <div className="flex items-center gap-2 max-w-sm ml-6 mb-2">
                                                <div className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 font-mono text-sm text-blue-300 overflow-hidden text-ellipsis whitespace-nowrap">
                                                    chrome://extensions
                                                </div>
                                                <button
                                                    onClick={handleCopy}
                                                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white"
                                                    title="Copy URL"
                                                >
                                                    {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <p className="flex items-center gap-2">
                                                <span className="text-blue-400 font-bold">B.</span> Turn on <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-medium border border-white/10">Developer mode</span> (top right).
                                            </p>
                                            <p className="flex items-start gap-2 leading-relaxed">
                                                <span className="text-blue-400 font-bold">C.</span> Click <span className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-medium border border-white/10">Load unpacked</span> (top left) and select the unzipped folder from Step 1.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Account */}
                                <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="hidden sm:block absolute left-5 top-10 w-px h-full bg-gradient-to-b from-emerald-500/50 to-amber-500/50" />
                                    <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        3
                                    </div>
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <UserPlus className="w-5 h-5 text-emerald-400" />
                                            <h4 className="text-lg font-bold text-white">Create Command Center</h4>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                            You need an account to save your captured jobs, track your interview pipeline, and store your prep notes.
                                        </p>
                                        <Link
                                            href="/login"
                                            className="inline-flex px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors items-center gap-2"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Register / Login
                                        </Link>
                                    </div>
                                </div>

                                {/* Step 4: API Keys */}
                                <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="hidden sm:block absolute left-5 top-10 w-px h-full bg-gradient-to-b from-amber-500/50 to-pink-500/50" />
                                    <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                        4
                                    </div>
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-5 h-5 text-amber-400" />
                                            <h4 className="text-lg font-bold text-white">Get Free AI Key</h4>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                            Job Scrabber uses Bring-Your-Own-Key (BYOK) architecture so you get raw, unfiltered AI intelligence without subscriptions. We recommend <strong>Groq</strong> because its free tier is incredibly fast.
                                        </p>
                                        <a
                                            href="https://console.groq.com/keys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex px-6 py-2.5 bg-[#f55036]/10 text-[#f55036] border border-[#f55036]/20 text-sm font-bold rounded-xl hover:bg-[#f55036]/20 transition-colors items-center gap-2"
                                        >
                                            Get Free Groq API Key
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                {/* Step 5: Connect */}
                                <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="relative z-10 w-10 h-10 flex-shrink-0 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                                        5
                                    </div>
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Settings className="w-5 h-5 text-pink-400" />
                                            <h4 className="text-lg font-bold text-white">Connect & Dominate</h4>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            Once logged into your Job Scrabber dashboard, click the <span className="inline-flex items-center gap-1 text-white bg-white/10 px-1.5 py-0.5 border border-white/10 rounded text-xs mx-1"><Settings className="w-3 h-3" /> Profile Settings</span> button in the top right. Paste your new API key into the Providers tab.
                                            <br /><br />
                                            <strong>You are now ready to hunt! 🎯</strong> Go to a job board (LinkedIn, etc), open the extension, and click capture.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
