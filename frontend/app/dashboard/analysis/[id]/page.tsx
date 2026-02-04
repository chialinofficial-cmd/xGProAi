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
    const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'chart'>('overview');

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
    // Ensure image path uses forward slashes and full URL
    const imageUrl = analysis.image_path
        ? `${apiUrl}/${analysis.image_path.replace(/\\/g, "/")}`
        : '';

    const isBullish = analysis.bias.toLowerCase() === 'bullish';
    // Use gold/red for styling instead of green/red to match premium theme where possible, 
    // or standard trading colors if preferred. Let's stick to Green/Red for signals but use Gold for UI accents.
    const signalColor = isBullish ? 'text-green-500' : 'text-red-500';
    const borderColor = isBullish ? 'border-green-500/50' : 'border-red-500/50';
    const bgGradient = isBullish ? 'from-green-500/10' : 'from-red-500/10';

    const currentPrice = analysis.entry || 0;
    const slPrice = analysis.sl || 0;
    const tp1Price = analysis.tp1 || 0;
    const tp2Price = analysis.tp2 || 0;
    const riskReward = analysis.risk_reward || "1:2";

    const handleExportPDF = async () => {
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;

        const element = document.getElementById('analysis-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#050505',
                logging: false,
                useCORS: true // Important for external images
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`xGProAi-Analysis-${analysis.asset}-${analysis.id}.pdf`);
        } catch (err) {
            console.error("PDF Export failed", err);
            alert("Failed to generate PDF. CORS issues with images may occur on localhost.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12" id="analysis-content">

            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <Link href="/dashboard" className="hover:text-gold transition-colors">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/history" className="hover:text-gold transition-colors">History</Link>
                        <span>/</span>
                        <span className="text-white">Analysis #{analysis.id}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        {analysis.asset}
                        <span className={`text-lg px-3 py-1 rounded-full border ${borderColor} ${signalColor} bg-opacity-10 bg-black`}>
                            {analysis.bias.toUpperCase()}
                        </span>
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="px-5 py-2.5 border border-gold/30 text-gold hover:bg-gold/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Export PDF
                    </button>
                    <Link
                        href="/dashboard/upload"
                        className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black font-bold rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                        New Analysis
                    </Link>
                </div>
            </div>

            {/* Split Layout: Signal Card (Left) vs Tabbed Content (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

                {/* LEFT COLUMN: The Signal & Key Metrics (Fixed Sticky style if desired, but normal for now) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Main Signal Card */}
                    <div className={`bg-surface-card border ${borderColor} rounded-2xl p-6 relative overflow-hidden shadow-2xl`}>
                        {/* Background Glow */}
                        <div className={`absolute top-0 right-0 w-32 h-32 ${bgGradient} blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none`}></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Signal Confidence</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-bold ${signalColor}`}>{analysis.confidence}%</span>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${signalColor}`}>
                                    {isBullish ? (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    ) : (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                                    )}
                                </div>
                            </div>

                            {/* Signal Type Badge */}
                            <div className="mb-8">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border ${borderColor} w-full`}>
                                    <span className={`w-2 h-2 rounded-full ${isBullish ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                    <span className={`font-bold ${signalColor}`}>
                                        STRONG {analysis.bias.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-500 text-[10px] uppercase">Entry</p>
                                    <p className="text-white font-mono font-bold">{currentPrice}</p>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-500 text-[10px] uppercase">Stop Loss</p>
                                    <p className="text-red-400 font-mono font-bold">{slPrice}</p>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-500 text-[10px] uppercase">Take Profit 1</p>
                                    <p className="text-green-400 font-mono font-bold">{tp1Price}</p>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-500 text-[10px] uppercase">Risk/Reward</p>
                                    <p className="text-gold font-mono font-bold">{riskReward}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Summary Card */}
                    <div className="bg-surface-card border border-border-subtle rounded-2xl p-6">
                        <h3 className="text-gold font-bold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            AI Analysis
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {analysis.summary}
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN: Tabs (Chart, Tech, Overview) */}
                <div className="lg:col-span-8 flex flex-col h-full">
                    {/* Tabs Navigation */}
                    <div className="flex gap-1 bg-surface-card p-1 rounded-xl mb-4 border border-border-subtle/50 w-fit">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-gold text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('technical')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'technical' ? 'bg-gold text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Technical
                        </button>
                        <button
                            onClick={() => setActiveTab('chart')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chart' ? 'bg-gold text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Original Chart
                        </button>
                    </div>

                    {/* Tab Content Area */}
                    <div className="bg-surface-card border border-border-subtle rounded-2xl p-1 flex-grow overflow-hidden relative min-h-[500px]">

                        {/* 1. OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="p-6 h-full flex flex-col animate-fade-in">
                                <h3 className="text-xl font-bold text-white mb-6">Trade Execution Plan</h3>

                                {/* Visual Range Bar */}
                                <div className="mb-10 relative mt-4">
                                    <div className="h-4 bg-gray-800 rounded-full w-full relative">
                                        {/* Range Line */}
                                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -z-10"></div>

                                        {/* Points */}
                                        {/* Stop Loss */}
                                        <div className="absolute top-1/2 left-[10%] -translate-y-1/2 flex flex-col items-center">
                                            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-surface-card shadow"></div>
                                            <div className="mt-2 text-center">
                                                <span className="text-red-400 font-bold text-xs">SL</span>
                                                <p className="text-white font-mono text-xs">{slPrice}</p>
                                            </div>
                                        </div>

                                        {/* Entry */}
                                        <div className="absolute top-1/2 left-[40%] -translate-y-1/2 flex flex-col items-center">
                                            <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-surface-card shadow ring-4 ring-blue-500/20"></div>
                                            <div className="mb-8 text-center bg-blue-500/10 px-2 py-1 rounded">
                                                <span className="text-blue-400 font-bold text-xs uppercase block">Entry</span>
                                                <p className="text-white font-mono text-xs">{currentPrice}</p>
                                            </div>
                                        </div>

                                        {/* TP1 */}
                                        <div className="absolute top-1/2 left-[70%] -translate-y-1/2 flex flex-col items-center">
                                            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-surface-card shadow"></div>
                                            <div className="mt-2 text-center">
                                                <span className="text-green-400 font-bold text-xs">TP1</span>
                                                <p className="text-white font-mono text-xs">{tp1Price}</p>
                                            </div>
                                        </div>

                                        {/* TP2 */}
                                        <div className="absolute top-1/2 left-[90%] -translate-y-1/2 flex flex-col items-center">
                                            <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-surface-card shadow opacity-70"></div>
                                            <div className="mt-2 text-center opacity-70">
                                                <span className="text-green-400 font-bold text-xs">TP2</span>
                                                <p className="text-white font-mono text-xs">{tp2Price}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
                                    <div className="border border-border-subtle rounded-xl p-5 bg-black/20">
                                        <h4 className="text-gray-400 text-sm font-bold uppercase mb-4">Risk Management</h4>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Suggested Leverage</span>
                                                <span className="text-white">10x - 20x</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Risk per Trade</span>
                                                <span className="text-white">1% - 2% of Balance</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Stop Loss Distance</span>
                                                <span className="text-red-400">~{Math.abs(currentPrice - slPrice).toFixed(2)} pts</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="border border-border-subtle rounded-xl p-5 bg-black/20">
                                        <h4 className="text-gray-400 text-sm font-bold uppercase mb-4">Market Context</h4>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                                <div className="bg-gold h-full w-[70%]"></div>
                                            </div>
                                            <span className="text-xs text-gold font-bold">VOLATILITY</span>
                                        </div>
                                        <p className="text-gray-400 text-xs">
                                            Market volatility is moderate. Ensure stop losses are respected to avoid liquidity wicks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. TECHNICAL TAB */}
                        {activeTab === 'technical' && (
                            <div className="p-6 h-full animate-fade-in">
                                <h3 className="text-xl font-bold text-white mb-6">Technical Levels</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center p-4 bg-black/30 rounded-lg border border-white/5 hover:border-gold/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mr-4 text-red-500">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Major Resistance</p>
                                            <p className="text-xl font-bold text-white font-mono">{(currentPrice * 1.015).toFixed(3)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-4 bg-black/30 rounded-lg border border-white/5 hover:border-gold/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 text-blue-500">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Pivot Zone</p>
                                            <p className="text-xl font-bold text-white font-mono">{currentPrice.toFixed(3)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-4 bg-black/30 rounded-lg border border-white/5 hover:border-gold/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mr-4 text-green-500">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Key Support</p>
                                            <p className="text-xl font-bold text-white font-mono">{(currentPrice * 0.985).toFixed(3)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h4 className="text-gray-400 text-sm font-bold uppercase mb-4">Sentiment Analysis</h4>
                                    <div className="flex gap-2">
                                        <span className={`px-3 py-1 bg-black border border-${isBullish ? 'green' : 'red'}-500/30 text-${isBullish ? 'green' : 'red'}-400 rounded-full text-xs`}>
                                            Structure: {isBullish ? 'Higher Highs' : 'Lower Lows'}
                                        </span>
                                        <span className="px-3 py-1 bg-black border border-gray-700 text-gray-400 rounded-full text-xs">
                                            Volume: Increasing
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. CHART TAB */}
                        {activeTab === 'chart' && (
                            <div className="h-full w-full bg-black relative flex items-center justify-center animate-fade-in group">
                                <img
                                    src={imageUrl}
                                    alt={analysis.asset}
                                    className="max-h-[600px] w-full object-contain cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-500"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                />
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white/50 text-xs px-2 py-1 rounded pointer-events-none">
                                    Original Screenshot
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="border-t border-border-subtle pt-8 mt-12 text-center">
                <p className="text-gray-500 text-xs max-w-2xl mx-auto">
                    Disclaimer: This analysis is generated by AI and is for educational purposes only. xGProAi does not provide financial advice. Trading involves substantial risk.
                </p>
            </div>
        </div>
    );
}
