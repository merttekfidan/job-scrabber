'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Settings, Loader2 } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, session }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) setLoading(false);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0F1117] border border-gray-700/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161921]/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-400" /> Member Profile
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/30 hover:bg-gray-800 p-2 rounded-xl" aria-label="Close profile modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                                <h3 className="text-base font-semibold text-gray-300 mb-4">Account Info</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                                        {session?.user?.image
                                            ? <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400"><User size={24} /></div>}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{session?.user?.name || 'User'}</div>
                                        <div className="text-base text-gray-400">{session?.user?.email}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                                <h3 className="text-base font-semibold text-gray-300 mb-4">Application Preferences</h3>
                                {[
                                    { label: 'Dark Mode', desc: 'Use dark theme across the dashboard', on: true },
                                    { label: 'Email Notifications', desc: 'Receive interview reminders via email', on: true },
                                    { label: 'Weekly Digest', desc: 'Receive a weekly summary', on: false },
                                    { label: 'Auto-Archive Rejections', desc: 'Archive rejections after 30 days', on: false },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
                                        <div>
                                            <span className="text-gray-300 text-base font-medium">{item.label}</span>
                                            <p className="text-gray-500 text-base">{item.desc}</p>
                                        </div>
                                        <div className={`w-10 h-5 ${item.on ? 'bg-blue-600 justify-end' : 'bg-gray-600 justify-start'} rounded-full flex items-center p-1`}>
                                            <div className="w-4 h-4 bg-white rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
