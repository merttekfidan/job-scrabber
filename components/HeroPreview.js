"use client";

import { useState } from 'react';
import Image from 'next/image';
import { MousePointerClick, Kanban, Brain } from 'lucide-react';

const TABS = [
    {
        id: 'capture',
        label: 'Capture',
        icon: MousePointerClick,
        image: '/assets/nano_step_1_capture.png',
        alt: 'One-click job capture from any job board',
    },
    {
        id: 'track',
        label: 'Track',
        icon: Kanban,
        image: '/assets/live_kanban_overview.png',
        alt: 'Visual Kanban board tracking your pipeline',
    },
    {
        id: 'prep',
        label: 'AI Prep',
        icon: Brain,
        image: '/assets/live_job_details_swot.png',
        alt: 'AI-powered SWOT analysis and interview prep',
    },
];

export default function HeroPreview() {
    const [activeTab, setActiveTab] = useState('capture');

    return (
        <div className="hero-preview-shell">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 p-1.5 bg-white/5 rounded-xl border border-white/5 mb-0">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onMouseEnter={() => setActiveTab(tab.id)}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer
                                ${isActive
                                    ? 'bg-white/10 text-white shadow-lg shadow-purple-500/10 border border-white/10'
                                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Preview Pane */}
            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#0a0a0f] border border-white/5">
                {TABS.map((tab) => (
                    <div
                        key={tab.id}
                        className={`
                            absolute inset-0 transition-opacity duration-500 ease-in-out
                            ${activeTab === tab.id ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                        `}
                    >
                        <Image
                            src={tab.image}
                            alt={tab.alt}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={tab.id === 'capture'}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
