"use client";

import {
    CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

interface AIHealthProps {
    stats: {
        avg_confidence: number;
        avg_latency_ms: number;
        win_rate: number;
        latency_history: { date: string, ms: number }[];
        bias_distribution: { name: string, value: number }[];
    } | null;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B']; // Green, Red, Amber

export function AIHealth({ stats }: AIHealthProps) {
    if (!stats) return <div className="text-gray-500 animate-pulse">Loading AI Vital Signs...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">AI Core Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Latency Card */}
                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Latency</p>
                        <h3 className={`text-3xl font-bold mt-1 ${stats.avg_latency_ms < 5000 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {stats.avg_latency_ms}ms
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                </div>

                {/* Confidence Card */}
                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Confidence</p>
                        <h3 className="text-3xl font-bold text-blue-500 mt-1">{stats.avg_confidence}%</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                {/* Accuracy Card (Simulated) */}
                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Market Accuracy</p>
                        <h3 className="text-3xl font-bold text-gold mt-1">{stats.win_rate}%</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latency History Chart */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Response Time (Last 50 Requests)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.latency_history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="ms" stroke="#10B981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bias Distribution */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Sentiment Bias (Bull vs Bear)</h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.bias_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.bias_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Bullish' ? '#10B981' : entry.name === 'Bearish' ? '#EF4444' : '#6B7280'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
