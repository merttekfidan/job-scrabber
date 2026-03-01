'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Flame, Zap, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import logger from '@/lib/logger';

function RadialGauge({ value = 0, label, color = '#8b5cf6' }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: 112, height: 112 }}>
                <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle
                        cx="50" cy="50" r={radius} fill="none"
                        stroke={color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-[10px] text-gray-500">/ 100</span>
                </div>
            </div>
            <span className="label-uppercase">{label}</span>
        </div>
    );
}

export default function SmartAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/smart-analytics');
            const json = await res.json();
            if (json.success) setData(json.smartAnalytics);
        } catch (e) {
            logger.error('Smart analytics load failed', { message: e instanceof Error ? e.message : String(e) });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="mb-6 space-y-4">
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
            </section>
        );
    }

    if (!data) return null;

    const { velocity, responseRate, avgResponseDays, skillHeatmap, weeklyDigest, streak } = data;
    const weekChange = weeklyDigest?.change || 0;

    return (
        <section className="mb-6 space-y-4">
            {/* Hero Row: Gauges + Streak + Weekly Digest */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Radial Gauges */}
                <Card className="border-white/10 bg-[var(--bg-card)] backdrop-blur-xl p-6 flex items-center justify-around gradient-bg">
                    <RadialGauge value={velocity?.score || 0} label="Velocity Score" color="#8b5cf6" />
                    <RadialGauge value={responseRate?.percentage || 0} label="Response Rate" color="#06b6d4" />
                </Card>

                {/* Streak */}
                <Card className="border-white/10 bg-[var(--bg-card)] backdrop-blur-xl p-6 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                        <Flame size={28} className="text-amber-400" />
                        <span className="text-4xl font-black text-white">{streak || 0}</span>
                    </div>
                    <span className="label-uppercase">Day Streak</span>
                    <div className="flex gap-1 mt-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-sm ${i < (streak || 0) && i < 7
                                    ? 'bg-gradient-to-t from-amber-600/60 to-amber-400'
                                    : 'bg-gray-800'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-base text-gray-500">Last 7 days</span>
                </Card>

                {/* Weekly Digest */}
                <Card className="border-white/10 bg-[var(--bg-card)] backdrop-blur-xl p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Zap size={18} className="text-blue-400" />
                        <span className="label-uppercase">Weekly Digest</span>
                    </div>
                    <p className="text-base text-gray-300 leading-relaxed">
                        Week trend: <span className="font-bold text-white flex items-center gap-1 inline-flex">
                            {weekChange > 0 ? `+${weekChange}` : `${weekChange}`}
                            {weekChange > 0 ? <TrendingUp size={14} className="text-emerald-400" /> :
                                weekChange < 0 ? <TrendingDown size={14} className="text-red-400" /> :
                                    <Minus size={14} className="text-gray-400" />}
                        </span>
                    </p>
                    <div className="flex gap-4 mt-auto text-base text-gray-500">
                        <span>Avg response: <span className="text-white font-medium">
                            {avgResponseDays > 0 ? `${avgResponseDays}d` : '—'}
                        </span></span>
                    </div>
                    <button
                        onClick={loadAnalytics}
                        className="mt-auto flex items-center gap-1.5 text-base text-gray-500 hover:text-white transition-colors self-start"
                    >
                        <RefreshCw size={12} /> Refresh
                    </button>
                </Card>
            </div>

            {/* Skill Demand Heatmap */}
            {skillHeatmap && skillHeatmap.length > 0 && (
                <Card className="border-white/10 bg-[var(--bg-card)] backdrop-blur-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Star size={18} className="text-amber-400 fill-amber-400" />
                        <span className="label-uppercase">Skill Demand</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {skillHeatmap.slice(0, 15).map((item, i) => {
                            const maxCount = skillHeatmap[0].count;
                            const starCount = Math.max(1, Math.round((item.count / maxCount) * 5));
                            return (
                                <div key={i} className="flex items-center gap-2 bg-gray-900/40 rounded-lg px-2.5 py-1.5 border border-amber-500/10 hover:border-amber-500/30 transition-colors">
                                    <span className="text-base font-medium text-gray-300 max-w-[140px] truncate" title={item.skill}>{item.skill}</span>
                                    <div className="flex items-center gap-0.5 ml-1 border-l border-gray-700 pl-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                size={10}
                                                className={star <= starCount ? 'text-amber-400 fill-amber-400' : 'hidden'}
                                            />
                                        ))}
                                        <span className="text-[10px] text-gray-500 ml-1 font-mono">{item.count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </section>
    );
}
