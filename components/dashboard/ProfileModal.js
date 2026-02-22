'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Settings, Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, ExternalLink, Zap, CheckCircle, FlaskConical } from 'lucide-react';

const PROVIDERS = {
    groq: {
        name: 'Groq',
        logo: '⚡',
        color: 'orange',
        freeLimit: '1,000 req / day',
        models: 'Llama 3.3 70B → 3.1 8B fallback',
        docsUrl: 'https://console.groq.com/keys',
        placeholder: 'gsk_...',
        description: 'Fastest inference. Great free tier.',
    },
    gemini: {
        name: 'Google Gemini',
        logo: '✦',
        color: 'blue',
        freeLimit: '1,500 req / day',
        models: 'Gemini 2.0 Flash → 1.5 Flash fallback',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        placeholder: 'AIzaSy...',
        description: 'Most generous free tier. Google quality.',
    },
    openrouter: {
        name: 'OpenRouter',
        logo: '🔀',
        color: 'purple',
        freeLimit: 'Free models available',
        models: 'Llama 3.3 70B, Qwen 72B (free)',
        docsUrl: 'https://openrouter.ai/keys',
        placeholder: 'sk-or-...',
        description: 'Access 200+ models with a single key.',
    },
};

const COLORS = {
    orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
    blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
    purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
};

const DEFAULT_META = {
    groq: { enabled: true, priority: 1, keyCount: 0 },
    gemini: { enabled: false, priority: 2, keyCount: 0 },
    openrouter: { enabled: false, priority: 3, keyCount: 0 },
};

function Toggle({ value, onChange }) {
    return (
        <button onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-200 ${value ? 'bg-emerald-500 justify-end' : 'bg-gray-700 justify-start'}`}>
            <div className="w-5 h-5 bg-white rounded-full shadow" />
        </button>
    );
}

function ProviderCard({ providerKey, meta, onToggle, onMovePriority, onAddKey, onRemoveAllKeys, totalProviders }) {
    const pm = PROVIDERS[providerKey];
    const colors = COLORS[pm.color];
    const [newKey, setNewKey] = useState('');
    const [adding, setAdding] = useState(false);
    const [addingLocal, setAddingLocal] = useState(false);
    const [testResult, setTestResult] = useState(null); // null | { status, keys: [...] }
    const [testing, setTesting] = useState(false);

    const handleAdd = async () => {
        const trimmed = newKey.trim();
        if (!trimmed) return;
        setAddingLocal(true);
        await onAddKey(providerKey, trimmed);
        setNewKey('');
        setAdding(false);
        setAddingLocal(false);
        setTestResult(null); // reset test after adding new key
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerKey }),
            });
            const data = await res.json();
            if (data.success) {
                setTestResult(data.results[providerKey] || []);
            } else {
                setTestResult([{ status: 'error', message: data.error }]);
            }
        } catch (e) {
            setTestResult([{ status: 'error', message: e.message }]);
        } finally {
            setTesting(false);
        }
    };

    const statusBadge = (r) => {
        if (r.status === 'ok') return <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">✓ OK {r.latencyMs && `· ${r.latencyMs}ms`}</span>;
        if (r.status === 'rate_limited') return <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">⚠ Rate limited · {r.message}</span>;
        if (r.status === 'invalid_key') return <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">✕ Invalid key</span>;
        if (r.status === 'no_key') return <span className="text-xs text-gray-500 bg-gray-700/30 border border-gray-700 px-2 py-0.5 rounded-full">No keys</span>;
        return <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">✕ {r.message}</span>;
    };

    return (
        <div className={`rounded-xl border transition-all duration-200 ${meta.enabled ? `${colors.border} ${colors.bg}` : 'border-gray-700/40 bg-gray-800/20'} p-4`}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                    <button onClick={() => onMovePriority(providerKey, 'up')} disabled={meta.priority === 1}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"><ChevronUp size={14} /></button>
                    <button onClick={() => onMovePriority(providerKey, 'down')} disabled={meta.priority === totalProviders}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"><ChevronDown size={14} /></button>
                </div>
                <span className="text-xs font-mono text-gray-500 w-4">{meta.priority}</span>
                <span className="text-lg">{pm.logo}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{pm.name}</span>
                        {meta.keyCount > 0 && meta.enabled && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${colors.badge}`}>
                                {meta.keyCount} key{meta.keyCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">{pm.description}</div>
                </div>
                <Toggle value={meta.enabled} onChange={(v) => onToggle(providerKey, v)} />
                {/* Test button */}
                {meta.enabled && meta.keyCount > 0 && (
                    <button
                        onClick={handleTest}
                        disabled={testing}
                        title="Test API connectivity"
                        className="text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-40 ml-1"
                    >
                        {testing ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
                    </button>
                )}
            </div>

            {/* Expanded body when enabled */}
            {meta.enabled && (
                <div className="mt-3 pl-9 space-y-2">
                    <div className="text-xs text-gray-500 flex gap-3">
                        <span>Free: <span className="text-gray-300">{pm.freeLimit}</span></span>
                        <span className="text-gray-700">·</span>
                        <span>Models: <span className="text-gray-300">{pm.models}</span></span>
                    </div>

                    {/* Saved keys indicator */}
                    {meta.keyCount > 0 && (
                        <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-gray-700/40">
                            <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 flex-1">
                                {meta.keyCount} active key{meta.keyCount > 1 ? 's' : ''} saved
                            </span>
                            <button onClick={() => onRemoveAllKeys(providerKey)}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Test results */}
                    {testResult && testResult.length > 0 && (
                        <div className="space-y-1">
                            {testResult.map((r, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    {testResult.length > 1 && <span className="text-xs text-gray-600 font-mono">key {i + 1}</span>}
                                    {statusBadge(r)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add key */}
                    {adding ? (
                        <div className="flex gap-2">
                            <input autoFocus
                                type="password"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewKey(''); } }}
                                placeholder={pm.placeholder}
                                className="flex-1 bg-black/40 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                            />
                            <button onClick={handleAdd} disabled={!newKey.trim() || addingLocal}
                                className="btn btn-primary px-3 py-2 text-sm disabled:opacity-40 flex items-center gap-1">
                                {addingLocal ? <Loader2 size={13} className="animate-spin" /> : null} Add
                            </button>
                            <button onClick={() => { setAdding(false); setNewKey(''); }} className="px-3 py-2 text-sm text-gray-400 hover:text-white">✕</button>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors py-1 w-full">
                            <Plus size={13} /> Add API key
                            <a href={pm.docsUrl} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="ml-auto text-blue-500 hover:text-blue-400 flex items-center gap-1">
                                Get key <ExternalLink size={11} />
                            </a>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProfileModal({ isOpen, onClose, session }) {
    const [activeTab, setActiveTab] = useState('settings');
    // State: { groq: { enabled, priority, keyCount }, gemini: {...}, openrouter: {...} }
    // Keys are NEVER stored in client state — only counts.
    const [providers, setProviders] = useState(DEFAULT_META);
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState({ message: '', type: '' });

    useEffect(() => {
        if (isOpen) loadProfile();
        else setStatusData({ message: '', type: '' });
    }, [isOpen]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success && data.profile.aiProviders) {
                const merged = { ...DEFAULT_META };
                for (const [k, v] of Object.entries(data.profile.aiProviders)) {
                    if (merged[k]) merged[k] = { ...merged[k], ...v };
                }
                setProviders(merged);
            }
        } catch (e) {
            console.error('Error loading profile:', e);
        } finally {
            setLoading(false);
        }
    };

    const showStatus = (message, type = 'success') => {
        setStatusData({ message, type });
        setTimeout(() => setStatusData({ message: '', type: '' }), 3000);
    };

    const apiCall = async (body) => {
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return res.json();
    };

    // Add a single new key (key sent immediately to server, never persisted in state)
    const handleAddKey = useCallback(async (provider, key) => {
        try {
            const data = await apiCall({ action: 'add-key', provider, key });
            if (data.success) {
                setProviders(prev => ({
                    ...prev,
                    [provider]: { ...prev[provider], keyCount: (prev[provider].keyCount || 0) + 1 },
                }));
                showStatus(`✓ Key added to ${PROVIDERS[provider].name}`);
            } else {
                showStatus(data.error || 'Failed to add key', 'error');
            }
        } catch {
            showStatus('Network error', 'error');
        }
    }, []);

    // Clear all keys for a provider
    const handleRemoveAllKeys = useCallback(async (provider) => {
        if (!confirm(`Remove all ${PROVIDERS[provider].name} keys?`)) return;
        try {
            const data = await apiCall({ action: 'clear-keys', provider });
            if (data.success) {
                setProviders(prev => ({
                    ...prev,
                    [provider]: { ...prev[provider], keyCount: 0 },
                }));
                showStatus(`✓ All ${PROVIDERS[provider].name} keys removed`);
            } else {
                showStatus(data.error || 'Failed to remove keys', 'error');
            }
        } catch {
            showStatus('Network error', 'error');
        }
    }, []);

    // Toggle enabled state (saved immediately)
    const handleToggle = useCallback(async (provider, enabled) => {
        setProviders(prev => ({ ...prev, [provider]: { ...prev[provider], enabled } }));
        await apiCall({ action: 'update-meta', provider, providerMeta: { enabled } });
    }, []);

    // Move priority (swap with neighbor)
    const handleMovePriority = useCallback(async (provider, dir) => {
        setProviders(prev => {
            const next = { ...prev };
            const currentPriority = prev[provider].priority;
            const targetPriority = dir === 'up' ? currentPriority - 1 : currentPriority + 1;
            const swapKey = Object.keys(prev).find(k => prev[k].priority === targetPriority);
            if (!swapKey) return prev;
            next[provider] = { ...prev[provider], priority: targetPriority };
            next[swapKey] = { ...prev[swapKey], priority: currentPriority };

            // Persist to server
            apiCall({
                action: 'update-all-meta',
                providers: {
                    [provider]: { priority: targetPriority, enabled: next[provider].enabled },
                    [swapKey]: { priority: currentPriority, enabled: next[swapKey].enabled },
                },
            });
            return next;
        });
    }, []);

    const sorted = Object.entries(providers).sort(([, a], [, b]) => a.priority - b.priority);
    const enabledWithKeys = sorted.filter(([, cfg]) => cfg.enabled && cfg.keyCount > 0);

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
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/30 hover:bg-gray-800 p-2 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-[#161921]/30 px-2 pt-2">
                    {[
                        { id: 'settings', icon: <Settings size={16} />, label: 'Preferences' },
                        {
                            id: 'keys', icon: <Zap size={16} />, label: 'AI Providers',
                            badge: enabledWithKeys.length > 0 ? enabledWithKeys.length : null,
                        },
                    ].map(tab => (
                        <button key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>
                            {tab.icon} {tab.label}
                            {tab.badge && <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
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
                                                {session?.user?.image
                                                    ? <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400"><User size={24} /></div>}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{session?.user?.name || 'User'}</div>
                                                <div className="text-sm text-gray-400">{session?.user?.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Application Preferences</h3>
                                        {[
                                            { label: 'Dark Mode', desc: 'Use dark theme across the dashboard', on: true },
                                            { label: 'Email Notifications', desc: 'Receive interview reminders via email', on: true },
                                            { label: 'Weekly Digest', desc: 'Receive a weekly summary', on: false },
                                            { label: 'Auto-Archive Rejections', desc: 'Archive rejections after 30 days', on: false },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
                                                <div>
                                                    <span className="text-gray-300 text-sm font-medium">{item.label}</span>
                                                    <p className="text-gray-500 text-xs">{item.desc}</p>
                                                </div>
                                                <div className={`w-10 h-5 ${item.on ? 'bg-blue-600 justify-end' : 'bg-gray-600 justify-start'} rounded-full flex items-center p-1`}>
                                                    <div className="w-4 h-4 bg-white rounded-full" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'keys' && (
                                <div className="space-y-4">
                                    {/* Info banner */}
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm">
                                        <div className="font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                                            <Zap size={14} /> Smart AI Key Pool
                                        </div>
                                        <p className="text-gray-400 text-xs leading-relaxed">
                                            Add multiple keys per provider. When one hits its rate limit, the next is tried automatically. Providers are tried top → bottom.
                                        </p>
                                    </div>

                                    {/* Provider cards */}
                                    {sorted.map(([providerKey, meta]) => (
                                        <ProviderCard
                                            key={providerKey}
                                            providerKey={providerKey}
                                            meta={meta}
                                            onToggle={handleToggle}
                                            onMovePriority={handleMovePriority}
                                            onAddKey={handleAddKey}
                                            onRemoveAllKeys={handleRemoveAllKeys}
                                            totalProviders={sorted.length}
                                        />
                                    ))}

                                    {/* Routing preview */}
                                    {enabledWithKeys.length > 0 && (
                                        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-3 text-xs text-gray-400">
                                            <div className="text-gray-300 font-medium mb-1.5">Active routing chain:</div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {enabledWithKeys.map(([k, cfg], i, arr) => (
                                                    <React.Fragment key={k}>
                                                        <span className="flex items-center gap-1">
                                                            <span>{PROVIDERS[k].logo}</span>
                                                            <span className="text-gray-300">{PROVIDERS[k].name}</span>
                                                            <span className="text-gray-600">({cfg.keyCount})</span>
                                                        </span>
                                                        {i < arr.length - 1 && <span className="text-gray-600">→</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Status */}
                                    {statusData.message && (
                                        <div className={`p-3 rounded-xl border text-sm text-center font-medium ${statusData.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                            {statusData.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
