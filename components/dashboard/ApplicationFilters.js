'use client';

import React from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const selectClass = "appearance-none bg-gray-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-base text-gray-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer";

export default function ApplicationFilters({ filters, setFilters, companies = [], totalCount }) {
    return (
        <Card className="border-white/10 bg-[var(--bg-card)] backdrop-blur-xl p-4">
        <CardContent className="p-0 flex flex-col sm:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder={`Search ${totalCount || ''} jobs, companies, skills...`}
                    className="w-full bg-gray-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-base text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
            </div>

            <div className="flex gap-2 flex-wrap">
                <div className="relative">
                    <select
                        className={selectClass}
                        value={filters.status || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">All Status</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview Scheduled">Interview</option>
                        <option value="Offer Received">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
                </div>

                <div className="relative">
                    <select
                        className={selectClass}
                        value={filters.workMode || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, workMode: e.target.value }))}
                    >
                        <option value="">All Modes</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">On-site</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
                </div>

                <div className="relative">
                    <select
                        className={selectClass}
                        value={filters.company || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                    >
                        <option value="">All Companies</option>
                        {companies.map(c => (
                            <option key={c.company} value={c.company}>{c.company}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
                </div>

                <div className="relative">
                    <SlidersHorizontal size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <select
                        className={`${selectClass} pl-8`}
                        value={filters.sortBy || 'date_desc'}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    >
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="company_asc">Company A-Z</option>
                        <option value="company_desc">Company Z-A</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
                </div>
            </div>
        </CardContent>
        </Card>
    );
}
