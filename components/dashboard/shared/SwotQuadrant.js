import React from 'react';

export function SwotQuadrant({ color, icon, title, items }) {
    return (
        <div className={`bg-${color}-500/5 border border-${color}-500/20 p-5 rounded-2xl`}>
            <h4 className={`text-${color}-400 font-bold mb-3 flex items-center gap-2`}>
                {icon} {title}
            </h4>
            <ul className="space-y-2">
                {(items || []).map((item, i) => (
                    <li key={i} className="text-base text-gray-300 flex items-start gap-2 group/item" title={item}>
                        <span className={`text-${color}-500 mt-1 shrink-0`}>•</span>
                        <span className="line-clamp-2 group-hover/item:line-clamp-none transition-all cursor-default">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

