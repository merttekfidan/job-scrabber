'use client';

import React from 'react';

/**
 * Skeleton loading components — shimmer placeholders for dashboard sections.
 */

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-900/40 border border-white/5 rounded-xl p-5 animate-pulse">
                    <div className="h-3 w-20 bg-gray-700/50 rounded mb-3" />
                    <div className="h-8 w-16 bg-gray-700/50 rounded" />
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-gray-900/40 border border-white/5 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="h-4 w-48 bg-gray-700/50 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-700/50 rounded" />
                </div>
                <div className="flex gap-3">
                    <div className="h-3 w-16 bg-gray-700/50 rounded" />
                    <div className="h-3 w-16 bg-gray-700/50 rounded" />
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-5 w-14 bg-gray-700/50 rounded" />
                ))}
            </div>
        </div>
    );
}

export function ApplicationListSkeleton({ count = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="bg-gray-900/40 border border-white/5 rounded-xl p-6 animate-pulse">
            <div className="h-4 w-32 bg-gray-700/50 rounded mb-4" />
            <div className="h-48 bg-gray-700/30 rounded-lg" />
        </div>
    );
}
