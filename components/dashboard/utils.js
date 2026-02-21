'use client';

import React from 'react';

/**
 * Safe JSON parse helper.
 * Used across multiple dashboard components for parsing stringified arrays/objects.
 */
export function parseJson(str) {
    try {
        return typeof str === 'string' ? JSON.parse(str) : (Array.isArray(str) ? str : []);
    } catch (e) { return []; }
}

/**
 * Format date to readable string.
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get status badge class based on application status.
 */
export function getStatusClass(status) {
    if (status === 'Applied') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (status?.includes('Interview')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (status?.includes('Offer')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
}
