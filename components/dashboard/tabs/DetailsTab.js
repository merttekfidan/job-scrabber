import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { parseJson } from '../utils';

export function DetailsTab({ app, onUpdateDetails, onDelete }) {
    return (
        <div className="space-y-4">
            {app.role_summary && (
                <div className="info-card">
                    <h5><Search size={12} className="inline mr-1" />Position Summary</h5>
                    <p>{app.role_summary}</p>
                </div>
            )}

            {(() => {
                const negativeSignals = parseJson(app.negative_signals);
                if (negativeSignals && negativeSignals.length > 0) {
                    return (
                        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <AlertTriangle size={14} className="text-red-400" />
                                <span className="label-uppercase" style={{ color: '#ef4444' }}>Red Flags</span>
                            </div>
                            <ul className="space-y-1">
                                {negativeSignals.map((signal, idx) => (
                                    <li key={idx} className="text-base text-red-300/80">{signal}</li>
                                ))}
                            </ul>
                        </div>
                    );
                }
                return null;
            })()}

            <div className="grid grid-cols-2 gap-4">
                <div className="info-card">
                    <h5>Status</h5>
                    <select
                        className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-base focus:ring-1 focus:ring-indigo-500/50 outline-none"
                        value={app.status}
                        onClick={e => e.stopPropagation()}
                        onChange={(e) => onUpdateDetails(app.id, { status: e.target.value })}
                    >
                        <option value="Applied">Applied</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Offer Received">Offer Received</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                        <option value="Accepted">Accepted</option>
                    </select>
                </div>
                <div className="info-card">
                    <h5>Salary</h5>
                    <div className="text-lg font-medium text-white">{app.salary || 'Not listed'}</div>
                </div>
            </div>

            <div>
                <h4 className="label-uppercase mb-3">Responsibilities</h4>
                <ul className="space-y-1.5">
                    {parseJson(app.key_responsibilities).map((item, index) => (
                        <li key={index} className="text-base text-white/80 flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>{item}
                        </li>
                    ))}
                    {parseJson(app.key_responsibilities).length === 0 && (
                        <p className="text-gray-500 italic text-base">No responsibilities extracted.</p>
                    )}
                </ul>
            </div>

            <div>
                <h4 className="label-uppercase mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                    {parseJson(app.required_skills).map((skill, index) => (
                        <span key={index} className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{skill}</span>
                    ))}
                    {parseJson(app.required_skills).length === 0 && (
                        <span className="text-gray-500 italic text-base">No specific skills listed.</span>
                    )}
                </div>
            </div>
        </div>
    );
}

