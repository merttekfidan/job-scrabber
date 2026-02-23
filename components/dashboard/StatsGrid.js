'use client';

import React from 'react';
import { Briefcase, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

function Sparkline({ data = [], color = '#667eea' }) {
    if (!data || data.length < 2) return null;
    const w = 80, h = 24;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
    ).join(' ');

    return (
        <svg width={w} height={h} style={{ opacity: 0.6 }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function MetricCard({ icon: Icon, value, label, trend, sparkline, color, iconBg }) {
    const isPositive = trend >= 0;

    return (
        <div className="glass-card-hover p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${iconBg}`}>
                        <Icon size={16} className={color} />
                    </div>
                    <span className="label-uppercase">{label}</span>
                </div>
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="flex items-end justify-between">
                <span className="stat-value text-white">{value}</span>
                <Sparkline data={sparkline} color={color.replace('text-', '')} />
            </div>
        </div>
    );
}

export default function StatsGrid({ stats }) {
    const total = stats?.total || 0;
    const last7Days = stats?.last7Days || 0;
    const interviews = stats?.byStatus?.find(s => s.status.includes('Interview'))?.count || 0;
    const offers = stats?.byStatus?.find(s => s.status.includes('Offer'))?.count || 0;
    const rejections = stats?.byStatus?.find(s => s.status.includes('Rejected'))?.count || 0;

    // Simple trend approximation based on last7Days ratio
    const totalTrend = total > 0 ? Math.round((last7Days / total) * 100) : 0;

    return (
        <section className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Briefcase}
                    value={
                        <span className="flex items-center gap-2">
                            {total}
                            {last7Days > 0 && (
                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                                    +{last7Days}
                                </span>
                            )}
                        </span>
                    }
                    label="Total Apps"
                    trend={totalTrend}
                    color="text-blue-400"
                    iconBg="bg-blue-500/10"
                />
                <MetricCard
                    icon={Clock}
                    value={interviews}
                    label="Interviews"
                    color="text-purple-400"
                    iconBg="bg-purple-500/10"
                />
                <MetricCard
                    icon={CheckCircle}
                    value={offers}
                    label="Offers"
                    color="text-emerald-400"
                    iconBg="bg-emerald-500/10"
                />
                <MetricCard
                    icon={XCircle}
                    value={rejections}
                    label="Rejections"
                    color="text-red-400"
                    iconBg="bg-red-500/10"
                />
            </div>
        </section>
    );
}
