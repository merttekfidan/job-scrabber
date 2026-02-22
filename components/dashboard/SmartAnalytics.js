'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
            console.error('Failed to load smart analytics', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="mb-6">
                <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 animate-pulse h-32 shadow-lg shadow-black/20" />
            </section>
        );
    }

    if (!data) return null;

    const { velocity, responseRate, avgResponseDays, skillHeatmap, weeklyDigest, streak } = data;
    const weekChange = weeklyDigest.change;

    return (
        <section className="mb-6">
            <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        📊 Smart Analytics
                    </h2>
                    <button onClick={loadAnalytics} className="text-gray-500 hover:text-white transition-colors">
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Metric Cards Row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Velocity Score */}
                    <div className="flex flex-1 items-center gap-3 border-r border-white/5 pr-4 min-w-[100px]">
                        <div>
                            <div className="text-xl font-bold text-white flex items-center gap-1.5">
                                {velocity.score}%
                                {velocity.score >= 100 ? <TrendingUp size={14} className="text-emerald-400" /> : velocity.score >= 50 ? <Minus size={14} className="text-amber-400" /> : <TrendingDown size={14} className="text-red-400" />}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Velocity</div>
                        </div>
                    </div>

                    {/* Response Rate */}
                    <div className="flex flex-1 items-center gap-3 border-r border-white/5 pr-4 min-w-[100px]">
                        <div>
                            <div className="text-xl font-bold text-white flex items-center gap-1.5">
                                {responseRate.percentage}%
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Response Rate</div>
                        </div>
                    </div>

                    {/* Avg Response Time */}
                    <div className="flex flex-1 items-center gap-3 border-r border-white/5 pr-4 min-w-[100px]">
                        <div>
                            <div className="text-xl font-bold text-white flex items-center gap-1.5">
                                {avgResponseDays > 0 ? `${avgResponseDays}d` : '—'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Avg Response</div>
                        </div>
                    </div>

                    {/* Streak */}
                    <div className="flex flex-1 items-center gap-3 border-r border-white/5 pr-4 min-w-[100px]">
                        <div>
                            <div className="text-xl font-bold text-white flex items-center gap-1.5">
                                {streak} {streak >= 3 && '🔥'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Streak</div>
                        </div>
                    </div>

                    {/* Week Trend */}
                    <div className="flex flex-1 items-center gap-3 min-w-[100px]">
                        <div>
                            <div className="text-xl font-bold text-white flex items-center gap-1.5">
                                {weekChange > 0 ? `+${weekChange}` : `${weekChange}`}
                                {weekChange > 0 ? <TrendingUp size={14} className="text-emerald-400" /> : weekChange < 0 ? <TrendingDown size={14} className="text-red-400" /> : <Minus size={14} className="text-gray-400" />}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Week Trend</div>
                        </div>
                    </div>
                </div>

                {/* Skill Heatmap */}
                {skillHeatmap.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                            {skillHeatmap.map((item, i) => {
                                const maxCount = skillHeatmap[0].count;
                                const intensity = Math.max(0.2, item.count / maxCount);
                                return (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded text-[10px] font-medium border transition-all hover:scale-105"
                                        style={{
                                            backgroundColor: `rgba(99, 102, 241, ${intensity * 0.3})`,
                                            borderColor: `rgba(99, 102, 241, ${intensity * 0.5})`,
                                            color: `rgba(165, 180, 252, ${0.5 + intensity * 0.5})`,
                                        }}
                                        title={`${item.count} jobs require this`}
                                    >
                                        {item.skill} <span className="opacity-60 text-[9px]">×{item.count}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
