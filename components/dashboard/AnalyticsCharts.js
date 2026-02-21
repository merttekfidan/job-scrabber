'use client';

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function AnalyticsCharts({ analytics }) {
    if (!analytics) return null;

    return (
        <section className="charts-section">
            <h2 className="section-title">Analytics</h2>
            <div className="charts-grid">
                <div className="chart-card">
                    <h3 className="chart-title">Applications Over Time</h3>
                    <div className="h-64">
                        <Line
                            data={{
                                labels: analytics.byMonth?.map(m => m.month).reverse() || [],
                                datasets: [{
                                    label: 'Applications',
                                    data: analytics.byMonth?.map(m => m.count).reverse() || [],
                                    borderColor: '#667eea',
                                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                                    fill: true,
                                    tension: 0.4
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                                    x: { grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">Status Distribution</h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut
                            data={{
                                labels: analytics.byStatus?.map(s => s.status) || [],
                                datasets: [{
                                    data: analytics.byStatus?.map(s => s.count) || [],
                                    backgroundColor: [
                                        '#667eea', '#4facfe', '#00f2a9', '#f5576c', '#fa709a'
                                    ],
                                    borderWidth: 0
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'right', labels: { color: '#a0a0b8' } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
