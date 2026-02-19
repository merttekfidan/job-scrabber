
import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import {
    MapPin, DollarSign, Calendar, Briefcase, ExternalLink, Globe, Building,
    CheckCircle, AlertCircle, Sparkles, BrainCircuit, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Force dynamic rendering since we are fetching data based on ID
export const dynamic = 'force-dynamic';

async function getApplication(id) {
    // Fetch by simple ID
    const result = await query('SELECT * FROM applications WHERE id = $1', [id]);
    return result.rows[0];
}

export default async function SharePage({ params }) {
    const { id } = await params;
    const app = await getApplication(id);

    if (!app) {
        notFound();
    }

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const parseJson = (jsonString) => {
        try {
            return JSON.parse(jsonString) || [];
        } catch (e) {
            return [];
        }
    };

    const insights = app.personalized_analysis?.companyInsights;
    const swot = app.personalized_analysis?.swot;
    const prep = typeof app.interview_prep_notes === 'string'
        ? parseJson(app.interview_prep_notes)
        : app.interview_prep_notes || {};

    return (
        <div className="min-h-screen bg-[#0f1117] text-gray-300 font-sans selection:bg-blue-500/30 pb-20">
            {/* Top Navigation / Branding */}
            <div className="border-b border-gray-800 bg-[#0f1117]/80 backdrop-blur sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-bold text-white tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">JS</div>
                        Job Scrabber <span className="text-gray-500 font-normal ml-2 text-sm border-l border-gray-700 pl-3">Mentorship View</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Header Card */}
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-8 mb-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-8">
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-4xl shadow-inner border border-white/10 shrink-0">
                                    {app.company.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{app.job_title}</h1>
                                    <div className="text-xl text-blue-400 font-medium flex items-center gap-2">
                                        <Building size={20} /> {app.company}
                                    </div>
                                </div>
                            </div>

                            {app.job_url && (
                                <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/30 font-medium flex items-center gap-2 shrink-0">
                                    View Original Post <ExternalLink size={16} />
                                </a>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><MapPin size={12} /> Location</div>
                                <div className="text-white font-medium truncate">{app.location || 'Remote'}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><DollarSign size={12} /> Salary</div>
                                <div className="text-white font-medium truncate">{app.salary || 'Competitive'}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Briefcase size={12} /> Work Mode</div>
                                <div className="text-white font-medium truncate">{app.work_mode || 'Full-time'}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Calendar size={12} /> Applied On</div>
                                <div className="text-white font-medium truncate">{formatDate(app.application_date)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN (2/3) - Main Details & Analysis */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Company Intelligence (Strategic Focus) */}
                        {insights && (
                            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                                <h3 className="text-indigo-400 font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                                    <Globe size={20} /> Company Strategic Focus
                                </h3>
                                <p className="text-gray-300 leading-relaxed relative z-10 text-lg">
                                    {insights.strategicFocus}
                                </p>
                            </div>
                        )}

                        {/* 2. SWOT Analysis (For Mentorship) */}
                        {swot && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <BrainCircuit className="text-purple-400" /> Candidate Analysis (SWOT)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-500/5 border border-green-500/10 p-5 rounded-2xl">
                                        <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2 border-b border-green-500/10 pb-2">
                                            <CheckCircle size={16} /> Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {parseJson(swot.strengths).map((s, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="text-green-500/50 mt-1.5 min-w-[6px] h-[6px] rounded-full bg-green-500 block"></span>
                                                    <span className="leading-snug">{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
                                        <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2 border-b border-red-500/10 pb-2">
                                            <AlertCircle size={16} /> Gaps / Weaknesses
                                        </h4>
                                        <ul className="space-y-2">
                                            {parseJson(swot.weaknesses).map((s, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="text-red-500/50 mt-1.5 min-w-[6px] h-[6px] rounded-full bg-red-500 block"></span>
                                                    <span className="leading-snug">{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Job Description */}
                        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Layers className="text-blue-400" /> Job Description
                            </h3>
                            <div className="prose prose-invert prose-blue max-w-none text-gray-300 prose-headings:text-gray-100 prose-a:text-blue-400">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {app.formatted_content || app.original_content || app.company_description || 'No description available.'}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (1/3) - Sidebar Info */}
                    <div className="space-y-6">

                        {/* Tech Stack */}
                        {prep.techStackToStudy && prep.techStackToStudy.length > 0 && (
                            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-yellow-400" /> Tech Stack
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {prep.techStackToStudy.map((tech, i) => (
                                        <span key={i} className="px-3 py-1 bg-yellow-400/10 text-yellow-200 border border-yellow-400/20 rounded-lg text-sm font-medium">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Required Skills */}
                        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {parseJson(app.required_skills).map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                                {parseJson(app.required_skills).length === 0 && <span className="text-gray-500 italic text-sm">No specific skills listed.</span>}
                            </div>
                        </div>

                        {/* Why Us / Why You (From Insights) */}
                        {insights && (
                            <div className="space-y-4">
                                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                                    <h4 className="text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">Why {app.company}?</h4>
                                    <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10 text-gray-300 italic text-sm">
                                        "{insights.whyUsAnswer}"
                                    </div>
                                </div>
                                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                                    <h4 className="text-blue-400 font-bold mb-2 text-sm uppercase tracking-wider">Why Me?</h4>
                                    <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 text-gray-300 italic text-sm">
                                        "{insights.whyYouAnswer}"
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* About Company */}
                        {app.company_description && (
                            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">About the Company</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {app.company_description}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
