'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [type, setType] = useState('idea'); // 'bug', 'idea', 'other'
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setStatus('submitting');
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback, type })
            });

            if (res.ok) {
                setStatus('success');
                setTimeout(() => {
                    setIsOpen(false);
                    setFeedback('');
                    setStatus('idle');
                }, 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg shadow-purple-500/20 transition-all z-[9999] flex items-center justify-center group"
                title="Send Feedback"
            >
                <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800/80 p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-400" />
                    <h3 className="text-sm font-bold text-white">Beta Feedback</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Body */}
            <div className="p-4">
                {status === 'success' ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Send size={24} />
                        </div>
                        <h4 className="text-white font-bold mb-1">Thanks!</h4>
                        <p className="text-sm text-gray-400">Your feedback helps us improve.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-2">
                            {['idea', 'bug', 'other'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-colors \${type === t ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us what you think..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none min-h-[100px]"
                            required
                        />
                        <button
                            type="submit"
                            disabled={status === 'submitting' || !feedback.trim()}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {status === 'submitting' ? 'Sending...' : (
                                <>
                                    <Send size={16} /> Send Feedback
                                </>
                            )}
                        </button>
                        {status === 'error' && (
                            <p className="text-xs text-red-400 text-center">Failed to send. Please try again.</p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
