"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DashboardHome() {
    const { user } = useAuth();

    // Data Fetching
    const [stats, setStats] = useState({
        total_analyses: 0,
        charts_analyzed: 0,
        ai_responses: 0,
        credits_remaining: 3
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch Stats
                const statsRes = await fetch('http://localhost:8000/stats', {
                    headers: { 'X-User-ID': user.uid }
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Fetch Recent Activity
                const activityRes = await fetch('http://localhost:8000/analyses?limit=5', {
                    headers: { 'X-User-ID': user.uid }
                });
                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setRecentActivity(activityData);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            }
        };

        fetchData();
    }, [user]);

    return (
        <div className="space-y-6">

            {/* Welcome Banner */}
            <div className="rounded-xl overflow-hidden relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.displayName || 'Trader'}</h1>
                    <p className="text-blue-100">Ready to analyze your charts with AI-powered insights?</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-surface-card border border-border-subtle p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Uploads</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.total_analyses}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-surface-card border border-border-subtle p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Charts Analyzed</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.charts_analyzed}</h3>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-surface-card border border-border-subtle p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">AI Responses</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.ai_responses}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-surface-card border border-border-subtle p-6 rounded-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Today Credits Left</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.credits_remaining} / 3</h3>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: AI Analysis Summary (Graph) */}
                <div className="lg:col-span-2 bg-surface-card border border-border-subtle rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <h3 className="text-lg font-bold text-white">AI Analysis Summary</h3>
                    </div>
                    <p className="text-gray-400 text-xs mb-8">Summary of your uploaded chart actions</p>

                    {/* Mock Chart Area */}
                    <div className="h-64 w-full flex items-end justify-center gap-8 relative border-b border-gray-700/50 pb-4">
                        {/* Y Axis Mock */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                            <span>1</span>
                            <span>0.75</span>
                            <span>0.5</span>
                            <span>0.25</span>
                            <span>0</span>
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-sm h-[75%] bg-blue-500/90 rounded-t-sm hover:opacity-80 transition-opacity relative group cursor-pointer ml-8">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                XAU/USD: 1 Analysis
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4 text-xs text-gray-400">XAU/USD</div>
                </div>

                {/* Right: Recent Activity */}
                <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    </div>
                    <p className="text-gray-400 text-xs mb-6">Your latest uploads and analyses</p>

                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No recent activity found.</p>
                        ) : (
                            recentActivity.map((item, idx) => (
                                <Link key={item.id} href={`/dashboard/analysis/${item.id}`}>
                                    <div className="bg-[#1a1d24] p-4 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-[#20242c] transition-colors border border-border-subtle/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white truncate max-w-[150px]">{item.asset} - {item.bias}</p>
                                                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString()}</p>
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

                    <Link href="/dashboard/history" className="block w-full mt-6 bg-white py-2 rounded-lg text-black text-sm font-bold hover:bg-gray-200 transition-colors text-center">
                        View All History
                    </Link>
                </div>

            </div>

            {/* Quick Actions */}
            <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Quick Actions</h3>
                <p className="text-gray-400 text-xs mb-6">Common tasks you might want to perform</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/dashboard/upload" className="bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Upload Chart
                    </Link>
                    <Link href="/dashboard/chat" className="bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        Start Chat
                    </Link>
                    <Link href="/dashboard/history" className="bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        View History
                    </Link>
                </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-8 border-t border-border-subtle pt-6">
                <p className="text-[10px] text-red-500/80 leading-tight">
                    Disclaimer: xGProAi provides AI-powered chart analysis for educational purposes only. It does not offer financial advice or guarantee trading results. Trading involves risk, and users should conduct their own research or consult a licensed financial advisor before making investment decisions. xGProAi is not liable for any losses incurred.
                </p>
            </div>
        </div>
    );
}
