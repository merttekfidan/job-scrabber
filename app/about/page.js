import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Shield, Users } from 'lucide-react';

export const metadata = {
    title: 'About | HuntIQ',
    description: 'Learn more about HuntIQ and our mission to simplify the job hunt.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-gray-200">
            <header className="glass-card sticky top-0 z-50 rounded-none border-t-0 border-x-0">
                <div className="container py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                        <span className="font-medium text-white">Back to App</span>
                    </Link>
                    <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        HuntIQ
                    </div>
                </div>
            </header>

            <main className="container py-20 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">HuntIQ</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        We built HuntIQ because the modern job hunt is broken.
                        Tracking applications across dozens of portals shouldn't require a master's degree in spreadsheet management.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <div className="glass-card p-8 rounded-2xl border border-white/5 bg-gray-900/40">
                        <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                            <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Our Mission</h3>
                        <p className="text-gray-400">
                            To empower job seekers with intelligent tools that organize the chaos of applying, interviewing, and negotiating.
                        </p>
                    </div>
                    <div className="glass-card p-8 rounded-2xl border border-white/5 bg-gray-900/40">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Privacy First</h3>
                        <p className="text-gray-400">
                            Your career data is yours. We don't sell your data to recruiters or third parties. What happens in HuntIQ stays in HuntIQ.
                        </p>
                    </div>
                    <div className="glass-card p-8 rounded-2xl border border-white/5 bg-gray-900/40">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                            <Users size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Community Driven</h3>
                        <p className="text-gray-400">
                            Built with feedback from real job seekers. We are constantly evolving the platform based on what actually helps people land jobs.
                        </p>
                    </div>
                </div>

                <div className="glass-card p-10 rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900/80 to-purple-900/20">
                    <h2 className="text-3xl font-bold text-white mb-6">The Story</h2>
                    <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                        <p>
                            HuntIQ started as a simple Chrome extension to right-click and save jobs from LinkedIn and generic ATS portals.
                        </p>
                        <p>
                            As the job market became more competitive, simply saving links wasn't enough. We integrated AI to help analyze job descriptions against resumes, identify skill gaps, and generate tailored interview prep questions.
                        </p>
                        <p>
                            Today, HuntIQ is an all-in-one command center for your career transition. From the first application to the final offer, we're here to help you stay organized and confident.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
