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
            <section className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-900/40 border border-white/5 rounded-xl p-4 animate-pulse h-24" />
                    ))}
                </div>
            </section>
        );
    }

    if (!data) return null;

    const { velocity, responseRate, avgResponseDays, skillHeatmap, weeklyDigest, streak } = data;
    const weekChange = weeklyDigest.change;

    return (
        <section className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    📊 Smart Analytics
                </h2>
                <button onClick={loadAnalytics} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Velocity Score */}
                <MetricCard
                    label="Velocity"
                    value={`${velocity.score}%`}
                    subtitle={`${velocity.thisWeek} this week`}
                    color={velocity.score >= 100 ? 'emerald' : velocity.score >= 50 ? 'amber' : 'red'}
                    icon={velocity.score >= 100 ? <TrendingUp size={14} /> : velocity.score >= 50 ? <Minus size={14} /> : <TrendingDown size={14} />}
                />

                {/* Response Rate */}
                <MetricCard
                    label="Response Rate"
                    value={`${responseRate.percentage}%`}
                    subtitle={`${responseRate.responded}/${responseRate.total}`}
                    color={responseRate.percentage >= 20 ? 'emerald' : responseRate.percentage >= 10 ? 'amber' : 'red'}
                />

                {/* Avg Response Time */}
                <MetricCard
                    label="Avg Response"
                    value={avgResponseDays > 0 ? `${avgResponseDays}d` : '—'}
                    subtitle="days to hear back"
                    color="blue"
                />

                {/* Streak */}
                <MetricCard
                    label="Streak"
                    value={`${streak}`}
                    subtitle={streak === 1 ? 'day' : 'days'}
                    color={streak >= 5 ? 'emerald' : streak >= 2 ? 'amber' : 'gray'}
                    icon={streak >= 3 ? '🔥' : null}
                />

                {/* Week Trend */}
                <MetricCard
                    label="Week Trend"
                    value={weekChange > 0 ? `+${weekChange}` : `${weekChange}`}
                    subtitle="vs last week"
                    color={weekChange > 0 ? 'emerald' : weekChange < 0 ? 'red' : 'gray'}
                    icon={weekChange > 0 ? <TrendingUp size={14} /> : weekChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                />
            </div>

            {/* Skill Heatmap */}
            {skillHeatmap.length > 0 && (
                <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Most Demanded Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {skillHeatmap.map((item, i) => {
                            const maxCount = skillHeatmap[0].count;
                            const intensity = Math.max(0.2, item.count / maxCount);
                            return (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:scale-105"
                                    style={{
                                        backgroundColor: `rgba(99, 102, 241, ${intensity * 0.3})`,
                                        borderColor: `rgba(99, 102, 241, ${intensity * 0.5})`,
                                        color: `rgba(165, 180, 252, ${0.5 + intensity * 0.5})`,
                                    }}
                                    title={`${item.count} jobs require this`}
                                >
                                    {item.skill} <span className="opacity-60">×{item.count}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

function MetricCard({ label, value, subtitle, color, icon }) {
    const colorMap = {
        emerald: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
        amber: 'from-amber-500/10 border-amber-500/20 text-amber-400',
        red: 'from-red-500/10 border-red-500/20 text-red-400',
        blue: 'from-blue-500/10 border-blue-500/20 text-blue-400',
        gray: 'from-gray-500/10 border-gray-500/20 text-gray-400',
    };
    const classes = colorMap[color] || colorMap.gray;

    return (
        <div className={`bg-gradient-to-br ${classes} border rounded-xl p-3 bg-gray-900/40`}>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-white">{value}</span>
                {icon && <span className={`text-${color}-400`}>{typeof icon === 'string' ? icon : icon}</span>}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{subtitle}</div>
        </div>
    );
}
