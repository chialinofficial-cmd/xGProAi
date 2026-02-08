"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function DashboardHome() {
    const { user } = useAuth();

    // Data Fetching
    const [stats, setStats] = useState({
        total_analyses: 0,
        charts_analyzed: 0,
        ai_responses: 0,
        credits_remaining: 10,
        plan_tier: 'trial'
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Fetch Stats
                const statsRes = await fetch(`${apiUrl}/stats`, {
                    headers: { 'X-User-ID': user.uid }
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Fetch Recent Activity
                const activityRes = await fetch(`${apiUrl}/analyses?limit=5`, {
                    headers: { 'X-User-ID': user.uid }
                });
                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setRecentActivity(activityData);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Prepare Chart Data
    const chartData = [
        { name: 'Uploads', value: stats.total_analyses },
        { name: 'Analyzed', value: stats.charts_analyzed },
        { name: 'AI Responses', value: stats.ai_responses },
    ];

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Banner Skeleton */}
                <div className="h-48 rounded-xl glass-panel border border-white/5"></div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 glass-card rounded-xl border border-white/5"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Welcome Banner */}
            <div className="rounded-2xl overflow-hidden relative bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.displayName || 'Trader'}</h1>
                    <p className="text-blue-200/80 max-w-xl">Ready to find your next winning trade? Upload a chart to get instant AI-powered institutional analysis.</p>

                    <div className="mt-6 flex gap-3">
                        <Link href="/dashboard/upload" className="bg-gold hover:bg-gold-light text-black px-6 py-2.5 rounded-lg font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            New Analysis
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Uploads</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.total_analyses}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Charts Analyzed</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.charts_analyzed}</h3>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">AI Responses</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.ai_responses}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Credits</p>
                            <h3 className="text-3xl font-bold text-white mt-1">
                                {stats.plan_tier === 'pro' ? '∞' : stats.credits_remaining}
                            </h3>
                            {stats.plan_tier === 'trial' && (
                                <p className="text-[10px] text-yellow-500 font-mono mt-1">Trial Plan</p>
                            )}
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: AI Analysis Summary (Recharts) */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-6 relative">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Activity Overview</h3>
                    </div>

                    {/* Chart Area */}
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(10,10,10,0.9)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#a855f7'][index % 3]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Recent Activity */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Recent Signals</h3>
                    </div>

                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                                <p className="text-sm">No recent activity.</p>
                                <Link href="/dashboard/upload" className="mt-2 text-gold text-xs hover:underline">Start your first analysis</Link>
                            </div>
                        ) : (
                            recentActivity.map((item) => (
                                <Link key={item.id} href={`/dashboard/analysis/${item.id}`}>
                                    <div className="glass-card p-4 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                <span className="text-[10px] font-bold">{item.asset.split('/')[0]}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white truncate max-w-[120px]">{item.asset}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${item.bias === 'Bullish' ? 'bg-green-500/20 text-green-500' : item.bias === 'Bearish' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                            {item.bias}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    <Link href="/dashboard/history" className="block w-full mt-6 py-2 rounded-lg text-gray-400 hover:text-white text-xs font-bold text-center border border-white/5 hover:bg-white/5 transition-all">
                        VIEW ALL HISTORY
                    </Link>
                </div>

            </div>

            {/* Quick Actions */}
            <div className="glass-panel rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Link href="/dashboard/upload" className="glass-card hover:bg-white/10 p-6 rounded-lg flex flex-col items-center justify-center gap-3 transition-all group">
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="font-bold text-gray-200">Upload Chart</span>
                    </Link>
                    <Link href="/dashboard/chat" className="glass-card hover:bg-white/10 p-6 rounded-lg flex flex-col items-center justify-center gap-3 transition-all group">
                        <div className="p-3 bg-purple-500/20 rounded-full text-purple-500 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <span className="font-bold text-gray-200">AI Chat</span>
                    </Link>
                    <Link href="/dashboard/history" className="glass-card hover:bg-white/10 p-6 rounded-lg flex flex-col items-center justify-center gap-3 transition-all group">
                        <div className="p-3 bg-green-500/20 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="font-bold text-gray-200">View History</span>
                    </Link>
                </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-8 border-t border-white/5 pt-6 text-center">
                <p className="text-[10px] text-gray-600/60 leading-tight max-w-2xl mx-auto">
                    Disclaimer: xGProAi provides AI-powered chart analysis for educational purposes only. It does not offer financial advice or guarantee trading results. Trading involves risk, and users should conduct their own research.
                </p>
            </div>
        </div>
    );
}
