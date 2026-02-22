'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Sparkles, TrendingUp, Target, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CvUpload() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [cvData, setCvData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchActiveCv();
    }, []);

    const fetchActiveCv = async () => {
        try {
            const res = await fetch('/api/cv/upload');
            const contentType = res.headers.get('content-type');
            if (!res.ok || !contentType?.includes('application/json')) {
                return;
            }
            const data = await res.json();
            if (data.success && data.cv) {
                setCvData(data.cv);
            }
        } catch (err) {
            console.error('Failed to fetch CV:', err);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setError(null);
        } else {
            setError('Please select a valid PDF file.');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/cv/upload', {
                method: 'POST',
                body: formData,
            });

            const contentType = res.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            if (!isJson) {
                throw new Error('Server returned an invalid response (not JSON)');
            }

            const data = await res.json();
            if (res.ok && data.success) {
                setCvData(data.cv);
                setFile(null);
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong during upload.');
        } finally {
            setIsUploading(false);
        }
    };

    const analysis = cvData?.ai_analysis;

    return (
        <div className="space-y-6">
            {/* Header section with summary if available */}
            {analysis && (
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/20 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Career Coach Analysis</h2>
                            <p className="text-sm text-blue-300/70">Based on your active CV: {cvData.filename}</p>
                        </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed italic">&quot;{analysis.summary}&quot;</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Upload & Profile */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Upload Card */}
                    <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Upload size={18} className="text-blue-400" /> Upload CV
                        </h3>
                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileText className="w-8 h-8 mb-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                        {file ? file.name : <span className="font-semibold">Click to upload PDF</span>}
                                    </p>
                                </div>
                                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                            </label>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <><Loader2 className="animate-spin" size={18} /> Analyzing...</>
                                ) : (
                                    <>Analyze with AI</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats if analyzed */}
                    {analysis && (
                        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Professional Profile</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Level</label>
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">
                                        {analysis.experienceLevel}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Top Expertise</label>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.topSkills?.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-white/5 text-gray-400 rounded text-[10px] border border-white/5">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: In-depth Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    {!analysis ? (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-900/20 border border-white/5 border-dashed rounded-2xl p-12 text-center">
                            <Sparkles size={48} className="text-gray-700 mb-4" />
                            <h3 className="text-xl font-bold text-gray-500">No CV Uploaded Yet</h3>
                            <p className="text-gray-600 max-w-sm mt-2">Upload your CV to get a professional sectoral analysis and personalized interview preparation notes.</p>
                        </div>
                    ) : (
                        <>
                            {/* Market Fit & Coaching */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 text-green-400">
                                        <TrendingUp size={18} /> Market Fit
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{analysis.marketFit}</p>
                                </div>
                                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 text-amber-400">
                                        <Target size={18} /> Coaching Advice
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.coachingAdvice?.map((tip, i) => (
                                            <li key={i} className="text-sm text-gray-400 flex gap-2">
                                                <span className="text-amber-500 font-bold">•</span> {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* SWOT Analysis */}
                            <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6">SWOT Career Analysis</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10">
                                            <h4 className="text-sm font-bold text-green-400 mb-2 uppercase tracking-wide">Strengths</h4>
                                            <ul className="space-y-2">
                                                {analysis.swot.strengths?.map((s, i) => (
                                                    <li key={i} className="text-xs text-gray-400 flex gap-2"><CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" /> {s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                                            <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">Opportunities</h4>
                                            <ul className="space-y-2">
                                                {analysis.swot.opportunities?.map((o, i) => (
                                                    <li key={i} className="text-xs text-gray-400 flex gap-2"><Sparkles size={12} className="text-blue-500 flex-shrink-0 mt-0.5" /> {o}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                                            <h4 className="text-sm font-bold text-amber-400 mb-2 uppercase tracking-wide">Weaknesses</h4>
                                            <ul className="space-y-2">
                                                {analysis.swot.weaknesses?.map((w, i) => (
                                                    <li key={i} className="text-xs text-gray-400 flex gap-2"><AlertCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" /> {w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                            <h4 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wide">Threats</h4>
                                            <ul className="space-y-2">
                                                {analysis.swot.threats?.map((t, i) => (
                                                    <li key={i} className="text-xs text-gray-400 flex gap-2"><AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" /> {t}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
