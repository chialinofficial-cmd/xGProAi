"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function HistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/analyses?limit=50`, {
                    headers: { 'X-User-ID': user.uid }
                });

                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-12 w-48 bg-white/5 rounded-lg mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 glass-card rounded-xl border border-white/5"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analysis History</h1>
                    <p className="text-gray-400 text-sm mt-1">Review your past AI insights and their outcomes.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-lg text-sm text-gray-300 font-mono">
                    Total: {history.length}
                </div>
            </div>

            {history.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No History Yet</h3>
                    <p className="text-gray-400 mb-6">Upload your first chart to get started.</p>
                    <Link href="/dashboard/upload" className="bg-gold hover:bg-gold-light text-black px-6 py-2 rounded-lg font-bold transition-colors">
                        New Analysis
                    </Link>
                </div>
            ) : (
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Asset</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Bias</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Setup</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-sm text-gray-300 font-mono">
                                            {new Date(item.created_at).toLocaleDateString()}
                                            <span className="block text-xs text-gray-500">{new Date(item.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs border border-blue-500/20">
                                                    {item.asset.substring(0, 3)}
                                                </div>
                                                <span className="font-bold text-white">{item.asset}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${item.bias === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                                                    item.bias === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {item.bias}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                {item.entry && <span className="text-gray-300"><span className="text-gray-500 text-xs mr-2">ENTRY</span>{item.entry}</span>}
                                                {item.tp1 && <span className="text-green-400"><span className="text-gray-500 text-xs mr-2">TP</span>{item.tp1}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link href={`/dashboard/analysis/${item.id}`} className="text-gold hover:text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Details &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
