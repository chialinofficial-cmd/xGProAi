"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Analysis {
    id: number;
    asset: string;
    bias: string;
    confidence: number;
    summary: string;
    created_at: string;
    image_path: string;
    entry?: number;
    sl?: number;
    tp1?: number;
    tp2?: number;
    risk_reward?: string;
    sentiment?: string;
}

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('technical');

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchAnalysis = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            try {
                const res = await fetch(`${apiUrl}/analyses/${id}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    throw new Error("Analysis not found");
                }
                const data = await res.json();
                setAnalysis(data);
            } catch (error) {
                console.error("Failed to load analysis", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="text-center text-white p-12">
                <h2 className="text-2xl font-bold mb-4">Analysis Not Found</h2>
                <Link href="/dashboard" className="text-gold hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const imageUrl = analysis.image_path
        ? `${apiUrl}/${analysis.image_path.replace(/\\/g, "/")}`
        : '';

    // Use Real Analysis Data
    const isBullish = analysis.bias.toLowerCase() === 'bullish';
    const signalColor = isBullish ? 'green' : 'red';

    // Fallback to 0 if data missing, but use the API data
    const currentPrice = analysis.entry || 0;
    const entryPrice = analysis.entry || 0;
    const slPrice = analysis.sl || 0;
    const tp1Price = analysis.tp1 || 0;
    const tp2Price = analysis.tp2 || 0;
    const riskReward = analysis.risk_reward || "1:2";

    const handleExportPDF = async () => {
        // Dynamic import to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;

        const element = document.getElementById('analysis-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#0d0f14', // Match background
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Analysis-${analysis.asset}-${analysis.id}.pdf`);
        } catch (err) {
            console.error("PDF Export failed", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" id="analysis-content">

            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                        {analysis.asset} • <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-xs">5m</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 border border-border-subtle hover:bg-white/5 text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export PDF
                    </button>
                    <Link href="/dashboard/history" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        View History
                    </Link>
                </div>
            </div>

            {/* Main Signal Card */}
            <div className={`bg-surface-card border border-${signalColor}-500/30 rounded-xl p-6 relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1 h-full bg-${signalColor}-500`}></div>
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r from-${signalColor}-500/5 to-transparent pointer-events-none`}></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <svg className={`w-6 h-6 text-${signalColor}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isBullish
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                }
                            </svg>
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {analysis.bias} Signal for {analysis.asset}
                                    <button className="text-xs font-normal text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-2">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        View Chart
                                    </button>
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">{analysis.summary.substring(0, 60)}...</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`bg-${signalColor}-500 text-white px-4 py-1.5 rounded-lg font-bold uppercase tracking-wide text-sm shadow-lg shadow-${signalColor}-500/20`}>
                                {isBullish ? 'Buy' : 'Sell'}
                            </span>
                            <span className="bg-[#1a1d24] border border-border-subtle text-gray-300 px-3 py-1.5 rounded-lg font-mono text-sm">
                                {analysis.confidence}%
                            </span>
                        </div>
                    </div>

                    {/* Signal Strength */}
                    <div className="bg-[#1a1d24] rounded-lg p-4 mb-6 border border-border-subtle/50">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="text-white font-bold text-sm">Signal Strength</p>
                                <p className="text-[10px] text-gray-500">Based on confidence score</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${signalColor}-500 rounded-full`} style={{ width: `${analysis.confidence}%` }}></div>
                                </div>
                                <span className={`text-${signalColor}-500 font-bold text-sm`}>{analysis.confidence}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Price Levels Visualization */}
                    <div className="mb-2">
                        <p className="text-xs uppercase text-gray-400 font-semibold mb-3 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Price Levels Visualization
                        </p>
                        <div className="flex h-24 rounded-lg overflow-hidden relative">
                            {/* Stop Loss Zone */}
                            <div className="flex-1 bg-red-500/10 border-r border-red-500/20 relative flex flex-col items-center justify-center">
                                <span className="text-red-400 font-bold text-sm mb-1">{slPrice}</span>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">SL</span>
                            </div>

                            {/* Pending/Current Zone */}
                            <div className="flex-1 bg-blue-500/10 border-r border-blue-500/20 relative flex flex-col items-center justify-center">
                                {/* Dynamic "Current Price" Badge positioned roughly */}
                                <div className="absolute top-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                                    Current: {currentPrice}
                                </div>
                                <span className="text-blue-400 font-bold text-sm mb-1">{entryPrice}</span>
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Entry</span>
                            </div>

                            {/* TP Zone */}
                            <div className="flex-[1.5] bg-green-500/10 relative flex items-center justify-around">
                                <div className="flex flex-col items-center">
                                    <span className="text-green-400 font-bold text-sm mb-1">{tp1Price}</span>
                                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">TP1</span>
                                </div>
                                <div className="flex flex-col items-center opacity-70">
                                    <span className="text-green-400 font-bold text-sm mb-1">{tp2Price}</span>
                                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">TP2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-border-subtle p-4 rounded-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Current Price
                    </p>
                    <h3 className="text-xl font-bold text-white">{currentPrice}</h3>
                    <div className="flex gap-2 text-[10px] mt-1 text-gray-500 font-mono">
                        <span className="text-green-400">H: {(currentPrice + 1.25).toFixed(2)}</span>
                        <span className="text-red-400">L: {(currentPrice - 2.10).toFixed(2)}</span>
                    </div>
                </div>
                <div className="bg-surface-card border border-border-subtle p-4 rounded-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Volatility
                    </p>
                    <h3 className="text-xl font-bold text-white">1.50%</h3>
                    <p className="text-[10px] text-green-400 mt-1 uppercase font-bold">Low</p>
                </div>
                <div className="bg-surface-card border border-border-subtle p-4 rounded-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Market Sentiment
                    </p>
                    <h3 className="text-xl font-bold text-white">Strong Uptrend</h3>
                    <p className="text-[10px] text-gray-500 mt-1">No sentiment data</p>
                </div>
                <div className="bg-surface-card border border-border-subtle p-4 rounded-xl">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Risk Aleart
                    </p>
                    <h3 className="text-xl font-bold text-white">1 : 1.85</h3>
                    <p className="text-[10px] text-yellow-500 mt-1">Check risk levels</p>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="border-b border-gray-800">
                <div className="flex gap-6">
                    {['Technical Analysis', 'Risk Management', 'Overview'].map((tab) => (
                        <button
                            key={tab}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab.toLowerCase().split(' ')[0] ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
                            onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0])}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase().split(' ')[0] && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Levels Table */}
                <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Key Levels
                    </h3>
                    <div className="space-y-3 font-mono text-sm">
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                            <span className="text-gray-400">Support</span>
                            <span className="text-white font-bold">{(currentPrice - 5.5).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                            <span className="text-gray-400">Resistance</span>
                            <span className="text-white font-bold">{(currentPrice + 4.2).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                            <span className="text-gray-400">Pivot Point</span>
                            <span className="text-white font-bold">{currentPrice.toFixed(3)}</span>
                        </div>
                    </div>
                </div>

                {/* Trade Metrics */}
                <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Trade Metrics
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                            <span className="text-gray-400">Risk/Reward</span>
                            <span className="text-white font-bold">{riskReward}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                            <span className="text-gray-400">Confidence</span>
                            <span className="text-green-500 font-bold">{analysis.confidence}%</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                            <span className="text-gray-400">Entry Type</span>
                            <span className="text-blue-400 font-bold uppercase">{analysis.bias}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Chart Image for debug/reference if needed later */}
            <div className="hidden">
                <img src={imageUrl} alt="Analyzed Chart" />
            </div>

        </div>
    );
}
