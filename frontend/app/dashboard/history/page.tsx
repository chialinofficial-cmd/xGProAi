"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Analysis {
    id: number;
    asset: string;
    bias: string;
    confidence: number;
    summary: string;
    created_at: string;
    image_path: string;
}

export default function HistoryPage() {
    const { user } = useAuth();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/analyses?limit=50`, {
                    headers: {
                        'X-User-ID': user.uid
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnalyses(data);
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
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Chart History</h1>
                    <p className="text-gray-400">View and manage your past AI analyses.</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-surface-card border border-border-subtle text-gray-400 px-3 py-1.5 rounded-lg text-xs font-mono">
                        {analyses.length} Total Analysis
                    </span>
                </div>
            </div>

            {analyses.length === 0 ? (
                <div className="text-center py-20 glass-panel border border-white/5 rounded-xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">No Analysis Yet</h3>
                    <p className="text-gray-400 mb-6">Upload your first chart to get started.</p>
                    <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium">
                        Upload Chart
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analyses.map((item) => (
                        <Link href={`/dashboard/analysis/${item.id}`} key={item.id} className="group">
                            <div className="glass-card rounded-xl overflow-hidden hover:border-white/20 transition-all h-full flex flex-col hover:-translate-y-1 hover:shadow-xl">
                                {/* Image Preview */}
                                <div className="h-40 bg-black/50 relative overflow-hidden">
                                    {item.image_path ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${item.image_path.replace(/\\/g, "/")}`}
                                            alt={item.asset}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">No Preview</div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${item.bias === 'Bullish' ? 'bg-green-500/30 text-green-400 border border-green-500/30' : 'bg-red-500/30 text-red-400 border border-red-500/30'}`}>
                                            {item.bias}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-white font-bold text-lg group-hover:text-gold transition-colors">{item.asset}</h3>
                                        <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                                        {item.summary}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-800 h-1.5 w-16 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.confidence > 70 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${item.confidence}%` }}></div>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">{item.confidence}% Conf.</span>
                                        </div>
                                        <span className="text-blue-400 text-xs font-semibold group-hover:underline">View Result &rarr;</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}        </div>
    );
}
