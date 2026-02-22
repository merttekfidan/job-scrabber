'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, User, Settings, Save, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, session }) {
    const [activeTab, setActiveTab] = useState('settings');
    const [groqKey, setGroqKey] = useState('');
    const [maskedKey, setMaskedKey] = useState(null);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusData, setStatusData] = useState({ message: '', type: '' });

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        } else {
            // Reset state on close
            setStatusData({ message: '', type: '' });
            setGroqKey('');
            setShowKeyInput(false);
        }
    }, [isOpen]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success) {
                setMaskedKey(data.profile.maskedGroqKey);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (activeTab === 'keys') {
            setSaving(true);
            try {
                const res = await fetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groqApiKey: groqKey })
                });
                const data = await res.json();

                if (data.success) {
                    setStatusData({ message: 'API Key saved successfully.', type: 'success' });
                    setGroqKey('');
                    setShowKeyInput(false);
                    loadProfile(); // Refresh masked key
                } else {
                    setStatusData({ message: data.error || 'Failed to save.', type: 'error' });
                }
            } catch (error) {
                setStatusData({ message: 'An error occurred.', type: 'error' });
            } finally {
                setSaving(false);
                setTimeout(() => setStatusData({ message: '', type: '' }), 3000);
            }
        }
    };

    const handleDeleteKey = async () => {
        if (!confirm('Are you sure you want to remove your API Key?')) return;

        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groqApiKey: '' })
            });
            if (res.ok) {
                setMaskedKey(null);
                setShowKeyInput(true);
                setStatusData({ message: 'API Key removed.', type: 'success' });
            }
        } catch (error) {
            setStatusData({ message: 'Failed to remove key.', type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setStatusData({ message: '', type: '' }), 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-[#0F1117] border border-gray-700/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161921]/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-400" /> Member Profile
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/30 hover:bg-gray-800 p-2 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-[#161921]/30 px-2 pt-2">
                    <button
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={16} /> Preferences
                    </button>
                    <button
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'keys' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                        onClick={() => setActiveTab('keys')}
                    >
                        <Key size={16} /> API Keys
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'settings' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Account Info</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                                                {session?.user?.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400"><User size={24} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{session?.user?.name || 'User'}</div>
                                                <div className="text-sm text-gray-400">{session?.user?.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Application Preferences</h3>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 text-sm font-medium">Dark Mode</span>
                                                <span className="text-gray-500 text-xs">Use dark theme across the dashboard</span>
                                            </div>
                                            <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center p-1 justify-end cursor-pointer"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 text-sm font-medium">Email Notifications</span>
                                                <span className="text-gray-500 text-xs">Receive interview reminders via email</span>
                                            </div>
                                            <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center p-1 justify-end cursor-pointer"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 text-sm font-medium">Weekly Digest</span>
                                                <span className="text-gray-500 text-xs">Receive a weekly summary of your applications</span>
                                            </div>
                                            <div className="w-10 h-5 bg-gray-600 rounded-full flex items-center p-1 justify-start cursor-pointer"><div className="w-4 h-4 bg-gray-300 rounded-full"></div></div>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 text-sm font-medium">Auto-Archive Responses</span>
                                                <span className="text-gray-500 text-xs">Automatically archive rejections after 30 days</span>
                                            </div>
                                            <div className="w-10 h-5 bg-gray-600 rounded-full flex items-center p-1 justify-start cursor-pointer"><div className="w-4 h-4 bg-gray-300 rounded-full"></div></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'keys' && (
                                <div className="space-y-6">
                                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-200/80">
                                        <div className="font-bold text-yellow-500 mb-1 flex items-center gap-1.5">
                                            <Key size={14} /> Provide Your Own AI Key
                                        </div>
                                        Entering your personal Groq API key allows you to bypass shared rate limits and process unlimited jobs quickly. Your key is encrypted and stored securely.
                                    </div>

                                    {maskedKey && !showKeyInput ? (
                                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-semibold text-gray-300">Active Groq Key</div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setShowKeyInput(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Update</button>
                                                    <span className="text-gray-600">•</span>
                                                    <button onClick={handleDeleteKey} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                                                </div>
                                            </div>
                                            <div className="font-mono text-lg text-emerald-400 bg-black/40 py-2 px-3 rounded-lg border border-emerald-500/20 tracking-wider break-all">
                                                {maskedKey}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-300 mb-2">Groq API Key</label>
                                                <input
                                                    type="password"
                                                    value={groqKey}
                                                    onChange={(e) => setGroqKey(e.target.value)}
                                                    placeholder="gsk_..."
                                                    className="w-full bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                                                />
                                            </div>

                                            {maskedKey && (
                                                <button onClick={() => setShowKeyInput(false)} className="text-xs text-gray-500 hover:text-gray-400">Cancel Update</button>
                                            )}
                                        </div>
                                    )}

                                    {/* Status Message */}
                                    {statusData.message && (
                                        <div className={`p-3 rounded-xl border text-sm text-center font-medium ${statusData.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                                            }`}>
                                            {statusData.message}
                                        </div>
                                    )}

                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'keys' && (showKeyInput || !maskedKey) && (
                    <div className="px-6 py-4 border-t border-gray-800 bg-[#161921]/50 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving || !groqKey.trim()}
                            className="btn btn-primary px-6 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Key
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
