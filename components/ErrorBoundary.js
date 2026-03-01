'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';

/**
 * React Error Boundary for graceful failure handling.
 * Catches rendering errors in child components and shows a fallback UI
 * instead of crashing the entire page.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('ErrorBoundary caught', { message: error?.message, componentStack: errorInfo?.componentStack });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[200px] flex items-center justify-center">
                    <div className="bg-gray-900/40 border border-red-500/20 rounded-xl p-8 text-center max-w-md">
                        <AlertCircle size={40} className="mx-auto mb-4 text-red-400" />
                        <h3 className="text-lg font-bold text-white mb-2">
                            {this.props.fallbackTitle || 'Something went wrong'}
                        </h3>
                        <p className="text-gray-400 text-base mb-4">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw size={16} /> Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
