'use client';

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function ApplicationFilters({ filters, setFilters, companies = [] }) {
    return (
        <section className="analytics-section mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1 max-w-md">
                    <h2 className="text-xl font-bold mb-3 text-white">Applications</h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="text"
                            className="w-full bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            placeholder="Search jobs, companies..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <select
                            className="appearance-none bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor:pointer hover:bg-gray-800/40 transition-all"
                            value={filters.company || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                        >
                            <option value="">All Companies</option>
                            {companies.map(c => (
                                <option key={c.company} value={c.company}>{c.company}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor:pointer hover:bg-gray-800/40 transition-all"
                            value={filters.workMode || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, workMode: e.target.value }))}
                        >
                            <option value="">All Work Modes</option>
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Onsite">Onsite</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor:pointer hover:bg-gray-800/40 transition-all"
                            value={filters.status || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            <option value="Applied">Applied</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Offer Received">Offer Received</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor:pointer hover:bg-gray-800/40 transition-all"
                            value={filters.sortBy || 'date_desc'}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        >
                            <option value="date_desc">Newest First</option>
                            <option value="date_asc">Oldest First</option>
                            <option value="company_asc">Company (A-Z)</option>
                            <option value="company_desc">Company (Z-A)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>
        </section>
    );
}
